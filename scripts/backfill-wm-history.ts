// Historical replay for the current `/` WM + learned-RL dashboard.
//
// This is intentionally separate from scripts/backfill-history.ts. The legacy
// command writes predictions/trades/equity_snapshots; this command writes only
// the registered btc-wm31-ac-20260906-paper-v1 run through the same state,
// accounting, and projection contract used by the live Edge Function.
//
// Usage:
//   npm run backfill:wm -- --reset --days 30
//   npm run backfill:wm -- --days 30 --max-steps 8
//
// Before a reset/replay, pause the WM live Cron. Completed transitions are
// durable and a stopped process can be resumed without --reset.

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import { setTimeout as sleep } from "node:timers/promises";

dotenv.config({ path: ".env.backfill" });

const RUN_ID = "btc-wm31-ac-20260906-paper-v1";
const BUNDLE_ID = "btc-wm31-ac-20260906";
const MODEL_FAMILY = "wm_market31_ac";
const BAR_MS = 15 * 60 * 1000;
const BARS_PER_DAY = 96;
const HISTORY_BARS = 8704;
const BINANCE_CHUNK_BARS = 1000;
const MARKET_WORKERS = 3;
const REQUEST_TIMEOUT_MS = 20_000;
const HF_TIMEOUT_MS = 90_000;
const HF_RETRY_MAX = 3;
const HF_RETRY_BASE_MS = 1_500;
const OPEN_RECEIPT_OFFSET_MS = 1_000;
const RECEIPT_OFFSET_MS = 2_000;
const REPLAY_CLOCK_OFFSET_MS = 5_000;
const MAX_DAYS = 90;

type Market = "spot" | "um";

type MarketBar = {
  timestamp: string;
  open: number | null;
  high: number | null;
  low: number | null;
  close: number | null;
  volume: number | null;
  quote_volume: number | null;
  taker_buy_quote: number | null;
  n_trades: number | null;
};

type BackfillOptions = {
  reset: boolean;
  days: number;
  maxSteps: number;
};

type RunRow = {
  run_id: string;
  bundle_id: string;
  bundle_sha256: string;
  feature_contract_sha256: string;
  execution_contract_sha256: string;
  manifest: Record<string, unknown>;
};

type PersistedState = {
  run_id: string;
  version: number;
  last_open_ts: string;
  state: Record<string, unknown>;
};

type Transition = Record<string, unknown> & {
  ok?: boolean;
  run_id?: string;
  bundle_id?: string;
  model_family?: string;
  event_ts?: string;
  expected_state_version?: number;
  state?: Record<string, unknown>;
  snapshots?: unknown[];
  events?: unknown[];
};

function parseArgs(): BackfillOptions {
  const argv = process.argv.slice(2);
  let reset = false;
  let days = 30;
  let maxSteps = Number.POSITIVE_INFINITY;
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--reset") {
      reset = true;
    } else if (arg === "--days") {
      const value = Number(argv[++i]);
      if (!Number.isInteger(value) || value <= 0 || value > MAX_DAYS) {
        throw new Error(`--days must be an integer from 1 to ${MAX_DAYS}`);
      }
      days = value;
    } else if (arg === "--max-steps") {
      const value = Number(argv[++i]);
      if (!Number.isInteger(value) || value <= 0) {
        throw new Error("--max-steps must be a positive integer");
      }
      maxSteps = value;
    } else if (arg === "--help" || arg === "-h") {
      console.log("Usage: npm run backfill:wm -- [--reset] [--days N=30] [--max-steps N]");
      process.exit(0);
    } else {
      throw new Error(`unknown argument: ${arg}`);
    }
  }
  return { reset, days, maxSteps };
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`missing required env: ${name} (set it in .env.backfill)`);
  }
  return value;
}

function iso(ms: number): string {
  return new Date(ms).toISOString();
}

