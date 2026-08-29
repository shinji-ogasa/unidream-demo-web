import {
  BINANCE_FUTURES_BASE_URL,
  BINANCE_PAGE_LIMIT,
  BINANCE_SPOT_BASE_URL,
  SYMBOL,
  TIMEFRAME,
  type Candle,
  type FundingRateObservation,
  type MarkPriceObservation,
} from "./config.ts";

export type SpotCandle = {
  openTime: number;
  closeTime: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

type BinanceFundingRate = {
  fundingTime?: number | string;
  fundingRate?: number | string;
};

export type BinanceRequestOptions = {
  /** Dependency injection for deterministic tests and local verification. */
  fetchImpl?: typeof fetch;
  spotBaseUrl?: string;
  futuresBaseUrl?: string;
  /** Fixed observation cutoff; defaults to Date.now() for live runs. */
  nowMs?: number;
};

type ResolvedRequestOptions = {
  fetchImpl: typeof fetch;
  spotBaseUrl: string;
  futuresBaseUrl: string;
  nowMs: number;
};

/** A Binance response that should be retried/backed off by the caller. */
export class BinanceApiError extends Error {
  readonly endpoint: string;
  readonly status: number;
  readonly retryAfter: string | null;

  constructor(
    endpoint: string,
    status: number,
    retryAfter: string | null,
    body: string,
  ) {
    const rateMessage = status === 418 || status === 429
      ? `; rate limited${retryAfter ? `, retry-after=${retryAfter}` : ""}`
      : "";
    super(
      `binance ${endpoint} failed: HTTP ${status}${rateMessage} ${body.slice(0, 200)}`,
    );
    this.name = "BinanceApiError";
    this.endpoint = endpoint;
    this.status = status;
    this.retryAfter = retryAfter;
    Object.setPrototypeOf(this, BinanceApiError.prototype);
  }

  get isRateLimited(): boolean {
    return this.status === 418 || this.status === 429;
  }
}

function resolveOptions(options: BinanceRequestOptions = {}): ResolvedRequestOptions {
  const nowMs = options.nowMs ?? Date.now();
  if (!Number.isFinite(nowMs) || !Number.isInteger(nowMs) || nowMs < 0) {
    throw new Error(`observation cutoff must be a non-negative integer timestamp, got ${nowMs}`);
  }
  return {
    // Resolve fetch at invocation time so tests can replace globalThis.fetch.
    fetchImpl: options.fetchImpl ?? ((...args) => globalThis.fetch(...args)),
    spotBaseUrl: options.spotBaseUrl ?? BINANCE_SPOT_BASE_URL,
    futuresBaseUrl: options.futuresBaseUrl ?? BINANCE_FUTURES_BASE_URL,
    nowMs,
  };
}

function endpointUrl(
  baseUrl: string,
  path: string,
  params: Record<string, string>,
): string {
  const url = new URL(`${baseUrl.replace(/\/+$/, "")}${path}`);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  return url.toString();
}

async function requestJson(
  endpoint: string,
  url: string,
  options: ResolvedRequestOptions,
): Promise<unknown> {
  let response: Response;
  try {
    response = await options.fetchImpl(url);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`binance ${endpoint} request failed: ${message}`);
  }

  const body = await response.text();
  if (!response.ok) {
    throw new BinanceApiError(
      endpoint,
      response.status,
      response.headers.get("retry-after"),
      body,
    );
  }

  try {
    return JSON.parse(body) as unknown;
  } catch {
    throw new Error(`binance ${endpoint} returned invalid JSON`);
  }
}

function asFiniteNumber(value: unknown, field: string): number {
  const number = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(number)) throw new Error(`binance ${field} is not finite`);
  return number;
}

function asTimestampMs(value: unknown, field: string): number {
  const timestamp = asFiniteNumber(value, field);
  if (!Number.isInteger(timestamp) || timestamp < 0) {
    throw new Error(`binance ${field} is not a non-negative integer timestamp`);
  }
  return timestamp;
}

