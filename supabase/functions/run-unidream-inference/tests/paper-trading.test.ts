import assert from "node:assert/strict";
import test from "node:test";

import {
  DEMO_TRADING_COSTS,
  RESEARCH_TRADING_COSTS,
} from "../../_shared/config.ts";
import {
  applyFill,
  computeTransactionCosts,
} from "../../_shared/paper_trading.ts";

const flatState = {
  current_position: 0,
  cash: 10_000,
  asset_qty: 0,
  equity: 10_000,
  last_price: null,
  last_timestamp: null,
};

test("demo cost contract matches research defaults and half-spread units", () => {
  assert.deepEqual(RESEARCH_TRADING_COSTS, {
    fee_rate: 0.0003,
    spread_bps: 3,
    slippage_bps: 1,
  });
  assert.deepEqual(DEMO_TRADING_COSTS, RESEARCH_TRADING_COSTS);

  const costs = computeTransactionCosts(1, 10_000);
  assert.equal(costs.position_delta, 1);
  assert.equal(costs.notional_base, 10_000);
  assert.ok(Math.abs(costs.fee - 3) < 1e-12);
  assert.ok(Math.abs(costs.spread - 1.5) < 1e-12);
  assert.equal(costs.slippage, 1);
  assert.ok(Math.abs(costs.total - 5.5) < 1e-12);
});

test("applyFill charges cost on position delta before recording equity", () => {
  const result = applyFill(flatState, 1, 100);

  assert.equal(result.trade?.trade_notional, 10_000);
  // 10,000 * (0.0003 + 3bps / 2 + 1bps) = 5.50 quote currency.
  assert.ok(Math.abs((result.trade?.fee ?? 0) - 5.5) < 1e-12);
  assert.equal(result.next.asset_qty, 100);
  assert.ok(Math.abs(result.next.cash + 5.5) < 1e-12);
  assert.ok(Math.abs(result.next.equity - 9_994.5) < 1e-12);
});

test("unchanged exposure has no new transaction cost while mark-to-market updates equity", () => {
  const entered = applyFill(flatState, 1, 100);
  const held = applyFill(
    {
      ...flatState,
      ...entered.next,
      current_position: 1,
      last_price: 100,
      last_timestamp: "2026-08-30T00:00:00.000Z",
    },
    1,
    110,
  );

  assert.equal(held.trade, null);
  assert.ok(Math.abs(held.next.cash + 5.5) < 1e-12);
  assert.equal(held.next.asset_qty, 100);
  assert.ok(Math.abs(held.next.equity - 10_994.5) < 1e-12);
});
