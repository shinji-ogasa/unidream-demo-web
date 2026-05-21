// Supabase Edge Function: run-unidream-inference
//
// Pipeline (every 15 minutes via Supabase Cron):
//   1. Fetch BTCUSDT 15m candles from Binance public klines.
//   2. POST candles to the UniDream HF Space /predict (x-api-key auth).
//   3. Read the previous strategy_state row.
//   4. Idempotency: if the latest candle is not newer than last_timestamp, skip.
//   5. Simulate a virtual fill from current_position -> target_position at the
//      latest close, updating cash/asset_qty/equity (long-only exposure).
//   6. Insert prediction log, append equity_snapshot, optionally append trade,
//      upsert strategy_state.
//
// Required secrets (set via `supabase secrets set ...`):
//   PROJECT_URL                // Supabase project URL (https://<ref>.supabase.co)
//   PROJECT_SECRET_KEY         // service-role / sb_secret_... key
//   HF_SPACE_URL               // e.g. https://shinjiaa-unidream-space.hf.space
//   HF_INFERENCE_API_KEY       // matches INFERENCE_API_KEY on the Space
//
// NOTE: Supabase CLI rejects secret names that start with SUPABASE_, so the
// project URL/key are exposed to the function under PROJECT_* names.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const SYMBOL = "BTCUSDT";
const TIMEFRAME = "15m";
const RUN_ID = "unidream_btcusdt_15m_main";
const BARS_PER_DAY = 96;
const PLAN008_LOOKBACK_DAYS = 60;
const FEATURE_WARMUP_BARS = 1488;
const TARGET_BARS = PLAN008_LOOKBACK_DAYS * BARS_PER_DAY + FEATURE_WARMUP_BARS;
const MIN_BARS = TARGET_BARS;
const BINANCE_LIMIT = 1000;
const INITIAL_CASH = 10_000;
const FEE_RATE = 0; // PoC: no fees / slippage. Tune later if needed.
const MAX_TARGET_POSITION = 1.12;
// Long-only exposure baseline. Plan008 v2 overweight up to 1.06 is allowed.
const ALLOW_SHORT = false;

type Candle = {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

type BinanceKline = [
  number, string, string, string, string, string,
  number, string, number, string, string, string,
];

type StrategyState = {
  id: string;
  symbol: string;
  timeframe: string;
  current_position: number;
  cash: number;
  asset_qty: number;
  equity: number;
  last_price: number | null;
  last_timestamp: string | null;
};

function requireEnv(name: string): string {
  const v = Deno.env.get(name);
  if (!v) throw new Error(`missing required env: ${name}`);
  return v;
}

async function fetchBinanceBatch(endTimeMs: number | null, limit: number): Promise<BinanceKline[]> {
  const params = new URLSearchParams({
    symbol: SYMBOL,
    interval: TIMEFRAME,
    limit: String(limit),
  });
  if (endTimeMs !== null) params.set("endTime", String(endTimeMs));
  const url = `https://api.binance.com/api/v3/klines?${params.toString()}`;
  const resp = await fetch(url);
  if (!resp.ok) {
    const body = await resp.text();
    throw new Error(`binance klines failed: ${resp.status} ${body.slice(0, 200)}`);
  }
  return (await resp.json()) as BinanceKline[];
}

async function fetchCandles(target: number): Promise<Candle[]> {
  const newest = await fetchBinanceBatch(null, BINANCE_LIMIT);
  const acc: BinanceKline[] = [...newest];
  let oldestOpen = newest.length ? newest[0][0] : null;

  while (acc.length < target && oldestOpen !== null) {
    const remaining = Math.min(BINANCE_LIMIT, target - acc.length + 50);
    const older = await fetchBinanceBatch(oldestOpen - 1, remaining);
    if (older.length === 0) break;
    acc.unshift(...older);
    oldestOpen = older[0][0];
    if (older.length < remaining) break;
  }

  const byOpenTime = new Map<number, BinanceKline>();
  for (const k of acc) byOpenTime.set(k[0], k);
  const sorted = [...byOpenTime.values()].sort((a, b) => a[0] - b[0]);
  const clipped = sorted.slice(-target);
  return clipped.map((k) => ({
    timestamp: new Date(k[0]).toISOString(),
    open: Number(k[1]),
    high: Number(k[2]),
    low: Number(k[3]),
    close: Number(k[4]),
    volume: Number(k[5]),
  }));
}

function shortModelVersion(run: Record<string, unknown> | null | undefined): string | null {
  if (!run || typeof run !== "object") return null;
  const explicit = run.name ?? run.run_id;
  if (typeof explicit === "string" && explicit.length > 0) return explicit;
  const dir = run.checkpoint_dir;
  if (typeof dir === "string" && dir.length > 0) {
    const base = dir.split(/[\\/]/).filter(Boolean).pop() ?? dir;
    const fold = run.fold;
    return typeof fold === "number" ? `${base}@fold${fold}` : base;
  }
  return null;
}

async function fetchModelVersion(spaceUrl: string): Promise<string | null> {
  try {
    const resp = await fetch(`${spaceUrl.replace(/\/+$/, "")}/health`);
    if (!resp.ok) return null;
    const data = await resp.json() as { run?: Record<string, unknown> };
    return shortModelVersion(data.run);
  } catch {
    return null;
  }
}

async function callPredict(spaceUrl: string, apiKey: string, candles: Candle[]) {
  const resp = await fetch(`${spaceUrl.replace(/\/+$/, "")}/predict`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
    },
    body: JSON.stringify({
      symbol: SYMBOL,
      timeframe: TIMEFRAME,
      candles,
      tail: 32,
    }),
  });
  const text = await resp.text();
  if (!resp.ok) {
    throw new Error(`HF /predict failed: ${resp.status} ${text.slice(0, 300)}`);
  }
  return JSON.parse(text);
}

