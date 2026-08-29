import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { DEMO_CONTRACT } from "../../../../src/lib/contract.ts";

test("dashboard exposes the model, parity, cutoff, atomic, and cost contract", () => {
  assert.equal(DEMO_CONTRACT.model, "Plan011 v31");
  assert.match(DEMO_CONTRACT.featureSchema, /17-feature/);
  assert.match(DEMO_CONTRACT.featureParity, /research/);
  assert.match(DEMO_CONTRACT.derivativeInputs, /funding_rate \+ mark_close/);
  assert.match(DEMO_CONTRACT.observationCutoff, /closed 15m/);
  assert.match(DEMO_CONTRACT.atomicCommit, /record_unidream_inference/);
  assert.deepEqual(DEMO_CONTRACT.tradingCosts, {
    fee_rate: 0.0003,
    spread_bps: 3,
    slippage_bps: 1,
  });
});

test("dashboard labels legacy fee values as all-in transaction cost", () => {
  const table = readFileSync(
    new URL("../../../../src/components/TradesTable.tsx", import.meta.url),
    "utf8",
  );
  const dashboard = readFileSync(
    new URL("../../../../src/components/Dashboard.tsx", import.meta.url),
    "utf8",
  );
  assert.match(table, /cost \(USDT\)/);
  assert.match(table, /Legacy fee column; all-in quote transaction cost/);
  assert.match(dashboard, /source-configured/);
  assert.match(dashboard, /per-row provenance/);
});

