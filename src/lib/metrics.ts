import { INITIAL_EQUITY, type EquitySnapshot, type Trade } from "./types";
import { DEMO_TRADING_COSTS } from "../../supabase/functions/_shared/config.ts";
import { computeTransactionCosts } from "../../supabase/functions/_shared/paper_trading.ts";

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
  if (returns.length < 2 || !Number.isFinite(annualization) || annualization <= 0) return 0;
  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance =
    returns.reduce((a, b) => a + (b - mean) * (b - mean), 0) / returns.length;
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
      const dd = (e - peak) / peak;
      if (dd < mdd) mdd = dd;
    }
  }
  return mdd;
}

/**
 * Build a net buy-and-hold equity curve with the same flat -> 1.0 initial
 * entry convention as the live strategy. The entry cost is quote currency and
 * is deducted from cash once; subsequent bars only mark the unchanged
 * benchmark quantity to spot price (the cost must not scale with price).
 */
export function buildBuyAndHoldEquity(
  snapshots: readonly EquitySnapshot[],
  initialCapital = INITIAL_EQUITY,
): number[] {
  if (snapshots.length === 0) return [];
  if (!Number.isFinite(initialCapital) || initialCapital <= 0) {
    throw new Error(`initial capital must be positive and finite, got ${initialCapital}`);
  }
  const firstPrice = snapshots[0].price;
  if (!Number.isFinite(firstPrice) || firstPrice <= 0) return snapshots.map(() => 0);
  const entryCost = computeTransactionCosts(1, initialCapital).total;
  return snapshots.map((snapshot) =>
    initialCapital * (Number.isFinite(snapshot.price) ? snapshot.price : 0) / firstPrice - entryCost,
  );
}

export function computeMetrics(
  snapshots: EquitySnapshot[],
  trades: Trade[],
  annualization: number,
  initialCapital = INITIAL_EQUITY,
): WindowMetrics {
  if (snapshots.length < 2) return { ...ZERO_METRICS, bars: snapshots.length };

  const first = snapshots[0];
  const last = snapshots[snapshots.length - 1];
  const stratReturn = first.equity > 0 ? last.equity / first.equity - 1 : 0;
  const bnhEqs = buildBuyAndHoldEquity(snapshots, initialCapital);
  // Window returns start at the first displayed bar, so the one-time entry
  // cost is intentionally outside this ratio (the net curve still carries
  // it for absolute equity and drawdown comparisons).
  const bnhReturn = first.price > 0 ? last.price / first.price - 1 : 0;
  const alphaEx = stratReturn - bnhReturn;

  const stratR: number[] = [];
  const bnhR: number[] = [];
  for (let i = 1; i < snapshots.length; i++) {
    const prev = snapshots[i - 1];
    const cur = snapshots[i];
    if (prev.equity > 0 && cur.equity > 0) stratR.push(Math.log(cur.equity / prev.equity));
    if (prev.price > 0 && cur.price > 0) bnhR.push(Math.log(cur.price / prev.price));
  }
  const sharpeStrat = sharpe(stratR, annualization);
  const sharpeBnh = sharpe(bnhR, annualization);

  const stratEqs = snapshots.map((s) => s.equity);
  const maxDDStrat = maxDrawdown(stratEqs);
  const maxDDBnh = maxDrawdown(bnhEqs);

  const startMs = new Date(first.timestamp).getTime();
  const endMs = new Date(last.timestamp).getTime();
  const inWindow = trades.filter((t) => {
    const ts = new Date(t.timestamp).getTime();
    return ts >= startMs && ts <= endMs;
  });
  // Research action_stats defines turnover as the sum of adjacent absolute
  // position changes. It is an exposure-ratio unit, not quote notional, and
  // deliberately excludes the synthetic initial flat -> target entry.
  let turnover = 0;
  for (let i = 1; i < snapshots.length; i++) {
    turnover += Math.abs(snapshots[i].position - snapshots[i - 1].position);
  }

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
    // Research reports abs(strategy MaxDD) - abs(B&H MaxDD); negative means
    // the strategy's drawdown is smaller.
    maxDDDelta: Math.abs(maxDDStrat) - Math.abs(maxDDBnh),
    turnover,
    longPct: longCount / total,
    shortPct: shortCount / total,
    flatPct: flatCount / total,
    bars: total,
    trades: inWindow.length,
  };
}