function clampTargetPosition(raw: unknown): number {
  if (typeof raw !== "number" || !Number.isFinite(raw)) return 0;
  let target = raw;
  if (!ALLOW_SHORT && target < 0) target = 0;
  if (target > MAX_TARGET_POSITION) target = MAX_TARGET_POSITION;
  if (target < -1) target = -1;
  return target;
}

function applyFill(
  prev: StrategyState,
  targetPosition: number,
  price: number,
): {
  next: { current_position: number; cash: number; asset_qty: number; equity: number };
  trade: {
    from_position: number;
    to_position: number;
    price: number;
    trade_notional: number;
    fee: number;
  } | null;
} {
  // Mark previous state to current price so target sizing is based on live equity.
  const equityAtPrice = prev.cash + prev.asset_qty * price;
  const targetAssetQty = (targetPosition * equityAtPrice) / price;
  const deltaQty = targetAssetQty - prev.asset_qty;

  // No-op when target position equals current within tiny epsilon.
  const positionUnchanged = Math.abs(targetPosition - prev.current_position) < 1e-9
    && Math.abs(deltaQty) < 1e-9;

  if (positionUnchanged) {
    return {
      next: {
        current_position: prev.current_position,
        cash: prev.cash,
        asset_qty: prev.asset_qty,
        equity: equityAtPrice,
      },
      trade: null,
    };
  }

  const tradeNotional = Math.abs(deltaQty) * price;
  const fee = tradeNotional * FEE_RATE;
  const newCash = prev.cash - deltaQty * price - fee;
  const newAssetQty = targetAssetQty;
  const newEquity = newCash + newAssetQty * price;

  return {
    next: {
      current_position: targetPosition,
      cash: newCash,
      asset_qty: newAssetQty,
      equity: newEquity,
    },
    trade: {
      from_position: prev.current_position,
      to_position: targetPosition,
      price,
      trade_notional: tradeNotional,
      fee,
    },
  };
}

