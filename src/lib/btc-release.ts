/** One isolated public paper run. Historical evidence is supplied separately. */
export const BTC_RUN_ID = "btc-wm31-ac-20260906-paper-v1";
export const BTC_BUNDLE_ID = "btc-wm31-ac-20260906";
export const BTC_CANDIDATE_ID = "wm_market31_ac";
export const BTC_DISPLAY_CAPITAL = 10_000;
export const BTC_MODEL_LABEL = "UniDream · WM + RL";
export const BTC_EVIDENCE_URL = "/btc-accuracy-release.json";

export type BtcRun = {
  run_id: string;
  bundle_id: string;
  bundle_sha256: string;
  feature_contract_sha256: string;
  execution_contract_sha256: string;
  manifest: Record<string, unknown>;
  created_at: string;
};

export type BtcState = {
  schema_version: number;
  run_id: string;
  bundle_id: string;
  bundle_sha256: string;
  version: number;
  last_open_ts: string;
  started_at: string;
  initial_open: number;
  initial_equity: number;
  display_capital: number;
  cash: number;
  units: number;
  benchmark_units: number;
  fees: number;
  borrow: number;
  trades: number;
  pending_target: number | null;
  pending_decision_ts: string | null;
  pending_due_at: string | null;
  last_mark_ts: string | null;
  last_mark_price: number | null;
  equity: number;
  benchmark_equity: number;
  max_drawdown: number;
  benchmark_max_drawdown: number;
  current_open_equity: number | null;
  current_open_exposure: number | null;
  bridge_state: {
    schema: "wm-rl-live-bridge-v1";
    bundle_id: string;
    manifest_sha256: string;
    account: { account: { last_exposure: number | null; insolvent: boolean } };
  };
};

export type BtcStateRow = {
  run_id: string;
  version: number;
  last_open_ts: string;
  state: BtcState;
  updated_at: string;
};

export type BtcSnapshot = {
  run_id: string;
  timestamp: string;
  equity: number;
  benchmark_equity: number;
  exposure: number;
  price: number;
  cash: number;
  units: number;
  fees: number;
  borrow: number;
  max_drawdown: number;
  benchmark_max_drawdown: number;
  bundle_sha256: string;
};

export type BtcForecast = {
  forecast_kind: "wm_rl_actor";
  diagnostics: Record<string, unknown>;
  run_id: string;
  decision_ts: string;
  available: boolean;
  action_eligible: boolean;
  reason: string | null;
  mu: number | null;
  variance: number | null;
  target: number | null;
  known_open_exposure: number | null;
  bundle_sha256: string;
  feature_contract_sha256: string;
  execution_contract_sha256: string;
  data: Record<string, unknown>;
  created_at: string;
};

export type BtcEvent = {
  run_id: string;
  event_id: string;
  timestamp: string;
  kind: "fill" | "intent" | "expired" | "account" | "decision";
  details: Record<string, unknown>;
  bundle_sha256: string;
};

export type BtcDashboardData = {
  run: BtcRun | null;
  state: BtcStateRow | null;
  snapshots: BtcSnapshot[];
  forecast: BtcForecast | null;
  events: BtcEvent[];
  readStatus: "ready" | "pending" | "unavailable" | "contract_mismatch";
  checkedAt: string;
};

/** Values displayed as money are scaled, never written back into normalized state. */
export function displayNav(nav: number | null | undefined): number | null {
  return typeof nav === "number" && Number.isFinite(nav)
    ? nav * BTC_DISPLAY_CAPITAL
    : null;
}

export function isBoundToRun(
  row: { run_id: string; bundle_sha256: string },
  run: BtcRun,
): boolean {
  return row.run_id === BTC_RUN_ID && row.bundle_sha256 === run.bundle_sha256;
}

export type BtcHistoricalEvidence = {
  metric_units: "fraction; multiply by100 for percentage points";
  start: string;
  end_exclusive: string;
  quarters: number;
  regime_counts: { bull: number; bear: number; sideways: number };
  base: { alpha_ex: number; maxdd_delta: number };
  stress_2x: { alpha_ex: number; maxdd_delta: number };
  joint_quarters_both_costs: number;
};

export type BtcReleaseEvidence = {
  bundle_id: string;
  candidate_id: string;
  historical_evidence: BtcHistoricalEvidence | null;
  source_report_url: string;
  production_cutoff: string | null;
  selection_manifest_url: string;
  research_scores_apply_to_production_weights: false;
  high_probability_generalization_established: false;
  learned_rl: true;
  minimum_means_met: boolean | null;
  policy_arm: string | null;
};
