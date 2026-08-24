import {
  ALLOW_SHORT,
  DEMO_FEE_RATE,
  MAX_TARGET_POSITION,
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
): FillResult {
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
  const fee = tradeNotional * DEMO_FEE_RATE;
  const newCash = previous.cash - deltaQty * price - fee;
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
      fee,
    },
  };
}
