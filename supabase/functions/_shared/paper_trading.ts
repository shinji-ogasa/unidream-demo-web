import {
  ALLOW_SHORT,
  DEMO_TRADING_COSTS,
  MAX_TARGET_POSITION,
  type TradingCostContract,
} from "./config.ts";

export type PaperTradingState = {
  current_position: number;
  cash: number;
  asset_qty: number;
  equity: number;
  last_price: number | null;
  last_timestamp: string | null;
};

export type FillResult = {
  next: {
    current_position: number;
    cash: number;
    asset_qty: number;
    equity: number;
  };
  trade: {
    from_position: number;
    to_position: number;
    price: number;
    trade_notional: number;
    fee: number;
  } | null;
};

export type TransactionCostBreakdown = {
  position_delta: number;
  notional_base: number;
  fee: number;
  spread: number;
  slippage: number;
  total: number;
};

/**
 * Apply the research cost convention in quote-currency units.
 *
 * `position_delta` is the absolute exposure change and `notional_base` is
 * equity marked at the decision price. This mirrors research's
 * compute_costs(): fee + (full spread / 2) + slippage, all multiplied by the
 * changed exposure. It deliberately does not alter the mark price.
 */
export function computeTransactionCosts(
  positionDelta: number,
  notionalBase: number,
  costs: TradingCostContract = DEMO_TRADING_COSTS,
): TransactionCostBreakdown {
  if (!Number.isFinite(positionDelta) || positionDelta < 0) {
    throw new Error(`position delta must be a non-negative finite number, got ${positionDelta}`);
  }
  if (!Number.isFinite(notionalBase) || notionalBase < 0) {
    throw new Error(`notional base must be a non-negative finite number, got ${notionalBase}`);
  }
  if (
    !Number.isFinite(costs.fee_rate) || costs.fee_rate < 0
    || !Number.isFinite(costs.spread_bps) || costs.spread_bps < 0
    || !Number.isFinite(costs.slippage_bps) || costs.slippage_bps < 0
  ) {
    throw new Error("trading cost contract must contain non-negative finite rates");
  }

  const changedNotional = positionDelta * notionalBase;
  const fee = changedNotional * costs.fee_rate;
  const spread = changedNotional * (costs.spread_bps / 10_000) / 2;
  const slippage = changedNotional * (costs.slippage_bps / 10_000);
  return {
    position_delta: positionDelta,
    notional_base: notionalBase,
    fee,
    spread,
    slippage,
    total: fee + spread + slippage,
  };
}

export function clampTargetPosition(raw: unknown): number {
  if (typeof raw !== "number" || !Number.isFinite(raw)) return 0;
  let target = raw;
  if (!ALLOW_SHORT && target < 0) target = 0;
  if (target > MAX_TARGET_POSITION) target = MAX_TARGET_POSITION;
  if (target < -1) target = -1;
  return target;
}

export function applyFill(
  previous: PaperTradingState,
  targetPosition: number,
  price: number,
  costs: TradingCostContract = DEMO_TRADING_COSTS,
): FillResult {
  if (!Number.isFinite(price) || price <= 0) {
    throw new Error(`fill price must be a positive finite number, got ${price}`);
  }
  const equityAtPrice = previous.cash + previous.asset_qty * price;
  const targetAssetQty = (targetPosition * equityAtPrice) / price;
  const deltaQty = targetAssetQty - previous.asset_qty;
  const positionUnchanged =
    Math.round(targetPosition * 1e6) === Math.round(previous.current_position * 1e6);

  if (positionUnchanged) {
    return {
      next: {
        current_position: previous.current_position,
        cash: previous.cash,
        asset_qty: previous.asset_qty,
        equity: equityAtPrice,
      },
      trade: null,
    };
  }

  const currentPosition = Math.round(targetPosition * 1e6) / 1e6;
  const tradeNotional = Math.abs(deltaQty) * price;
  const positionDelta = Math.abs(currentPosition - previous.current_position);
  const transactionCosts = computeTransactionCosts(positionDelta, equityAtPrice, costs);
  const newCash = previous.cash - deltaQty * price - transactionCosts.total;
  const newAssetQty = targetAssetQty;

  return {
    next: {
      current_position: currentPosition,
      cash: newCash,
      asset_qty: newAssetQty,
      equity: newCash + newAssetQty * price,
    },
    trade: {
      from_position: previous.current_position,
      to_position: currentPosition,
      price,
      trade_notional: tradeNotional,
      // The legacy DB column is named `fee`; it stores the all-in quote cost
      // so the demo cannot understate research-equivalent execution drag.
      fee: transactionCosts.total,
    },
  };
}