function aligned(ms: number, name: string): void {
  if (!Number.isSafeInteger(ms) || ms % BAR_MS !== 0) {
    throw new Error(`${name} is not aligned to the UTC 15-minute grid`);
  }
}

function numberValue(value: unknown, name: string): number {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) throw new Error(`${name} is not finite`);
  return parsed;
}

function emptyBar(ms: number): MarketBar {
  return {
    timestamp: iso(ms),
    open: null,
    high: null,
    low: null,
    close: null,
    volume: null,
    quote_volume: null,
    taker_buy_quote: null,
    n_trades: null,
  };
}

function parseKline(row: unknown, from: number, until: number): [number, MarketBar] {
  if (!Array.isArray(row) || row.length < 11) {
    throw new Error("Binance returned a malformed kline");
  }
  const timestamp = numberValue(row[0], "kline open time");
  const closeTime = numberValue(row[6], "kline close time");
  aligned(timestamp, "kline open time");
  if (timestamp < from || timestamp >= until || closeTime !== timestamp + BAR_MS - 1) {
    throw new Error("Binance returned a kline outside the requested 15-minute chunk");
  }
  const [open, high, low, close, volume, quote, trades, taker] = [
    1,
    2,
    3,
    4,
    5,
    7,
    8,
    10,
  ].map((index) => numberValue(row[index], `kline field ${index}`));
  if (
    Math.min(open, high, low, close) <= 0 ||
    low > Math.min(open, close) ||
    high < Math.max(open, close) ||
    low > high ||
    volume < 0 ||
    quote < 0 ||
    taker < 0 ||
    taker > quote ||
    !Number.isSafeInteger(trades) ||
    trades < 0
  ) {
    throw new Error("Binance returned invalid OHLCV geometry");
  }
  return [timestamp, {
    timestamp: iso(timestamp),
    open,
    high,
    low,
    close,
    volume,
    quote_volume: quote,
    taker_buy_quote: taker,
    n_trades: trades,
  }];
}

async function fetchJson(url: URL): Promise<unknown> {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  if (!response.ok) {
    throw new Error(`market HTTP ${response.status}`);
  }
  return response.json();
}

function basesFor(market: Market): string[] {
  return market === "spot"
    ? ["https://api.binance.com", "https://data-api.binance.vision"]
    : ["https://fapi.binance.com"];
}

