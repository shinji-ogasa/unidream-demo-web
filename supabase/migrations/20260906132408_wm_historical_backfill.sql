-- Historical WM replay uses the exact live transition validator and projector,
-- but cannot satisfy the live next-open deadline by design. Keep the bypass in
-- a separate service-only wrapper so the public/live RPC remains fail-closed.
-- The function body is patched from the already-installed migration instead of
-- being copied here, which keeps the accounting validation single-sourced.
do $migration$
declare
  function_sql text;
  original_check text := $$if clock_timestamp() >= event_time + interval '15 minutes' then$$;
  historical_check text := $$if current_setting('unidream.wm_historical', true) is distinct from 'on'
    and clock_timestamp() >= event_time + interval '15 minutes' then$$;
begin
  select pg_get_functiondef('public.record_wm_demo_transition(jsonb)'::regprocedure)
    into function_sql;
  if function_sql is null or length(function_sql) = 0 then
    raise exception 'WM live transition function is missing';
  end if;
  if length(function_sql) - length(replace(function_sql, original_check, '')) <> 2 * length(original_check) then
    raise exception 'WM live transition deadline checks changed; review backfill migration';
  end if;
  function_sql := replace(function_sql, original_check, historical_check);
  execute function_sql;
end;
$migration$;

create function public.record_wm_demo_backfill_transition(payload jsonb)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if current_user not in ('service_role', 'postgres', 'supabase_admin') then
    raise exception using errcode = '42501', message = 'WM backfill requires server authority';
  end if;
  if jsonb_typeof(payload) is distinct from 'object'
      or payload->>'write_mode' is distinct from 'backfill' then
    raise exception 'WM backfill requires write_mode=backfill';
  end if;
  perform set_config('unidream.wm_historical', 'on', true);
  return public.record_wm_demo_transition(payload);
end;
$$;

revoke all on function public.record_wm_demo_backfill_transition(jsonb) from public, anon, authenticated;
grant execute on function public.record_wm_demo_backfill_transition(jsonb) to service_role;