function parseIntervalMs(interval: string): number {
  const match = /^(\d+)([mhdw])$/.exec(interval);
  if (!match) throw new Error(`unsupported Binance interval: ${interval}`);
  const count = Number(match[1]);
  const unitMs = ({ m: 60_000, h: 3_600_000, d: 86_400_000, w: 604_800_000 } as Record<string, number>)[match[2]];
  return count * unitMs;
}

const BAR_MS = parseIntervalMs(TIMEFRAME);

function parseSpotKline(value: unknown): SpotCandle {
  if (!Array.isArray(value) || value.length < 7) {
    throw new Error("binance spot klines returned a malformed row");
  }
  return {
    openTime: asTimestampMs(value[0], "spot open time"),
    closeTime: asTimestampMs(value[6], "spot close time"),
    open: asFiniteNumber(value[1], "spot open"),
    high: asFiniteNumber(value[2], "spot high"),
    low: asFiniteNumber(value[3], "spot low"),
    close: asFiniteNumber(value[4], "spot close"),
    volume: asFiniteNumber(value[5], "spot volume"),
  };
}

/** A Binance kline is complete exactly at and after its reported close time. */
export function isCandleClosed(closeTimeMs: number, nowMs: number): boolean {
  return closeTimeMs <= nowMs;
}

function parseMarkKline(value: unknown): MarkPriceObservation {
  if (!Array.isArray(value) || value.length < 5) {
    throw new Error("binance mark-price klines returned a malformed row");
  }
  const markClose = asFiniteNumber(value[4], "mark close");
  if (markClose <= 0) throw new Error("binance mark close must be positive");
  return {
    openTime: asTimestampMs(value[0], "mark open time"),
    markClose,
  };
}

function parseFundingRate(value: unknown): FundingRateObservation {
  if (!value || typeof value !== "object") {
    throw new Error("binance funding history returned a malformed row");
  }
  const row = value as BinanceFundingRate;
  return {
    fundingTime: asTimestampMs(row.fundingTime, "funding time"),
    fundingRate: asFiniteNumber(row.fundingRate, "funding rate"),
  };
}

async function fetchSpotPage(
  endTimeMs: number | null,
  limit: number,
  options: ResolvedRequestOptions,
): Promise<SpotCandle[]> {
  const params: Record<string, string> = {
    symbol: SYMBOL,
    interval: TIMEFRAME,
    limit: String(limit),
  };
  if (endTimeMs !== null) params.endTime = String(endTimeMs);
  const payload = await requestJson(
    "spot klines",
    endpointUrl(options.spotBaseUrl, "/api/v3/klines", params),
    options,
  );
  if (!Array.isArray(payload)) throw new Error("binance spot klines response was not an array");
  return payload.map(parseSpotKline);
}

async function collectSpotCandles(
  target: number,
  options: ResolvedRequestOptions,
): Promise<SpotCandle[]> {
  const firstLimit = Math.min(BINANCE_PAGE_LIMIT, target);
  const newest = await fetchSpotPage(null, firstLimit, options);
  const byOpenTime = new Map<number, SpotCandle>();
  for (const row of newest) {
    if (isCandleClosed(row.closeTime, options.nowMs)) byOpenTime.set(row.openTime, row);
  }
  if (newest.length === 0) throw new Error("binance spot klines returned no rows");

  let oldestOpen = Math.min(...newest.map((row) => row.openTime));
  while (byOpenTime.size < target) {
    const remaining = Math.min(BINANCE_PAGE_LIMIT, target - byOpenTime.size);
    const older = await fetchSpotPage(oldestOpen - 1, remaining, options);
    if (older.length === 0) break;

    const previousOldest = oldestOpen;
    for (const row of older) {
      if (row.openTime >= previousOldest) {
        throw new Error("binance spot pagination did not move backwards");
      }
      if (isCandleClosed(row.closeTime, options.nowMs)) byOpenTime.set(row.openTime, row);
    }
    oldestOpen = Math.min(...older.map((row) => row.openTime));
    if (oldestOpen >= previousOldest) throw new Error("binance spot pagination stalled");
    if (older.length < remaining) break;
  }

  if (byOpenTime.size < target) {
    throw new Error(`insufficient spot klines: got ${byOpenTime.size}, need ${target}`);
  }

  const rows = [...byOpenTime.values()].sort((a, b) => a.openTime - b.openTime).slice(-target);
  for (let index = 1; index < rows.length; index += 1) {
    const gap = rows[index].openTime - rows[index - 1].openTime;
    if (gap !== BAR_MS) {
      throw new Error(
        `spot klines have a missing/non-${TIMEFRAME} bar between ${rows[index - 1].openTime} and ${rows[index].openTime}`,
      );
    }
  }
  return rows;
}

