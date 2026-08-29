-- Atomic paper-trading commit for the Edge inference job.
--
-- This migration is intentionally all-or-nothing: the Edge function submits
-- one JSON payload to record_unidream_inference(), which locks the run state,
-- validates the expected state, and writes prediction/state/snapshot/trade in
-- one database transaction.

-- Existing predictions predate run_id. This demo has one canonical run, so
-- backfill that run id before making the new idempotency key mandatory.
alter table public.predictions
  add column if not exists run_id text;

update public.predictions
set run_id = 'unidream_btcusdt_15m_main'
where run_id is null;

alter table public.predictions
  alter column run_id set default 'unidream_btcusdt_15m_main',
  alter column run_id set not null;

-- Do not silently discard history while upgrading. If a prior deployment
-- already produced duplicate timestamps, stop and reconcile those rows first.
do $$
begin
  if exists (
    select 1
    from public.predictions
    where latest_timestamp is not null
    group by run_id, latest_timestamp
    having count(*) > 1
  ) then
    raise exception
      'cannot add predictions(run_id, latest_timestamp) key: duplicate rows exist';
  end if;

  if exists (
    select 1
    from public.trades
    group by run_id, timestamp
    having count(*) > 1
  ) then
    raise exception
      'cannot add trades(run_id, timestamp) key: duplicate rows exist';
  end if;
end;
$$;

create unique index if not exists predictions_run_latest_timestamp_uidx
  on public.predictions (run_id, latest_timestamp);

-- Defense in depth for trade rows. The RPC checks this key while holding the
-- strategy_state lock; this index also prevents a duplicate trade if a future
-- code path accidentally bypasses that check.
create unique index if not exists trades_run_timestamp_uidx
  on public.trades (run_id, timestamp);

-- Keep the Data API read-only for public clients. Existing SELECT policies are
-- intentionally retained; no INSERT/UPDATE/DELETE policy is added.
alter table public.predictions enable row level security;
alter table public.strategy_state enable row level security;
alter table public.equity_snapshots enable row level security;
alter table public.trades enable row level security;

revoke insert, update, delete, truncate, references, trigger
  on public.predictions, public.strategy_state, public.equity_snapshots, public.trades
  from public, anon, authenticated;

