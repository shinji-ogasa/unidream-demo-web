import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const scriptUrl = new URL("../../../../scripts/backfill-history.ts", import.meta.url);
const script = readFileSync(scriptUrl, "utf8");

test("backfill reuses the closed derivative and atomic inference contract", () => {
  assert.match(script, /fetchCandles as fetchClosedCandles/);
  assert.match(script, /fetchClosedCandles\(targetBars\)/);
  assert.match(script, /funding_rate: c\.funding_rate/);
  assert.match(script, /mark_close: c\.mark_close/);
  assert.match(script, /buildAtomicInferencePayload/);
  assert.match(script, /applyInferenceRpc/);
  assert.doesNotMatch(script, /\.from\("predictions"\)\.insert/);
  assert.doesNotMatch(script, /\.from\("equity_snapshots"\)\.(insert|upsert)/);
  assert.doesNotMatch(script, /\.from\("trades"\)\.insert/);
});

