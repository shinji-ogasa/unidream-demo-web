import type { EquitySnapshot } from "./types";

export type Tf = "15m" | "1h" | "1D";

export const TF_OPTIONS: Tf[] = ["15m", "1h", "1D"];

const BUCKET_MS: Record<Tf, number> = {
  "15m": 15 * 60 * 1000,
  "1h": 60 * 60 * 1000,
  "1D": 24 * 60 * 60 * 1000,
};

// Bars per year for each TF — used by Sharpe annualization.
export const ANNUALIZATION: Record<Tf, number> = {
  "15m": 96 * 365,
  "1h": 24 * 365,
  "1D": 365,
};

// Group 15m snapshots into the requested TF buckets and keep the most recent
// snapshot in each bucket so the equity at coarser TFs uses end-of-bar values.
// 15m passes through unchanged (just sorted ascending).
export function aggregateSnapshots(snapshots: EquitySnapshot[], tf: Tf): EquitySnapshot[] {
  const sorted = [...snapshots].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
  );
  if (tf === "15m") return sorted;
  const bucket = BUCKET_MS[tf];
  const grouped = new Map<number, EquitySnapshot>();
  for (const s of sorted) {
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

export function tickLabel(ts: number, tf: Tf): string {
  const iso = new Date(ts).toISOString();
  switch (tf) {
    case "1D":
      return iso.slice(0, 10); // YYYY-MM-DD
    case "1h":
      return iso.slice(2, 13).replace("T", " "); // YY-MM-DD HH
    default:
      return iso.slice(2, 16).replace("T", " "); // YY-MM-DD HH:MM
  }
}
