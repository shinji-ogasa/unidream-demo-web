import assert from "node:assert/strict";
import test from "node:test";

import { buildBuyAndHoldEquity, computeMetrics } from "../../../../src/lib/metrics.ts";
import type { EquitySnapshot, Trade } from "../../../../src/lib/types.ts";
import { applyFill } from "../../_shared/paper_trading.ts";

const timestamps = [
  "2026-08-30T00:00:00.000Z",
  "2026-08-30T00:15:00.000Z",
  "2026-08-30T00:30:00.000Z",
];

function snapshot(
  index: number,
  price: number,
  equity: number,
  position: number,
): EquitySnapshot {
  return {
    id: `snapshot-${index}`,
    run_id: "run",
    symbol: "BTCUSDT",
    timeframe: "15m",
    timestamp: timestamps[index],
    equity,
    cash: equity,
    asset_qty: 0,
    position,
    price,
    created_at: timestamps[index],
  };
}

function trade(
  index: number,
  fromPosition: number,
  toPosition: number,
  notional: number,
): Trade {
  return {
    id: `trade-${index}`,
    run_id: "run",
    symbol: "BTCUSDT",
    timeframe: "15m",
    timestamp: timestamps[index],
    from_position: fromPosition,
    to_position: toPosition,
    price: 100,
    trade_notional: notional,
    fee: 5.5,
    created_at: timestamps[index],
  };
}

test("buy-and-hold charges the same flat-to-one entry cost as the strategy", () => {
  const flat = {
    current_position: 0,
    cash: 10_000,
    asset_qty: 0,
    equity: 10_000,
    last_price: null,
    last_timestamp: null,
  };
  const strategyEntry = applyFill(flat, 1, 100);
  const strategyHold = applyFill(
    { ...flat, ...strategyEntry.next, current_position: 1 },
    1,
    110,
  );
  const curve = buildBuyAndHoldEquity([
    snapshot(0, 100, 9_994.5, 1),
    snapshot(1, 110, 10_994.5, 1),
  ]);

  assert.equal(curve[0], strategyEntry.next.equity);
  assert.equal(curve[1], strategyHold.next.equity);
});

test("dashboard metrics use net B&H, research MaxDD sign, and position turnover units", () => {
  const snapshots = [
    snapshot(0, 100, 9_994.5, 1),
    snapshot(1, 110, 10_994.5, 0.5),
    snapshot(2, 99, 9_894.5, 0.5),
  ];
  const metrics = computeMetrics(
    snapshots,
    [
      // The initial entry is intentionally excluded from adjacent-position
      // turnover, matching research action_stats's no-prepend convention.
      trade(0, 0, 1, 999_999),
      trade(1, 1, 0.5, 999_999),
    ],
    35_040,
  );

  assert.ok(Math.abs(metrics.bnhReturn - (-0.01)) < 1e-12);
  const expectedBnhMaxDd = 9_894.5 / 10_994.5 - 1;
  assert.ok(Math.abs(metrics.maxDDBnh - expectedBnhMaxDd) < 1e-12);
  assert.ok(metrics.maxDDStrat < 0);
  assert.ok(
    Math.abs(metrics.maxDDDelta - (Math.abs(metrics.maxDDStrat) - Math.abs(expectedBnhMaxDd)))
      < 1e-12,
  );
  assert.equal(metrics.turnover, 0.5);
});

test("metrics Sharpe uses annualized log returns with population volatility", () => {
  const snapshots = [
    snapshot(0, 100, 100, 0),
    snapshot(1, 110, 110, 0),
    snapshot(2, 99, 99, 0),
  ];
  const metrics = computeMetrics(snapshots, [], 1);
  const returns = [Math.log(110 / 100), Math.log(99 / 110)];
  const mean = (returns[0] + returns[1]) / 2;
  const variance = ((returns[0] - mean) ** 2 + (returns[1] - mean) ** 2) / 2;
  const expected = mean / Math.sqrt(variance);
  assert.ok(Math.abs(metrics.sharpeBnh - expected) < 1e-12);
});
