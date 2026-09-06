import assert from "node:assert/strict";
import { BAR_MS, collectMarketData, HISTORY_BARS } from "./collector.ts";

const EVENT = Date.parse("2026-09-06T06:00:00Z");
const CLOCK = () => EVENT + 5000;
const row = (
  time: number,
): unknown[] => [
  time,
  "100",
  "110",
  "90",
  "101",
  "3",
  time + BAR_MS - 1,
  "1000",
  5,
  "1",
  "400",
  "unused",
];
const urlOf = (value: RequestInfo | URL) =>
  new URL(value instanceof Request ? value.url : String(value));
const json = (v: unknown, status = 200) =>
  new Response(JSON.stringify(v), {
    status,
    headers: { "Content-Type": "application/json" },
  });
const range = (url: URL) => ({
  from: Number(url.searchParams.get("startTime")),
  until: Number(url.searchParams.get("endTime")) + 1,
});
function normal(url: URL): unknown[] {
  const { from, until } = range(url);
  if (from === EVENT) {
    return [[EVENT, "125", ...Array(10).fill({ unclosed_poison: true })]];
  }
  const out = [];
  for (let t = from; t < until; t += BAR_MS) out.push(row(t));
  return out;
}
function mock(
  fn: (url: URL, init?: RequestInit) => Response | Promise<Response>,
): typeof fetch {
  return ((input: RequestInfo | URL, init?: RequestInit) =>
    Promise.resolve(fn(urlOf(input), init))) as typeof fetch;
}

Deno.test("forecast fetches exactly 8641 elapsed bars in nonoverlapping 1000-slot chunks with max three active per market", async () => {
  const calls: URL[] = [];
  const active = { spot: 0, um: 0 }, maxima = { spot: 0, um: 0 };
  let allFetchesFinished = false, clockCalls = 0;
  const f = mock(async (url, init) => {
    calls.push(url);
    assert.equal(url.searchParams.get("symbol"), "BTCUSDT");
    assert.equal(url.searchParams.get("interval"), "15m");
    assert.ok(init?.signal);
    assert.equal(init?.headers, undefined);
    const market = url.hostname === "fapi.binance.com" ? "um" : "spot";
    active[market]++;
    maxima[market] = Math.max(maxima[market], active[market]);
    await new Promise((resolve) => setTimeout(resolve, 1));
    active[market]--;
    if (range(url).from === EVENT) allFetchesFinished = true;
    return json(normal(url));
  });
  const now = () => {
    if (++clockCalls === 2) assert.ok(allFetchesFinished);
    return EVENT + clockCalls * 1000;
  };
  const got = await collectMarketData(EVENT, EVENT - BAR_MS, true, f, now);
  assert.equal(got.spot.length, HISTORY_BARS);
  assert.equal(got.um.length, HISTORY_BARS);
  assert.equal(calls.length, 19);
  assert.deepEqual(maxima, { spot: 3, um: 3 });
  for (const host of ["api.binance.com", "fapi.binance.com"]) {
    const chunks = calls.filter((u) =>
      u.hostname === host && range(u).from < EVENT
    ).sort((a, b) => range(a).from - range(b).from);
    assert.equal(chunks.length, 9);
    assert.equal(range(chunks[0]).from, EVENT - HISTORY_BARS * BAR_MS);
    for (let i = 0; i < chunks.length; i++) {
      assert.equal(chunks[i].searchParams.get("limit"), "1000");
      const { from, until } = range(chunks[i]);
      assert.ok(until - from <= 1000 * BAR_MS);
      assert.equal(until, i === 8 ? EVENT : range(chunks[i + 1]).from);
    }
  }
  assert.equal(
    got.spot[0].timestamp,
    new Date(EVENT - HISTORY_BARS * BAR_MS).toISOString(),
  );
  assert.equal(
    got.spot.at(-1)?.timestamp,
    new Date(EVENT - BAR_MS).toISOString(),
  );
  assert.deepEqual(got.current_open, {
    timestamp: new Date(EVENT).toISOString(),
    open: 125,
    received_at: new Date(EVENT + 2000).toISOString(),
  });
  assert.equal(got.received_at, got.current_open.received_at);
});

