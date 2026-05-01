export type Prediction = {
  id: string;
  symbol: string;
  timeframe: string;
  signal: string;
  position: number | null;
  score: number | null;
  confidence: number | null;
  latest_close: number | null;
  latest_timestamp: string | null;
  model_version: string | null;
  feature_version: string | null;
  raw: unknown;
  created_at: string;
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
  updated_at: string;
};

export type EquitySnapshot = {
  id: string;
  run_id: string;
  symbol: string;
  timeframe: string;
  timestamp: string;
  equity: number;
  cash: number;
  asset_qty: number;
  position: number;
  price: number;
  created_at: string;
};

export type Trade = {
  id: string;
  run_id: string;
  symbol: string;
  timeframe: string;
  timestamp: string;
  from_position: number;
  to_position: number;
  price: number;
  trade_notional: number | null;
  fee: number | null;
  created_at: string;
};

export const RUN_ID = "unidream_btcusdt_15m_main";
export const SYMBOL = "BTCUSDT";
export const TIMEFRAME = "15m";
export const INITIAL_EQUITY = 10_000;
export const DISPLAY_MODEL_NAME = "ACtuning_v0";