async function fetchRows(market: Market, from: number, until: number): Promise<unknown[]> {
  const bases = basesFor(market);
  let lastError: unknown;
  for (let baseIndex = 0; baseIndex < bases.length; baseIndex += 1) {
    const url = new URL(market === "spot" ? "/api/v3/klines" : "/fapi/v1/klines", bases[baseIndex]);
    url.search = new URLSearchParams({
      symbol: "BTCUSDT",
      interval: "15m",
      startTime: String(from),
      endTime: String(until - 1),
      limit: String(BINANCE_CHUNK_BARS),
    }).toString();
    for (let attempt = 1; attempt <= 3; attempt += 1) {
      try {
        const rows = await fetchJson(url);
        if (!Array.isArray(rows) || rows.length > BINANCE_CHUNK_BARS) {
          throw new Error("Binance returned an invalid kline array");
        }
        return rows;
      } catch (error) {
        lastError = error;
        const message = error instanceof Error ? error.message : String(error);
        const rateLimited = message.includes("market HTTP 418") || message.includes("market HTTP 429");
        if (rateLimited || attempt === 3) break;
        await sleep(750 * attempt);
      }
    }
    // A transport/5xx failure may use the public Spot fallback. Rate limits
    // are terminal so the script cannot silently multiply load.
    if (market === "um" || lastError instanceof Error && /market HTTP (418|429)/.test(lastError.message)) {
      break;
    }
  }
  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

async function fetchMarketGrid(market: Market, from: number, until: number): Promise<MarketBar[]> {
  aligned(from, `${market} history start`);
  aligned(until, `${market} history end`);
  if (until <= from) throw new Error(`${market} history range is empty`);
  const chunks: Array<{ from: number; until: number }> = [];
  for (let start = from; start < until; start += BINANCE_CHUNK_BARS * BAR_MS) {
    chunks.push({ from: start, until: Math.min(start + BINANCE_CHUNK_BARS * BAR_MS, until) });
  }
  const parsed = new Map<number, MarketBar>();
  let next = 0;
  let failed = false;
  const worker = async (): Promise<void> => {
    while (!failed) {
      const chunk = chunks[next++];
      if (!chunk) return;
      try {
        const rows = await fetchRows(market, chunk.from, chunk.until);
        for (const row of rows) {
          const [timestamp, parsedRow] = parseKline(row, chunk.from, chunk.until);
          if (parsed.has(timestamp)) throw new Error("duplicate Binance kline timestamp");
          parsed.set(timestamp, parsedRow);
        }
      } catch (error) {
        failed = true;
        throw error;
      }
    }
  };
  await Promise.all(
    Array.from({ length: Math.min(MARKET_WORKERS, chunks.length) }, () => worker()),
  );
  const bars: MarketBar[] = [];
  for (let timestamp = from; timestamp < until; timestamp += BAR_MS) {
    bars.push(parsed.get(timestamp) ?? emptyBar(timestamp));
  }
  return bars;
}

async function requestSpace(
  url: string,
  apiKey: string,
  body?: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= HF_RETRY_MAX; attempt += 1) {
    try {
      const response = await fetch(url, {
        method: body ? "POST" : "GET",
        headers: body
          ? { "Content-Type": "application/json", "x-api-key": apiKey }
          : { "x-api-key": apiKey },
        body: body ? JSON.stringify(body) : undefined,
        signal: AbortSignal.timeout(HF_TIMEOUT_MS),
      });
      const text = await response.text();
      let parsed: unknown;
      try {
        parsed = JSON.parse(text);
      } catch {
        throw new Error(`HF response was not JSON (HTTP ${response.status})`);
      }
      if (!response.ok) {
        throw new Error(`HF HTTP ${response.status}: ${text.slice(0, 300)}`);
      }
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        throw new Error("HF response was not an object");
      }
      return parsed as Record<string, unknown>;
    } catch (error) {
      lastError = error;
      const message = error instanceof Error ? error.message : String(error);
      if (message.includes("HF HTTP 4") || attempt === HF_RETRY_MAX) break;
      await sleep(HF_RETRY_BASE_MS * attempt);
    }
  }
  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

async function loadRun(db: SupabaseClient): Promise<RunRow> {
  const { data, error } = await db
    .from("btc_demo_runs")
    .select("run_id,bundle_id,bundle_sha256,feature_contract_sha256,execution_contract_sha256,manifest")
    .eq("run_id", RUN_ID)
    .maybeSingle();
  if (error) throw new Error(`btc_demo_runs read failed: ${error.message}`);
  if (!data) throw new Error(`registered run not found: ${RUN_ID}`);
  const run = data as RunRow;
  if (run.bundle_id !== BUNDLE_ID || run.manifest?.model_family !== MODEL_FAMILY) {
    throw new Error("registered WM run identity does not match the backfill contract");
  }
  return run;
}

async function loadState(db: SupabaseClient): Promise<PersistedState | null> {
  const { data, error } = await db
    .from("btc_demo_state")
    .select("run_id,version,last_open_ts,state")
    .eq("run_id", RUN_ID)
    .maybeSingle();
  if (error) throw new Error(`btc_demo_state read failed: ${error.message}`);
  return data as PersistedState | null;
}

async function clearRun(db: SupabaseClient): Promise<void> {
  // Keep the registered run and its hashes. Only the derived public timeline
  // for the current dashboard run is rebuilt.
  for (const table of [
    "btc_demo_state",
    "btc_demo_snapshots",
    "btc_demo_forecasts",
    "btc_demo_events",
  ]) {
    const { error } = await db.from(table).delete().eq("run_id", RUN_ID);
    if (error) throw new Error(`${table} reset failed: ${error.message}`);
  }
}

