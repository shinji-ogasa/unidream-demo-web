-- New WM+learned-RL run only; leave the existing ML RPC and run unchanged.
alter table public.btc_demo_forecasts add column forecast_kind text not null default 'ml_return_variance'
  check (forecast_kind in ('ml_return_variance','wm_rl_actor'));
alter table public.btc_demo_forecasts add column diagnostics jsonb not null default '{}'::jsonb
  check (jsonb_typeof(diagnostics)='object');
alter table public.btc_demo_forecasts drop constraint btc_demo_forecasts_check;
alter table public.btc_demo_forecasts add constraint btc_demo_forecasts_kind_contract check (
  (forecast_kind='ml_return_variance' and ((not available and mu is null and variance is null) or (available and mu is not null and variance is not null)))
  or (forecast_kind='wm_rl_actor' and mu is null and variance is null and estimated_utility_gain is null and known_open_exposure is null)
);

alter table public.btc_demo_events drop constraint btc_demo_events_kind_check;
alter table public.btc_demo_events add constraint btc_demo_events_kind_check
  check (kind in ('fill','intent','expired','account','decision'));

create function public.record_wm_demo_transition(payload jsonb)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  run_row public.btc_demo_runs%rowtype;
  old_row public.btc_demo_state%rowtype;
  new_state jsonb;
  expected_version bigint;
  new_version bigint;
  event_time timestamptz;
  previous_mark timestamptz;
  row_item jsonb;
  row_time timestamptz;
  forecast jsonb;
  key text;
  value_number double precision;
  snapshot_count integer := 0;
  event_count integer := 0;
  bridge jsonb;
  account jsonb;
  policy jsonb;
  deferred jsonb;
  expected_bars bigint;
  processed_bars bigint;
  halted boolean;
  started timestamptz;
  event_ns numeric;
  started_ns numeric;
  controller_value jsonb;
  controller_index integer;
  running_equity float8;
  running_benchmark float8;
  running_peak float8;
  running_benchmark_peak float8;
  running_dd float8;
  running_benchmark_dd float8;
  running_price float8;
  bound_contract jsonb := '{"schema":"wm-rl-cash-units-v1","one_way_cost":0.00055,"borrow_annual":0.1,"max_step":0.08,"deadband":0.01,"intent_bounds":[0.5,1.12],"bars_per_year":35040,"fill_delay_bars":1,"initial_cash":0.0,"initial_units":"1/initial_open","initial_equity":1.0,"missing_next_open":"expire_pending_intent","decision_account_feedback":"previous_completed_bar","missing_close_hold_valuation":"last_known_mark_explicitly_stale"}'::jsonb;
