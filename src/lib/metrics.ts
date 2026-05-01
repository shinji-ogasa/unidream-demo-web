import type { EquitySnapshot, Trade } from "./types";

export type WindowMetrics = {
  stratReturn: number;
  bnhReturn: number;
  alphaEx: number;
  sharpeStrat: number;
  sharpeBnh: number;
  sharpeDelta: number;
  maxDDStrat: number;
  maxDDBnh: number;
  maxDDDelta: number;
  turnover: number;
  longPct: number;
  shortPct: number;
  flatPct: number;
  bars: number;
  trades: number;
};

const ZERO_METRICS: WindowMetrics = {
  stratReturn: 0,
  bnhReturn: 0,
  alphaEx: 0,
  sharpeStrat: 0,
  sharpeBnh: 0,
  sharpeDelta: 0,
  maxDDStrat: 0,
  maxDDBnh: 0,
  maxDDDelta: 0,
  turnover: 0,
  longPct: 0,
  shortPct: 0,
  flatPct: 0,
  bars: 0,
  trades: 0,
};

function sharpe(returns: number[], annualization: number): number {
  if (returns.length < 2) return 0;
  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance =
    returns.reduce((a, b) => a + (b - mean) * (b - mean), 0) / (returns.length - 1);
  const std = Math.sqrt(variance);
  if (std < 1e-12) return 0;
  return (mean / std) * Math.sqrt(annualization);
}

function maxDrawdown(equities: number[]): number {
  if (equities.length === 0) return 0;
  let peak = equities[0];
  let mdd = 0;
  for (const e of equities) {
    if (e > peak) peak = e;
    if (peak > 0) {
      const dd = (peak - e) / peak;
      if (dd > mdd) mdd = dd;
    }
  }
  return mdd;
}

export function computeMetrics(
  snapshots: EquitySnapshot[],
  trades: Trade[],
  annualization: number,
): WindowMetrics {
  if (snapshots.length < 2) return { ...ZERO_METRICS, bars: snapshots.length };

  const first = snapshots[0];
  const last = snapshots[snapshots.length - 1];
  const stratReturn = first.equity > 0 ? last.equity / first.equity - 1 : 0;
  const bnhReturn = first.price > 0 ? last.price / first.price - 1 : 0;
  const alphaEx = stratReturn - bnhReturn;

  const stratR: number[] = [];
  const bnhR: number[] = [];
  for (let i = 1; i < snapshots.length; i++) {
    const prev = snapshots[i - 1];
    const cur = snapshots[i];
    if (prev.equity > 0) stratR.push(cur.equity / prev.equity - 1);
    if (prev.price > 0) bnhR.push(cur.price / prev.price - 1);
  }
  const sharpeStrat = sharpe(stratR, annualization);
  const sharpeBnh = sharpe(bnhR, annualization);

  const stratEqs = snapshots.map((s) => s.equity);
  const bnhEqs = snapshots.map((s) =>
    first.price > 0 ? (s.price / first.price) * first.equity : 0,
  );
  const maxDDStrat = maxDrawdown(stratEqs);
  const maxDDBnh = maxDrawdown(bnhEqs);

  const meanEq = stratEqs.reduce((a, b) => a + b, 0) / stratEqs.length;
  const startMs = new Date(first.timestamp).getTime();
  const endMs = new Date(last.timestamp).getTime();
  const inWindow = trades.filter((t) => {
    const ts = new Date(t.timestamp).getTime();
    return ts >= startMs && ts <= endMs;
  });
  const totalNotional = inWindow.reduce((a, t) => a + Math.abs(t.trade_notional ?? 0), 0);
  const turnover = meanEq > 0 ? totalNotional / meanEq : 0;

  let longCount = 0;
  let shortCount = 0;
  let flatCount = 0;
  for (const s of snapshots) {
    if (s.position > 1e-9) longCount += 1;
    else if (s.position < -1e-9) shortCount += 1;
    else flatCount += 1;
  }
  const total = snapshots.length;

  return {
    stratReturn,
    bnhReturn,
    alphaEx,
    sharpeStrat,
    sharpeBnh,
    sharpeDelta: sharpeStrat - sharpeBnh,
    maxDDStrat,
    maxDDBnh,
    maxDDDelta: maxDDStrat - maxDDBnh,
    turnover,
    longPct: longCount / total,
    shortPct: shortCount / total,
    flatPct: flatCount / total,
    bars: total,
    trades: inWindow.length,
  };
}
