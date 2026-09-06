-- Versioned BTC research demo. Legacy BTC and BNB records remain untouched.
create table public.btc_demo_runs (
  run_id text primary key,
  bundle_id text not null,
  bundle_sha256 text not null check (bundle_sha256 ~ '^[0-9a-f]{64}$'),
  feature_contract_sha256 text not null check (feature_contract_sha256 ~ '^[0-9a-f]{64}$'),
  execution_contract_sha256 text not null check (execution_contract_sha256 ~ '^[0-9a-f]{64}$'),
  manifest jsonb not null check (jsonb_typeof(manifest) = 'object'),
  created_at timestamptz not null default now()
);
create table public.btc_demo_state (
  run_id text primary key references public.btc_demo_runs(run_id),
  version bigint not null check (version > 0),
  last_open_ts timestamptz not null,
  state jsonb not null check (jsonb_typeof(state) = 'object'),
  updated_at timestamptz not null default now(),
  check ((state->>'version')::bigint = version),
  check ((state->>'last_open_ts')::timestamptz = last_open_ts),
  check (state->>'run_id' = run_id)
);
create table public.btc_demo_snapshots (
  run_id text not null references public.btc_demo_runs(run_id),
  timestamp timestamptz not null,
  price double precision not null check (price > 0 and price < 'Infinity'::float8),
  equity double precision not null check (equity > 0 and equity < 'Infinity'::float8),
  benchmark_equity double precision not null check (benchmark_equity > 0 and benchmark_equity < 'Infinity'::float8),
  exposure double precision not null check (exposure >= 0 and exposure < 'Infinity'::float8),
  cash double precision not null check (cash > '-Infinity'::float8 and cash < 'Infinity'::float8),
  units double precision not null check (units >= 0 and units < 'Infinity'::float8),
  fees double precision not null check (fees >= 0 and fees < 'Infinity'::float8),
  borrow double precision not null check (borrow >= 0 and borrow < 'Infinity'::float8),
  turnover double precision not null default 0 check (turnover >= 0 and turnover < 'Infinity'::float8),
  trades bigint not null default 0 check (trades >= 0),
  max_drawdown double precision not null check (max_drawdown >= 0 and max_drawdown <= 1),
  benchmark_max_drawdown double precision not null check (benchmark_max_drawdown >= 0 and benchmark_max_drawdown <= 1),
  bundle_sha256 text not null check (bundle_sha256 ~ '^[0-9a-f]{64}$'),
  created_at timestamptz not null default now(),
  primary key (run_id, timestamp)
);
create table public.btc_demo_forecasts (
  run_id text not null references public.btc_demo_runs(run_id),
  decision_ts timestamptz not null,
  available boolean not null,
  action_eligible boolean not null,
  reason text,
  mu double precision check (mu > '-Infinity'::float8 and mu < 'Infinity'::float8),
  variance double precision check (variance >= 0 and variance < 'Infinity'::float8),
  target double precision check (target >= 0.5 and target <= 1.12),
  estimated_utility_gain double precision check (estimated_utility_gain > '-Infinity'::float8 and estimated_utility_gain < 'Infinity'::float8),
  estimated_turnover double precision check (estimated_turnover >= 0 and estimated_turnover < 'Infinity'::float8),
  known_open_exposure double precision check (known_open_exposure >= 0 and known_open_exposure < 'Infinity'::float8),
  bundle_sha256 text not null check (bundle_sha256 ~ '^[0-9a-f]{64}$'),
  feature_contract_sha256 text not null check (feature_contract_sha256 ~ '^[0-9a-f]{64}$'),
  execution_contract_sha256 text not null check (execution_contract_sha256 ~ '^[0-9a-f]{64}$'),
  data jsonb not null,
  created_at timestamptz not null default now(),
  primary key (run_id, decision_ts),
  check ((not available and mu is null and variance is null) or (available and mu is not null and variance is not null)),
  check (target is null or (available and action_eligible))
);
create table public.btc_demo_events (
  run_id text not null references public.btc_demo_runs(run_id),
  event_id text not null,
  timestamp timestamptz not null,
  kind text not null check (kind in ('fill', 'intent', 'expired')),
  details jsonb not null check (jsonb_typeof(details) = 'object'),
  bundle_sha256 text not null check (bundle_sha256 ~ '^[0-9a-f]{64}$'),
  created_at timestamptz not null default now(),
  primary key (run_id, event_id)
);
create index btc_demo_events_run_time on public.btc_demo_events(run_id, timestamp desc);

