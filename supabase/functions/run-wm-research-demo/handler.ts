import { collectMarketData, HISTORY_BARS } from "./collector.ts";

export const RUN_ID = "btc-wm31-ac-20260906-paper-v1";
export const BUNDLE_ID = "btc-wm31-ac-20260906";
export const MODEL_FAMILY = "wm_market31_ac";
const BAR_MS = 900_000;
type Json = Record<string, any>;
type RequestLabel =
  | "read btc_demo_runs"
  | "read btc_demo_state"
  | "HF health"
  | "HF predict"
  | "BTC transaction";
type Stage =
  | "read registered run and state"
  | "verify HF model contract"
  | "collect completed market bars and current open"
  | "compute canonical HF transition"
  | "persist atomic transition";

class SafeRequestFailure extends Error {
  constructor(
    readonly request_label: RequestLabel,
    readonly http_status: number | null,
    readonly failure_kind: "http_status" | "transport" | "invalid_json",
  ) {
    super("Upstream request failed");
    this.name = "SafeRequestFailure";
  }
}
type Config = {
  projectUrl: string;
  projectKey: string;
  spaceUrl: string;
  apiKey: string;
};
type Dependencies = {
  fetcher?: typeof fetch;
  now?: () => number;
  collect?: typeof collectMarketData;
};

async function authorized(request: Request, key: string): Promise<boolean> {
  const supplied = request.headers.get("authorization") ?? "";
  if (!key || supplied.length > 4096) return false;
  const encode = new TextEncoder();
  const [a, b] = await Promise.all(
    [supplied, `Bearer ${key}`].map(async (value) =>
      new Uint8Array(
        await crypto.subtle.digest("SHA-256", encode.encode(value)),
      )
    ),
  );
  let different = 0;
  for (let i = 0; i < a.length; i++) different |= a[i] ^ b[i];
  return different === 0;
}

// All nanosecond clocks cross JSON as decimal strings, never JS numbers.
export function assertNsStrings(value: unknown): void {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("missing WM bridge state");
  }
  const visit = (node: unknown): void => {
    if (!node || typeof node !== "object") return;
    for (const [key, item] of Object.entries(node)) {
      if (
        key.endsWith("_ns") && item !== null &&
        (typeof item !== "string" || !/^(0|[1-9][0-9]*)$/.test(item))
      ) throw new Error("WM ns clock must be a canonical decimal string");
      if (item && typeof item === "object") visit(item);
    }
  };
  visit(value);
}

