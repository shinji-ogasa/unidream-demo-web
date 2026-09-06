/** Public REST klines only. Closed feature/accounting bars and current open are separate. */
export const BAR_MS = 900_000;
export const HISTORY_BARS = 8641;
const CHUNK_BARS = 1000;
const REQUEST_TIMEOUT_MS = 15_000;
const SPOT_BASES = [
  "https://api.binance.com",
  "https://data-api.binance.vision",
] as const;
const UM_BASE = "https://fapi.binance.com";

export type MarketBar = {
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
export type CollectedMarketData = {
  spot: MarketBar[];
  um: MarketBar[];
  current_open: { timestamp: string; open: number | null; received_at: string };
  received_at: string;
};

class RemoteFailure extends Error {
  constructor(message: string, readonly status?: number) {
    super(message);
  }
}

function integerTime(value: unknown, name: string): number {
  if (
    typeof value !== "number" || !Number.isSafeInteger(value) || value < 0 ||
    value % BAR_MS !== 0
  ) {
    throw new Error(`${name}: expected aligned integer milliseconds`);
  }
  return value;
}
function number(value: unknown, name: string): number {
  if (
    typeof value !== "number" &&
    (typeof value !== "string" ||
      !/^-?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/.test(value))
  ) {
    throw new Error(`${name}: invalid numeric value`);
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) throw new Error(`${name}: nonfinite value`);
  return parsed;
}
function emptyBar(ms: number): MarketBar {
  return {
    timestamp: new Date(ms).toISOString(),
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
function kline(
  value: unknown,
  from: number,
  until: number,
  eventMs: number,
): [number, MarketBar] {
  if (!Array.isArray(value) || value.length < 11) {
    throw new Error("Malformed closed kline");
  }
  const time = integerTime(value[0], "kline open time");
  if (time < from || time >= until || time + BAR_MS > eventMs) {
    throw new Error("Kline outside fixed closed chunk");
  }
  if (typeof value[6] !== "number" || value[6] !== time + BAR_MS - 1) {
    throw new Error("Kline close timestamp does not match 15m interval");
  }
  const [open, high, low, close, volume, quote, count, taker] = [
    1,
    2,
    3,
    4,
    5,
    7,
    8,
    10,
  ].map((i) => number(value[i], `kline field ${i}`));
  if (
    Math.min(open, high, low, close) <= 0 || low > Math.min(open, close) ||
    high < Math.max(open, close) || low > high
  ) throw new Error("Invalid closed OHLC");
  if (
    volume < 0 || quote < 0 || taker < 0 || taker > quote ||
    !Number.isSafeInteger(count) || count < 0
  ) throw new Error("Invalid closed volume/taker/trade count");
  return [time, {
    timestamp: new Date(time).toISOString(),
    open,
    high,
    low,
    close,
    volume,
    quote_volume: quote,
    taker_buy_quote: taker,
    n_trades: count,
  }];
}

async function request(url: URL, fetcher: typeof fetch): Promise<unknown> {
  const abort = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  // Covers headers and response body, even if an injected transport ignores abort.
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      abort.abort();
      reject(new RemoteFailure("Market request timeout"));
    }, REQUEST_TIMEOUT_MS);
  });
  const download = (async () => {
    let response: Response;
    try {
      response = await fetcher(url, { signal: abort.signal });
    } catch {
      throw new RemoteFailure("Market transport failed");
    }
    if (!response.ok) {
      throw new RemoteFailure("Market HTTP failure", response.status);
    }
    try {
      return await response.json();
    } catch {
      throw new Error("Market response is not valid JSON");
    }
  })();
  try {
    return await Promise.race([download, timeout]);
  } finally {
    if (timer !== undefined) clearTimeout(timer);
  }
}

