import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  applyInferenceRpc,
  buildAtomicInferencePayload,
  InferenceRpcConflictError,
  type AtomicInferencePayload,
  type RpcClient,
} from "../atomic.ts";
import type { Candle, StrategyState } from "../config.ts";

const previous: StrategyState = {
  id: "unidream_btcusdt_15m_main",
  symbol: "BTCUSDT",
  timeframe: "15m",
  current_position: 0,
  cash: 10_000,
  asset_qty: 0,
  equity: 10_000,
  last_price: null,
  last_timestamp: null,
};

const latest: Candle = {
  timestamp: "2026-08-30T00:15:00.000Z",
  open: 100,
  high: 101,
  low: 99,
  close: 100.5,
  volume: 12,
  funding_rate: 0.001,
  mark_close: 100.6,
};

test("atomic payload carries expected CAS state and one complete next-state calculation", () => {
  const payload = buildAtomicInferencePayload(
    previous,
    latest,
    { signal: "hold", position: 1.0, score: 0.25, confidence: 0.75 },
    "plan011-v31@fold23",
  );

  assert.equal(payload.run_id, previous.id);
  assert.deepEqual(payload.expected_state, {
    last_timestamp: null,
    current_position: 0,
    cash: 10_000,
    asset_qty: 0,
    equity: 10_000,
    last_price: null,
  });
  assert.equal(payload.latest.timestamp, latest.timestamp);
  assert.equal(payload.latest.close, latest.close);
  assert.equal(payload.prediction.position, 1);
  assert.equal(payload.prediction.model_version, "plan011-v31@fold23");
  assert.equal(payload.target_position, 1);
  assert.equal(payload.next_state.current_position, 1);
  assert.equal(payload.next_state.asset_qty, 10_000 / 100.5);
  assert.equal(payload.trade?.from_position, 0);
  assert.equal(payload.trade?.to_position, 1);
});

test("applyInferenceRpc sends exactly one named RPC and accepts an idempotent duplicate", async () => {
  let functionName = "";
  let rpcArgs: { p_payload: AtomicInferencePayload } | null = null;
  const client: RpcClient = {
    async rpc(name, args) {
      functionName = name;
      rpcArgs = args;
      return { data: { ok: true, status: "already_processed", traded: true }, error: null };
    },
  };
  const payload = buildAtomicInferencePayload(previous, latest, { position: 0 }, null);
  const result = await applyInferenceRpc(client, payload);

  assert.equal(functionName, "record_unidream_inference");
  assert.deepEqual(rpcArgs, { p_payload: payload });
  assert.deepEqual(result, { ok: true, status: "already_processed", traded: true });
});

test("applyInferenceRpc exposes stale-state conflicts instead of retrying writes", async () => {
  const client: RpcClient = {
    async rpc() {
      return {
        data: null,
        error: { code: "40001", message: "inference state conflict: stale expected state" },
      };
    },
  };
  const payload = buildAtomicInferencePayload(previous, latest, { position: 0 }, null);

  await assert.rejects(
    () => applyInferenceRpc(client, payload),
    (error: unknown) => error instanceof InferenceRpcConflictError
      && error.code === "40001"
      && /stale expected state/.test(error.message),
  );
});

test("atomic migration statically declares the locked RPC, idempotency keys, and privileges", () => {
  const migrationUrl = new URL("../../../migrations/0003_atomic_inference.sql", import.meta.url);
  const sql = readFileSync(migrationUrl, "utf8");

  assert.match(sql, /create unique index if not exists predictions_run_latest_timestamp_uidx[\s\S]*on public\.predictions \(run_id, latest_timestamp\)/i);
  assert.match(sql, /create unique index if not exists trades_run_timestamp_uidx[\s\S]*on public\.trades \(run_id, timestamp\)/i);
  assert.match(sql, /security definer[\s\S]*set search_path = ''/i);
  assert.match(sql, /from public\.strategy_state[\s\S]*for update/i);
  assert.match(sql, /status', 'already_processed'/i);
  assert.match(sql, /using errcode = '40001'/i);
  assert.match(sql, /lower\(v_latest_close::text\) in \('nan', 'infinity', '-infinity'\)/i);
  assert.match(sql, /lower\(v_latest_timestamp::text\) in \('infinity', '-infinity'\)/i);
  assert.match(sql, /lower\(v_expected_last_price::text\) in \('nan', 'infinity', '-infinity'\)/i);
  assert.match(sql, /lower\(v_score::text\) in \('nan', 'infinity', '-infinity'\)/i);
  assert.match(sql, /lower\(v_trade_fee::text\) in \('nan', 'infinity', '-infinity'\)/i);
  assert.match(sql, /lower\(v_state\.equity::text\) in \('nan', 'infinity', '-infinity'\)/i);
  assert.match(sql, /v_has_trade and not exists \([\s\S]*from public\.trades/i);
  assert.match(sql, /revoke all on function public\.record_unidream_inference\(jsonb\) from public, anon, authenticated/i);
  assert.match(sql, /grant execute on function public\.record_unidream_inference\(jsonb\) to service_role/i);
});
