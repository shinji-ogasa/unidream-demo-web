import assert from "node:assert/strict";
import {
  assertNsStrings,
  BUNDLE_ID,
  createHandler,
  MODEL_FAMILY,
  RUN_ID,
} from "./handler.ts";
import { BAR_MS, HISTORY_BARS } from "./collector.ts";
const event = Date.parse("2026-09-06T00:15:00Z");
const cfg = {
  projectUrl: "https://db.invalid",
  projectKey: "test-private-key",
  spaceUrl: "https://hf.invalid",
  apiKey: "test-hf-key",
};
const run = {
  run_id: RUN_ID,
  bundle_id: BUNDLE_ID,
  bundle_sha256: "a".repeat(64),
  feature_contract_sha256: "b".repeat(64),
  execution_contract_sha256: "c".repeat(64),
  manifest: { model_family: MODEL_FAMILY },
};
const req = (key = cfg.projectKey, method = "POST") =>
  new Request("https://edge.invalid", {
    method,
    headers: { authorization: `Bearer ${key}` },
  });
function setup(o: any = {}) {
  let time = event + 5000;
  const calls: { url: string; init?: RequestInit }[] = [],
    collected: any[] = [];
  const s = {
    ...run,
    schema_version: 2,
    version: (o.state?.version ?? 0) + 1,
    last_open_ts: new Date(event).toISOString(),
    bridge_state: {
      account: {
        account: { initial_timestamp_ns: String(BigInt(event) * 1000000n) },
      },
      policy: { last_timestamp_ns: String(BigInt(event) * 1000000n) },
    },
  };
  const transition = {
    ...run,
    model_family: MODEL_FAMILY,
    ok: true,
    event_ts: new Date(event).toISOString(),
    expected_state_version: o.state?.version ?? 0,
    state: s,
    snapshots: [],
    events: [],
    forecast: { available: true, action_eligible: true },
    data: { timely: true },
    ...o.transition,
  };
  const fetcher: typeof fetch = async (input, init) => {
    const url = String(input);
    calls.push({ url, init });
    if (o.fail && url.includes(o.fail)) {
      if (o.failKind === "transport") {
        const error = new Error("sensitive transport body " + cfg.apiKey);
        error.name = "sensitive transport name " + cfg.projectKey;
        throw error;
      }
      if (o.failKind === "invalid_json") {
        return new Response("not JSON; never echo " + cfg.apiKey, {
          status: 200,
        });
      }
      return Response.json({ secret: "never echo " + cfg.apiKey }, {
        status: o.failStatus ?? 500,
      });
    }
    if (url.includes("btc_demo_runs")) {
      return Response.json(o.noRun ? [] : [o.run ?? run]);
    }
    if (url.includes("btc_demo_state")) {
      return Response.json(
        o.state ? [{ state: o.state, version: o.state.version }] : [],
      );
    }
    if (url.endsWith("/health")) {
      return Response.json(
        o.health ?? { ...run, ok: true, model_family: MODEL_FAMILY },
      );
    }
    if (url.endsWith("/predict")) {
      if (o.latePredict) time = event + BAR_MS;
      return Response.json(transition);
    }
    if (url.includes("record_wm_demo_transition")) {
      return Response.json(o.rpc ?? { status: "applied", version: s.version });
    }
    throw Error("unexpected URL");
  };
  const collect: any = async (...args: any[]) => {
    collected.push(args);
    if (o.lateCollect) time = event + BAR_MS;
    return {
      spot: [],
      um: [],
      received_at: new Date(time).toISOString(),
      current_open: {
        timestamp: new Date(event).toISOString(),
        open: 100,
        received_at: new Date(time).toISOString(),
      },
    };
  };
  return {
    calls,
    collected,
    transition,
    handler: createHandler(cfg, { fetcher, collect, now: () => time }),
  };
}
Deno.test("WM auth/method rejects before every DB and data access", async () => {
  const x = setup();
  assert.equal((await x.handler(req("bad"))).status, 401);
  assert.equal((await x.handler(req(cfg.projectKey, "GET"))).status, 405);
  assert.equal(x.calls.length, 0);
});
Deno.test("every15m event requests full WM collection and fixed distinct run/bundle IDs", async () => {
  const x = setup();
  const response = await x.handler(
    new Request("https://edge.invalid", {
      method: "POST",
      headers: { authorization: `Bearer ${cfg.projectKey}` },
      body: JSON.stringify({ event_ts: "2000-01-01", state: { version: 999 } }),
    }),
  );
  assert.equal(response.status, 200);
  assert.equal(x.collected[0][0], event);
  assert.equal(x.collected[0].length, 3);
  assert.equal(HISTORY_BARS, 8704);
  const c = x.calls.find((c) => c.url.endsWith("/v4/btc/predict"))!;
  const p = JSON.parse(String(c.init?.body));
  assert.equal(p.run_id, RUN_ID);
  assert.equal(p.bundle_id, BUNDLE_ID);
  assert.equal(p.state, null);
  assert.equal(p.event_ts, new Date(event).toISOString());
  assert.equal(x.calls.filter((c) => c.url.includes("record_wm")).length, 1);
});
Deno.test("missing registry and wrong family/hash fail before collection", async () => {
  for (
    const o of [
      { noRun: true },
      { run: { ...run, manifest: { model_family: "ml" } } },
      { run: { ...run, bundle_sha256: null } },
      {
        health: {
          ...run,
          ok: true,
          model_family: MODEL_FAMILY,
          bundle_sha256: "d".repeat(64),
        },
      },
    ]
  ) {
    const x = setup(o);
    assert.equal((await x.handler(req())).status, 502);
    assert.equal(x.collected.length, 0);
  }
});
Deno.test("duplicate timestamp bypasses health data and inference", async () => {
  const x = setup({
    state: {
      ...run,
      schema_version: 2,
      version: 4,
      last_open_ts: new Date(event).toISOString(),
    },
  });
  assert.equal(
    (await (await x.handler(req())).json()).status,
    "already_processed",
  );
  assert.equal(x.calls.length, 2);
});
Deno.test("missed intervals retain stored state but never request historical predictions", async () => {
  const state = {
    ...run,
    schema_version: 2,
    version: 4,
    last_open_ts: new Date(event - 3 * BAR_MS).toISOString(),
    bridge_state: {
      policy: {
        last_timestamp_ns: String(BigInt(event - 3 * BAR_MS) * 1000000n),
      },
    },
  };
  const x = setup({ state });
  assert.equal((await x.handler(req())).status, 200);
  const payload = JSON.parse(
    String(x.calls.find((c) => c.url.endsWith("/predict"))?.init?.body),
  );
  assert.deepEqual(payload.state, state);
  assert.equal(payload.event_ts, new Date(event).toISOString());
  assert.equal(x.collected.length, 1);
});
Deno.test("outage beyond8704-bar recovery bound fails before collection", async () => {
  const x = setup({
    state: {
      ...run,
      schema_version: 2,
      version: 4,
      last_open_ts: new Date(event - (HISTORY_BARS + 1) * BAR_MS).toISOString(),
      bridge_state: {
        policy: {
          last_timestamp_ns: String(
            BigInt(event - (HISTORY_BARS + 1) * BAR_MS) * 1000000n,
          ),
        },
      },
    },
  });
  assert.equal((await x.handler(req())).status, 502);
  assert.equal(x.collected.length, 0);
});
Deno.test("prediction envelope and transport corruption cannot reach RPC", async () => {
  for (
    const mod of [
      { model_family: "ml" },
      { bundle_id: RUN_ID },
      { bundle_sha256: "d".repeat(64) },
      { expected_state_version: 7 },
      { event_ts: new Date(event - BAR_MS).toISOString() },
      { state: { schema_version: 1 } },
    ]
  ) {
    const x = setup({ transition: mod });
    assert.equal((await x.handler(req())).status, 502);
    assert.ok(!x.calls.some((c) => c.url.includes("record_wm")));
  }
  const x = setup();
  x.transition.state.bridge_state.policy.last_timestamp_ns = Number(
    BigInt(event) * 1000000n,
  ) as any;
  assert.equal((await x.handler(req())).status, 502);
  assert.ok(!x.calls.some((c) => c.url.includes("record_wm")));
});
Deno.test("collection/prediction exactly at next-open deadline cannot persist", async () => {
  for (const o of [{ lateCollect: true }, { latePredict: true }]) {
    const x = setup(o);
    assert.equal((await x.handler(req())).status, 502);
    assert.ok(!x.calls.some((c) => c.url.includes("record_wm")));
  }
});
Deno.test("RPC duplicate is safe and remote errors do not expose bodies", async () => {
  let x = setup({ rpc: { status: "already_processed", version: 1 } });
  assert.equal(
    (await (await x.handler(req())).json()).status,
    "already_processed",
  );
  x = setup({ fail: "/predict" });
  const response = await x.handler(req());
  assert.equal(response.status, 502);
  assert.ok(!(await response.text()).includes("never echo"));
  assert.ok(!x.calls.some((c) => c.url.includes("record_wm")));
});
Deno.test("ns transport is lossless across JSON; raw integers and noncanonical strings reject", () => {
  const value = {
    account: {
      initial_timestamp_ns: "1788732900000000000",
      last_bar_timestamp_ns: null,
    },
    policy: { last_timestamp_ns: "1788732900000000000", step_count: 99 },
  };
  assertNsStrings(JSON.parse(JSON.stringify(value)));
  for (
    const bad of [1788732900000000000, "01788732900000000000", "1.78e18", "-1"]
  ) {
    assert.throws(() =>
      assertNsStrings({ policy: { last_timestamp_ns: bad } })
    );
  }
});