async function fetchMarkPage(
  startTimeMs: number,
  endTimeMs: number,
  limit: number,
  options: ResolvedRequestOptions,
): Promise<MarkPriceObservation[]> {
  const payload = await requestJson(
    "USDⓈ-M mark-price klines",
    endpointUrl(options.futuresBaseUrl, "/fapi/v1/markPriceKlines", {
      symbol: SYMBOL,
      interval: TIMEFRAME,
      startTime: String(startTimeMs),
      endTime: String(endTimeMs),
      limit: String(limit),
    }),
    options,
  );
  if (!Array.isArray(payload)) {
    throw new Error("binance mark-price klines response was not an array");
  }
  return payload.map(parseMarkKline);
}

async function collectMarkRows(
  firstOpen: number,
  lastOpen: number,
  options: ResolvedRequestOptions,
): Promise<MarkPriceObservation[]> {
  const rows: MarkPriceObservation[] = [];
  let cursor = firstOpen;
  while (cursor <= lastOpen) {
    const page = await fetchMarkPage(cursor, lastOpen, BINANCE_PAGE_LIMIT, options);
    if (page.length === 0) break;
    const inRange = page.filter((row) => row.openTime >= firstOpen && row.openTime <= lastOpen);
    rows.push(...inRange);

    const lastPageOpen = Math.max(...page.map((row) => row.openTime));
    if (lastPageOpen < cursor) throw new Error("binance mark pagination moved backwards");
    if (lastPageOpen >= lastOpen || page.length < BINANCE_PAGE_LIMIT) break;
    const nextCursor = lastPageOpen + 1;
    if (nextCursor <= cursor) throw new Error("binance mark pagination stalled");
    cursor = nextCursor;
  }
  return rows;
}

async function fetchFundingPage(
  startTimeMs: number | null,
  endTimeMs: number,
  limit: number,
  options: ResolvedRequestOptions,
): Promise<FundingRateObservation[]> {
  const params: Record<string, string> = {
    symbol: SYMBOL,
    endTime: String(endTimeMs),
    limit: String(limit),
  };
  if (startTimeMs !== null) params.startTime = String(startTimeMs);
  const payload = await requestJson(
    "USDⓈ-M funding-rate history",
    endpointUrl(options.futuresBaseUrl, "/fapi/v1/fundingRate", params),
    options,
  );
  if (!Array.isArray(payload)) {
    throw new Error("binance funding-rate response was not an array");
  }
  return payload.map(parseFundingRate);
}

async function collectFundingRows(
  firstOpen: number,
  lastOpen: number,
  options: ResolvedRequestOptions,
): Promise<FundingRateObservation[]> {
  // The first request deliberately asks for the latest event at/before the
  // first candle. This supplies the as-of value without guessing a funding
  // interval and without ever consulting an event after the observation.
  const priorPage = await fetchFundingPage(null, firstOpen, 1, options);
  const prior = priorPage
    .filter((row) => row.fundingTime <= firstOpen)
    .sort((a, b) => a.fundingTime - b.fundingTime)
    .at(-1);
  if (!prior) {
    throw new Error(`missing funding-rate coverage at/before first candle ${firstOpen}`);
  }

  const rows: FundingRateObservation[] = [];
  let cursor = prior.fundingTime;
  while (cursor <= lastOpen) {
    const page = await fetchFundingPage(cursor, lastOpen, BINANCE_PAGE_LIMIT, options);
    if (page.length === 0) break;
    const inRange = page.filter(
      (row) => row.fundingTime >= prior.fundingTime && row.fundingTime <= lastOpen,
    );
    rows.push(...inRange);

    const lastPageTime = Math.max(...page.map((row) => row.fundingTime));
    if (lastPageTime < cursor) throw new Error("binance funding pagination moved backwards");
    if (lastPageTime >= lastOpen || page.length < BINANCE_PAGE_LIMIT) break;
    const nextCursor = lastPageTime + 1;
    if (nextCursor <= cursor) throw new Error("binance funding pagination stalled");
    cursor = nextCursor;
  }
  return rows;
}

