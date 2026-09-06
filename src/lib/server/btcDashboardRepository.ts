import { createClient } from "@supabase/supabase-js";
import {
  BTC_RUN_ID,
  BTC_BUNDLE_ID,
  BTC_CANDIDATE_ID,
  isBoundToRun,
  type BtcDashboardData,
  type BtcRun,
  type BtcStateRow,
  type BtcSnapshot,
  type BtcForecast,
  type BtcEvent,
} from "@/lib/btc-release";

const PAGE_SIZE = 1000;
const SNAPSHOT_LIMIT = 10_000;
const EVENT_LIMIT = 1_000;

export async function loadBtcDashboard(): Promise<BtcDashboardData> {
  const empty: BtcDashboardData = {
    run: null,
    state: null,
    snapshots: [],
    forecast: null,
    events: [],
    readStatus: "pending",
    checkedAt: new Date().toISOString(),
  };
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return { ...empty, readStatus: "unavailable" };
  const db = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) =>
        fetch(input, {
          ...init,
          cache: "no-store",
          signal: AbortSignal.timeout(10_000),
        }),
    },
  });
  try {
    const [runRes, stateRes, forecastRes, eventRes] = await Promise.all([
      db
        .from("btc_demo_runs")
        .select("*")
        .eq("run_id", BTC_RUN_ID)
        .maybeSingle(),
      db
        .from("btc_demo_state")
        .select("*")
        .eq("run_id", BTC_RUN_ID)
        .maybeSingle(),
      db
        .from("btc_demo_forecasts")
        .select("*")
        .eq("run_id", BTC_RUN_ID)
        .order("decision_ts", { ascending: false })
        .limit(1),
      db
        .from("btc_demo_events")
        .select("*")
        .eq("run_id", BTC_RUN_ID)
        .order("timestamp", { ascending: false })
        .limit(EVENT_LIMIT),
    ]);
    if ([runRes, stateRes, forecastRes, eventRes].some((r) => r.error))
      return { ...empty, readStatus: "unavailable" };
    const run = runRes.data as BtcRun | null;
    if (!run) return empty;
    if (
      run.run_id !== BTC_RUN_ID ||
      run.bundle_id !== BTC_BUNDLE_ID ||
      run.manifest?.model_family !== BTC_CANDIDATE_ID ||
      !/^[a-f0-9]{64}$/.test(run.bundle_sha256)
    ) {
      return { ...empty, readStatus: "contract_mismatch" };
    }
    const state = stateRes.data as BtcStateRow | null;
    if (!state) return { ...empty, run };
    if (
      state.run_id !== BTC_RUN_ID ||
      state.state.schema_version !== 2 ||
      !isBoundToRun(state.state, run) ||
      state.state.bundle_id !== run.bundle_id ||
      state.version !== state.state.version ||
      state.state.initial_equity !== 1 ||
      state.state.bridge_state?.schema !== "wm-rl-live-bridge-v1" ||
      state.state.bridge_state?.bundle_id !== run.bundle_id ||
      state.state.bridge_state?.manifest_sha256 !== run.bundle_sha256 ||
      ![state.state.equity, state.state.benchmark_equity].every(
        Number.isFinite,
      ) ||
      state.state.current_open_equity !== null ||
      state.state.current_open_exposure !== null
    ) {
      return { ...empty, run, readStatus: "contract_mismatch" };
    }
    const snapshots: BtcSnapshot[] = [];
    // State defines the display's as-of time; do not mix rows from a later transition.
    if (state.state.last_mark_ts) {
      for (let from = 0; from < SNAPSHOT_LIMIT; from += PAGE_SIZE) {
        const response = await db
          .from("btc_demo_snapshots")
          .select("*")
          .eq("run_id", BTC_RUN_ID)
          .lte("timestamp", state.state.last_mark_ts)
          .order("timestamp", { ascending: false })
          .range(from, from + PAGE_SIZE - 1);
        if (response.error) return { ...empty, run, readStatus: "unavailable" };
        const page = (response.data ?? []) as BtcSnapshot[];
        snapshots.push(...page);
        if (page.length < PAGE_SIZE) break;
      }
    }
    const forecast = (forecastRes.data?.[0] ?? null) as BtcForecast | null;
    const events = (eventRes.data ?? []) as BtcEvent[];
    if (
      snapshots.some(
        (r) =>
          !isBoundToRun(r, run) ||
          ![r.equity, r.benchmark_equity, r.price].every(Number.isFinite),
      ) ||
      events.some((r) => !isBoundToRun(r, run)) ||
      (forecast &&
        (!isBoundToRun(forecast, run) ||
          forecast.forecast_kind !== "wm_rl_actor" ||
          forecast.mu !== null || forecast.variance !== null ||
          forecast.feature_contract_sha256 !== run.feature_contract_sha256 ||
          forecast.execution_contract_sha256 !== run.execution_contract_sha256))
    ) {
      return { ...empty, run, readStatus: "contract_mismatch" };
    }
    const asOf = new Date(state.last_open_ts).getTime();
    return {
      run,
      state,
      snapshots: snapshots.reverse(),
      forecast:
        forecast && new Date(forecast.decision_ts).getTime() <= asOf
          ? forecast
          : null,
      events: events.filter((r) => new Date(r.timestamp).getTime() <= asOf),
      readStatus: "ready",
      checkedAt: new Date().toISOString(),
    };
  } catch {
    // No public credential or database details are rendered as an error message.
    return { ...empty, readStatus: "unavailable" };
  }
}
