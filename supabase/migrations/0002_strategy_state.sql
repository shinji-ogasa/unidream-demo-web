-- Virtual paper-trading state driven by UniDream predictions.

create table if not exists public.strategy_state (
  id text primary key,
  symbol text not null,
  timeframe text not null,
  current_position double precision not null default 0,
  cash double precision not null,
  asset_qty double precision not null default 0,
  equity double precision not null,
  last_price double precision,
  last_timestamp timestamptz,
  updated_at timestamptz not null default now()
);

alter table public.strategy_state enable row level security;
drop policy if exists "strategy_state_public_read" on public.strategy_state;
create policy "strategy_state_public_read"
  on public.strategy_state
  for select to anon, authenticated using (true);

create table if not exists public.equity_snapshots (
  id uuid primary key default gen_random_uuid(),
  run_id text not null,
  symbol text not null,
  timeframe text not null,
  timestamp timestamptz not null,
  equity double precision not null,
  cash double precision not null,
  asset_qty double precision not null,
  position double precision not null,
  price double precision not null,
  created_at timestamptz not null default now()
);

create unique index if not exists equity_snapshots_run_timestamp_uidx
  on public.equity_snapshots (run_id, timestamp);

create index if not exists equity_snapshots_run_created_idx
  on public.equity_snapshots (run_id, created_at desc);

alter table public.equity_snapshots enable row level security;
drop policy if exists "equity_snapshots_public_read" on public.equity_snapshots;
create policy "equity_snapshots_public_read"
  on public.equity_snapshots
  for select to anon, authenticated using (true);

create table if not exists public.trades (
  id uuid primary key default gen_random_uuid(),
  run_id text not null,
  symbol text not null,
  timeframe text not null,
  timestamp timestamptz not null,
  from_position double precision not null,
  to_position double precision not null,
  price double precision not null,
  trade_notional double precision,
  fee double precision default 0,
  created_at timestamptz not null default now()
);

create index if not exists trades_run_created_idx
  on public.trades (run_id, created_at desc);

alter table public.trades enable row level security;
drop policy if exists "trades_public_read" on public.trades;
create policy "trades_public_read"
  on public.trades
  for select to anon, authenticated using (true);

-- Seed the default run if missing. Initial cash 10_000 USDT, flat position.
insert into public.strategy_state
  (id, symbol, timeframe, current_position, cash, asset_qty, equity, last_price, last_timestamp)
values
  ('unidream_btcusdt_15m_main', 'BTCUSDT', '15m', 0, 10000, 0, 10000, null, null)
on conflict (id) do nothing;
