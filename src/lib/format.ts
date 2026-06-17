export function fmtNumber(n: number | null | undefined, digits = 2): string {
  if (n === null || n === undefined || !Number.isFinite(n)) return "—";
  return n.toLocaleString("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

export function fmtUSD(n: number | null | undefined, digits = 2): string {
  if (n === null || n === undefined || !Number.isFinite(n)) return "—";
  return `$${fmtNumber(n, digits)}`;
}

export function fmtPosition(n: number | null | undefined): string {
  if (n === null || n === undefined || !Number.isFinite(n)) return "—";
  return (Math.trunc(n * 1000) / 1000).toFixed(3);
}

export function fmtTime(ts: string | null | undefined): string {
  if (!ts) return "—";
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return ts;
  return d.toISOString().replace("T", " ").slice(0, 19) + " UTC";
}

export function pnlPercent(equity: number, initial: number): number {
  return ((equity - initial) / initial) * 100;
}

export function fmtPercent(p: number, digits = 2, signed = false): string {
  if (!Number.isFinite(p)) return "—";
  const v = (p * 100).toFixed(digits);
  if (signed && p > 0) return `+${v}%`;
  return `${v}%`;
}

export function fmtSigned(n: number, digits = 2, suffix = ""): string {
  if (!Number.isFinite(n)) return "—";
  const v = n.toFixed(digits);
  return `${n > 0 ? "+" : ""}${v}${suffix}`;
}

export function fmtSeconds(secs: number): string {
  if (!Number.isFinite(secs) || secs < 0) return "00:00";
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
