import { collectMarketData } from "./collector.ts";

export const RUN_ID = "btc-perp-reliability-20260906";
const BAR_MS = 900_000;
type Json = Record<string, any>;
type Config = { projectUrl: string; projectKey: string; spaceUrl: string; apiKey: string };
type Dependencies = {
  fetcher?: typeof fetch;
  now?: () => number;
  collect?: typeof collectMarketData;
};

async function authorized(request: Request, key: string): Promise<boolean> {
  const supplied = request.headers.get("authorization") ?? "";
  if (!key || supplied.length > 4096) return false;
  const encode = new TextEncoder();
  const [a, b] = await Promise.all([supplied, `Bearer ${key}`].map(async value =>
    new Uint8Array(await crypto.subtle.digest("SHA-256", encode.encode(value)))));
  let different = 0;
  for (let i = 0; i < a.length; i++) different |= a[i] ^ b[i];
  return different === 0;
}

export function createHandler(config: Config, dependencies: Dependencies = {}) {
  const fetcher = dependencies.fetcher ?? fetch;
  const now = dependencies.now ?? Date.now;
  const collect = dependencies.collect ?? collectMarketData;
  const project = config.projectUrl.replace(/\/+$/, "");
  const space = config.spaceUrl.replace(/\/+$/, "");
  const restHeaders = { apikey: config.projectKey, Authorization: `Bearer ${config.projectKey}` };

  async function json(url: string, options: RequestInit, label: string): Promise<Json | Json[]> {
    const response = await fetcher(url, { ...options, signal: AbortSignal.timeout(45_000) });
    if (!response.ok) throw new Error(`${label}: HTTP ${response.status}`);
    return await response.json();
  }
  const read = (table: string) => json(
    `${project}/rest/v1/${table}?run_id=eq.${RUN_ID}&select=*`,
    { headers: restHeaders }, `read ${table}`);

  return async (request: Request): Promise<Response> => {
    if (request.method !== "POST") return Response.json({ ok: false, error: "POST required" }, { status: 405 });
    if (!await authorized(request, config.projectKey)) return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
    if (![project, space, config.apiKey].every(Boolean)) return Response.json({ ok: false, error: "missing server configuration" }, { status: 503 });
    let stage = "read registered run and state";
    try {
      // Event time comes only from this server, never from caller input.
      const eventMs = Math.floor(now() / BAR_MS) * BAR_MS;
      const eventTs = new Date(eventMs).toISOString();
      const [runs, states] = await Promise.all([read("btc_demo_runs"), read("btc_demo_state")]);
      if (!Array.isArray(runs) || runs.length !== 1 || !Array.isArray(states) || states.length > 1) throw new Error("registered run/state cardinality mismatch");
      const run = runs[0], previous = states[0]?.state ?? null;
      if (run.bundle_id !== RUN_ID) throw new Error("registered bundle ID mismatch");
      const fields = ["bundle_sha256", "feature_contract_sha256", "execution_contract_sha256"] as const;
      if (fields.some(field => !/^[a-f0-9]{64}$/.test(run[field] ?? ""))) throw new Error("registered contract digest invalid");
      if (previous) {
        const priorTs = Date.parse(previous.last_open_ts);
        if (!Number.isFinite(priorTs) || previous.run_id !== RUN_ID || previous.bundle_sha256 !== run.bundle_sha256 || previous.version !== states[0].version) throw new Error("persisted state identity mismatch");
        if (priorTs >= eventMs) return Response.json({ ok: true, status: "already_processed", run_id: RUN_ID, event_ts: eventTs, version: previous.version });
      }
      stage = "verify HF model contract";
      const health = await json(`${space}/v3/btc/health`, {}, "HF health") as Json;
      if (health.ok !== true || health.bundle_id !== RUN_ID || fields.some(field => health[field] !== run[field])) throw new Error("HF deployment contract mismatch");
      stage = "collect completed market bars and current open";
      const decision = eventMs % (24 * BAR_MS) === 0;
      const startMs = decision ? eventMs - 8641 * BAR_MS : previous ? Date.parse(previous.last_open_ts) : eventMs - BAR_MS;
      // A long outage needs an explicit recovery review, not a silently truncated account.
      if (eventMs - startMs > 8641 * BAR_MS || (previous && eventMs - Date.parse(previous.last_open_ts) > 8641 * BAR_MS)) throw new Error("accounting history exceeds bounded recovery window");
      const market = await collect(eventMs, startMs, decision, fetcher, now);
      stage = "compute canonical HF transition";
      const transition = await json(`${space}/v3/btc/predict`, {
        method: "POST", headers: { "Content-Type": "application/json", "x-api-key": config.apiKey },
        body: JSON.stringify({ run_id: RUN_ID, bundle_id: RUN_ID, event_ts: eventTs, ...market, state: previous }),
      }, "HF predict") as Json;
      if (transition.ok !== true || transition.run_id !== RUN_ID || transition.bundle_id !== RUN_ID || Date.parse(transition.event_ts) !== eventMs || fields.some(field => transition[field] !== run[field]) || transition.expected_state_version !== (previous?.version ?? 0)) throw new Error("HF transition contract mismatch");
      stage = "persist atomic transition";
      const saved = await json(`${project}/rest/v1/rpc/record_btc_demo_transition`, {
        method: "POST", headers: { ...restHeaders, "Content-Type": "application/json" },
        body: JSON.stringify({ payload: transition }),
      }, "BTC transaction") as Json;
      if (!["applied", "already_processed"].includes(saved.status)) throw new Error("unexpected transaction response");
      return Response.json({ ok: true, run_id: RUN_ID, bundle_sha256: run.bundle_sha256,
        event_ts: eventTs, status: saved.status, version: saved.version,
        snapshots: saved.snapshots ?? 0, events: saved.events ?? 0,
        forecast_available: transition.forecast?.available ?? null,
        action_eligible: transition.forecast?.action_eligible ?? null,
        timely: transition.data?.timely ?? false });
    } catch (error) {
      // Do not echo remote response bodies or credentials to callers/logs.
      console.error(JSON.stringify({ scope: "btc_research_demo", stage, reason: error instanceof Error ? error.name : "Error" }));
      return Response.json({ ok: false, stage, error: "BTC research transition failed; state was not partially committed" }, { status: 502 });
    }
  };
}
