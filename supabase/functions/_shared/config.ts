export const SYMBOL = "BTCUSDT";
export const TIMEFRAME = "15m";
export const RUN_ID = "unidream_btcusdt_15m_main";
export const BARS_PER_DAY = 96;
export const MODEL_LOOKBACK_DAYS = 60;
export const FEATURE_WARMUP_BARS = 1488;
export const TARGET_BARS = MODEL_LOOKBACK_DAYS * BARS_PER_DAY + FEATURE_WARMUP_BARS;
export const BINANCE_LIMIT = 1000;
export const INITIAL_CASH = 10_000;

// Keep the demo's quote-currency execution model aligned with the research
// backtest defaults. `spread_bps` is the full quoted spread; each position
// change pays one half-spread plus slippage and fee on the changed exposure.
export type TradingCostContract = Readonly<{
  fee_rate: number;
  spread_bps: number;
  slippage_bps: number;
}>;

export const RESEARCH_TRADING_COSTS: TradingCostContract = Object.freeze({
  fee_rate: 0.0003,
  spread_bps: 3.0,
  slippage_bps: 1.0,
});

// The public demo intentionally uses the same contract as research. Keep a
// named alias so a future demo stress scenario can be configured explicitly
// without silently changing the research comparison.
export const DEMO_TRADING_COSTS = RESEARCH_TRADING_COSTS;
export const MAX_TARGET_POSITION = 1.12;
export const ALLOW_SHORT = false;
