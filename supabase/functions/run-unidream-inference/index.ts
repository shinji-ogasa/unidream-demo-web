// Scheduled orchestration for the UniDream paper-trading demo.
//
// External I/O and pure domain logic live in the sibling modules. This file
// coordinates the single 15-minute inference transaction and persists its
// result to Supabase.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

import { fetchCandles } from "./binance.ts";
import {
  INITIAL_CASH,
  MIN_BARS,
  RUN_ID,
  SYMBOL,
  TARGET_BARS,
  TIMEFRAME,
  type StrategyState,
  requireEnv,
} from "./config.ts";
import {
  applyInferenceRpc,
  buildAtomicInferencePayload,
  InferenceRpcConflictError,
} from "./atomic.ts";
import { callPredict, fetchModelVersion } from "./inference.ts";

Deno.serve(async () => {
  try {
    const projectUrl = requireEnv("PROJECT_URL");
    const projectSecretKey = requireEnv("PROJECT_SECRET_KEY");
    const spaceUrl = requireEnv("HF_SPACE_URL");
    const apiKey = requireEnv("HF_INFERENCE_API_KEY");
    const supabase = createClient(projectUrl, projectSecretKey, {
      auth: { persistSession: false },
    });

    const [candles, stateRes] = await Promise.all([
      fetchCandles(TARGET_BARS),
      supabase.from("strategy_state").select("*").eq("id", RUN_ID).maybeSingle(),
    ]);
    if (stateRes.error) throw new Error(`strategy_state read failed: ${stateRes.error.message}`);
    if (candles.length < MIN_BARS) {
      throw new Error(`insufficient candles: got ${candles.length}, need >= ${MIN_BARS}`);
    }

    const latest = candles[candles.length - 1];
    const latestTimestamp = new Date(latest.timestamp).getTime();
    const previous: StrategyState = stateRes.data ?? {
      id: RUN_ID,
      symbol: SYMBOL,
      timeframe: TIMEFRAME,
      current_position: 0,
      cash: INITIAL_CASH,
      asset_qty: 0,
      equity: INITIAL_CASH,
      last_price: null,
      last_timestamp: null,
    };

    if (previous.last_timestamp) {
      const previousTimestamp = new Date(previous.last_timestamp).getTime();
      if (latestTimestamp <= previousTimestamp) {
        return Response.json({
          ok: true,
          skipped: true,
          reason: "already_processed",
          latest_timestamp: latest.timestamp,
          last_timestamp: previous.last_timestamp,
        });
      }
    }

    const [prediction, modelVersion] = await Promise.all([
      callPredict(spaceUrl, apiKey, candles),
      fetchModelVersion(spaceUrl),
    ]);
    const atomicPayload = buildAtomicInferencePayload(previous, latest, prediction, modelVersion);
    const rpcResult = await applyInferenceRpc(supabase, atomicPayload);
    if (rpcResult.status === "already_processed") {
      return Response.json({
        ok: true,
        skipped: true,
        reason: "already_processed",
        candles: candles.length,
        latest_timestamp: latest.timestamp,
      });
    }

    return Response.json({
      ok: true,
      candles: candles.length,
      prediction: {
        signal: atomicPayload.prediction.signal,
        raw_position: atomicPayload.prediction.position,
        target_position: atomicPayload.target_position,
        latest_close: latest.close,
        latest_timestamp: latest.timestamp,
        model_version: atomicPayload.prediction.model_version,
      },
      state: {
        equity: atomicPayload.next_state.equity,
        cash: atomicPayload.next_state.cash,
        asset_qty: atomicPayload.next_state.asset_qty,
        position: atomicPayload.next_state.current_position,
      },
      traded: rpcResult.traded,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ ok: false, error: message }), {
      status: error instanceof InferenceRpcConflictError ? 409 : 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