Deno.test("WM upstream telemetry exposes only fixed labels status and categories", async () => {
  const logged: string[] = [];
  const original = console.error;
  console.error = (...items: unknown[]) => logged.push(items.join(" "));
  try {
    for (
      const [failKind, failStatus, expectedKind, expectedStatus] of [
        ["http_status", 422, "http_status", 422],
        ["transport", undefined, "transport", null],
        ["invalid_json", undefined, "invalid_json", 200],
      ] as const
    ) {
      const x = setup({ fail: "/predict", failKind, failStatus });
      const response = await x.handler(req());
      assert.equal(response.status, 502);
      const body = await response.json();
      assert.equal(body.stage, "compute canonical HF transition");
      assert.equal(body.request_label, "HF predict");
      assert.equal(body.http_status, expectedStatus);
      assert.equal(body.failure_kind, expectedKind);
      assert.ok(!x.calls.some((call) => call.url.includes("record_wm")));
      const log = JSON.parse(logged.at(-1)!);
      assert.deepEqual(log, {
        scope: "wm_research_demo",
        stage: "compute canonical HF transition",
        reason: "upstream_request",
        request_label: "HF predict",
        http_status: expectedStatus,
        failure_kind: expectedKind,
      });
      const encoded = JSON.stringify(body) + logged.join(" ");
      for (
        const secret of [
          cfg.apiKey,
          cfg.projectKey,
          "never echo",
          "sensitive",
          cfg.spaceUrl,
        ]
      ) {
        assert.ok(!encoded.includes(secret));
      }
    }
  } finally {
    console.error = original;
  }
});
