import assert from "node:assert/strict";
import { BAR_MS, collectMarketData, HISTORY_BARS } from "./collector.ts";
const EVENT = Date.parse("2026-09-06T00:15:00Z"), CLOCK = () => EVENT + 5000;
const row = (
  t: number,
): any[] => [
  t,
  "100",
  "110",
  "90",
  "101",
  "3",
  t + BAR_MS - 1,
  "1000",
  5,
  "1",
  "400",
  "unused",
];
const url = (x: RequestInfo | URL) =>
  new URL(x instanceof Request ? x.url : String(x));
const normal = (u: URL) => {
  const from = Number(u.searchParams.get("startTime")),
    until = Number(u.searchParams.get("endTime")) + 1;
  if (from === EVENT) {
    return [[EVENT, "125", ...Array(10).fill({ future_poison: true })]];
  }
  const rows = [];
  for (let t = from; t < until; t += BAR_MS) rows.push(row(t));
  return rows;
};
const mock = (fn: (u: URL) => any): typeof fetch => async (input) =>
  Response.json(await fn(url(input)));
Deno.test("both markets exact8704 nominal rows at non6h origin and nineteen bounded requests", async () => {
  const calls: URL[] = [];
  const got = await collectMarketData(
    EVENT,
    mock((u) => {
      calls.push(u);
      return normal(u);
    }),
    CLOCK,
  );
  assert.equal(got.spot.length, 8704);
  assert.equal(got.um.length, 8704);
  assert.equal(calls.length, 19);
  for (const bars of [got.spot, got.um]) {
    assert.equal(
      bars[0].timestamp,
      new Date(EVENT - HISTORY_BARS * BAR_MS).toISOString(),
    );
    assert.equal(
      bars.at(-1)!.timestamp,
      new Date(EVENT - BAR_MS).toISOString(),
    );
    assert.equal(
      bars.every((r, i) =>
        Date.parse(r.timestamp) === EVENT - (HISTORY_BARS - i) * BAR_MS
      ),
      true,
    );
  }
  assert.equal(got.current_open.open, 125);
  assert.equal(got.received_at, new Date(CLOCK()).toISOString());
  assert.ok(
    new TextEncoder().encode(JSON.stringify(got)).length < 12 * 1024 * 1024,
  );
  for (const host of ["api.binance.com", "fapi.binance.com"]) {
    const chunks = calls.filter((u) =>
      u.hostname === host && Number(u.searchParams.get("startTime")) < EVENT
    ).sort((a, b) =>
      Number(a.searchParams.get("startTime")) -
      Number(b.searchParams.get("startTime"))
    );
    assert.equal(chunks.length, 9);
    for (let i = 0; i < chunks.length; i++) {
      assert.equal(
        Number(chunks[i].searchParams.get("endTime")) + 1,
        i === 8 ? EVENT : Number(chunks[i + 1].searchParams.get("startTime")),
      );
      assert.equal(chunks[i].searchParams.get("limit"), "1000");
    }
  }
});
Deno.test("missing source rows retain all-null slots in both markets; no interpolation", async () => {
  const missing = EVENT - 22 * BAR_MS;
  const got = await collectMarketData(
    EVENT,
    mock((u) => normal(u).filter((r) => r[0] !== missing)),
    CLOCK,
  );
  for (const bars of [got.spot, got.um]) {
    const x = bars.find((r) => Date.parse(r.timestamp) === missing)!;
    assert.deepEqual(Object.values(x).slice(1), Array(8).fill(null));
    assert.equal(bars.length, HISTORY_BARS);
  }
});
Deno.test("missing current open stays null and never uses previous close", async () => {
  const got = await collectMarketData(
    EVENT,
    mock((u) =>
      Number(u.searchParams.get("startTime")) === EVENT ? [] : normal(u)
    ),
    CLOCK,
  );
  assert.equal(got.current_open.open, null);
  assert.equal(got.spot.at(-1)!.close, 101);
});
Deno.test("no backoff/fallback to evade rate limits; one public Spot fallback for transport", async () => {
  let calls = 0;
  const rate: typeof fetch = async () => {
    calls++;
    return Response.json({ error: "limit" }, { status: 429 });
  };
  await assert.rejects(
    () => collectMarketData(EVENT, rate, CLOCK),
    /Market HTTP failure/,
  );
  assert.ok(calls <= 6);
  const hosts = new Set<string>();
  const f: typeof fetch = async (input) => {
    const u = url(input);
    hosts.add(u.hostname);
    if (u.hostname === "api.binance.com") throw TypeError("transport");
    return Response.json(normal(u));
  };
  assert.equal(
    (await collectMarketData(EVENT, f, CLOCK)).spot.length,
    HISTORY_BARS,
  );
  assert.ok(hosts.has("data-api.binance.vision"));
});
Deno.test("malformed and future rows fail instead of becoming available zeros", async () => {
  for (
    const mutate of [
      (r: any[]) => r[1] = "NaN",
      (r: any[]) => r[10] = "1001",
      (r: any[]) => r[8] = 1.2,
      (r: any[]) => r[6] += 1,
      (r: any[]) => r[0] = EVENT,
    ]
  ) {
    await assert.rejects(() =>
      collectMarketData(
        EVENT,
        mock((u) => {
          const rows = normal(u);
          if (Number(u.searchParams.get("startTime")) < EVENT) {
            mutate(rows[0]);
          }
          return rows;
        }),
        CLOCK,
      )
    );
  }
});
Deno.test("invalid origin and backwards clock reject before fetch", async () => {
  let calls = 0;
  const f = mock((u) => {
    calls++;
    return normal(u);
  });
  await assert.rejects(() => collectMarketData(EVENT + 1, f, CLOCK));
  await assert.rejects(() => collectMarketData(EVENT, f, () => EVENT - 1));
  assert.equal(calls, 0);
});
