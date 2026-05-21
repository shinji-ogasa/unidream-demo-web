// One-time backfill: replay UniDream predictions over historical Binance 15m
// candles so the demo has a populated equity curve and trade history before
// the live Cron starts. Mirrors the simulation logic from the Edge Function
// `run-unidream-inference`, but runs locally against `.env.backfill`.
//
// Usage:
//   npm run backfill -- --reset
//   npm run backfill -- --reset --days 30
//   npm run backfill -- --max-steps 200
//
// Notes:
//   - Sequential HF /predict calls, ~1-5s each. The script fetches the requested
//     replay span plus Plan008 context, then replays only the requested span.
//     Expect a long-running job; flush every 200 steps so partial progress is
//     preserved on Ctrl+C.
//   - Run before the live Cron is enabled, or pause the Cron during the run.

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import { setTimeout as sleep } from "node:timers/promises";

dotenv.config({ path: ".env.backfill" });

// --- Config ---------------------------------------------------------------

const SYMBOL = "BTCUSDT";
const TIMEFRAME = "15m";
const RUN_ID = "unidream_btcusdt_15m_main";
const INITIAL_CASH = 10_000;
const FEE_RATE = 0;
const MAX_TARGET_POSITION = 1.12;
const ALLOW_SHORT = false;
const BARS_PER_DAY = 96;
const PLAN008_LOOKBACK_DAYS = 60;
const FEATURE_WARMUP_BARS = 1488;
const WINDOW_BARS = PLAN008_LOOKBACK_DAYS * BARS_PER_DAY + FEATURE_WARMUP_BARS;
const WARMUP_BARS = WINDOW_BARS;
const MODEL_CONTEXT_DAYS = WINDOW_BARS / BARS_PER_DAY;
const BINANCE_LIMIT = 1000;
const SAMPLE_PROBES = 20;
const FLUSH_EVERY = 200;
const HF_RETRY_MAX = 3;
const HF_RETRY_BASE_MS = 1500;
const BINANCE_PACING_MS = 150;

// --- Types ----------------------------------------------------------------

type Candle = {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  openTimeMs: number;
};

type State = {
  current_position: number;
  cash: number;
  asset_qty: number;
  equity: number;
  last_price: number | null;
  last_timestamp: string | null;
};

type PredResponse = Record<string, unknown> & {
  position?: number;
  signal?: string;
  target_position?: number;
  score?: number;
  confidence?: number;
  model_version?: string;
  feature_version?: string;
};

type CliOpts = {
  reset: boolean;
  days: number;
  maxSteps: number;
};

// --- CLI ------------------------------------------------------------------

function parseArgs(): CliOpts {
  const argv = process.argv.slice(2);
  let reset = false;
  let days = 60;
  let maxSteps = Number.POSITIVE_INFINITY;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--reset") {
      reset = true;
    } else if (a === "--days") {
      const v = argv[++i];
      if (!v) throw new Error("--days requires a value");
      days = Number(v);
      if (!Number.isFinite(days) || days <= 0) throw new Error("--days must be a positive number");
    } else if (a === "--max-steps") {
      const v = argv[++i];
      if (!v) throw new Error("--max-steps requires a value");
      maxSteps = Number(v);
      if (!Number.isFinite(maxSteps) || maxSteps <= 0) throw new Error("--max-steps must be positive");
    } else if (a === "--help" || a === "-h") {
      console.log("Usage: npm run backfill -- [--reset] [--days N=60] [--max-steps N]");
      process.exit(0);
    } else {
      throw new Error(`unknown argument: ${a}`);
    }
  }
  return { reset, days, maxSteps };
}

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) {
    console.error(`missing required env: ${name} (set in .env.backfill — copy .env.backfill.example)`);
    process.exit(1);
  }
  return v;
}

// --- Binance --------------------------------------------------------------

async function fetchBinanceBatch(endTimeMs: number | null, limit: number): Promise<unknown[][]> {
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
  return (await resp.json()) as unknown[][];
}

