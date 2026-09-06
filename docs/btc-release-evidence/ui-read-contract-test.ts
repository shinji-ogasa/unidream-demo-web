import assert from "node:assert/strict";
import { loadBtcDashboard } from "../../src/lib/server/btcDashboardRepository";
import {
  BTC_RUN_ID,
  BTC_BUNDLE_ID,
  BTC_CANDIDATE_ID,
  displayNav,
} from "../../src/lib/btc-release";
import { loadBtcReleaseEvidence } from "../../src/lib/server/btcReleaseEvidence";

async function main() {
  const h = "a".repeat(64),
    id = BTC_RUN_ID;
  const run = {
    run_id: id,
    bundle_id: BTC_BUNDLE_ID,
    bundle_sha256: h,
    feature_contract_sha256: h,
    execution_contract_sha256: h,
    manifest: { model_family: BTC_CANDIDATE_ID },
  };
  const state = {
    schema_version: 2,
    run_id: id,
    bundle_id: BTC_BUNDLE_ID,
    bundle_sha256: h,
    version: 1,
    initial_equity: 1,
    equity: 1.1,
    benchmark_equity: 1.05,
    current_open_equity: null,
    current_open_exposure: null,
    bridge_state: {schema: "wm-rl-live-bridge-v1",bundle_id:BTC_BUNDLE_ID,manifest_sha256:h,account:{account:{last_exposure:1.09,insolvent:false}}},
    last_open_ts: "2026-09-06T06:00:00Z",
    last_mark_ts: "2026-09-06T05:45:00Z",
  };
  const stateRow = {
    run_id: id,
    version: 1,
    last_open_ts: state.last_open_ts,
    state,
  };
  const snap = {
    run_id: id,
    bundle_sha256: h,
    timestamp: state.last_mark_ts,
    equity: 1.1,
    benchmark_equity: 1.05,
    price: 50000,
  };
  const forecast = {
    run_id: id,
    bundle_sha256: h,
    feature_contract_sha256: h,
    execution_contract_sha256: h,
    forecast_kind: "wm_rl_actor",
    mu: null, variance: null,
    decision_ts: state.last_open_ts,
  };
  const event = {
    run_id: id,
    bundle_sha256: h,
    event_id: "one",
    timestamp: state.last_open_ts,
    kind: "intent",
    details: {},
  };
  process.env.NEXT_PUBLIC_SUPABASE_URL =
    "https://synthetic-project.supabase.co";
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "public-test-key";
  let mode = "ready";
  let calls = 0;
  globalThis.fetch = async (input: RequestInfo | URL) => {
    const url = new URL(
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.href
          : input.url,
    );
    assert.equal(url.searchParams.get("run_id"), "eq." + id);
    calls++;
    const table = url.pathname.split("/").at(-1);
    const v =
      table === "btc_demo_runs"
        ? mode === "pending"
          ? null
          : run
        : table === "btc_demo_state"
          ? {
              ...stateRow,
              state:
                mode === "mismatch"
                  ? { ...state, bundle_sha256: "b".repeat(64) }
                  : mode === "missing_open"
                    ? {
                        ...state,
                        current_open_equity: null,
                        current_open_exposure: null,
                      }
                    : mode === "partial_missing_open"
                      ? { ...state, current_open_equity: null, current_open_exposure:1.09 }
                      : state,
            }
          : table === "btc_demo_forecasts"
            ? [
                {
                  ...forecast,
                  decision_ts:
                    mode === "future"
                      ? "2026-09-06T12:00:00Z"
                      : forecast.decision_ts,
                },
              ]
            : table === "btc_demo_events"
              ? [event]
              : table === "btc_demo_snapshots"
                ? [snap]
                : null;
    if (table === "btc_demo_snapshots")
      assert.equal(
        url.searchParams.get("timestamp"),
        "lte." + state.last_mark_ts,
      );
    return new Response(JSON.stringify(v), {
      status: mode === "offline" ? 503 : 200,
      headers: { "Content-Type": "application/json" },
    });
  };
  let result = await loadBtcDashboard();
  assert.equal(result.readStatus, "ready");
  assert.equal(result.snapshots.length, 1);
  assert.equal(result.state?.state.equity, 1.1);
  assert.equal(result.forecast?.decision_ts, state.last_open_ts);
  assert.equal(calls, 5);
  mode = "missing_open";
  result = await loadBtcDashboard();
  assert.equal(result.readStatus, "ready");
  assert.equal(result.snapshots.length, 1);
  assert.equal(result.state?.state.current_open_equity, null);
  assert.equal(result.state?.state.equity, 1.1);
  mode = "partial_missing_open";
  result = await loadBtcDashboard();
  assert.equal(result.readStatus, "contract_mismatch");
  mode = "mismatch";
  result = await loadBtcDashboard();
  assert.equal(result.readStatus, "contract_mismatch");
  assert.equal(result.state, null);
  assert.equal(result.snapshots.length, 0);
  mode = "future";
  result = await loadBtcDashboard();
  assert.equal(result.readStatus, "ready");
  assert.equal(result.forecast, null);
  mode = "pending";
  result = await loadBtcDashboard();
  assert.equal(result.readStatus, "pending");
  assert.equal(result.run, null);
  assert.equal(result.snapshots.length, 0);
  mode = "offline";
  result = await loadBtcDashboard();
  assert.equal(result.readStatus, "unavailable");
  assert.equal(result.state, null);
  delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  result = await loadBtcDashboard();
  assert.equal(result.readStatus, "unavailable");
  assert.equal(displayNav(1.1), 11000);
  assert.equal(displayNav(null), null);
  assert.equal(displayNav(NaN), null);
  const evidence = loadBtcReleaseEvidence();
  assert.ok(evidence);
  assert.equal(evidence.learned_rl, true);
  assert.equal(evidence.candidate_id, BTC_CANDIDATE_ID);
  assert.equal(evidence.research_scores_apply_to_production_weights, false);
  console.log(
    JSON.stringify({
      passed: true,
      scenarios: [
        "ready",
        "missing_open_keeps_closed_history",
        "partially_null_open_rejected",
        "wrong_bundle_clears_values",
        "future_forecast_excluded",
        "unregistered_run_empty",
        "read_failure_empty",
        "unconfigured_empty",
        "normalized_money",
        "separate_static_evidence",
      ],
      all_queries_run_filtered: true,
      snapshot_state_cutoff_checked: true,
      real_network: false,
    }),
  );
}
main().catch((error) => {
  console.error(error);
  process.exit(1);
});