async function fetchRows(
  market: "spot" | "um",
  from: number,
  until: number,
  fetcher: typeof fetch,
  limit = CHUNK_BARS,
): Promise<unknown[]> {
  const bases = market === "spot" ? SPOT_BASES : [UM_BASE];
  for (let i = 0; i < bases.length; i++) {
    const url = new URL(
      market === "spot" ? "/api/v3/klines" : "/fapi/v1/klines",
      bases[i],
    );
    url.search = new URLSearchParams({
      symbol: "BTCUSDT",
      interval: "15m",
      startTime: String(from),
      endTime: String(until - 1),
      limit: String(limit),
    }).toString();
    let rows: unknown;
    try {
      rows = await request(url, fetcher);
    } catch (error) {
      // One alternative public Spot host, no endless retry or rate-limit bypass.
      if (
        error instanceof RemoteFailure &&
        ![418, 429].includes(error.status ?? 0) && i + 1 < bases.length
      ) continue;
      throw error;
    }
    if (!Array.isArray(rows) || rows.length > limit) {
      throw new Error("Invalid market kline response size/schema");
    }
    return rows;
  }
  throw new Error("No market endpoint available");
}

async function history(
  market: "spot" | "um",
  from: number,
  eventMs: number,
  fetcher: typeof fetch,
): Promise<MarketBar[]> {
  const chunks: { from: number; until: number }[] = [];
  for (let t = from; t < eventMs; t += CHUNK_BARS * BAR_MS) {
    chunks.push({ from: t, until: Math.min(t + CHUNK_BARS * BAR_MS, eventMs) });
  }
  const parsed = new Map<number, MarketBar>();
  let next = 0;
  let failed = false;
  const worker = async () => {
    while (!failed) {
      const chunk = chunks[next++];
      if (!chunk) return;
      try {
        const rows = await fetchRows(market, chunk.from, chunk.until, fetcher);
        for (const row of rows) {
          const [ts, bar] = kline(row, chunk.from, chunk.until, eventMs);
          if (parsed.has(ts)) throw new Error("Duplicate kline timestamp");
          parsed.set(ts, bar);
        }
      } catch (error) {
        failed = true;
        throw error;
      }
    }
  };
  const finished = await Promise.allSettled(
    Array.from({ length: Math.min(3, chunks.length) }, worker),
  );
  const failure = finished.find((r) => r.status === "rejected");
  if (failure?.status === "rejected") throw failure.reason;
  const grid: MarketBar[] = [];
  for (let t = from; t < eventMs; t += BAR_MS) {
    grid.push(parsed.get(t) ?? emptyBar(t));
  }
  return grid;
}

export async function collectMarketData(
  eventMs: number,
  historyStartMs: number,
  needForecast: boolean,
  fetcher: typeof fetch = fetch,
  now: () => number = Date.now,
): Promise<CollectedMarketData> {
  integerTime(eventMs, "eventMs");
  integerTime(historyStartMs, "historyStartMs");
  if (typeof needForecast !== "boolean" || historyStartMs > eventMs) {
    throw new Error("Invalid history/forecast request");
  }
  const start = needForecast ? eventMs - HISTORY_BARS * BAR_MS : historyStartMs;
  if (start < 0 || eventMs - start > HISTORY_BARS * BAR_MS) {
    throw new Error("History exceeds bounded 8641-bar window");
  }
  const started = now();
  if (!Number.isSafeInteger(started) || started < eventMs) {
    throw new Error("Invalid collector clock or future event");
  }
  const completed = await Promise.allSettled([
    history("spot", start, eventMs, fetcher),
    needForecast
      ? history("um", start, eventMs, fetcher)
      : Promise.resolve([] as MarketBar[]),
  ]);
  for (const r of completed) if (r.status === "rejected") throw r.reason;
  const spot = (completed[0] as PromiseFulfilledResult<MarketBar[]>).value;
  const um = (completed[1] as PromiseFulfilledResult<MarketBar[]>).value;
  // A separate query deliberately extracts only timestamp/open from the live row.
  const current = await fetchRows(
    "spot",
    eventMs,
    eventMs + BAR_MS,
    fetcher,
    1,
  );
  let open: number | null = null;
  if (current.length) {
    const row = current[0];
    if (
      !Array.isArray(row) || row.length < 2 ||
      integerTime(row[0], "current open time") !== eventMs
    ) throw new Error("Invalid current open timestamp");
    open = number(row[1], "current open");
    if (open <= 0) throw new Error("Invalid current open price");
  }
  const received = now();
  if (!Number.isSafeInteger(received) || received < started) {
    throw new Error("Collector clock moved backwards");
  }
  const receipt = new Date(received).toISOString();
  return {
    spot,
    um,
    current_open: {
      timestamp: new Date(eventMs).toISOString(),
      open,
      received_at: receipt,
    },
    received_at: receipt,
  };
}
