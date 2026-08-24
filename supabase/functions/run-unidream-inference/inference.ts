import { SYMBOL, TIMEFRAME, type Candle } from "./config.ts";

function shortModelVersion(run: Record<string, unknown> | null | undefined): string | null {
  if (!run || typeof run !== "object") return null;
  const explicit = run.name ?? run.run_id;
  if (typeof explicit === "string" && explicit.length > 0) return explicit;
  const directory = run.checkpoint_dir;
  if (typeof directory === "string" && directory.length > 0) {
    const base = directory.split(/[\\/]/).filter(Boolean).pop() ?? directory;
    const fold = run.fold;
    return typeof fold === "number" ? `${base}@fold${fold}` : base;
  }
  return null;
}

export async function fetchModelVersion(spaceUrl: string): Promise<string | null> {
  try {
    const response = await fetch(`${spaceUrl.replace(/\/+$/, "")}/health`);
    if (!response.ok) return null;
    const data = await response.json() as { run?: Record<string, unknown> };
    return shortModelVersion(data.run);
  } catch {
    return null;
  }
}

export async function callPredict(spaceUrl: string, apiKey: string, candles: Candle[]) {
  const response = await fetch(`${spaceUrl.replace(/\/+$/, "")}/predict`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
    },
    body: JSON.stringify({
      symbol: SYMBOL,
      timeframe: TIMEFRAME,
      candles,
      tail: 32,
    }),
  });
  const body = await response.text();
  if (!response.ok) throw new Error(`HF /predict failed: ${response.status} ${body.slice(0, 300)}`);
  return JSON.parse(body);
}