Deno.test("nondecision fetches only required Spot accounting bars, preserves missing grid as nulls, and extracts only current open", async () => {
  const calls: URL[] = [];
  const got = await collectMarketData(
    EVENT,
    EVENT - 3 * BAR_MS,
    false,
    mock((url) => {
      calls.push(url);
      if (range(url).from === EVENT) return json(normal(url));
      return json([row(EVENT - 3 * BAR_MS), row(EVENT - BAR_MS)]);
    }),
    CLOCK,
  );
  assert.equal(calls.length, 2);
  assert.ok(calls.every((u) => u.hostname === "api.binance.com"));
  assert.deepEqual(got.um, []);
  assert.equal(got.spot.length, 3);
  const missing = got.spot[1];
  assert.equal(missing.timestamp, new Date(EVENT - 2 * BAR_MS).toISOString());
  assert.ok(
    Object.entries(missing).filter(([k]) => k !== "timestamp").every(([, v]) =>
      v === null
    ),
  );
  assert.equal(got.spot[2].close, 101);
  assert.equal(got.current_open.open, 125);
  assert.deepEqual(Object.keys(got.current_open).sort(), [
    "open",
    "received_at",
    "timestamp",
  ]);
});

Deno.test("missing current open is explicit null and does not reuse previous close", async () => {
  const got = await collectMarketData(
    EVENT,
    EVENT - BAR_MS,
    false,
    mock((u) => json(range(u).from === EVENT ? [] : normal(u))),
    CLOCK,
  );
  assert.equal(got.current_open.open, null);
  assert.equal(got.spot[0].close, 101);
});

Deno.test("one alternate public Spot host on transport failure, with no UM fallback", async () => {
  const calls: string[] = [];
  const got = await collectMarketData(
    EVENT,
    EVENT - BAR_MS,
    false,
    mock((url) => {
      calls.push(url.hostname);
      if (
        url.hostname === "api.binance.com" && range(url).from < EVENT
      ) throw new TypeError("network unavailable");
      return json(normal(url));
    }),
    CLOCK,
  );
  assert.equal(got.spot.length, 1);
  assert.deepEqual(calls, [
    "api.binance.com",
    "data-api.binance.vision",
    "api.binance.com",
  ]);
  let umCalls = 0;
  await assert.rejects(() =>
    collectMarketData(
      EVENT,
      EVENT - BAR_MS,
      true,
      mock((url) => {
        if (url.hostname === "fapi.binance.com") {
          umCalls++;
          return json({}, 503);
        }
        return json(normal(url));
      }),
      CLOCK,
    )
  );
  assert.ok(umCalls <= 3);
});

Deno.test("rate-limit and semantic failures do not trigger fallback/retry", async () => {
  for (const mode of ["rate", "schema", "json"]) {
    let calls = 0;
    await assert.rejects(() =>
      collectMarketData(
        EVENT,
        EVENT - BAR_MS,
        false,
        mock(() => {
          calls++;
          return mode === "rate"
            ? json({}, 429)
            : mode === "schema"
            ? json({ rows: [] })
            : new Response("not-json");
        }),
        CLOCK,
      )
    );
    assert.equal(calls, 1, mode);
  }
});

Deno.test("closed rows reject duplicates, overlap, future and unclosed timestamps", async () => {
  const bad = [
    [row(EVENT - BAR_MS), row(EVENT - BAR_MS)],
    [row(EVENT - 2 * BAR_MS)],
    [row(EVENT)],
    [[EVENT - BAR_MS + 1, ...row(EVENT - BAR_MS).slice(1)]],
    [Object.assign(row(EVENT - BAR_MS), { 6: EVENT + 100 })],
    [Object.assign(row(EVENT - BAR_MS), { 0: (EVENT - BAR_MS) * 1000 })],
  ];
  for (const values of bad) {
    await assert.rejects(() =>
      collectMarketData(
        EVENT,
        EVENT - BAR_MS,
        false,
        mock(() => json(values)),
        CLOCK,
      )
    );
  }
});

