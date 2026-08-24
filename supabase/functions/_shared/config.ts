export const SYMBOL = "BTCUSDT";
export const TIMEFRAME = "15m";
export const RUN_ID = "unidream_btcusdt_15m_main";
export const BARS_PER_DAY = 96;
export const MODEL_LOOKBACK_DAYS = 60;
export const FEATURE_WARMUP_BARS = 1488;
export const TARGET_BARS = MODEL_LOOKBACK_DAYS * BARS_PER_DAY + FEATURE_WARMUP_BARS;
export const BINANCE_LIMIT = 1000;
export const INITIAL_CASH = 10_000;

// The realtime demo is paper trading. Research costs remain defined by the
// research config; the demo currently omits fees and slippage.
export const DEMO_FEE_RATE = 0;
export const MAX_TARGET_POSITION = 1.12;
export const ALLOW_SHORT = false;
