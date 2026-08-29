import { type Candle, type StrategyState } from "./config.ts";
import { applyFill, clampTargetPosition } from "../_shared/paper_trading.ts";

type PredictionRecord = Record<string, unknown>;

export type AtomicInferencePayload = {
  run_id: string;
  symbol: string;
  timeframe: string;
  expected_state: {
    last_timestamp: string | null;
    current_position: number;
    cash: number;
    asset_qty: number;
    equity: number;
    last_price: number | null;
  };
  latest: {
    timestamp: string;
    close: number;
  };
  prediction: {
    signal: string;
    position: number | null;
    score: number | null;
    confidence: number | null;
    model_version: string | null;
    feature_version: string | null;
    raw: unknown;
  };
  target_position: number;
  next_state: {
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

export type AtomicRpcResult = {
  ok: true;
  status: "applied" | "already_processed";
  traded: boolean;
};

export type RpcError = {
  code?: string;
  message?: string;
  details?: string;
  hint?: string;
};

export type RpcClient = {
  rpc(
    functionName: string,
    args: { p_payload: AtomicInferencePayload },
  ): PromiseLike<{ data: unknown; error: RpcError | null }>;
};

export class InferenceRpcConflictError extends Error {
  readonly code: string | null;

  constructor(message: string, code: string | null = null) {
    super(message);
    this.name = "InferenceRpcConflictError";
    this.code = code;
    Object.setPrototypeOf(this, InferenceRpcConflictError.prototype);
  }
}

function predictionRecord(prediction: unknown): PredictionRecord {
  return prediction && typeof prediction === "object"
    ? prediction as PredictionRecord
    : {};
}

function finiteOrNull(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

/** Build the complete CAS-protected request without performing any I/O. */
export function buildAtomicInferencePayload(
  previous: StrategyState,
  latest: Candle,
  prediction: unknown,
  modelVersion: string | null,
): AtomicInferencePayload {
  const record = predictionRecord(prediction);
  const rawPosition = finiteOrNull(record.position);
  const targetPosition = clampTargetPosition(rawPosition ?? 0);
  const { next, trade } = applyFill(previous, targetPosition, latest.close);

  return {
    run_id: previous.id,
    symbol: previous.symbol,
    timeframe: previous.timeframe,
    expected_state: {
      last_timestamp: previous.last_timestamp,
      current_position: previous.current_position,
      cash: previous.cash,
      asset_qty: previous.asset_qty,
      equity: previous.equity,
      last_price: previous.last_price,
    },
    latest: {
      timestamp: latest.timestamp,
      close: latest.close,
    },
    prediction: {
      signal: typeof record.signal === "string" ? record.signal : "unknown",
      position: rawPosition,
      score: finiteOrNull(record.score),
      confidence: finiteOrNull(record.confidence),
      model_version: typeof record.model_version === "string"
        ? record.model_version
        : modelVersion,
      feature_version: typeof record.feature_version === "string"
        ? record.feature_version
        : null,
      raw: prediction === undefined ? null : prediction,
    },
    target_position: targetPosition,
    next_state: next,
    trade,
  };
}

function isConflict(error: RpcError): boolean {
  return error.code === "40001" || /inference (state )?conflict|stale expected state/i.test(
    error.message ?? "",
  );
}

/** Invoke the single Postgres RPC and normalize duplicate/conflict outcomes. */
export async function applyInferenceRpc(
  client: RpcClient,
  payload: AtomicInferencePayload,
): Promise<AtomicRpcResult> {
  const { data, error } = await client.rpc("record_unidream_inference", {
    p_payload: payload,
  });
  if (error) {
    const detail = [error.message, error.details, error.hint].filter(Boolean).join("; ");
    if (isConflict(error)) throw new InferenceRpcConflictError(detail || "inference state conflict", error.code ?? null);
    throw new Error(`record_unidream_inference failed: ${detail || "unknown RPC error"}`);
  }
  if (!data || typeof data !== "object") {
    throw new Error("record_unidream_inference returned an invalid result");
  }
  const result = data as Partial<AtomicRpcResult>;
  if (result.ok !== true || (result.status !== "applied" && result.status !== "already_processed")) {
    throw new Error("record_unidream_inference returned an invalid status");
  }
  return {
    ok: true,
    status: result.status,
    traded: result.traded === true,
  };
}
