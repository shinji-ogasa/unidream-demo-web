import {
  BINANCE_LIMIT,
  SYMBOL,
  TIMEFRAME,
  type Candle,
} from "./config.ts";

type BinanceKline = [
  number, string, string, string, string, string,
  number, string, number, string, string, string,
];

async function fetchBinanceBatch(endTimeMs: number | null, limit: number): Promise<BinanceKline[]> {
  const params = new URLSearchParams({
    symbol: SYMBOL,
    interval: TIMEFRAME,
    limit: String(limit),
  });
  if (endTimeMs !== null) params.set("endTime", String(endTimeMs));
  const response = await fetch(`https://api.binance.com/api/v3/klines?${params.toString()}`);
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`binance klines failed: ${response.status} ${body.slice(0, 200)}`);
  }
  return (await response.json()) as BinanceKline[];
}

export async function fetchCandles(target: number): Promise<Candle[]> {
  const newest = await fetchBinanceBatch(null, BINANCE_LIMIT);
  const accumulated: BinanceKline[] = [...newest];
  let oldestOpen = newest.length ? newest[0][0] : null;

  while (accumulated.length < target && oldestOpen !== null) {
    const remaining = Math.min(BINANCE_LIMIT, target - accumulated.length + 50);
    const older = await fetchBinanceBatch(oldestOpen - 1, remaining);
    if (older.length === 0) break;
    accumulated.unshift(...older);
    oldestOpen = older[0][0];
    if (older.length < remaining) break;
  }

  const byOpenTime = new Map<number, BinanceKline>();
  for (const kline of accumulated) byOpenTime.set(kline[0], kline);
  return [...byOpenTime.values()]
    .sort((a, b) => a[0] - b[0])
    .slice(-target)
    .map((kline) => ({
      timestamp: new Date(kline[0]).toISOString(),
      open: Number(kline[1]),
      high: Number(kline[2]),
      low: Number(kline[3]),
      close: Number(kline[4]),
      volume: Number(kline[5]),
    }));
}
