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
      .order("created_at", { ascending: false })
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

  const prediction = (predRes.data?.[0] as Prediction | undefined) ?? null;
  const state = (stateRes.data as StrategyState | null) ?? null;
  const trades = ((tradesRes.data ?? []) as Trade[]).filter(
    (trade) => Math.round(trade.from_position * 10000) !== Math.round(trade.to_position * 10000),
  );
  return { prediction, state, snapshots, trades };
}
