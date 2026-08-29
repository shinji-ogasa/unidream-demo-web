import assert from "node:assert/strict";
import test from "node:test";

import {
  alignDerivativeInputs,
  fetchCandles,
  isCandleClosed,
  type BinanceRequestOptions,
} from "../binance.ts";
import { callPredict } from "../inference.ts";

const BAR_MS = 15 * 60 * 1000;

test("closed-candle gate includes the exact close boundary only", () => {
  const closeTime = 1_700_000_000_000;
  assert.equal(isCandleClosed(closeTime, closeTime - 1), false);
  assert.equal(isCandleClosed(closeTime, closeTime), true);
  assert.equal(isCandleClosed(closeTime, closeTime + 1), true);
});

function spotRow(openTime: number, close = 100): [number, string, string, string, string, string, number] {
  return [
    openTime,
    String(close - 1),
    String(close + 1),
    String(close - 2),
    String(close),
    "10",
    openTime + BAR_MS - 1,
  ];
}

function markRow(openTime: number, close = 100): [number, string, string, string, string] {
  return [openTime, String(close - 1), String(close + 1), String(close - 2), String(close)];
}

function spotCandles(start = 0) {
  return [0, 1, 2].map((index) => ({
    openTime: start + index * BAR_MS,
    closeTime: start + index * BAR_MS + BAR_MS - 1,
    open: 99 + index,
    high: 101 + index,
    low: 98 + index,
    close: 100 + index,
    volume: 10 + index,
  }));
}

test("funding alignment never uses a future publication", () => {
  const spots = spotCandles(1_700_000_000_000);
  const aligned = alignDerivativeInputs(
    spots,
    [
      { fundingTime: spots[0].openTime - BAR_MS, fundingRate: 0.01 },
      { fundingTime: spots[1].openTime, fundingRate: 0.02 },
      { fundingTime: spots[2].openTime + 1, fundingRate: 0.99 },
    ],
    spots.map((spot) => ({ openTime: spot.openTime, markClose: spot.close + 0.5 })),
  );

  assert.deepEqual(
    aligned.map((candle) => candle.funding_rate),
    [0.01, 0.02, 0.02],
  );
});
test("mark closes align by exact candle open timestamp", () => {
  const spots = spotCandles(1_700_000_000_000);
  const aligned = alignDerivativeInputs(
    spots,
    [{ fundingTime: spots[0].openTime - BAR_MS, fundingRate: 0.01 }],
    [
      { openTime: spots[2].openTime, markClose: 303 },
      { openTime: spots[0].openTime, markClose: 101 },
      { openTime: spots[1].openTime, markClose: 202 },
      // A later mark bar must not be used as a fill for any spot candle.
      { openTime: spots[2].openTime + BAR_MS, markClose: 404 },
    ],
  );

  assert.deepEqual(
    aligned.map((candle) => candle.mark_close),
    [101, 202, 303],
  );
});

test("missing derivative coverage fails closed", () => {
  const spots = spotCandles(1_700_000_000_000);
  const funding = [{ fundingTime: spots[0].openTime - BAR_MS, fundingRate: 0.01 }];
  const marks = spots.slice(0, 2).map((spot) => ({ openTime: spot.openTime, markClose: 100 }));

  assert.throws(
    () => alignDerivativeInputs(spots, funding, marks),
    /missing mark-price coverage/,
  );
  assert.throws(
    () => alignDerivativeInputs(
      spots,
      [{ fundingTime: spots[0].openTime + 1, fundingRate: 0.01 }],
      spots.map((spot) => ({ openTime: spot.openTime, markClose: 100 })),
    ),
    /missing funding-rate coverage/,
  );
});

test("fetchCandles excludes the unclosed latest row while retaining TARGET_BARS", async () => {
  const firstOpen = 1_700_000_000_000;
  const allSpots = [0, 1, 2, 3].map((index) => spotRow(firstOpen + index * BAR_MS, 100 + index));
  const latest = allSpots[3];
  const cutoff = latest[0] + BAR_MS - 2;
  latest[6] = cutoff + 1;
  const requests: URL[] = [];
  const fetchImpl: NonNullable<BinanceRequestOptions["fetchImpl"]> = async (input) => {
    const url = new URL(String(input));
    requests.push(url);
    if (url.pathname === "/api/v3/klines") {
      const endTime = url.searchParams.get("endTime");
      const rows = endTime === null
        ? allSpots.slice(1)
        : allSpots.filter((row) => row[0] <= Number(endTime));
      return new Response(JSON.stringify(rows), { status: 200 });
    }
    if (url.pathname === "/fapi/v1/markPriceKlines") {
      return new Response(JSON.stringify(allSpots.slice(0, 3).map((row) => markRow(row[0], Number(row[4]) + 0.5))), { status: 200 });
    }
    if (url.pathname === "/fapi/v1/fundingRate") {
      const prior = { fundingTime: firstOpen - BAR_MS, fundingRate: "0.001" };
      const current = { fundingTime: firstOpen + 2 * BAR_MS, fundingRate: "0.002" };
      return new Response(
        JSON.stringify(url.searchParams.has("startTime") ? [prior, current] : [prior]),
        { status: 200 },
      );
    }
    return new Response("not found", { status: 404 });
  };

  const candles = await fetchCandles(3, {
    fetchImpl,
    nowMs: cutoff,
    spotBaseUrl: "https://spot.test",
    futuresBaseUrl: "https://futures.test",
  });

  assert.equal(candles.length, 3);
  assert.deepEqual(candles.map((candle) => candle.timestamp), [
    new Date(firstOpen).toISOString(),
    new Date(firstOpen + BAR_MS).toISOString(),
    new Date(firstOpen + 2 * BAR_MS).toISOString(),
  ]);
  assert.equal(candles.at(-1)?.close, 102);
  assert.equal(candles.some((candle) => candle.close === 103), false);
  const spotRequests = requests.filter((url) => url.pathname === "/api/v3/klines");
  assert.equal(spotRequests.length, 2);
  assert.equal(spotRequests[0].searchParams.get("limit"), "3");
  assert.equal(spotRequests[1].searchParams.get("endTime"), String(firstOpen + BAR_MS - 1));
});

