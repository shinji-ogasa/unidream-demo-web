-- predictions table: stores UniDream inference results emitted by the Edge Function.
create extension if not exists "pgcrypto";

create table if not exists public.predictions (
  id uuid primary key default gen_random_uuid(),
  symbol text not null,
  timeframe text not null,
  signal text not null,
  position double precision,
  score double precision,
  confidence double precision,
  latest_close double precision,
  latest_timestamp timestamptz,
  model_version text,
  feature_version text,
  raw jsonb,
  created_at timestamptz not null default now()
);

create index if not exists predictions_symbol_timeframe_created_at_idx
  on public.predictions (symbol, timeframe, created_at desc);

alter table public.predictions enable row level security;

-- Public read so the Web client can subscribe with the publishable key.
drop policy if exists "predictions_public_read" on public.predictions;
create policy "predictions_public_read"
  on public.predictions
  for select
  to anon, authenticated
  using (true);

-- No insert/update/delete policy for anon: the Edge Function uses the
-- service-role / secret key which bypasses RLS, so writes stay server-side.