Deno.test("present malformed OHLC, volume/taker, count and coercible poison are rejected without making data gaps", async () => {
  const mutations: [number, unknown][] = [
    [1, 0],
    [2, 99],
    [3, 102],
    [4, 120],
    [5, -1],
    [7, -1],
    [10, 1001],
    [10, -1],
    [8, 1.5],
    [8, -1],
    [1, null],
    [5, true],
    [7, " "],
    [4, "Infinity"],
  ];
  for (const [field, value] of mutations) {
    const bad = row(EVENT - BAR_MS);
    bad[field] = value;
    await assert.rejects(
      () =>
        collectMarketData(
          EVENT,
          EVENT - BAR_MS,
          false,
          mock(() => json([bad])),
          CLOCK,
        ),
      Error,
      `field ${field}, ${String(value)}`,
    );
  }
});

Deno.test("current open rejects wrong timestamp, duplicate/malformed rows and invalid price while ignoring all other fields", async () => {
  for (
    const rows of [
      [[EVENT - BAR_MS, 125]],
      [[EVENT, -1]],
      [[EVENT, null]],
      [[EVENT, ""]],
      [[EVENT, 125], [EVENT, 125]],
      [{}],
    ]
  ) {
    await assert.rejects(() =>
      collectMarketData(
        EVENT,
        EVENT - BAR_MS,
        false,
        mock((url) => json(range(url).from === EVENT ? rows : normal(url))),
        CLOCK,
      )
    );
  }
  const got = await collectMarketData(
    EVENT,
    EVENT - BAR_MS,
    false,
    mock((url) =>
      json(range(url).from === EVENT ? [[EVENT, 125]] : normal(url))
    ),
    CLOCK,
  );
  assert.equal(got.current_open.open, 125);
});

Deno.test("invalid clocks, oversized accounting history and alignment reject before remote fetch", async () => {
  let calls = 0;
  const f = mock((u) => {
    calls++;
    return json(normal(u));
  });
  for (
    const [e, start] of [
      [EVENT + 1, EVENT - BAR_MS],
      [EVENT, EVENT - BAR_MS + 1],
      [EVENT, EVENT + BAR_MS],
      [EVENT, EVENT - (HISTORY_BARS + 1) * BAR_MS],
    ]
  ) {
    await assert.rejects(() => collectMarketData(e, start, false, f, CLOCK));
  }
  await assert.rejects(() =>
    collectMarketData(EVENT, EVENT - BAR_MS, false, f, () => EVENT - 1)
  );
  assert.equal(calls, 0);
  let reads = 0;
  await assert.rejects(() =>
    collectMarketData(
      EVENT,
      EVENT - BAR_MS,
      false,
      f,
      () => EVENT + (++reads === 1 ? 2000 : 1000),
    )
  );
});

Deno.test("empty nondecision history needs only separate current-open query", async () => {
  let calls = 0;
  const got = await collectMarketData(
    EVENT,
    EVENT,
    false,
    mock((u) => {
      calls++;
      return json(normal(u));
    }),
    CLOCK,
  );
  assert.equal(calls, 1);
  assert.deepEqual(got.spot, []);
  assert.deepEqual(got.um, []);
  assert.equal(got.current_open.open, 125);
});

Deno.test("15-second request deadlines bound a hung transport even when injected fetch ignores abort", async () => {
  const original = globalThis.setTimeout;
  const durations: number[] = [], signals: AbortSignal[] = [];
  globalThis.setTimeout = ((
    callback: Parameters<typeof setTimeout>[0],
    delay?: number,
    ...args: unknown[]
  ) => {
    durations.push(delay ?? 0);
    return original(callback, delay === 15_000 ? 1 : delay);
  }) as typeof setTimeout;
  try {
    const hung = ((_input: RequestInfo | URL, init?: RequestInit) => {
      signals.push(init!.signal!);
      return new Promise<Response>(() => {});
    }) as typeof fetch;
    await assert.rejects(() =>
      collectMarketData(EVENT, EVENT - BAR_MS, false, hung, CLOCK)
    );
    assert.deepEqual(durations, [15_000, 15_000]);
    assert.equal(signals.length, 2);
    assert.ok(signals.every((s) => s.aborted));
  } finally {
    globalThis.setTimeout = original;
  }
});