Deno.serve(async (_req) => {
  try {
    const projectUrl = requireEnv("PROJECT_URL");
    const projectSecretKey = requireEnv("PROJECT_SECRET_KEY");
    const spaceUrl = requireEnv("HF_SPACE_URL");
    const apiKey = requireEnv("HF_INFERENCE_API_KEY");

    const supabase = createClient(projectUrl, projectSecretKey, {
      auth: { persistSession: false },
    });

    // Fetch candles + load previous state in parallel.
    const [candles, stateRes] = await Promise.all([
      fetchCandles(TARGET_BARS),
      supabase.from("strategy_state").select("*").eq("id", RUN_ID).maybeSingle(),
    ]);

    if (stateRes.error) throw new Error(`strategy_state read failed: ${stateRes.error.message}`);
    if (candles.length < MIN_BARS) {
      throw new Error(`insufficient candles: got ${candles.length}, need >= ${MIN_BARS}`);
    }
    const latest = candles[candles.length - 1];
    const latestTs = new Date(latest.timestamp).getTime();

    // Seed strategy_state row on first run if the migration's seed was skipped.
    let prev: StrategyState = stateRes.data ?? {
      id: RUN_ID,
      symbol: SYMBOL,
      timeframe: TIMEFRAME,
      current_position: 0,
      cash: INITIAL_CASH,
      asset_qty: 0,
      equity: INITIAL_CASH,
      last_price: null,
      last_timestamp: null,
    };

    // Idempotency: skip when this 15m bar was already processed.
    if (prev.last_timestamp) {
      const lastTs = new Date(prev.last_timestamp).getTime();
      if (latestTs <= lastTs) {
        return Response.json({
          ok: true,
          skipped: true,
          reason: "already_processed",
          latest_timestamp: latest.timestamp,
          last_timestamp: prev.last_timestamp,
        });
      }
    }

    const [pred, modelVersion] = await Promise.all([
      callPredict(spaceUrl, apiKey, candles),
      fetchModelVersion(spaceUrl),
    ]);

    const rawTarget = typeof pred?.position === "number" ? pred.position : 0;
    const targetPosition = clampTargetPosition(rawTarget);
    const price = latest.close;

    const { next, trade } = applyFill(prev, targetPosition, price);

    // Predictions log.
    const predRow = {
      symbol: SYMBOL,
      timeframe: TIMEFRAME,
      signal: typeof pred?.signal === "string" ? pred.signal : "unknown",
      position: typeof pred?.position === "number" ? pred.position : null,
      score: typeof pred?.score === "number" ? pred.score : null,
      confidence: typeof pred?.confidence === "number" ? pred.confidence : null,
      latest_close: price,
      latest_timestamp: latest.timestamp,
      model_version: typeof pred?.model_version === "string" ? pred.model_version : modelVersion,
      feature_version: typeof pred?.feature_version === "string" ? pred.feature_version : null,
      raw: pred,
    };

    const snapshotRow = {
      run_id: RUN_ID,
      symbol: SYMBOL,
      timeframe: TIMEFRAME,
      timestamp: latest.timestamp,
      equity: next.equity,
      cash: next.cash,
      asset_qty: next.asset_qty,
      position: next.current_position,
      price,
    };

    const stateRow = {
      id: RUN_ID,
      symbol: SYMBOL,
      timeframe: TIMEFRAME,
      current_position: next.current_position,
      cash: next.cash,
      asset_qty: next.asset_qty,
      equity: next.equity,
      last_price: price,
      last_timestamp: latest.timestamp,
      updated_at: new Date().toISOString(),
    };

    // Order matters only for upsert/insert errors; do them sequentially so we
    // can surface a precise error for the user.
    const insPred = await supabase.from("predictions").insert(predRow);
    if (insPred.error) throw new Error(`predictions insert failed: ${insPred.error.message}`);

    const upsState = await supabase.from("strategy_state").upsert(stateRow);
    if (upsState.error) throw new Error(`strategy_state upsert failed: ${upsState.error.message}`);

    // Snapshot has a unique index on (run_id, timestamp) so reruns are safe.
    const insSnap = await supabase
      .from("equity_snapshots")
      .upsert(snapshotRow, { onConflict: "run_id,timestamp" });
    if (insSnap.error) throw new Error(`equity_snapshots upsert failed: ${insSnap.error.message}`);

    if (trade) {
      const tradeRow = {
        run_id: RUN_ID,
        symbol: SYMBOL,
        timeframe: TIMEFRAME,
        timestamp: latest.timestamp,
        ...trade,
      };
      const insTrade = await supabase.from("trades").insert(tradeRow);
      if (insTrade.error) throw new Error(`trades insert failed: ${insTrade.error.message}`);
    }

    return Response.json({
      ok: true,
      candles: candles.length,
      prediction: {
        signal: predRow.signal,
        raw_position: predRow.position,
        target_position: targetPosition,
        latest_close: price,
        latest_timestamp: latest.timestamp,
        model_version: predRow.model_version,
      },
      state: {
        equity: next.equity,
        cash: next.cash,
        asset_qty: next.asset_qty,
        position: next.current_position,
      },
      traded: trade !== null,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ ok: false, error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
