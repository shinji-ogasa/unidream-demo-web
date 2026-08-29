// One-time backfill: replay UniDream predictions over closed Binance 15m
// candles so the demo has a populated equity curve and trade history before
// the live Cron starts. It deliberately reuses the Edge data/feature contract
// and the same atomic paper-trading RPC instead of maintaining a second
// OHLCV-only write path. It runs locally against `.env.backfill`.
//
// Usage:
//   npm run backfill -- --reset
//   npm run backfill -- --reset --days 30
//   npm run backfill -- --max-steps 200
//
// Notes:
//   - Sequential HF /predict calls, ~1-5s each. The script fetches the requested
//     replay span plus Plan011 context, then replays only the requested span.
//     Each replay step is one all-or-nothing `record_unidream_inference` RPC;
//     completed steps remain durable if the process is interrupted.
//   - Run before the live Cron is enabled, or pause the Cron during the run.

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import { setTimeout as sleep } from "node:timers/promises";

import {
  BARS_PER_DAY,
  FEATURE_WARMUP_BARS,
  INITIAL_CASH,
  MODEL_LOOKBACK_DAYS,
  RUN_ID,
  SYMBOL,
  TIMEFRAME,
} from "../supabase/functions/_shared/config.ts";
import { clampTargetPosition } from "../supabase/functions/_shared/paper_trading.ts";
import {
  applyInferenceRpc,
  buildAtomicInferencePayload,
} from "../supabase/functions/run-unidream-inference/atomic.ts";
import {
  fetchCandles as fetchClosedCandles,
} from "../supabase/functions/run-unidream-inference/binance.ts";
import type {
  Candle as EdgeCandle,
  StrategyState,
} from "../supabase/functions/run-unidream-inference/config.ts";

dotenv.config({ path: ".env.backfill" });

// --- Config ---------------------------------------------------------------

const WINDOW_BARS = MODEL_LOOKBACK_DAYS * BARS_PER_DAY + FEATURE_WARMUP_BARS;
const WARMUP_BARS = WINDOW_BARS;
const MODEL_CONTEXT_DAYS = WINDOW_BARS / BARS_PER_DAY;
const SAMPLE_PROBES = 20;
const HF_RETRY_MAX = 3;
const HF_RETRY_BASE_MS = 1500;

// --- Types ----------------------------------------------------------------

type Candle = EdgeCandle & { openTimeMs: number };

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

async function fetchCandles(days: number): Promise<Candle[]> {
  const targetBars = Math.ceil(days * BARS_PER_DAY) + 1;
  const closed = await fetchClosedCandles(targetBars);
  return closed.map((candle) => ({
    ...candle,
    openTimeMs: new Date(candle.timestamp).getTime(),
  }));
}

function defaultState(): StrategyState {
  return {
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
}

async function loadState(supabase: SupabaseClient): Promise<StrategyState> {
  const stateRes = await supabase
    .from("strategy_state")
    .select("*")
    .eq("id", RUN_ID)
    .maybeSingle();
  if (stateRes.error) throw new Error(`strategy_state read failed: ${stateRes.error.message}`);
  return stateRes.data ? stateRes.data as StrategyState : defaultState();
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
      funding_rate: c.funding_rate,
      mark_close: c.mark_close,
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

// --- Reset ----------------------------------------------------------------

async function deleteBatched(
  supabase: SupabaseClient,
  table: string,
  filter: Record<string, string>,
  batchSize = 100,
): Promise<void> {
  while (true) {
    const query = supabase.from(table).select("id");
    for (const [k, v] of Object.entries(filter)) {
      query.eq(k, v);
    }
    const { data, error } = await query.limit(batchSize);
    if (error) throw error;
    if (!data || data.length === 0) break;
    const ids: Array<string | number> = data.map((r: { id: string | number }) => r.id);
    const { error: delErr } = await supabase.from(table).delete().in("id", ids);
    if (delErr) throw delErr;
    console.log(`  deleted ${ids.length} from ${table}`);
  }
}

async function resetRun(supabase: SupabaseClient): Promise<void> {
  console.log("[reset] clearing predictions...");
  await deleteBatched(supabase, "predictions", {
    symbol: SYMBOL,
    timeframe: TIMEFRAME,
  });

  console.log("[reset] clearing trades...");
  await deleteBatched(supabase, "trades", { run_id: RUN_ID });

  console.log("[reset] clearing equity_snapshots...");
  await deleteBatched(supabase, "equity_snapshots", { run_id: RUN_ID });

  console.log("[reset] resetting strategy_state...");
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

  let curState = await loadState(supabase);

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
  console.log(`[replay] Plan011 window bars = ${WINDOW_BARS}`);
  if (probeTargets.length > 0) {
    const avgMs = (probeElapsedSec * 1000) / probeTargets.length;
    const estMin = (totalSteps * avgMs) / 1000 / 60;
    console.log(
      `[replay] total steps = ${totalSteps} · probe avg ${avgMs.toFixed(0)}ms/call → est ~${estMin.toFixed(1)} min`,
    );
  } else {
    console.log(`[replay] total steps = ${totalSteps}`);
  }

  let predCount = 0;
  let tradeCount = 0;
  let processed = 0;
  let skipped = 0;
  const t0 = Date.now();

  let lastTsMs = curState.last_timestamp ? new Date(curState.last_timestamp).getTime() : -Infinity;

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
      throw err;
    }

    const stepModelVersion =
      typeof pred.model_version === "string" ? pred.model_version : modelVersion;
    const atomicPayload = buildAtomicInferencePayload(curState, latest, pred, stepModelVersion);
    const rpcResult = await applyInferenceRpc(supabase, atomicPayload);
    if (rpcResult.status === "already_processed") {
      // A prior process may have committed this bar after our state read. Read
      // the canonical state before continuing so the next CAS is fresh.
      curState = await loadState(supabase);
      lastTsMs = curState.last_timestamp
        ? new Date(curState.last_timestamp).getTime()
        : -Infinity;
      skipped += 1;
      continue;
    }

    curState = {
      ...curState,
      ...atomicPayload.next_state,
      last_price: latest.close,
      last_timestamp: latest.timestamp,
    };
    lastTsMs = latest.openTimeMs;
    predCount += 1;
    if (rpcResult.traded) tradeCount += 1;
    processed += 1;

    if (processed % 50 === 0 || processed === totalSteps) {
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
