import {
  DEMO_TRADING_COSTS,
  type TradingCostContract,
} from "../../supabase/functions/_shared/config.ts";

/**
 * Read-only provenance shown by the dashboard. These are source-contract
 * declarations; row-level runtime evidence is not persisted in the current
 * public tables, so the UI must not present them as a health check.
 */
export type DashboardContract = Readonly<{
  model: string;
  featureSchema: string;
  featureParity: string;
  derivativeInputs: string;
  observationCutoff: string;
  atomicCommit: string;
  tradingCosts: TradingCostContract;
}>;

export const DEMO_CONTRACT: DashboardContract = Object.freeze({
  model: "Plan011 v31",
  featureSchema: "17-feature raw candle input",
  featureParity: "research 17-feature parity inputs",
  derivativeInputs: "funding_rate + mark_close",
  observationCutoff: "closed 15m candle",
  atomicCommit: "record_unidream_inference RPC",
  tradingCosts: DEMO_TRADING_COSTS,
});
