import assert from "node:assert/strict";
import { createHandler, RUN_ID } from "./handler.ts";

const event = Date.parse("2026-09-06T00:15:00Z");
const config = { projectUrl: "https://db.invalid", projectKey: "private-test-key", spaceUrl: "https://hf.invalid", apiKey: "hf-test-key" };
const sha = "a".repeat(64);
const run = { run_id: RUN_ID, bundle_id: RUN_ID, bundle_sha256: sha, feature_contract_sha256: "b".repeat(64), execution_contract_sha256: "c".repeat(64) };
const request = (key = config.projectKey, method = "POST") => new Request("https://edge.invalid", { method, headers: { authorization: `Bearer ${key}` } });
function setup(options: { state?: any; run?: any; health?: any; transition?: any; rpc?: any; now?: number; fail?: string } = {}) {
  const calls: { url: string; init?: RequestInit }[] = [];
  const collected: any[] = [];
  const now = options.now ?? event + 10_000;
  const eventTs = new Date(Math.floor(now / 900000) * 900000).toISOString();
  const fetcher: typeof fetch = async (input, init) => {
    const url = String(input); calls.push({ url, init });
    if (options.fail && url.includes(options.fail)) return Response.json({ secret: "never-echo" }, { status: 500 });
    if (url.includes("btc_demo_runs")) return Response.json([options.run ?? run]);
    if (url.includes("btc_demo_state")) return Response.json(options.state ? [{ state: options.state, version: options.state.version }] : []);
    if (url.endsWith("/health")) return Response.json(options.health ?? { ...run, ok: true });
    if (url.endsWith("/predict")) return Response.json(options.transition ?? { ...run, ok: true, event_ts: eventTs, expected_state_version: options.state?.version ?? 0, state: {}, snapshots: [], events: [], forecast: null, data: { timely: true } });
    if (url.includes("record_btc_demo_transition")) return Response.json(options.rpc ?? { status: "applied", version: (options.state?.version ?? 0) + 1, snapshots: 0, events: 0 });
    throw new Error(`unexpected test URL ${url}`);
  };
  const collect: any = async (...args: any[]) => {
    collected.push(args.slice(0, 3));
    return { spot: [], um: [], current_open: { timestamp: eventTs, open: 100, received_at: new Date(now).toISOString() }, received_at: new Date(now).toISOString() };
  };
  return { calls, collected, handler: createHandler(config, { fetcher, collect, now: () => now }) };
}

Deno.test("authentication and method fail before market/DB reads", async () => {
  const x = setup();
  assert.equal((await x.handler(request("bad"))).status, 401);
  assert.equal((await x.handler(request(config.projectKey, "GET"))).status, 405);
  assert.equal(x.calls.length, 0); assert.equal(x.collected.length, 0);
});
Deno.test("initial transition uses server clock and one closed bar", async () => {
  const x = setup();
  const req = new Request("https://edge.invalid", { method: "POST", headers: { authorization: `Bearer ${config.projectKey}` }, body: JSON.stringify({ event_ts: "2020-01-01", state: { equity: 99 } }) });
  const response = await x.handler(req), body = await response.json();
  assert.equal(response.status, 200); assert.equal(body.version, 1);
  assert.deepEqual(x.collected, [[event, event - 900000, false]]);
  const prediction = x.calls.find(c => c.url.endsWith("/predict"))!;
  const payload = JSON.parse(String(prediction.init?.body));
  assert.equal(payload.event_ts, new Date(event).toISOString()); assert.equal(payload.state, null);
  assert.equal((prediction.init?.headers as any)["x-api-key"], config.apiKey);
  assert.equal(x.calls.filter(c => c.url.includes("record_btc")).length, 1);
});
Deno.test("six-hour decision requests exact 8641 closed bars", async () => {
  const start = event - 900000, x = setup({ now: start + 3000 });
  assert.equal((await x.handler(request())).status, 200);
  assert.deepEqual(x.collected, [[start, start - 8641 * 900000, true]]);
});
Deno.test("existing account covers all missed closed bars", async () => {
  const state = { ...run, version: 4, last_open_ts: new Date(event - 3 * 900000).toISOString() };
  const x = setup({ state }); assert.equal((await x.handler(request())).status, 200);
  assert.deepEqual(x.collected, [[event, event - 3 * 900000, false]]);
});
Deno.test("duplicate event skips health, collection, prediction and writes", async () => {
  const x = setup({ state: { ...run, version: 4, last_open_ts: new Date(event).toISOString() } });
  assert.equal((await (await x.handler(request())).json()).status, "already_processed");
  assert.equal(x.calls.length, 2); assert.equal(x.collected.length, 0);
});
Deno.test("HF model digest mismatch fails before data collection", async () => {
  const x = setup({ health: { ...run, ok: true, bundle_sha256: "d".repeat(64) } });
  assert.equal((await x.handler(request())).status, 502); assert.equal(x.collected.length, 0);
  assert.ok(!x.calls.some(c => c.url.includes("record_btc")));
});
Deno.test("HF transition mismatches never reach persistence", async () => {
  for (const changed of [{ bundle_sha256: "d".repeat(64) }, { expected_state_version: 7 }, { event_ts: new Date(event - 900000).toISOString() }]) {
    const x = setup({ transition: { ...run, ok: true, event_ts: new Date(event).toISOString(), expected_state_version: 0, ...changed } });
    assert.equal((await x.handler(request())).status, 502);
    assert.ok(!x.calls.some(c => c.url.includes("record_btc")));
  }
});
Deno.test("failed HF response cannot mutate DB or echo secrets", async () => {
  const x = setup({ fail: "/predict" }), response = await x.handler(request());
  assert.equal(response.status, 502);
  assert.ok(!(await response.text()).includes("never-echo"));
  assert.ok(!x.calls.some(c => c.url.includes("record_btc")));
});
Deno.test("concurrent duplicate returned by RPC remains idempotent", async () => {
  const x = setup({ rpc: { status: "already_processed", version: 1 } });
  const body = await (await x.handler(request())).json();
  assert.equal(body.status, "already_processed"); assert.equal(body.events, 0);
});