function assertTransition(
  transition: Transition,
  previous: Record<string, unknown> | null,
  eventMs: number,
  run: RunRow,
): asserts transition is Transition & { state: Record<string, unknown> } {
  const expectedVersion = typeof previous?.version === "number" ? previous.version : 0;
  const transitionEventMs = typeof transition.event_ts === "string"
    ? Date.parse(transition.event_ts)
    : Number.NaN;
  if (
    transition.ok !== true ||
    transition.run_id !== RUN_ID ||
    transition.bundle_id !== BUNDLE_ID ||
    transition.model_family !== MODEL_FAMILY ||
    !Number.isFinite(transitionEventMs) ||
    transitionEventMs !== eventMs ||
    transition.expected_state_version !== expectedVersion ||
    !transition.state ||
    transition.state.version !== expectedVersion + 1 ||
    transition.state.run_id !== RUN_ID ||
    transition.state.bundle_id !== BUNDLE_ID ||
    transition.state.bundle_sha256 !== run.bundle_sha256
  ) {
    throw new Error("HF backfill transition failed the WM state envelope check");
  }
  if (!Array.isArray(transition.snapshots) || !Array.isArray(transition.events)) {
    throw new Error("HF backfill transition did not return snapshot/event arrays");
  }
}

async function persistTransition(
  db: SupabaseClient,
  transition: Transition,
): Promise<void> {
  const { data, error } = await db.rpc("record_wm_demo_backfill_transition", {
    payload: transition,
  });
  if (error) throw new Error(`WM backfill RPC failed: ${error.message}`);
  if (!data || typeof data !== "object" || !["applied", "already_processed"].includes((data as { status?: string }).status ?? "")) {
    throw new Error("WM backfill RPC returned an unexpected status");
  }
}