create or replace function public.record_unidream_inference(p_payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_run_id text;
  v_symbol text;
  v_timeframe text;

  v_expected_last_timestamp timestamptz;
  v_expected_current_position double precision;
  v_expected_cash double precision;
  v_expected_asset_qty double precision;
  v_expected_equity double precision;
  v_expected_last_price double precision;

  v_latest_timestamp timestamptz;
  v_latest_close double precision;

  v_signal text;
  v_prediction_position double precision;
  v_score double precision;
  v_confidence double precision;
  v_model_version text;
  v_feature_version text;
  v_prediction_raw jsonb;

  v_target_position double precision;
  v_next_current_position double precision;
  v_next_cash double precision;
  v_next_asset_qty double precision;
  v_next_equity double precision;

  v_has_trade boolean;
  v_trade_from_position double precision;
  v_trade_to_position double precision;
  v_trade_price double precision;
  v_trade_notional double precision;
  v_trade_fee double precision;

  v_state public.strategy_state%rowtype;
begin
  if p_payload is null or jsonb_typeof(p_payload) <> 'object' then
    raise exception 'inference payload must be a JSON object'
      using errcode = '22023';
  end if;

  v_run_id := nullif(p_payload ->> 'run_id', '');
  v_symbol := nullif(p_payload ->> 'symbol', '');
  v_timeframe := nullif(p_payload ->> 'timeframe', '');
  if v_run_id is null or v_symbol is null or v_timeframe is null then
    raise exception 'inference payload is missing run_id, symbol, or timeframe'
      using errcode = '22023';
  end if;

  -- Parse/cast inside a block so malformed client input becomes a clear
  -- validation error instead of an implementation-dependent cast failure.
  begin
    v_expected_last_timestamp := nullif(p_payload #>> '{expected_state,last_timestamp}', '')::timestamptz;
    v_expected_current_position := nullif(p_payload #>> '{expected_state,current_position}', '')::double precision;
    v_expected_cash := nullif(p_payload #>> '{expected_state,cash}', '')::double precision;
    v_expected_asset_qty := nullif(p_payload #>> '{expected_state,asset_qty}', '')::double precision;
    v_expected_equity := nullif(p_payload #>> '{expected_state,equity}', '')::double precision;
    v_expected_last_price := nullif(p_payload #>> '{expected_state,last_price}', '')::double precision;

    v_latest_timestamp := nullif(p_payload #>> '{latest,timestamp}', '')::timestamptz;
    v_latest_close := nullif(p_payload #>> '{latest,close}', '')::double precision;

    v_signal := coalesce(nullif(p_payload #>> '{prediction,signal}', ''), 'unknown');
    v_prediction_position := nullif(p_payload #>> '{prediction,position}', '')::double precision;
    v_score := nullif(p_payload #>> '{prediction,score}', '')::double precision;
    v_confidence := nullif(p_payload #>> '{prediction,confidence}', '')::double precision;
    v_model_version := nullif(p_payload #>> '{prediction,model_version}', '');
    v_feature_version := nullif(p_payload #>> '{prediction,feature_version}', '');
    v_prediction_raw := p_payload #> '{prediction,raw}';

    v_target_position := nullif(p_payload ->> 'target_position', '')::double precision;
    v_next_current_position := nullif(p_payload #>> '{next_state,current_position}', '')::double precision;
    v_next_cash := nullif(p_payload #>> '{next_state,cash}', '')::double precision;
    v_next_asset_qty := nullif(p_payload #>> '{next_state,asset_qty}', '')::double precision;
    v_next_equity := nullif(p_payload #>> '{next_state,equity}', '')::double precision;

    if not (p_payload ? 'trade')
      or jsonb_typeof(p_payload -> 'trade') not in ('object', 'null') then
      raise exception 'inference payload trade must be an object or null'
        using errcode = '22023';
    end if;
    v_has_trade := jsonb_typeof(p_payload -> 'trade') = 'object';
    if v_has_trade then
      v_trade_from_position := nullif(p_payload #>> '{trade,from_position}', '')::double precision;
      v_trade_to_position := nullif(p_payload #>> '{trade,to_position}', '')::double precision;
      v_trade_price := nullif(p_payload #>> '{trade,price}', '')::double precision;
      v_trade_notional := nullif(p_payload #>> '{trade,trade_notional}', '')::double precision;
      v_trade_fee := nullif(p_payload #>> '{trade,fee}', '')::double precision;
    end if;
  exception
    when invalid_text_representation or datetime_field_overflow or numeric_value_out_of_range then
      raise exception 'inference payload contains an invalid numeric or timestamp value'
        using errcode = '22023';
  end;

  -- PostgreSQL float8 treats NaN as equal to itself, so `value <> value`
  -- is not a finite-value predicate here. Cast to text and reject all three
  -- non-finite spellings explicitly; this also rejects Infinity in optional
  -- values instead of allowing it to bypass the CAS comparisons.
  if v_expected_current_position is null
    or v_expected_cash is null
    or v_expected_asset_qty is null
    or v_expected_equity is null
    or v_latest_timestamp is null
    or v_latest_close is null
    or v_target_position is null
    or v_next_current_position is null
    or v_next_cash is null
    or v_next_asset_qty is null
    or v_next_equity is null
    or v_latest_close <= 0
    or lower(v_latest_close::text) in ('nan', 'infinity', '-infinity')
    or lower(v_expected_current_position::text) in ('nan', 'infinity', '-infinity')
    or lower(v_expected_cash::text) in ('nan', 'infinity', '-infinity')
    or lower(v_expected_asset_qty::text) in ('nan', 'infinity', '-infinity')
    or lower(v_expected_equity::text) in ('nan', 'infinity', '-infinity')
    or lower(v_target_position::text) in ('nan', 'infinity', '-infinity')
    or lower(v_next_current_position::text) in ('nan', 'infinity', '-infinity')
    or lower(v_next_cash::text) in ('nan', 'infinity', '-infinity')
    or lower(v_next_asset_qty::text) in ('nan', 'infinity', '-infinity')
    or lower(v_next_equity::text) in ('nan', 'infinity', '-infinity')
    or (v_expected_last_price is not null
      and lower(v_expected_last_price::text) in ('nan', 'infinity', '-infinity'))
    or (v_prediction_position is not null
      and lower(v_prediction_position::text) in ('nan', 'infinity', '-infinity'))
    or (v_score is not null
      and lower(v_score::text) in ('nan', 'infinity', '-infinity'))
    or (v_confidence is not null
      and lower(v_confidence::text) in ('nan', 'infinity', '-infinity'))
  then
    raise exception 'inference payload is missing required finite state values'
      using errcode = '22023';
  end if;

  if v_has_trade and (
    v_trade_from_position is null
    or v_trade_to_position is null
    or v_trade_price is null
    or v_trade_notional is null
    or v_trade_fee is null
    or v_trade_price <= 0
    or lower(v_trade_from_position::text) in ('nan', 'infinity', '-infinity')
    or lower(v_trade_to_position::text) in ('nan', 'infinity', '-infinity')
    or lower(v_trade_price::text) in ('nan', 'infinity', '-infinity')
    or lower(v_trade_notional::text) in ('nan', 'infinity', '-infinity')
    or lower(v_trade_fee::text) in ('nan', 'infinity', '-infinity')
  ) then
    raise exception 'inference payload contains an invalid trade'
      using errcode = '22023';
  end if;

  -- This is the serialization point for one run. Concurrent invocations wait
  -- here; the second invocation then observes the committed last_timestamp.
  select *
  into v_state
  from public.strategy_state
  where id = v_run_id
  for update;

  if not found then
    raise exception 'inference state conflict: strategy_state row is missing for %', v_run_id
      using errcode = '40001';
  end if;

  if v_state.symbol <> v_symbol or v_state.timeframe <> v_timeframe then
    raise exception 'inference state conflict: symbol/timeframe mismatch for %', v_run_id
      using errcode = '40001';
  end if;

  if lower(v_state.current_position::text) in ('nan', 'infinity', '-infinity')
    or lower(v_state.cash::text) in ('nan', 'infinity', '-infinity')
    or lower(v_state.asset_qty::text) in ('nan', 'infinity', '-infinity')
    or lower(v_state.equity::text) in ('nan', 'infinity', '-infinity')
    or (v_state.last_price is not null
      and lower(v_state.last_price::text) in ('nan', 'infinity', '-infinity'))
  then
    raise exception 'inference state conflict: persisted state contains a non-finite value for %', v_run_id
      using errcode = '40001';
  end if;

  -- A retried request after a committed transaction is a successful no-op.
  -- Require both durable rows before accepting this as idempotent; this keeps
  -- a legacy partial write visible instead of masking it.
  if v_state.last_timestamp = v_latest_timestamp then
    if not exists (
      select 1 from public.predictions
      where run_id = v_run_id and latest_timestamp = v_latest_timestamp
    ) or not exists (
      select 1 from public.equity_snapshots
      where run_id = v_run_id and timestamp = v_latest_timestamp
    ) or (v_has_trade and not exists (
      select 1 from public.trades
      where run_id = v_run_id and timestamp = v_latest_timestamp
    )) then
      raise exception 'inference state conflict: committed state has missing durable rows for %', v_latest_timestamp
        using errcode = '40001';
    end if;
    return jsonb_build_object(
      'ok', true,
      'status', 'already_processed',
      'traded', exists (
        select 1 from public.trades
        where run_id = v_run_id and timestamp = v_latest_timestamp
      )
    );
  end if;

  if v_state.last_timestamp is not null and v_state.last_timestamp > v_latest_timestamp then
    raise exception 'inference state conflict: latest timestamp is stale for %', v_run_id
      using errcode = '40001';
  end if;

  if v_expected_last_timestamp is distinct from v_state.last_timestamp
    or abs(v_expected_current_position - v_state.current_position) > 1e-12
    or abs(v_expected_cash - v_state.cash) > 1e-9
    or abs(v_expected_asset_qty - v_state.asset_qty) > 1e-12
    or abs(v_expected_equity - v_state.equity) > 1e-9
    or v_expected_last_price is distinct from v_state.last_price
  then
    raise exception 'inference state conflict: stale expected state for %', v_run_id
      using errcode = '40001';
  end if;

  -- If a previous implementation left one durable row behind, fail closed;
  -- never complete a partial historical write with different calculations.
  if exists (
    select 1 from public.predictions
    where run_id = v_run_id and latest_timestamp = v_latest_timestamp
  ) or exists (
    select 1 from public.equity_snapshots
    where run_id = v_run_id and timestamp = v_latest_timestamp
  ) or exists (
    select 1 from public.trades
    where run_id = v_run_id and timestamp = v_latest_timestamp
  ) then
    raise exception 'inference state conflict: durable row already exists for %', v_latest_timestamp
      using errcode = '40001';
  end if;

  insert into public.predictions (
    run_id,
    symbol,
    timeframe,
    signal,
    position,
    score,
    confidence,
    latest_close,
    latest_timestamp,
    model_version,
    feature_version,
    raw
  ) values (
    v_run_id,
    v_symbol,
    v_timeframe,
    v_signal,
    v_prediction_position,
    v_score,
    v_confidence,
    v_latest_close,
    v_latest_timestamp,
    v_model_version,
    v_feature_version,
    v_prediction_raw
  );

  update public.strategy_state
  set current_position = v_next_current_position,
      cash = v_next_cash,
      asset_qty = v_next_asset_qty,
      equity = v_next_equity,
      last_price = v_latest_close,
      last_timestamp = v_latest_timestamp,
      updated_at = clock_timestamp()
  where id = v_run_id;

  insert into public.equity_snapshots (
    run_id,
    symbol,
    timeframe,
    timestamp,
    equity,
    cash,
    asset_qty,
    position,
    price
  ) values (
    v_run_id,
    v_symbol,
    v_timeframe,
    v_latest_timestamp,
    v_next_equity,
    v_next_cash,
    v_next_asset_qty,
    v_next_current_position,
    v_latest_close
  );

  if v_has_trade then
    insert into public.trades (
      run_id,
      symbol,
      timeframe,
      timestamp,
      from_position,
      to_position,
      price,
      trade_notional,
      fee
    ) values (
      v_run_id,
      v_symbol,
      v_timeframe,
      v_latest_timestamp,
      v_trade_from_position,
      v_trade_to_position,
      v_trade_price,
      v_trade_notional,
      v_trade_fee
    );
  end if;

  return jsonb_build_object(
    'ok', true,
    'status', 'applied',
    'traded', v_has_trade
  );
end;
$function$;

-- Functions default to EXECUTE for PUBLIC. Restrict this write RPC to the
-- server-side service_role used by the Edge Function; browser roles cannot
-- call it even though the function lives in the exposed public schema.
revoke all on function public.record_unidream_inference(jsonb) from public, anon, authenticated;
grant execute on function public.record_unidream_inference(jsonb) to service_role;