begin
  if current_user not in ('service_role', 'postgres', 'supabase_admin') then
    raise exception using errcode = '42501', message = 'WM transition requires server authority';
  end if;
  if jsonb_typeof(payload) is distinct from 'object' or payload->>'ok' is distinct from 'true'
      or jsonb_typeof(payload->'state') is distinct from 'object'
      or jsonb_typeof(payload->'snapshots') is distinct from 'array'
      or jsonb_typeof(payload->'events') is distinct from 'array' then
    raise exception 'Invalid WM transition envelope';
  end if;
  select * into run_row from public.btc_demo_runs where run_id = payload->>'run_id' for update;
  if not found then raise exception 'WM run must be registered before inference'; end if;
  if run_row.run_id is distinct from 'btc-wm31-ac-20260906-paper-v1'
      or run_row.bundle_id is distinct from 'btc-wm31-ac-20260906'
      or run_row.manifest->>'model_family' is distinct from 'wm_market31_ac'
      or payload->>'model_family' is distinct from 'wm_market31_ac'
      or payload->>'bundle_id' is distinct from run_row.bundle_id
      or payload->>'bundle_sha256' is distinct from run_row.bundle_sha256
      or payload->>'feature_contract_sha256' is distinct from run_row.feature_contract_sha256
      or payload->>'execution_contract_sha256' is distinct from run_row.execution_contract_sha256 then
    raise exception 'WM model or execution contract mismatch';
  end if;
  event_time := (payload->>'event_ts')::timestamptz;
  expected_version := (payload->>'expected_state_version')::bigint;
  new_state := payload->'state';
  new_version := (new_state->>'version')::bigint;
  if event_time is null or mod(extract(epoch from event_time), 900) <> 0
      or event_time > clock_timestamp() or expected_version is null or expected_version < 0
      or new_version is distinct from expected_version + 1
      or (new_state->>'schema_version')::integer is distinct from 2
      or new_state->>'run_id' is distinct from run_row.run_id
      or new_state->>'bundle_id' is distinct from run_row.bundle_id
      or new_state->>'bundle_sha256' is distinct from run_row.bundle_sha256
      or (new_state->>'last_open_ts')::timestamptz is distinct from event_time
      or (new_state->>'initial_equity')::double precision is distinct from 1.0 then
    raise exception 'Invalid WM state identity, clock or version';
  end if;
  select * into old_row from public.btc_demo_state where run_id = run_row.run_id;
  if found then
    if event_time <= old_row.last_open_ts then
      return jsonb_build_object('status', 'already_processed', 'version', old_row.version, 'last_open_ts', old_row.last_open_ts);
    end if;
    if old_row.version <> expected_version then
      raise exception using errcode = '40001', message = 'WM state version conflict';
    end if;
    previous_mark := nullif(old_row.state->>'last_mark_ts', '')::timestamptz;
    if new_state->>'started_at' is distinct from old_row.state->>'started_at'
        or (new_state->>'initial_open')::double precision is distinct from (old_row.state->>'initial_open')::double precision
        or (new_state->>'benchmark_units')::double precision is distinct from (old_row.state->>'benchmark_units')::double precision then
      raise exception 'WM initial endowment changed';
    end if;
  elsif expected_version <> 0 then
    raise exception using errcode = '40001', message = 'WM initial state version conflict';
  elsif (new_state->>'started_at')::timestamptz is distinct from event_time
      or jsonb_array_length(payload->'snapshots') <> 0 then
    raise exception 'WM new run cannot invent previous marks';
  end if;
  if clock_timestamp() >= event_time + interval '15 minutes' then
    raise exception 'WM transition missed next-open deadline';
  end if;
  bridge := new_state->'bridge_state';
  account := bridge->'account'->'account';
  policy := bridge->'policy';
  deferred := bridge->'deferred';
  started := (new_state->>'started_at')::timestamptz;
  event_ns := extract(epoch from event_time) * 1000000000;
  started_ns := extract(epoch from started) * 1000000000;
  expected_bars := (extract(epoch from event_time - started) / 900)::bigint;
  if jsonb_typeof(account->'insolvent') is distinct from 'boolean'
      or jsonb_typeof(account->'bars_processed') is distinct from 'number'
      or (account->>'bars_processed')::numeric <> trunc((account->>'bars_processed')::numeric) then
    raise exception 'WM account halt/count types invalid';
  end if;
  halted := (account->>'insolvent')::boolean;
  processed_bars := (account->>'bars_processed')::bigint;
  if started is null or started > event_time or mod(extract(epoch from started),900) <> 0
      or jsonb_typeof(bridge) is distinct from 'object'
      or bridge->>'schema' is distinct from 'wm-rl-live-bridge-v1'
      or bridge->>'bundle_id' is distinct from run_row.bundle_id
      or bridge->>'manifest_sha256' is distinct from run_row.bundle_sha256
      or jsonb_typeof(account) is distinct from 'object'
      or bridge->'account'->>'schema' is distinct from 'wm-rl-cash-units-v1'
      or bridge->'account'->'contract' is distinct from bound_contract
      or jsonb_typeof(policy) is distinct from 'object'
      or policy->'physical_feedback' is distinct from 'true'::jsonb
      or jsonb_typeof(policy->'controller') is distinct from 'array'
      or jsonb_array_length(policy->'controller') <> 4 then
    raise exception 'Invalid WM bridge identity or execution contract';
  end if;
  if (select array_agg(k order by k) from jsonb_object_keys(bridge) as t(k)) is distinct from array['account','bundle_id','deferred','manifest_sha256','policy','schema']
      or (select array_agg(k order by k) from jsonb_object_keys(bridge->'account') as t(k)) is distinct from array['account','contract','schema']
      or (select array_agg(k order by k) from jsonb_object_keys(account) as t(k)) is distinct from array['bars_processed','borrow','borrow_annual','cash','fees','initial_open','initial_timestamp_ns','insolvent','last_bar_timestamp_ns','last_close_observed','last_equity','last_exposure','last_fill_delta','last_mark','last_mark_source','last_mark_timestamp_ns','one_way_cost','pending_due_ns','pending_target','trades','turnover','units']
      or (select array_agg(k order by k) from jsonb_object_keys(policy) as t(k)) is distinct from array['active_count','controller','last_timestamp_ns','long_count','physical_feedback','step_count','underweight_count'] then
    raise exception 'WM exact nested bridge schemas changed';
  end if;
  foreach key in array array['initial_timestamp_ns','last_bar_timestamp_ns','pending_due_ns','last_mark_timestamp_ns'] loop
    if not account ? key or (account->key <> 'null'::jsonb and (
        jsonb_typeof(account->key) is distinct from 'string'
        or not ((account->>key) ~ '^(0|[1-9][0-9]*)$')
        or mod((account->>key)::numeric,900000000000) <> 0)) then
      raise exception 'WM nanosecond transport must be aligned decimal strings';
    end if;
  end loop;
  if jsonb_typeof(account->'last_mark_timestamp_ns') is distinct from 'string'
      or jsonb_typeof(policy->'last_timestamp_ns') is distinct from 'string'
      or not ((policy->>'last_timestamp_ns') ~ '^(0|[1-9][0-9]*)$')
      or (policy->>'last_timestamp_ns')::numeric is distinct from (case when halted then started_ns+(processed_bars-1)*900000000000 else event_ns end)
      or (account->>'initial_timestamp_ns')::numeric is distinct from started_ns
      or (account->>'last_mark_timestamp_ns')::numeric < started_ns
      or (account->>'last_mark_timestamp_ns')::numeric > event_ns
      or (processed_bars=0 and account->'last_bar_timestamp_ns' is distinct from 'null'::jsonb)
      or (processed_bars>0 and (account->>'last_bar_timestamp_ns')::numeric is distinct from started_ns+(processed_bars-1)*900000000000) then
    raise exception 'WM completed account and Actor clocks disagree';
  end if;
  foreach key in array array['step_count','active_count','underweight_count','long_count'] loop
    if jsonb_typeof(policy->key) is distinct from 'number' or (policy->>key)::numeric < 0
        or (policy->>key)::numeric <> trunc((policy->>key)::numeric) then
      raise exception 'WM policy counters must be nonnegative integers';
    end if;
  end loop;
  if (policy->>'step_count')::numeric <> processed_bars+(case when halted then 0 else 1 end)
      or (policy->>'active_count')::numeric > (policy->>'step_count')::numeric
      or (policy->>'underweight_count')::numeric + (policy->>'long_count')::numeric > (policy->>'active_count')::numeric
      or jsonb_typeof(account->'bars_processed') is distinct from 'number'
      or (not halted and processed_bars <> expected_bars)
      or (halted and (processed_bars<1 or processed_bars>expected_bars)) then
    raise exception 'WM nominal counter geometry changed';
  end if;
  controller_index := 0;
  for controller_value in select value from jsonb_array_elements(policy->'controller') loop
    value_number := (controller_value #>> '{}')::float8;
    if jsonb_typeof(controller_value) is distinct from 'number'
        or not (value_number > '-Infinity'::float8 and value_number < 'Infinity'::float8)
        or (controller_index>=2 and (value_number<0 or value_number>1)) then
      raise exception 'Invalid WM four-dimensional controller';
    end if;
    controller_index := controller_index+1;
  end loop;
  if halted and deferred is distinct from 'null'::jsonb then
    raise exception 'WM halted account cannot defer another bar';
  end if;
  if not halted then
  if (select array_agg(k order by k) from jsonb_object_keys(deferred) as t(k)) is distinct from array['intent','open_observed','origin','receipt','timely_current_open'] then
    raise exception 'WM exact deferred schema changed';
  end if;
  if jsonb_typeof(deferred) is distinct from 'object'
      or (deferred->>'origin')::timestamptz is distinct from event_time
      or jsonb_typeof(deferred->'open_observed') is distinct from 'boolean'
      or not deferred ? 'intent' or not deferred ? 'timely_current_open' or not deferred ? 'receipt' then
    raise exception 'Invalid WM deferred current bar';
  end if;
  if deferred->'intent' <> 'null'::jsonb and (
      jsonb_typeof(deferred->'intent') is distinct from 'number'
      or not ((deferred->>'intent')::float8 between 0.5 and 1.12)) then
    raise exception 'WM deferred target outside canonical bounds';
  end if;
  if (deferred->>'open_observed')::boolean then
    if jsonb_typeof(deferred->'timely_current_open') is distinct from 'number'
        or not ((deferred->>'timely_current_open')::float8 > 0 and (deferred->>'timely_current_open')::float8 < 'Infinity'::float8)
        or (deferred->>'receipt')::timestamptz is null
        or (deferred->>'receipt')::timestamptz < event_time
        or (deferred->>'receipt')::timestamptz >= event_time+interval '15 minutes'
        or (deferred->>'receipt')::timestamptz > clock_timestamp() then
      raise exception 'Invalid WM timely current open receipt';
    end if;
  elsif deferred->'timely_current_open' is distinct from 'null'::jsonb then
    raise exception 'Missing WM current open cannot have a price';
  end if;
  end if; -- non-halted deferred bar
  if (account->'pending_target' = 'null'::jsonb) is distinct from (account->'pending_due_ns' = 'null'::jsonb)
      or not account ? 'pending_target'
      or (halted and account->'pending_target' is distinct from 'null'::jsonb)
      or (account->'pending_target' <> 'null'::jsonb and (
        jsonb_typeof(account->'pending_target') is distinct from 'number'
        or not ((account->>'pending_target')::float8 between 0.5 and 1.12)
        or (account->>'pending_due_ns')::numeric is distinct from event_ns)) then
    raise exception 'WM old pending fill and deferred decision confused';
  end if;
  if (account->>'initial_open')::float8 is distinct from (new_state->>'initial_open')::float8
      or (account->>'one_way_cost')::float8 is distinct from 0.00055
      or (account->>'borrow_annual')::float8 is distinct from 0.1
      or (new_state->>'benchmark_units')::float8 is distinct from 1.0/(new_state->>'initial_open')::float8 then
    raise exception 'WM account endowment or registered costs changed';
  end if;
  foreach key in array array['cash','units','fees','borrow','turnover','trades'] loop
    if jsonb_typeof(account->key) is distinct from 'number'
        or (account->>key)::float8 is distinct from (new_state->>key)::float8 then
      raise exception 'WM completed projection differs from account';
    end if;
  end loop;
  if jsonb_typeof(account->'last_close_observed') is distinct from 'boolean'
      or jsonb_typeof(account->'last_fill_delta') is distinct from 'number'
      or not ((account->>'last_fill_delta')::float8 > '-Infinity'::float8 and (account->>'last_fill_delta')::float8 < 'Infinity'::float8)
      or account->>'last_mark_source' not in ('initial_open','open','close')
      or jsonb_typeof(account->'last_mark') is distinct from 'number'
      or not ((account->>'last_mark')::float8 > 0 and (account->>'last_mark')::float8 < 'Infinity'::float8) then
    raise exception 'Invalid WM completed mark or fill metadata';
  end if;
  if (account->>'last_close_observed')::boolean and (
      jsonb_typeof(account->'last_equity') is distinct from 'number'
      or not ((account->>'last_equity')::float8 > '-Infinity'::float8 and (account->>'last_equity')::float8 < 'Infinity'::float8)
      or (new_state->>'equity')::float8 is distinct from greatest(0,(account->>'last_equity')::float8)
      or account->>'last_mark_source' is distinct from 'close'
      or (account->>'last_mark_timestamp_ns')::numeric is distinct from (account->>'last_bar_timestamp_ns')::numeric+900000000000) then
    raise exception 'WM completed equity or mark chronology changed';
  end if;
  if expected_bars=0 and ((account->>'cash')::float8<>0
      or (account->>'units')::float8 is distinct from (new_state->>'benchmark_units')::float8
      or account->'pending_target' is distinct from 'null'::jsonb
      or not (deferred->>'open_observed')::boolean
      or (deferred->>'timely_current_open')::float8 is distinct from (new_state->>'initial_open')::float8) then
    raise exception 'WM initial event must use actual benchmark open';
  end if;
  if old_row.state is not null and (
      bridge->'account'->'contract' is distinct from old_row.state->'bridge_state'->'account'->'contract'
      or new_state->'initial_open' is distinct from old_row.state->'initial_open') then
    raise exception 'WM immutable account contract changed';
  end if;
  foreach key in array array['cash','units','benchmark_units','initial_open','equity','benchmark_equity','peak_equity','benchmark_peak_equity','max_drawdown','benchmark_max_drawdown','fees','borrow','turnover','trades','current_open_equity','current_open_exposure'] loop
    value_number := (new_state->>key)::double precision;
    if key in ('current_open_equity','current_open_exposure') and new_state ? key and new_state->key = 'null'::jsonb then
      continue;
    end if;
    if jsonb_typeof(new_state->key) is distinct from 'number' or value_number is null or not (value_number > '-Infinity'::float8 and value_number < 'Infinity'::float8)
        or (key <> 'cash' and value_number < 0)
        or (key in ('initial_open','equity','benchmark_equity','current_open_equity','peak_equity','benchmark_peak_equity') and value_number <= 0 and not (halted and key='equity' and value_number=0)) then
      raise exception 'Nonfinite or invalid WM state field: %', key;
    end if;
  end loop;
  if new_state->'current_open_equity' is distinct from 'null'::jsonb
      or new_state->'current_open_exposure' is distinct from 'null'::jsonb then
    raise exception 'WM projection must not manufacture current-open accounting';
  end if;
  if (new_state->>'max_drawdown')::float8 > 1 or (new_state->>'benchmark_max_drawdown')::float8 > 1
      or (new_state->>'trades')::float8 <> trunc((new_state->>'trades')::float8) then
    raise exception 'Invalid WM drawdown or trade count';
  end if;
  if jsonb_array_length(payload->'snapshots') > 10000 or jsonb_array_length(payload->'events') > 10000 then
    raise exception 'WM transition exceeds bounded history';
  end if;
  running_equity := coalesce((old_row.state->>'equity')::float8,1.0);
  running_benchmark := coalesce((old_row.state->>'benchmark_equity')::float8,1.0);
  running_peak := coalesce((old_row.state->>'peak_equity')::float8,1.0);
  running_benchmark_peak := coalesce((old_row.state->>'benchmark_peak_equity')::float8,1.0);
  running_dd := coalesce((old_row.state->>'max_drawdown')::float8,0.0);
  running_benchmark_dd := coalesce((old_row.state->>'benchmark_max_drawdown')::float8,0.0);
  running_price := (old_row.state->>'last_mark_price')::float8;
  for row_item in select value from jsonb_array_elements(payload->'snapshots') loop
    row_time := (row_item->>'timestamp')::timestamptz;
    if row_time is null or mod(extract(epoch from row_time), 900) <> 0 or row_time >= event_time
        or (previous_mark is not null and row_time <= previous_mark)
        or (old_row.last_open_ts is not null and row_time < old_row.last_open_ts) then
      raise exception 'WM snapshot chronology changed';
    end if;
    insert into public.btc_demo_snapshots (run_id,timestamp,price,equity,benchmark_equity,exposure,cash,units,fees,borrow,turnover,trades,max_drawdown,benchmark_max_drawdown,bundle_sha256)
    values (run_row.run_id,row_time,(row_item->>'price')::float8,(row_item->>'equity')::float8,(row_item->>'benchmark_equity')::float8,
      (row_item->>'exposure')::float8,(row_item->>'cash')::float8,(row_item->>'units')::float8,(row_item->>'fees')::float8,
      (row_item->>'borrow')::float8,coalesce((row_item->>'turnover')::float8,0),coalesce((row_item->>'trades')::bigint,0),
      (row_item->>'max_drawdown')::float8,(row_item->>'benchmark_max_drawdown')::float8,run_row.bundle_sha256);
    running_equity := (row_item->>'equity')::float8;
    running_benchmark := (row_item->>'benchmark_equity')::float8;
    running_price := (row_item->>'price')::float8;
    if running_equity is distinct from (row_item->>'cash')::float8+(row_item->>'units')::float8*running_price
        or running_benchmark is distinct from running_price/(new_state->>'initial_open')::float8
        or (row_item->>'exposure')::float8 is distinct from (row_item->>'units')::float8*running_price/running_equity then
      raise exception 'WM snapshot cash or benchmark arithmetic changed';
    end if;
    running_peak := greatest(running_peak,running_equity);
    running_benchmark_peak := greatest(running_benchmark_peak,running_benchmark);
    running_dd := greatest(running_dd,1-running_equity/running_peak);
    running_benchmark_dd := greatest(running_benchmark_dd,1-running_benchmark/running_benchmark_peak);
    if (row_item->>'max_drawdown')::float8 is distinct from running_dd
        or (row_item->>'benchmark_max_drawdown')::float8 is distinct from running_benchmark_dd then
      raise exception 'WM snapshot drawdown arithmetic changed';
    end if;
    previous_mark := row_time;
    snapshot_count := snapshot_count + 1;
  end loop;
  if nullif(new_state->>'last_mark_ts','')::timestamptz is distinct from previous_mark then
    raise exception 'WM state mark does not match inserted snapshots';
  end if;
  if halted then running_equity := 0; running_dd := 1; end if;
  if (new_state->>'equity')::float8 is distinct from running_equity
      or (new_state->>'benchmark_equity')::float8 is distinct from running_benchmark
      or (new_state->>'peak_equity')::float8 is distinct from running_peak
      or (new_state->>'benchmark_peak_equity')::float8 is distinct from running_benchmark_peak
      or (new_state->>'max_drawdown')::float8 is distinct from running_dd
      or (new_state->>'benchmark_max_drawdown')::float8 is distinct from running_benchmark_dd
      or (new_state->>'last_mark_price')::float8 is distinct from running_price then
    raise exception 'WM performance projection differs from completed snapshots';
  end if;
  forecast := payload->'forecast';
  if jsonb_typeof(forecast) is distinct from 'object'
      or forecast->>'kind' is distinct from 'wm_rl_actor'
      or jsonb_typeof(forecast->'available') is distinct from 'boolean'
      or jsonb_typeof(forecast->'action_eligible') is distinct from 'boolean'
      or jsonb_typeof(forecast->'diagnostics') is distinct from 'object'
      or forecast->'target' is distinct from (case when halted then 'null'::jsonb else deferred->'intent' end)
      or forecast->'mu' is distinct from 'null'::jsonb
      or forecast->'variance' is distinct from 'null'::jsonb
      or forecast->'estimated_utility_gain' is distinct from 'null'::jsonb
      or forecast->'known_open_exposure' is distinct from 'null'::jsonb
      or ((forecast->>'action_eligible')::boolean and not (forecast->>'available')::boolean) then
    raise exception 'WM forecast payload or deferred target mismatch';
  end if;
  if jsonb_typeof(forecast->'diagnostics'->'decision') is distinct from 'object'
      or forecast->'diagnostics'->'decision'->'state' is distinct from policy
      or forecast->'diagnostics'->'decision'->'target_intent' is distinct from forecast->'target'
      or forecast->'diagnostics'->'decision'->'action_eligible' is distinct from forecast->'action_eligible'
      or (forecast->'diagnostics'->'decision'->>'timestamp')::timestamptz is distinct from event_time
      or (forecast->'diagnostics'->'decision'->>'completed_at')::timestamptz is null
      or (forecast->'diagnostics'->'decision'->>'completed_at')::timestamptz < event_time
      or (forecast->'diagnostics'->'decision'->>'completed_at')::timestamptz > clock_timestamp()
      or (forecast->'diagnostics'->'decision'->>'deadline')::timestamptz is distinct from event_time+interval '15 minutes' then
    raise exception 'WM diagnostic decision state or clock does not match persisted intent';
  end if;
  if forecast is not null and forecast <> 'null'::jsonb then
    if (forecast->>'decision_ts')::timestamptz is distinct from event_time
        or mod(extract(epoch from event_time), 900) <> 0 then
      raise exception 'WM forecast escaped its 15-minute clock';
    end if;
    insert into public.btc_demo_forecasts (run_id,decision_ts,available,action_eligible,reason,mu,variance,target,estimated_utility_gain,estimated_turnover,known_open_exposure,bundle_sha256,feature_contract_sha256,execution_contract_sha256,data,forecast_kind,diagnostics)
    values (run_row.run_id,event_time,(forecast->>'available')::boolean,(forecast->>'action_eligible')::boolean,forecast->>'reason',
      (forecast->>'mu')::float8,(forecast->>'variance')::float8,(forecast->>'target')::float8,(forecast->>'estimated_utility_gain')::float8,
      (forecast->>'estimated_turnover')::float8,(forecast->>'known_open_exposure')::float8,run_row.bundle_sha256,run_row.feature_contract_sha256,run_row.execution_contract_sha256,payload->'data','wm_rl_actor',forecast->'diagnostics');
  end if;
  for row_item in select value from jsonb_array_elements(payload->'events') loop
    row_time := (row_item->>'timestamp')::timestamptz;
    if row_time is null or mod(extract(epoch from row_time),900)<>0 or row_time > event_time or nullif(row_item->>'event_id','') is null then
      raise exception 'Invalid WM event identity or clock';
    end if;
    insert into public.btc_demo_events (run_id,event_id,timestamp,kind,details,bundle_sha256)
    values (run_row.run_id,row_item->>'event_id',row_time,row_item->>'kind',row_item->'details',run_row.bundle_sha256);
    event_count := event_count + 1;
  end loop;
  -- Recheck actual time after all validation/inserts; a failure rolls back every row.
  if clock_timestamp() >= event_time + interval '15 minutes' then
    raise exception 'WM transaction missed next-open deadline';
  end if;
  insert into public.btc_demo_state (run_id,version,last_open_ts,state)
  values (run_row.run_id,new_version,event_time,new_state)
  on conflict (run_id) do update set version=excluded.version,last_open_ts=excluded.last_open_ts,state=excluded.state,updated_at=now();
  return jsonb_build_object('status','applied','version',new_version,'snapshots',snapshot_count,'events',event_count);
end;
$$;
revoke all on function public.record_wm_demo_transition(jsonb) from public, anon, authenticated;
grant execute on function public.record_wm_demo_transition(jsonb) to service_role;