function validateSpotRows(spotCandles: readonly SpotCandle[]): void {
  if (spotCandles.length === 0) throw new Error("cannot align an empty candle set");
  for (let index = 1; index < spotCandles.length; index += 1) {
    if (spotCandles[index].openTime <= spotCandles[index - 1].openTime) {
      throw new Error("spot candles must be strictly chronological");
    }
    if (spotCandles[index].openTime - spotCandles[index - 1].openTime !== BAR_MS) {
      throw new Error("spot candles are not contiguous");
    }
  }
}

/**
 * Attach derivative observations to spot candles using only point-in-time
 * values. Funding is an as-of join (latest fundingTime <= candle open time);
 * mark price is an exact open-time join, intentionally with no fill method.
 */
export function alignDerivativeInputs(
  spotCandles: readonly SpotCandle[],
  fundingRows: readonly FundingRateObservation[],
  markRows: readonly MarkPriceObservation[],
): Candle[] {
  validateSpotRows(spotCandles);
  if (fundingRows.length === 0) throw new Error("missing funding-rate coverage");
  if (markRows.length === 0) throw new Error("missing mark-price coverage");

  const funding = [...fundingRows].sort((a, b) => a.fundingTime - b.fundingTime);
  for (const row of funding) {
    if (!Number.isFinite(row.fundingTime) || !Number.isFinite(row.fundingRate)) {
      throw new Error("funding-rate coverage contains a non-finite value");
    }
  }

  const markByOpenTime = new Map<number, number>();
  for (const row of markRows) {
    if (!Number.isFinite(row.openTime) || !Number.isFinite(row.markClose) || row.markClose <= 0) {
      throw new Error("mark-price coverage contains an invalid value");
    }
    const previous = markByOpenTime.get(row.openTime);
    if (previous !== undefined && previous !== row.markClose) {
      throw new Error(`conflicting mark-price observations at ${row.openTime}`);
    }
    markByOpenTime.set(row.openTime, row.markClose);
  }

  const result: Candle[] = [];
  let fundingIndex = -1;
  for (const spot of spotCandles) {
    while (
      fundingIndex + 1 < funding.length &&
      funding[fundingIndex + 1].fundingTime <= spot.openTime
    ) {
      fundingIndex += 1;
    }
    if (fundingIndex < 0) {
      throw new Error(`missing funding-rate coverage at candle ${spot.openTime}`);
    }
    const markClose = markByOpenTime.get(spot.openTime);
    if (markClose === undefined) {
      throw new Error(`missing mark-price coverage at candle ${spot.openTime}`);
    }
    result.push({
      timestamp: new Date(spot.openTime).toISOString(),
      open: spot.open,
      high: spot.high,
      low: spot.low,
      close: spot.close,
      volume: spot.volume,
      funding_rate: funding[fundingIndex].fundingRate,
      mark_close: markClose,
    });
  }
  return result;
}

export async function fetchCandles(
  target: number,
  options: BinanceRequestOptions = {},
): Promise<Candle[]> {
  if (!Number.isInteger(target) || target <= 0) {
    throw new Error(`target candles must be a positive integer, got ${target}`);
  }
  const resolved = resolveOptions(options);
  const spotRows = await collectSpotCandles(target, resolved);
  const firstOpen = spotRows[0].openTime;
  const lastOpen = spotRows[spotRows.length - 1].openTime;
  const [markRows, fundingRows] = await Promise.all([
    collectMarkRows(firstOpen, lastOpen, resolved),
    collectFundingRows(firstOpen, lastOpen, resolved),
  ]);
  return alignDerivativeInputs(spotRows, fundingRows, markRows);
}