async function main(): Promise<void> {
  const options = parseArgs();
  const projectUrl = requireEnv("PROJECT_URL");
  const projectKey = requireEnv("PROJECT_SECRET_KEY");
  const spaceUrl = requireEnv("HF_SPACE_URL").replace(/\/+$/, "");
  const hfKey = requireEnv("HF_INFERENCE_API_KEY");
  const db = createClient(projectUrl, projectKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const run = await loadRun(db);
  const health = await requestSpace(`${spaceUrl}/v4/btc/health`, hfKey);
  for (const [key, expected] of [
    ["run_id", RUN_ID],
    ["bundle_id", BUNDLE_ID],
    ["model_family", MODEL_FAMILY],
    ["bundle_sha256", run.bundle_sha256],
    ["feature_contract_sha256", run.feature_contract_sha256],
    ["execution_contract_sha256", run.execution_contract_sha256],
  ] as const) {
    if (health[key] !== expected) throw new Error(`HF health contract mismatch: ${key}`);
  }
  const cutoffMs = Date.parse(String(health.production_cutoff ?? ""));
  if (!Number.isFinite(cutoffMs)) throw new Error("HF health did not provide a valid production cutoff");

  const endMs = Math.floor((Date.now() - REPLAY_CLOCK_OFFSET_MS) / BAR_MS) * BAR_MS;
  const startMs = endMs - options.days * BARS_PER_DAY * BAR_MS;
  aligned(startMs, "replay start");
  aligned(endMs, "replay end");
  if (startMs < cutoffMs) {
    const availableDays = Math.max(0, Math.floor((endMs - cutoffMs) / (BARS_PER_DAY * BAR_MS)));
    throw new Error(
      `requested replay begins before the WM production cutoff (${iso(cutoffMs)}); ` +
      `only about ${availableDays} post-cutoff days are available at the current end time`,
    );
  }
  const totalSteps = Math.floor((endMs - startMs) / BAR_MS) + 1;
  const plannedSteps = Math.min(totalSteps, options.maxSteps);
  console.log(`[wm-backfill] run=${RUN_ID}`);
  console.log(`[wm-backfill] window=${iso(startMs)} .. ${iso(endMs)} (${totalSteps} 15m ticks; max ${plannedSteps})`);
  console.log(`[wm-backfill] fetch context=${HISTORY_BARS} bars before the first replay tick`);

  let previousRow = await loadState(db);
  if (options.reset) {
    console.log("[wm-backfill] resetting only btc_demo_* rows for the current WM run");
    await clearRun(db);
    previousRow = null;
  } else if (previousRow && Date.parse(previousRow.last_open_ts) > endMs) {
    throw new Error("stored WM state is newer than this replay window; use --reset for a rebuild");
  }

  const historyStart = startMs - HISTORY_BARS * BAR_MS;
  const marketUntil = endMs + BAR_MS;
  console.log(`[wm-backfill] downloading spot and UM history through ${iso(endMs)}`);
  const [spot, um] = await Promise.all([
    fetchMarketGrid("spot", historyStart, marketUntil),
    fetchMarketGrid("um", historyStart, marketUntil),
  ]);
  const expectedBars = Math.floor((marketUntil - historyStart) / BAR_MS);
  if (spot.length !== expectedBars || um.length !== expectedBars) {
    throw new Error("historical market grid length changed");
  }

  let previous = previousRow?.state ?? null;
  let completed = 0;
  const startedAt = Date.now();
  for (let step = 0; step < totalSteps && completed < plannedSteps; step += 1) {
    const eventMs = startMs + step * BAR_MS;
    if (previous && Date.parse(String(previous.last_open_ts)) >= eventMs) continue;
    const offset = step;
    const closedSpot = spot.slice(offset, offset + HISTORY_BARS);
    const closedUm = um.slice(offset, offset + HISTORY_BARS);
    if (closedSpot.length !== HISTORY_BARS || closedUm.length !== HISTORY_BARS) {
      throw new Error("historical slice did not contain exactly 8704 bars");
    }
    const current = spot[offset + HISTORY_BARS];
    if (!current) throw new Error("historical current-open row is missing");
    const receipt = eventMs + RECEIPT_OFFSET_MS;
    const payload: Record<string, unknown> = {
      run_id: RUN_ID,
      bundle_id: BUNDLE_ID,
      event_ts: iso(eventMs),
      received_at: iso(receipt),
      replay_at: iso(eventMs + REPLAY_CLOCK_OFFSET_MS),
      current_open: {
        timestamp: iso(eventMs),
        open: current.open,
        received_at: iso(eventMs + OPEN_RECEIPT_OFFSET_MS),
      },
      spot: closedSpot,
      um: closedUm,
      state: previous,
    };
    const transition = await requestSpace(`${spaceUrl}/v4/btc/backfill`, hfKey, payload);
    assertTransition(transition, previous, eventMs, run);
    const persisted: Transition = {
      ...transition,
      write_mode: "backfill",
      data: {
        ...(transition.data && typeof transition.data === "object" ? transition.data : {}),
        write_mode: "historical_backfill",
        replay_clock: iso(eventMs + REPLAY_CLOCK_OFFSET_MS),
      },
    };
    await persistTransition(db, persisted);
    previous = transition.state;
    completed += 1;
    if (completed === 1 || completed % 25 === 0 || completed === plannedSteps) {
      const elapsed = (Date.now() - startedAt) / 1000;
      const perStep = elapsed / completed;
      const remainingMinutes = (perStep * (plannedSteps - completed)) / 60;
      console.log(`[wm-backfill] ${completed}/${plannedSteps} ticks; last=${iso(eventMs)}; estimated remaining=${remainingMinutes.toFixed(1)}m`);
    }
  }
  console.log(`[wm-backfill] complete: ${completed} transitions persisted; legacy tables were not touched`);
}

main().catch((error: unknown) => {
  console.error(`[wm-backfill] failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