export function createHandler(config: Config, dependencies: Dependencies = {}) {
  const fetcher = dependencies.fetcher ?? fetch;
  const now = dependencies.now ?? Date.now;
  const collect = dependencies.collect ?? collectMarketData;
  const project = config.projectUrl.replace(/\/+$/, "");
  const space = config.spaceUrl.replace(/\/+$/, "");
  const restHeaders = {
    apikey: config.projectKey,
    Authorization: `Bearer ${config.projectKey}`,
  };

  async function json(
    url: string,
    options: RequestInit,
    label: RequestLabel,
  ): Promise<Json | Json[]> {
    let response: Response;
    try {
      response = await fetcher(url, {
        ...options,
        signal: AbortSignal.timeout(45_000),
      });
    } catch {
      throw new SafeRequestFailure(label, null, "transport");
    }
    if (!response.ok) {
      throw new SafeRequestFailure(label, response.status, "http_status");
    }
    try {
      return await response.json();
    } catch {
      throw new SafeRequestFailure(label, response.status, "invalid_json");
    }
  }
  const read = (table: "btc_demo_runs" | "btc_demo_state") =>
    json(
      `${project}/rest/v1/${table}?run_id=eq.${RUN_ID}&select=*`,
      { headers: restHeaders },
      `read ${table}`,
    );

  return async (request: Request): Promise<Response> => {
    if (request.method !== "POST") {
      return Response.json({ ok: false, error: "POST required" }, {
        status: 405,
      });
    }
    if (!await authorized(request, config.projectKey)) {
      return Response.json({ ok: false, error: "unauthorized" }, {
        status: 401,
      });
    }
    if (![project, space, config.apiKey].every(Boolean)) {
      return Response.json(
        { ok: false, error: "missing server configuration" },
        { status: 503 },
      );
    }
    let stage: Stage = "read registered run and state";
    try {
      // Event time comes only from this server, never from caller input.
      const eventMs = Math.floor(now() / BAR_MS) * BAR_MS;
      const eventTs = new Date(eventMs).toISOString();
      const [runs, states] = await Promise.all([
        read("btc_demo_runs"),
        read("btc_demo_state"),
      ]);
      if (
        !Array.isArray(runs) || runs.length !== 1 || !Array.isArray(states) ||
        states.length > 1
      ) throw new Error("registered run/state cardinality mismatch");
      const run = runs[0], previous = states[0]?.state ?? null;
      if (
        run.run_id !== RUN_ID || run.bundle_id !== BUNDLE_ID ||
        run.manifest?.model_family !== MODEL_FAMILY
      ) throw new Error("registered bundle ID mismatch");
      const fields = [
        "bundle_sha256",
        "feature_contract_sha256",
        "execution_contract_sha256",
      ] as const;
      if (fields.some((field) => !/^[a-f0-9]{64}$/.test(run[field] ?? ""))) {
        throw new Error("registered contract digest invalid");
      }
      if (previous) {
        const priorTs = Date.parse(previous.last_open_ts);
        if (
          !Number.isFinite(priorTs) || priorTs % BAR_MS !== 0 ||
          !Number.isSafeInteger(previous.version) || previous.version < 1 ||
          previous.schema_version !== 2 || previous.bundle_id !== BUNDLE_ID ||
          previous.run_id !== RUN_ID ||
          previous.bundle_sha256 !== run.bundle_sha256 ||
          previous.version !== states[0].version
        ) throw new Error("persisted state identity mismatch");
        if (priorTs >= eventMs) {
          return Response.json({
            ok: true,
            status: "already_processed",
            run_id: RUN_ID,
            event_ts: eventTs,
            version: previous.version,
          });
        }
      }
      if (previous) assertNsStrings(previous.bridge_state);
      stage = "verify HF model contract";
      const health = await json(
        `${space}/v4/btc/health`,
        {},
        "HF health",
      ) as Json;
      if (
        health.ok !== true || health.bundle_id !== BUNDLE_ID ||
        health.model_family !== MODEL_FAMILY || fields.some((field) =>
          health[field] !== run[field]
        )
      ) throw new Error("HF deployment contract mismatch");
      stage = "collect completed market bars and current open";
      // Every nominal15m decision needs the full two-market feature prefix.
      if (
        previous &&
        eventMs - Date.parse(previous.last_open_ts) > HISTORY_BARS * BAR_MS
      ) throw new Error("accounting history exceeds bounded recovery window");
      const market = await collect(eventMs, fetcher, now);
      if (now() >= eventMs + BAR_MS) {
        throw new Error("collection passed next-open deadline");
      }
      stage = "compute canonical HF transition";
      const transition = await json(`${space}/v4/btc/predict`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": config.apiKey,
        },
        body: JSON.stringify({
          run_id: RUN_ID,
          bundle_id: BUNDLE_ID,
          event_ts: eventTs,
          ...market,
          state: previous,
        }),
      }, "HF predict") as Json;
      if (
        transition.ok !== true || transition.run_id !== RUN_ID ||
        transition.bundle_id !== BUNDLE_ID ||
        transition.model_family !== MODEL_FAMILY ||
        Date.parse(transition.event_ts) !== eventMs || fields.some((field) =>
          transition[field] !== run[field]
        ) || transition.expected_state_version !== (previous?.version ?? 0)
      ) throw new Error("HF transition contract mismatch");
      if (
        transition.state?.schema_version !== 2 ||
        transition.state?.run_id !== RUN_ID ||
        transition.state?.bundle_id !== BUNDLE_ID ||
        transition.state?.version !== (previous?.version ?? 0) + 1 ||
        Date.parse(transition.state?.last_open_ts) !== eventMs
      ) throw new Error("WM state envelope mismatch");
      assertNsStrings(transition.state.bridge_state);
      if (now() >= eventMs + BAR_MS) {
        throw new Error("prediction passed next-open deadline");
      }
      stage = "persist atomic transition";
      const saved = await json(
        `${project}/rest/v1/rpc/record_wm_demo_transition`,
        {
          method: "POST",
          headers: { ...restHeaders, "Content-Type": "application/json" },
          body: JSON.stringify({ payload: transition }),
        },
        "BTC transaction",
      ) as Json;
      if (!["applied", "already_processed"].includes(saved.status)) {
        throw new Error("unexpected transaction response");
      }
      return Response.json({
        ok: true,
        run_id: RUN_ID,
        bundle_sha256: run.bundle_sha256,
        event_ts: eventTs,
        status: saved.status,
        version: saved.version,
        snapshots: saved.snapshots ?? 0,
        events: saved.events ?? 0,
        forecast_available: transition.forecast?.available ?? null,
        action_eligible: transition.forecast?.action_eligible ?? null,
        timely: transition.data?.timely ?? false,
      });
    } catch (error) {
      // Only fixed labels, numeric HTTP status and fixed failure categories.
      // Never inspect remote bodies, URLs, headers, error messages or names.
      const upstream = error instanceof SafeRequestFailure
        ? {
          request_label: error.request_label,
          http_status: error.http_status,
          failure_kind: error.failure_kind,
        }
        : null;
      console.error(
        JSON.stringify({
          scope: "wm_research_demo",
          stage,
          reason: upstream ? "upstream_request" : "contract_or_collection",
          ...(upstream ?? {}),
        }),
      );
      return Response.json({
        ok: false,
        stage,
        ...(upstream ?? {}),
        error:
          "WM research transition failed; state was not partially committed",
      }, { status: 502 });
    }
  };
}
