export type PipelineNode = {
  index: string;
  label: string;
  title: string;
  detail: string;
  artifact: string;
  tone: "cyan" | "blue" | "lime" | "violet";
};

export const MARKETING_NAV = [
  { label: "プロダクト", href: "#product" },
  { label: "研究", href: "#research" },
  { label: "技術", href: "#technology" },
  { label: "検証", href: "#evidence" },
  { label: "デモ", href: "#demo" },
  { label: "コンタクト", href: "#contact" },
];

export const HERO_READOUTS = [
  { label: "BUNDLE", value: "PLAN011 / FOLD 23", tone: "blue" },
  { label: "SCHEMA", value: "17 FEATURES", tone: "cyan" },
  { label: "VERIFY", value: "1.1920929e-7 MAX DIFF", tone: "lime" },
] as const;

export const METRIC_RAIL = [
  { label: "MARKET", value: "BTCUSDT · 15m", detail: "2018-01-01 → 2026-04-17" },
  { label: "MODEL", value: "Plan011 v31", detail: "WM → BC → AC overlay" },
  { label: "VALIDATION", value: "FOLDS 0–12", detail: "development walk-forward" },
  { label: "HOLDOUT", value: "FOLDS 15–23", detail: "untouched · report-only" },
];

export const BUNDLE_CONTRACT = {
  bundle: "plan011_v31_overlay_actor",
  fold: "23",
  status: "latest_holdout_candidate",
  symbol: "BTCUSDT",
  interval: "15m",
  featureCount: 17,
  sequenceLength: 64,
  zscoreWindow: "60d",
  benchmarkPosition: "1.00000000",
  lastSamplePosition: "1.00632143",
  maxAbsDiff: "1.1920929e-7",
} as const;

export const HOLDOUT_FOLDS = [
  { fold: "15", period: "2024-01-16 → 2024-04-16", alphaEx: 0.90, maxDdDelta: 0.21, turnover: 0.52 },
  { fold: "16", period: "2024-04-16 → 2024-07-16", alphaEx: -0.12, maxDdDelta: 0.28, turnover: 0.41 },
  { fold: "17", period: "2024-07-16 → 2024-10-16", alphaEx: -0.02, maxDdDelta: 0.03, turnover: 1.09 },
  { fold: "18", period: "2024-10-16 → 2025-01-16", alphaEx: 0.65, maxDdDelta: 0.12, turnover: 0.14 },
  { fold: "19", period: "2025-01-16 → 2025-04-16", alphaEx: -0.31, maxDdDelta: 0.35, turnover: 0.44 },
  { fold: "20", period: "2025-04-16 → 2025-07-16", alphaEx: 0.32, maxDdDelta: 0.14, turnover: 1.73 },
  { fold: "21", period: "2025-07-16 → 2025-10-16", alphaEx: -0.04, maxDdDelta: 0.11, turnover: 0.50 },
  { fold: "22", period: "2025-10-16 → 2026-01-16", alphaEx: -0.20, maxDdDelta: 0.37, turnover: 0.34 },
  { fold: "23", period: "2026-01-16 → 2026-04-16", alphaEx: -0.14, maxDdDelta: 0.17, turnover: 0.23 },
] as const;

export const HOLDOUT_SUMMARY = {
  alphaExMean: "+0.11 pt",
  alphaExMedian: "−0.04 pt",
  alphaExBestWorst: "+0.90 / −0.31 pt",
  positiveAlphaEx: "3 / 9",
  maxDdDeltaMean: "+0.20 pt",
  maxDdDeltaMedian: "+0.17 pt",
  improvedDrawdown: "0 / 9",
  goalPass: "0 / 9",
  turnoverMean: "0.60×",
  turnoverMax: "1.73×",
} as const;

export const DEV_SUMMARY = {
  alphaExMean: "+0.41 pt",
  alphaExMedian: "+0.16 pt",
  positiveAlphaEx: "7 / 13",
  maxDdDeltaMean: "+0.20 pt",
  improvedDrawdown: "0 / 13",
  turnoverMean: "0.44×",
} as const;

export const PIPELINE_NODES: PipelineNode[] = [
  {
    index: "01",
    label: "DATA",
    title: "OHLCV / Features",
    detail: "BTCUSDT 15m closed bars with derivative context.",
    artifact: "obs_dim 17 · seq_len 64",
    tone: "cyan",
  },
  {
    index: "02",
    label: "TEACHER",
    title: "Hindsight Oracle",
    detail: "Creates bounded, leak-safe learning targets.",
    artifact: "signal_aim labels",
    tone: "cyan",
  },
  {
    index: "03",
    label: "WORLD MODEL",
    title: "Transformer WM",
    detail: "Encodes latent regime, return and risk state.",
    artifact: "predictive state bundle",
    tone: "blue",
  },
  {
    index: "04",
    label: "POLICY",
    title: "BC + IAC",
    detail: "Turns state into a risk-aware target position.",
    artifact: "inventory recovery",
    tone: "blue",
  },
  {
    index: "05",
    label: "SELECTOR",
    title: "Validation Gate",
    detail: "Selects on development folds; test is report-only.",
    artifact: "inference adjustment scale",
    tone: "violet",
  },
  {
    index: "06",
    label: "REPORT",
    title: "Test Scorecard",
    detail: "Fold, regime and B&H-relative evidence.",
    artifact: "AlphaEx · MaxDDΔ",
    tone: "lime",
  },
];

export const PRINCIPLES = [
  {
    index: "A",
    title: "状態を読む",
    body: "短期の値当てではなく、ボラティリティ・流動性・トレンドの組み合わせを潜在状態として捉える。",
    tone: "cyan",
  },
  {
    index: "B",
    title: "行動を選ぶ",
    body: "予測値を直接売買に変換せず、状態に応じたポジションとリスク制御を方策として学習する。",
    tone: "blue",
  },
  {
    index: "C",
    title: "検証で止める",
    body: "未使用holdout、B&H比較、ドローダウン、回転率を揃え、条件を満たさない候補は採用せず、testはレポートに限定する。",
    tone: "lime",
  },
];