alter table public.btc_demo_runs enable row level security;
alter table public.btc_demo_state enable row level security;
alter table public.btc_demo_snapshots enable row level security;
alter table public.btc_demo_forecasts enable row level security;
alter table public.btc_demo_events enable row level security;
create policy "Public BTC research metadata" on public.btc_demo_runs for select to anon, authenticated using (true);
create policy "Public BTC research state" on public.btc_demo_state for select to anon, authenticated using (true);
create policy "Public BTC research snapshots" on public.btc_demo_snapshots for select to anon, authenticated using (true);
create policy "Public BTC research forecasts" on public.btc_demo_forecasts for select to anon, authenticated using (true);
create policy "Public BTC research events" on public.btc_demo_events for select to anon, authenticated using (true);
revoke all on public.btc_demo_runs, public.btc_demo_state, public.btc_demo_snapshots, public.btc_demo_forecasts, public.btc_demo_events from public, anon, authenticated;
grant select on public.btc_demo_runs, public.btc_demo_state, public.btc_demo_snapshots, public.btc_demo_forecasts, public.btc_demo_events to anon, authenticated;
grant select, insert, update, delete on public.btc_demo_runs, public.btc_demo_state, public.btc_demo_snapshots, public.btc_demo_forecasts, public.btc_demo_events to service_role;

