# unidream-demo-web

UniDream live demo: Web frontend (Next.js) + Supabase Edge Function that drives a
virtual paper-trading run by calling the [unidream-space](../unidream-space) HF
Spaces inference API every 15 minutes.

```
Binance klines (15m)
    ↓
Supabase Cron (15m)
    ↓
Edge Function: run-unidream-inference
    ↓
HF Space /predict (UniDream)
    ↓
Supabase: predictions / strategy_state / equity_snapshots / trades
    ↓
Next.js page (Realtime subscribe)
```

The frontend never holds a model and never calls HF Spaces directly.
Disclaimer is shown in the UI: research demo, not financial advice.

## Layout

```
src/
  app/
    layout.tsx
    page.tsx              SSR initial load + <Dashboard/>
    globals.css
  components/
    Dashboard.tsx         realtime subscriptions + layout
    EquityChart.tsx       recharts line chart
    StatCard.tsx
    TradesTable.tsx
  lib/
    supabase.ts           browser client (publishable key)
    types.ts              row shapes + run_id constants
    format.ts
supabase/
  migrations/
    0001_predictions.sql        prediction log
    0002_strategy_state.sql     strategy_state, equity_snapshots, trades
  functions/
    run-unidream-inference/
      index.ts                  Deno Edge Function
```

## Tables

- `predictions` — every model call's raw output (signal, position, latest_close,
  model_version, raw jsonb).
- `strategy_state` — single row per `run_id` with current cash / asset_qty /
  equity / current_position / last_timestamp. Seed row inserted by migration.
- `equity_snapshots` — one row per processed 15m bar; powers the equity chart.
  Unique on `(run_id, timestamp)` so re-invocations are idempotent.
- `trades` — appended only when target position changes from previous.

Run id used by both the Edge Function and the frontend:
`unidream_btcusdt_15m_main` (initial cash 10,000 USDT, flat).

## Frontend setup

`.env.local` (create from `.env.local.example`):

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxxxxxxxxxxxxxxxx
```

Do **not** put `sb_secret_...` or `HF_INFERENCE_API_KEY` in `.env.local` —
both would leak to the browser. Those go to Edge Function secrets instead.

```powershell
npm install
npm run dev
```

Open http://localhost:3000.

## Supabase setup

Apply migrations (Studio SQL editor or `supabase db push`):

```powershell
supabase link --project-ref YOUR-PROJECT-REF
supabase db push
```

Set Edge Function secrets. Supabase CLI rejects names starting with
`SUPABASE_`, so the project URL/key are stored as `PROJECT_*`:

```powershell
supabase secrets set PROJECT_URL=https://YOUR-PROJECT.supabase.co
supabase secrets set PROJECT_SECRET_KEY=sb_secret_xxxxxxxxxxxxxxxxx
supabase secrets set HF_SPACE_URL=https://shinjiaa-unidream-space.hf.space
supabase secrets set HF_INFERENCE_API_KEY=<same value as INFERENCE_API_KEY on HF Space>
```

Deploy and smoke-test the function:

```powershell
supabase functions deploy run-unidream-inference
supabase functions invoke run-unidream-inference
```

A successful invocation returns:

```json
{
  "ok": true,
  "candles": 1800,
  "prediction": { "signal": "...", "raw_position": 1.0, "target_position": 1.0, ... },
  "state":      { "equity": 10000.0, "cash": 0.0, "asset_qty": 0.116, "position": 1.0 },
  "traded": true
}
```

Verify rows landed:

```sql
select created_at, signal, position, latest_close, model_version
from predictions order by created_at desc limit 1;

select * from strategy_state where id = 'unidream_btcusdt_15m_main';

select timestamp, equity, position, price
from equity_snapshots where run_id = 'unidream_btcusdt_15m_main'
order by timestamp desc limit 5;

select * from trades where run_id = 'unidream_btcusdt_15m_main'
order by created_at desc limit 5;
```

Schedule with Supabase Cron (run on minutes 1/16/31/46 of every hour):

```sql
select cron.schedule(
  'unidream-15m',
  '1,16,31,46 * * * *',
  $$
  select net.http_post(
    url := 'https://YOUR-PROJECT.functions.supabase.co/run-unidream-inference',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true),
      'Content-Type', 'application/json'
    ),
    body := jsonb_build_object()
  );
  $$
);
```

Adjust the auth header to match how your project exposes the service role key
to `pg_net`. The function itself does not require a JWT.

## Behaviour notes

- **Idempotency.** The function reads `strategy_state.last_timestamp` and skips
  the run if the latest 15m bar is not newer. `equity_snapshots` also has a
  unique `(run_id, timestamp)` index as a second line of defence.
- **Position semantics.** `target_position` is treated as fractional spot
  exposure: `1.0` = 100% long, `0.0` = flat. Negative targets collapse to flat
  by default (`ALLOW_SHORT = false` in the function). Flip the flag if/when the
  Space is allowed to short.
- **Fees / slippage.** `FEE_RATE = 0` for the PoC. Set a small value (e.g.
  `0.0005`) and re-deploy when realism is needed.
- **Initial state.** Migration `0002` seeds `strategy_state` with cash 10,000
  USDT, flat position. To reset the demo:
  ```sql
  delete from trades            where run_id = 'unidream_btcusdt_15m_main';
  delete from equity_snapshots  where run_id = 'unidream_btcusdt_15m_main';
  update strategy_state set
    current_position = 0, cash = 10000, asset_qty = 0, equity = 10000,
    last_price = null, last_timestamp = null, updated_at = now()
  where id = 'unidream_btcusdt_15m_main';
  ```
- **Predictions log.** Every Cron tick inserts a row even when no trade
  happens, so `predictions` doubles as a heartbeat.

## Local dev safety

- `.env.local` is gitignored. `.env.local.example` is the only template that
  should be committed.
- The browser only uses the publishable key, which has read-only access via
  RLS. Inserts come from the Edge Function using the service-role key.
- The frontend never reaches HF Spaces directly.