async function fetchCandles(days: number): Promise<Candle[]> {
  const targetSpanMs = days * 24 * 60 * 60 * 1000;
  const acc: unknown[][] = [];
  let endTimeMs: number | null = null;
  let oldest = Number.POSITIVE_INFINITY;
  let newest = Number.NEGATIVE_INFINITY;

  while (true) {
    const batch = await fetchBinanceBatch(endTimeMs, BINANCE_LIMIT);
    if (batch.length === 0) break;
    acc.push(...batch);
    const firstOpen = Number(batch[0][0]);
    const lastOpen = Number(batch[batch.length - 1][0]);
    oldest = Math.min(oldest, firstOpen);
    newest = Math.max(newest, lastOpen);
    if (newest - oldest >= targetSpanMs) break;
    if (batch.length < BINANCE_LIMIT) break;
    endTimeMs = firstOpen - 1;
    await sleep(BINANCE_PACING_MS);
  }

  const byOpenTime = new Map<number, unknown[]>();
  for (const k of acc) byOpenTime.set(Number(k[0]), k);
  const sorted = [...byOpenTime.values()].sort(
    (a, b) => Number(a[0]) - Number(b[0]),
  );
  const targetBars = Math.ceil(days * BARS_PER_DAY) + 1;
  const clipped = sorted.slice(-targetBars);
  return clipped.map((k) => ({
    timestamp: new Date(Number(k[0])).toISOString(),
    open: Number(k[1]),
    high: Number(k[2]),
    low: Number(k[3]),
    close: Number(k[4]),
    volume: Number(k[5]),
    openTimeMs: Number(k[0]),
  }));
}

// --- HF Space -------------------------------------------------------------

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
    const data = (await resp.json()) as { run?: Record<string, unknown> };
    return shortModelVersion(data.run ?? null);
  } catch {
    return null;
  }
}

async function callPredict(
  spaceUrl: string,
  apiKey: string,
  candles: Candle[],
): Promise<PredResponse> {
  const body = {
    symbol: SYMBOL,
    timeframe: TIMEFRAME,
    candles: candles.map((c) => ({
      timestamp: c.timestamp,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
      volume: c.volume,
    })),
    tail: 32,
  };
  let lastErr: unknown;
  for (let attempt = 1; attempt <= HF_RETRY_MAX; attempt++) {
    try {
      const resp = await fetch(`${spaceUrl.replace(/\/+$/, "")}/predict`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
        },
        body: JSON.stringify(body),
      });
      const text = await resp.text();
      if (!resp.ok) {
        throw new Error(`HF /predict ${resp.status}: ${text.slice(0, 300)}`);
      }
      return JSON.parse(text) as PredResponse;
    } catch (err) {
      lastErr = err;
      if (attempt === HF_RETRY_MAX) break;
      const delay = HF_RETRY_BASE_MS * attempt;
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`  retry ${attempt}/${HF_RETRY_MAX - 1} after ${delay}ms (${msg})`);
      await sleep(delay);
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
}

// --- Sim ------------------------------------------------------------------

function clampTargetPosition(raw: unknown): number {
  if (typeof raw !== "number" || !Number.isFinite(raw)) return 0;
  let t = raw;
  if (!ALLOW_SHORT && t < 0) t = 0;
  if (t > MAX_TARGET_POSITION) t = MAX_TARGET_POSITION;
  if (t < -1) t = -1;
  return t;
}

type FillResult = {
  next: { current_position: number; cash: number; asset_qty: number; equity: number };
  trade: {
    from_position: number;
    to_position: number;
    price: number;
    trade_notional: number;
    fee: number;
  } | null;
};

function applyFill(prev: State, targetPosition: number, price: number): FillResult {
  const equityAtPrice = prev.cash + prev.asset_qty * price;
  const targetAssetQty = (targetPosition * equityAtPrice) / price;
  const deltaQty = targetAssetQty - prev.asset_qty;
  const positionUnchanged =
    Math.abs(targetPosition - prev.current_position) < 1e-9 &&
    Math.abs(deltaQty) < 1e-9;

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
  const cash = prev.cash - deltaQty * price - fee;
  const asset_qty = targetAssetQty;
  const equity = cash + asset_qty * price;

  return {
    next: { current_position: targetPosition, cash, asset_qty, equity },
    trade: {
      from_position: prev.current_position,
      to_position: targetPosition,
      price,
      trade_notional: tradeNotional,
      fee,
    },
  };
}

