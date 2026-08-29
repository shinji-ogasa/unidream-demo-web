import {
  BINANCE_LIMIT as CURRENT_BINANCE_LIMIT,
  TARGET_BARS as CURRENT_TARGET_BARS,
} from "../_shared/config.ts";

export {
  ALLOW_SHORT,
  BARS_PER_DAY,
  DEMO_FEE_RATE,
  FEATURE_WARMUP_BARS,
  INITIAL_CASH,
  MAX_TARGET_POSITION,
  MODEL_LOOKBACK_DAYS,
  RUN_ID,
  SYMBOL,
  TARGET_BARS,
  TIMEFRAME,
} from "../_shared/config.ts";

export const MIN_BARS = CURRENT_TARGET_BARS;

// Public market-data endpoints used by the Edge function. Spot candles remain
// the model's OHLCV input; USDⓈ-M Futures supplies the derivative observations
// required by the Plan011 feature pipeline.
export const BINANCE_SPOT_BASE_URL = "https://api.binance.com";
export const BINANCE_FUTURES_BASE_URL = "https://fapi.binance.com";
export const BINANCE_PAGE_LIMIT = CURRENT_BINANCE_LIMIT;

export type Candle = {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  /** Latest funding observation published at or before timestamp. */
  funding_rate: number;
  /** Mark-price kline close for the exact timestamp bar. */
  mark_close: number;
};

export type FundingRateObservation = {
  fundingTime: number;
  fundingRate: number;
};

export type MarkPriceObservation = {
  openTime: number;
  markClose: number;
};

export type StrategyState = {
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

export function requireEnv(name: string): string {
  const runtime = globalThis as typeof globalThis & {
    Deno?: { env: { get(key: string): string | undefined } };
  };
  const value = runtime.Deno?.env.get(name);
  if (!value) throw new Error(`missing required env: ${name}`);
  return value;
}
