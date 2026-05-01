import type { EquitySnapshot } from "./types";

export type Tf = "15m" | "1h" | "1D";

export const TF_OPTIONS: Tf[] = ["15m", "1h", "1D"];

const BUCKET_MS: Record<Tf, number> = {
  "15m": 15 * 60 * 1000,
  "1h": 60 * 60 * 1000,
  "1D": 24 * 60 * 60 * 1000,
};

// bars-per-year for each timeframe — used to annualize Sharpe.
export const ANNUALIZATION: Record<Tf, number> = {
  "15m": 96 * 365,
  "1h": 24 * 365,
  "1D": 365,
};

// Group snapshots into buckets and keep the most-recent snapshot per bucket so
// the equity curve at coarser timeframes uses the closing equity of each
// bucket. Snapshots are assumed to come from the 15m source table.
export function aggregateSnapshots(snapshots: EquitySnapshot[], tf: Tf): EquitySnapshot[] {
  if (tf === "15m") {
    return [...snapshots].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    );
  }
  const bucket = BUCKET_MS[tf];
  const grouped = new Map<number, EquitySnapshot>();
  for (const s of snapshots) {
    const ts = new Date(s.timestamp).getTime();
    const key = Math.floor(ts / bucket);
    const prev = grouped.get(key);
    if (!prev || new Date(s.timestamp).getTime() > new Date(prev.timestamp).getTime()) {
      grouped.set(key, s);
    }
  }
  return [...grouped.values()].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
  );
}

export function bucketLabel(ts: number, tf: Tf): string {
  const d = new Date(ts);
  const iso = d.toISOString();
  if (tf === "1D") return iso.slice(0, 10);
  return iso.slice(2, 16).replace("T", " ");
}