// --- Reset ----------------------------------------------------------------

async function resetRun(supabase: SupabaseClient): Promise<void> {
  const delPred = await supabase
    .from("predictions")
    .delete()
    .eq("symbol", SYMBOL)
    .eq("timeframe", TIMEFRAME);
  if (delPred.error) throw new Error(`reset predictions failed: ${delPred.error.message}`);

  const delTrades = await supabase.from("trades").delete().eq("run_id", RUN_ID);
  if (delTrades.error) throw new Error(`reset trades failed: ${delTrades.error.message}`);

  const delSnaps = await supabase.from("equity_snapshots").delete().eq("run_id", RUN_ID);
  if (delSnaps.error) throw new Error(`reset equity_snapshots failed: ${delSnaps.error.message}`);

  const upState = await supabase.from("strategy_state").upsert({
    id: RUN_ID,
    symbol: SYMBOL,
    timeframe: TIMEFRAME,
    current_position: 0,
    cash: INITIAL_CASH,
    asset_qty: 0,
    equity: INITIAL_CASH,
    last_price: null,
    last_timestamp: null,
    updated_at: new Date().toISOString(),
  });
  if (upState.error) throw new Error(`reset strategy_state failed: ${upState.error.message}`);
}

// --- Helpers --------------------------------------------------------------

function evenIndices(start: number, end: number, n: number): number[] {
  if (end < start || n <= 0) return [];
  if (n === 1) return [Math.round((start + end) / 2)];
  if (n >= end - start + 1) {
    const all: number[] = [];
    for (let i = start; i <= end; i++) all.push(i);
    return all;
  }
  const out = new Set<number>();
  for (let k = 0; k < n; k++) {
    const idx = Math.round(start + ((end - start) * k) / (n - 1));
    out.add(idx);
  }
  return [...out].sort((a, b) => a - b);
}

function pickTarget(pred: PredResponse): number {
  if (typeof pred.target_position === "number") return pred.target_position;
  if (typeof pred.position === "number") return pred.position;
  return 0;
}

// --- Main -----------------------------------------------------------------

