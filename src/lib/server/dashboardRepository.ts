import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import {
  RUN_ID,
  SYMBOL,
  TIMEFRAME,
  type EquitySnapshot,
  type Prediction,
  type StrategyState,
  type Trade,
} from "@/lib/types";
import { DEMO_CONTRACT } from "@/lib/contract";

const SNAPSHOT_PAGE = 1000;
const SNAPSHOT_HARD_LIMIT = 50_000;
const TRADES_LIMIT = 10_000;

function getServerClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Supabase env vars missing. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in .env.local",
    );
  }
  return createClient(url, key, { auth: { persistSession: false } });
}

async function fetchAllSnapshots(supabase: SupabaseClient): Promise<EquitySnapshot[]> {
  const all: EquitySnapshot[] = [];
  for (let from = 0; from < SNAPSHOT_HARD_LIMIT; from += SNAPSHOT_PAGE) {
    const { data, error } = await supabase
      .from("equity_snapshots")
      .select("*")
      .eq("run_id", RUN_ID)
      .order("timestamp", { ascending: true })
      .range(from, from + SNAPSHOT_PAGE - 1);
    if (error) throw new Error(`equity_snapshots fetch failed: ${error.message}`);
    if (!data || data.length === 0) break;
    all.push(...(data as EquitySnapshot[]));
    if (data.length < SNAPSHOT_PAGE) break;
  }
  return all;
}

export async function loadInitialDashboard() {
  const supabase = getServerClient();
  const [predRes, stateRes, snapshots, tradesRes] = await Promise.all([
    supabase
      .from("predictions")
      .select("*")
      .eq("symbol", SYMBOL)
      .eq("timeframe", TIMEFRAME)
      // A backfill may be inserted after live rows, so bar time—not insert
      // time—is the source of truth for the latest model observation.
      .order("latest_timestamp", { ascending: false, nullsFirst: false })
      .limit(1),
    supabase.from("strategy_state").select("*").eq("id", RUN_ID).maybeSingle(),
    fetchAllSnapshots(supabase),
    supabase
      .from("trades")
      .select("*")
      .eq("run_id", RUN_ID)
      .order("timestamp", { ascending: false })
      .limit(TRADES_LIMIT),
  ]);

  if (predRes.error) throw new Error(`predictions fetch failed: ${predRes.error.message}`);
  if (stateRes.error) throw new Error(`strategy_state fetch failed: ${stateRes.error.message}`);
  if (tradesRes.error) throw new Error(`trades fetch failed: ${tradesRes.error.message}`);

  const prediction = (predRes.data?.[0] as Prediction | undefined) ?? null;
  const state = (stateRes.data as StrategyState | null) ?? null;
  const trades = ((tradesRes.data ?? []) as Trade[]).filter(
    (trade) => Math.round(trade.from_position * 10000) !== Math.round(trade.to_position * 10000),
  );
  // These declarations describe the code/deployment contract. The current
  // public schema does not persist per-row provenance, so the client labels
  // them as configured rather than claiming a runtime health check.
  return { prediction, state, snapshots, trades, contract: DEMO_CONTRACT };
}
