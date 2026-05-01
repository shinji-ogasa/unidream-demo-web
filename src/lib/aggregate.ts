import type { EquitySnapshot } from "./types";

// Demo runs at 15m granularity; coarser TFs were dropped from the UI because
// the model output didn't justify the extra toggle. Sharpe annualization is
// 96 bars/day * 365 days = 35040 bars/year.
export const ANNUALIZATION = 96 * 365;

export function sortedAscending(snapshots: EquitySnapshot[]): EquitySnapshot[] {
  return [...snapshots].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
  );
}

export function tickLabel(ts: number): string {
  // YY-MM-DD HH:MM
  return new Date(ts).toISOString().slice(2, 16).replace("T", " ");
}