test("fetchCandles requests spot, mark, and funding history and returns all raw fields", async () => {
  const spots = [spotRow(1_700_000_000_000, 100), spotRow(1_700_000_000_000 + BAR_MS, 101)];
  const requests: URL[] = [];
  const fetchImpl: NonNullable<BinanceRequestOptions["fetchImpl"]> = async (input) => {
    const url = new URL(String(input));
    requests.push(url);
    if (url.pathname === "/api/v3/klines") {
      return new Response(JSON.stringify(spots), { status: 200 });
    }
    if (url.pathname === "/fapi/v1/markPriceKlines") {
      return new Response(JSON.stringify([
        markRow(spots[0][0], 100.5),
        markRow(spots[1][0], 101.5),
      ]), { status: 200 });
    }
    if (url.pathname === "/fapi/v1/fundingRate") {
      const prior = { fundingTime: spots[0][0] - BAR_MS, fundingRate: "0.001" };
      const current = { fundingTime: spots[1][0], fundingRate: "0.002" };
      return new Response(
        JSON.stringify(url.searchParams.has("startTime") ? [prior, current] : [prior]),
        { status: 200 },
      );
    }
    return new Response("not found", { status: 404 });
  };

  const candles = await fetchCandles(2, {
    fetchImpl,
    spotBaseUrl: "https://spot.test",
    futuresBaseUrl: "https://futures.test",
  });

  assert.deepEqual(candles.map((candle) => ({
    timestamp: candle.timestamp,
    open: candle.open,
    high: candle.high,
    low: candle.low,
    close: candle.close,
    volume: candle.volume,
    funding_rate: candle.funding_rate,
    mark_close: candle.mark_close,
  })), [
    {
      timestamp: new Date(spots[0][0]).toISOString(),
      open: 99,
      high: 101,
      low: 98,
      close: 100,
      volume: 10,
      funding_rate: 0.001,
      mark_close: 100.5,
    },
    {
      timestamp: new Date(spots[1][0]).toISOString(),
      open: 100,
      high: 102,
      low: 99,
      close: 101,
      volume: 10,
      funding_rate: 0.002,
      mark_close: 101.5,
    },
  ]);

  const markRequest = requests.find((url) => url.pathname === "/fapi/v1/markPriceKlines");
  assert.equal(markRequest?.searchParams.get("startTime"), String(spots[0][0]));
  assert.equal(markRequest?.searchParams.get("endTime"), String(spots[1][0]));
  const fundingRequests = requests.filter((url) => url.pathname === "/fapi/v1/fundingRate");
  assert.equal(fundingRequests.length, 2);
  assert.equal(fundingRequests[0].searchParams.has("startTime"), false);
  assert.equal(fundingRequests[0].searchParams.get("endTime"), String(spots[0][0]));
  assert.equal(fundingRequests[1].searchParams.get("startTime"), String(spots[0][0] - BAR_MS));
  assert.equal(fundingRequests[1].searchParams.get("endTime"), String(spots[1][0]));
});

test("callPredict sends required derivative fields in the existing candles schema", async () => {
  const spots = spotCandles(1_700_000_000_000);
  const candles = alignDerivativeInputs(
    spots,
    [{ fundingTime: spots[0].openTime - BAR_MS, fundingRate: -0.001 }],
    spots.map((spot) => ({ openTime: spot.openTime, markClose: spot.close + 0.25 })),
  );
  let requestBody: unknown;
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (_input, init) => {
    requestBody = JSON.parse(String(init?.body));
    return new Response(JSON.stringify({ position: 1, signal: "hold" }), { status: 200 });
  };
  try {
    await callPredict("https://space.test/", "test-key", candles);
  } finally {
    globalThis.fetch = originalFetch;
  }

  assert.deepEqual((requestBody as { candles: unknown[] }).candles, candles);
  assert.deepEqual(requestBody, {
    symbol: "BTCUSDT",
    timeframe: "15m",
    candles,
    tail: 32,
  });
});