create function public.record_btc_demo_transition(payload jsonb)
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
begin
  if current_user not in ('service_role', 'postgres', 'supabase_admin') then
    raise exception using errcode = '42501', message = 'BTC transition requires server authority';
  end if;
  if jsonb_typeof(payload) is distinct from 'object' or payload->>'ok' is distinct from 'true'
      or jsonb_typeof(payload->'state') is distinct from 'object'
      or jsonb_typeof(payload->'snapshots') is distinct from 'array'
      or jsonb_typeof(payload->'events') is distinct from 'array' then
    raise exception 'Invalid BTC transition envelope';
  end if;
  select * into run_row from public.btc_demo_runs where run_id = payload->>'run_id' for update;
  if not found then raise exception 'BTC run must be registered before inference'; end if;
  if payload->>'bundle_id' is distinct from run_row.bundle_id
      or payload->>'bundle_sha256' is distinct from run_row.bundle_sha256
      or payload->>'feature_contract_sha256' is distinct from run_row.feature_contract_sha256
      or payload->>'execution_contract_sha256' is distinct from run_row.execution_contract_sha256 then
    raise exception 'BTC model or execution contract mismatch';
  end if;
  event_time := (payload->>'event_ts')::timestamptz;
  expected_version := (payload->>'expected_state_version')::bigint;
  new_state := payload->'state';
  new_version := (new_state->>'version')::bigint;
  if event_time is null or mod(extract(epoch from event_time), 900) <> 0
      or event_time > now() + interval '60 seconds' or expected_version is null or expected_version < 0
      or new_version is distinct from expected_version + 1
      or (new_state->>'schema_version')::integer is distinct from 1
      or new_state->>'run_id' is distinct from run_row.run_id
      or new_state->>'bundle_id' is distinct from run_row.bundle_id
      or new_state->>'bundle_sha256' is distinct from run_row.bundle_sha256
      or (new_state->>'last_open_ts')::timestamptz is distinct from event_time
      or (new_state->>'initial_equity')::double precision is distinct from 1.0 then
    raise exception 'Invalid BTC state identity, clock or version';
  end if;
  select * into old_row from public.btc_demo_state where run_id = run_row.run_id;
  if found then
    if event_time <= old_row.last_open_ts then
      return jsonb_build_object('status', 'already_processed', 'version', old_row.version, 'last_open_ts', old_row.last_open_ts);
    end if;
    if old_row.version <> expected_version then
      raise exception using errcode = '40001', message = 'BTC state version conflict';
    end if;
    previous_mark := nullif(old_row.state->>'last_mark_ts', '')::timestamptz;
    if new_state->>'started_at' is distinct from old_row.state->>'started_at'
        or (new_state->>'initial_open')::double precision is distinct from (old_row.state->>'initial_open')::double precision
        or (new_state->>'benchmark_units')::double precision is distinct from (old_row.state->>'benchmark_units')::double precision then
      raise exception 'BTC initial endowment changed';
    end if;
  elsif expected_version <> 0 then
    raise exception using errcode = '40001', message = 'BTC initial state version conflict';
  elsif (new_state->>'started_at')::timestamptz is distinct from event_time
      or jsonb_array_length(payload->'snapshots') <> 0 then
    raise exception 'BTC new run cannot invent previous marks';
  end if;
  foreach key in array array['cash','units','benchmark_units','initial_open','equity','benchmark_equity','peak_equity','benchmark_peak_equity','max_drawdown','benchmark_max_drawdown','fees','borrow','turnover','trades','current_open_equity','current_open_exposure'] loop
    value_number := (new_state->>key)::double precision;
    if key in ('current_open_equity','current_open_exposure') and new_state ? key and new_state->key = 'null'::jsonb then
      continue;
    end if;
    if value_number is null or not (value_number > '-Infinity'::float8 and value_number < 'Infinity'::float8)
        or (key <> 'cash' and value_number < 0)
        or (key in ('initial_open','equity','benchmark_equity','current_open_equity','peak_equity','benchmark_peak_equity') and value_number <= 0) then
      raise exception 'Nonfinite or invalid BTC state field: %', key;
    end if;
  end loop;
  if (new_state->>'current_open_equity' is null) is distinct from (new_state->>'current_open_exposure' is null) then
    raise exception 'BTC current open fields must be jointly available';
  end if;
  if nullif(new_state->>'pending_target','') is not null and (
      (new_state->>'pending_target')::float8 < 0.5 or (new_state->>'pending_target')::float8 > 1.12
      or (new_state->>'pending_decision_ts')::timestamptz is distinct from event_time
      or (new_state->>'pending_due_at')::timestamptz is distinct from event_time + interval '15 minutes') then
    raise exception 'BTC pending intent must be due at the next open';
  end if;
  if nullif(new_state->>'pending_target','') is null and (
      nullif(new_state->>'pending_due_at','') is not null or nullif(new_state->>'pending_decision_ts','') is not null) then
    raise exception 'BTC empty intent has pending timestamps';
  end if;
  if (new_state->>'max_drawdown')::float8 > 1 or (new_state->>'benchmark_max_drawdown')::float8 > 1
      or (new_state->>'trades')::float8 <> trunc((new_state->>'trades')::float8) then
    raise exception 'Invalid BTC drawdown or trade count';
  end if;
  if jsonb_array_length(payload->'snapshots') > 10000 or jsonb_array_length(payload->'events') > 10000 then
    raise exception 'BTC transition exceeds bounded history';
  end if;
  for row_item in select value from jsonb_array_elements(payload->'snapshots') loop
    row_time := (row_item->>'timestamp')::timestamptz;
    if row_time is null or mod(extract(epoch from row_time), 900) <> 0 or row_time >= event_time
        or (previous_mark is not null and row_time <= previous_mark)
        or (old_row.last_open_ts is not null and row_time < old_row.last_open_ts) then
      raise exception 'BTC snapshot chronology changed';
    end if;
    insert into public.btc_demo_snapshots (run_id,timestamp,price,equity,benchmark_equity,exposure,cash,units,fees,borrow,turnover,trades,max_drawdown,benchmark_max_drawdown,bundle_sha256)
    values (run_row.run_id,row_time,(row_item->>'price')::float8,(row_item->>'equity')::float8,(row_item->>'benchmark_equity')::float8,
      (row_item->>'exposure')::float8,(row_item->>'cash')::float8,(row_item->>'units')::float8,(row_item->>'fees')::float8,
      (row_item->>'borrow')::float8,coalesce((row_item->>'turnover')::float8,0),coalesce((row_item->>'trades')::bigint,0),
      (row_item->>'max_drawdown')::float8,(row_item->>'benchmark_max_drawdown')::float8,run_row.bundle_sha256);
    previous_mark := row_time;
    snapshot_count := snapshot_count + 1;
  end loop;
  if nullif(new_state->>'last_mark_ts','')::timestamptz is distinct from previous_mark then
    raise exception 'BTC state mark does not match inserted snapshots';
  end if;
  forecast := payload->'forecast';
  if forecast is not null and forecast <> 'null'::jsonb then
    if (forecast->>'decision_ts')::timestamptz is distinct from event_time
        or mod(extract(epoch from event_time), 21600) <> 0 then
      raise exception 'BTC forecast escaped its six-hour clock';
    end if;
    insert into public.btc_demo_forecasts (run_id,decision_ts,available,action_eligible,reason,mu,variance,target,estimated_utility_gain,estimated_turnover,known_open_exposure,bundle_sha256,feature_contract_sha256,execution_contract_sha256,data)
    values (run_row.run_id,event_time,(forecast->>'available')::boolean,(forecast->>'action_eligible')::boolean,forecast->>'reason',
      (forecast->>'mu')::float8,(forecast->>'variance')::float8,(forecast->>'target')::float8,(forecast->>'estimated_utility_gain')::float8,
      (forecast->>'estimated_turnover')::float8,(forecast->>'known_open_exposure')::float8,run_row.bundle_sha256,run_row.feature_contract_sha256,run_row.execution_contract_sha256,payload->'data');
  end if;
  for row_item in select value from jsonb_array_elements(payload->'events') loop
    row_time := (row_item->>'timestamp')::timestamptz;
    if row_time is null or row_time > event_time or nullif(row_item->>'event_id','') is null then
      raise exception 'Invalid BTC event identity or clock';
    end if;
    insert into public.btc_demo_events (run_id,event_id,timestamp,kind,details,bundle_sha256)
    values (run_row.run_id,row_item->>'event_id',row_time,row_item->>'kind',row_item->'details',run_row.bundle_sha256);
    event_count := event_count + 1;
  end loop;
  insert into public.btc_demo_state (run_id,version,last_open_ts,state)
  values (run_row.run_id,new_version,event_time,new_state)
  on conflict (run_id) do update set version=excluded.version,last_open_ts=excluded.last_open_ts,state=excluded.state,updated_at=now();
  return jsonb_build_object('status','applied','version',new_version,'snapshots',snapshot_count,'events',event_count);
end;
$$;
revoke all on function public.record_btc_demo_transition(jsonb) from public, anon, authenticated;
grant execute on function public.record_btc_demo_transition(jsonb) to service_role;

do $$
declare table_name text;
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    foreach table_name in array array['btc_demo_runs','btc_demo_state','btc_demo_snapshots','btc_demo_forecasts','btc_demo_events'] loop
      execute format('alter publication supabase_realtime add table public.%I', table_name);
    end loop;
  end if;
end $$;