async function main(): Promise<void> {
  const opts = parseArgs();
  const projectUrl = requireEnv("PROJECT_URL");
  const projectKey = requireEnv("PROJECT_SECRET_KEY");
  const spaceUrl = requireEnv("HF_SPACE_URL");
  const apiKey = requireEnv("HF_INFERENCE_API_KEY");

  const supabase: SupabaseClient = createClient(projectUrl, projectKey, {
    auth: { persistSession: false },
  });

  if (opts.reset) {
    console.log("[reset] clearing predictions / trades / equity_snapshots and resetting strategy_state");
    await resetRun(supabase);
  }

  const fetchDays = opts.days + MODEL_CONTEXT_DAYS;
  console.log(
    `[fetch] requesting ~${fetchDays.toFixed(1)} days of ${SYMBOL} ${TIMEFRAME} candles ` +
      `(${opts.days} replay days + ${MODEL_CONTEXT_DAYS.toFixed(1)} context days) from Binance`,
  );
  const candles = await fetchCandles(fetchDays);
  if (candles.length === 0) {
    console.error("no candles returned from Binance");
    process.exit(1);
  }
  console.log(
    `[fetch] got ${candles.length} candles (${candles[0].timestamp} → ${candles[candles.length - 1].timestamp})`,
  );

  if (candles.length < WARMUP_BARS + 1) {
    console.error(`not enough candles: got ${candles.length}, need >= ${WARMUP_BARS + 1}`);
    process.exit(1);
  }

  const stateRes = await supabase.from("strategy_state").select("*").eq("id", RUN_ID).maybeSingle();
  if (stateRes.error) throw new Error(`strategy_state read failed: ${stateRes.error.message}`);

  let curState: State = stateRes.data
    ? {
        current_position: stateRes.data.current_position,
        cash: stateRes.data.cash,
        asset_qty: stateRes.data.asset_qty,
        equity: stateRes.data.equity,
        last_price: stateRes.data.last_price,
        last_timestamp: stateRes.data.last_timestamp,
      }
    : {
        current_position: 0,
        cash: INITIAL_CASH,
        asset_qty: 0,
        equity: INITIAL_CASH,
        last_price: null,
        last_timestamp: null,
      };

  const modelVersion = await fetchModelVersion(spaceUrl);
  console.log(`[hf] model_version=${modelVersion ?? "unknown"}`);

  const firstStep = WARMUP_BARS - 1;
  const lastStep = candles.length - 1;

  // --- Probe phase: sanity-check that the Space is producing varied targets.
  console.log(`[probe] sampling ${SAMPLE_PROBES} windows for unique target_position values`);
  const probeIdx = evenIndices(firstStep, lastStep, SAMPLE_PROBES);
  const probeTargets: number[] = [];
  const probeStart = Date.now();
  for (const idx of probeIdx) {
    const win = candles.slice(Math.max(0, idx - WINDOW_BARS + 1), idx + 1);
    try {
      const pred = await callPredict(spaceUrl, apiKey, win);
      probeTargets.push(clampTargetPosition(pickTarget(pred)));
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`  probe at idx=${idx} failed: ${msg}`);
    }
  }
  const probeElapsedSec = (Date.now() - probeStart) / 1000;
  const uniqueProbe = [...new Set(probeTargets.map((v) => v.toFixed(4)))];
  console.log(`[probe] unique target_position values: [${uniqueProbe.join(", ")}]`);
  if (uniqueProbe.length === 1 && Number(uniqueProbe[0]) === 1) {
    console.warn(
      "[probe] WARN: every sampled target_position is 1.0 — the trade history will not grow even after a full backfill. Check the model/bundle.",
    );
  }

  // --- Replay phase
  const totalSteps = Math.min(lastStep - firstStep + 1, opts.maxSteps);
  console.log(`[replay] starting at idx=${firstStep} (${candles[firstStep].timestamp})`);
  console.log(`[replay] ending   at idx=${lastStep} (${candles[lastStep].timestamp})`);
  console.log(`[replay] Plan008 window bars = ${WINDOW_BARS}`);
  if (probeTargets.length > 0) {
    const avgMs = (probeElapsedSec * 1000) / probeTargets.length;
    const estMin = (totalSteps * avgMs) / 1000 / 60;
    console.log(
      `[replay] total steps = ${totalSteps} · probe avg ${avgMs.toFixed(0)}ms/call → est ~${estMin.toFixed(1)} min`,
    );
  } else {
    console.log(`[replay] total steps = ${totalSteps}`);
  }

  const predBuf: Record<string, unknown>[] = [];
  const snapBuf: Record<string, unknown>[] = [];
  const tradeBuf: Record<string, unknown>[] = [];
  let predCount = 0;
  let tradeCount = 0;
  let processed = 0;
  let skipped = 0;
  const t0 = Date.now();

  async function flush(): Promise<void> {
    if (predBuf.length) {
      const { error } = await supabase.from("predictions").insert(predBuf);
      if (error) throw new Error(`predictions insert failed: ${error.message}`);
      predCount += predBuf.length;
      predBuf.length = 0;
    }
    if (snapBuf.length) {
      const { error } = await supabase
        .from("equity_snapshots")
        .upsert(snapBuf, { onConflict: "run_id,timestamp" });
      if (error) throw new Error(`equity_snapshots upsert failed: ${error.message}`);
      snapBuf.length = 0;
    }
    if (tradeBuf.length) {
      const { error } = await supabase.from("trades").insert(tradeBuf);
      if (error) throw new Error(`trades insert failed: ${error.message}`);
      tradeCount += tradeBuf.length;
      tradeBuf.length = 0;
    }
  }

  const lastTsMs = curState.last_timestamp ? new Date(curState.last_timestamp).getTime() : -Infinity;

  for (let i = firstStep; i <= lastStep; i++) {
    if (processed >= opts.maxSteps) break;
    const latest = candles[i];
    if (latest.openTimeMs <= lastTsMs) {
      skipped += 1;
      continue;
    }
    const win = candles.slice(Math.max(0, i - WINDOW_BARS + 1), i + 1);
    let pred: PredResponse;
    try {
      pred = await callPredict(spaceUrl, apiKey, win);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[replay] step idx=${i} (${latest.timestamp}) failed after retries: ${msg}`);
      await flush();
      throw err;
    }

    const target = clampTargetPosition(pickTarget(pred));
    const price = latest.close;
    const { next, trade } = applyFill(curState, target, price);
    const stepModelVersion =
      typeof pred.model_version === "string" ? pred.model_version : modelVersion;

    predBuf.push({
      symbol: SYMBOL,
      timeframe: TIMEFRAME,
      signal: typeof pred.signal === "string" ? pred.signal : "unknown",
      position: typeof pred.position === "number" ? pred.position : null,
      score: typeof pred.score === "number" ? pred.score : null,
      confidence: typeof pred.confidence === "number" ? pred.confidence : null,
      latest_close: price,
      latest_timestamp: latest.timestamp,
      model_version: stepModelVersion,
      feature_version: typeof pred.feature_version === "string" ? pred.feature_version : null,
      raw: pred,
      // Anchor predictions to the bar time so the chart aligns with snapshots.
      created_at: latest.timestamp,
    });

    snapBuf.push({
      run_id: RUN_ID,
      symbol: SYMBOL,
      timeframe: TIMEFRAME,
      timestamp: latest.timestamp,
      equity: next.equity,
      cash: next.cash,
      asset_qty: next.asset_qty,
      position: next.current_position,
      price,
    });

    if (trade) {
      tradeBuf.push({
        run_id: RUN_ID,
        symbol: SYMBOL,
        timeframe: TIMEFRAME,
        timestamp: latest.timestamp,
        ...trade,
      });
    }

    curState = {
      current_position: next.current_position,
      cash: next.cash,
      asset_qty: next.asset_qty,
      equity: next.equity,
      last_price: price,
      last_timestamp: latest.timestamp,
    };
    processed += 1;

    if (predBuf.length >= FLUSH_EVERY) {
      await flush();
      const elapsed = (Date.now() - t0) / 1000;
      const rate = processed / Math.max(elapsed, 1e-6);
      const remain = totalSteps - processed;
      const etaSec = remain / Math.max(rate, 1e-6);
      console.log(
        `[replay] processed=${processed}/${totalSteps} (${((processed / totalSteps) * 100).toFixed(1)}%) ` +
          `rate=${rate.toFixed(2)} step/s eta=${Math.round(etaSec)}s ` +
          `equity=${curState.equity.toFixed(2)} pos=${curState.current_position.toFixed(2)}`,
      );
    }
  }

  await flush();

  const finalRow = {
    id: RUN_ID,
    symbol: SYMBOL,
    timeframe: TIMEFRAME,
    current_position: curState.current_position,
    cash: curState.cash,
    asset_qty: curState.asset_qty,
    equity: curState.equity,
    last_price: curState.last_price,
    last_timestamp: curState.last_timestamp,
    updated_at: new Date().toISOString(),
  };
  const { error: upErr } = await supabase.from("strategy_state").upsert(finalRow);
  if (upErr) throw new Error(`strategy_state upsert failed: ${upErr.message}`);

  const elapsed = (Date.now() - t0) / 1000;
  console.log("");
  console.log("=== backfill summary ===");
  console.log(`  fetched candles      : ${candles.length}`);
  console.log(`  replay start         : ${candles[firstStep].timestamp}`);
  console.log(`  replay end           : ${candles[lastStep].timestamp}`);
  console.log(`  processed steps      : ${processed}`);
  console.log(`  skipped steps        : ${skipped}`);
  console.log(`  unique probe targets : [${uniqueProbe.join(", ")}]`);
  console.log(`  inserted predictions : ${predCount}`);
  console.log(`  inserted trades      : ${tradeCount}`);
  console.log(`  final equity         : ${curState.equity.toFixed(2)}`);
  console.log(`  final position       : ${curState.current_position.toFixed(3)}`);
  console.log(`  final last_timestamp : ${curState.last_timestamp}`);
  console.log(`  elapsed              : ${elapsed.toFixed(1)}s`);
}

main().catch((err) => {
  console.error("backfill failed:", err);
  process.exit(1);
});
