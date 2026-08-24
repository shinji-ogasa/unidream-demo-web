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
import { callPredict, fetchModelVersion } from "./inference.ts";
import { applyFill, clampTargetPosition } from "../_shared/paper_trading.ts";

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
    const rawTarget = typeof prediction?.position === "number" ? prediction.position : 0;
    const targetPosition = clampTargetPosition(rawTarget);
    const { next, trade } = applyFill(previous, targetPosition, latest.close);

    const predictionRow = {
      symbol: SYMBOL,
      timeframe: TIMEFRAME,
      signal: typeof prediction?.signal === "string" ? prediction.signal : "unknown",
      position: typeof prediction?.position === "number" ? prediction.position : null,
      score: typeof prediction?.score === "number" ? prediction.score : null,
      confidence: typeof prediction?.confidence === "number" ? prediction.confidence : null,
      latest_close: latest.close,
      latest_timestamp: latest.timestamp,
      model_version: typeof prediction?.model_version === "string"
        ? prediction.model_version
        : modelVersion,
      feature_version: typeof prediction?.feature_version === "string"
        ? prediction.feature_version
        : null,
      raw: prediction,
    };
    const snapshotRow = {
      run_id: RUN_ID,
      symbol: SYMBOL,
      timeframe: TIMEFRAME,
      timestamp: latest.timestamp,
      equity: next.equity,
      cash: next.cash,
      asset_qty: next.asset_qty,
      position: next.current_position,
      price: latest.close,
    };
    const stateRow = {
      id: RUN_ID,
      symbol: SYMBOL,
      timeframe: TIMEFRAME,
      current_position: next.current_position,
      cash: next.cash,
      asset_qty: next.asset_qty,
      equity: next.equity,
      last_price: latest.close,
      last_timestamp: latest.timestamp,
      updated_at: new Date().toISOString(),
    };

    const predictionInsert = await supabase.from("predictions").insert(predictionRow);
    if (predictionInsert.error) {
      throw new Error(`predictions insert failed: ${predictionInsert.error.message}`);
    }
    const stateUpsert = await supabase.from("strategy_state").upsert(stateRow);
    if (stateUpsert.error) {
      throw new Error(`strategy_state upsert failed: ${stateUpsert.error.message}`);
    }
    const snapshotUpsert = await supabase
      .from("equity_snapshots")
      .upsert(snapshotRow, { onConflict: "run_id,timestamp" });
    if (snapshotUpsert.error) {
      throw new Error(`equity_snapshots upsert failed: ${snapshotUpsert.error.message}`);
    }
    if (trade) {
      const tradeInsert = await supabase.from("trades").insert({
        run_id: RUN_ID,
        symbol: SYMBOL,
        timeframe: TIMEFRAME,
        timestamp: latest.timestamp,
        ...trade,
      });
      if (tradeInsert.error) throw new Error(`trades insert failed: ${tradeInsert.error.message}`);
    }

    return Response.json({
      ok: true,
      candles: candles.length,
      prediction: {
        signal: predictionRow.signal,
        raw_position: predictionRow.position,
        target_position: targetPosition,
        latest_close: latest.close,
        latest_timestamp: latest.timestamp,
        model_version: predictionRow.model_version,
      },
      state: {
        equity: next.equity,
        cash: next.cash,
        asset_qty: next.asset_qty,
        position: next.current_position,
      },
      traded: trade !== null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ ok: false, error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
