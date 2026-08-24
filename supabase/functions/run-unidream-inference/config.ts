import { TARGET_BARS as CURRENT_TARGET_BARS } from "../_shared/config.ts";

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

export type Candle = {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
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
  const value = Deno.env.get(name);
  if (!value) throw new Error(`missing required env: ${name}`);
  return value;
}
