import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { Dashboard } from "@/components/Dashboard";
import {
  type EquitySnapshot,
  type Prediction,
  RUN_ID,
  SYMBOL,
  TIMEFRAME,
  type StrategyState,
  type Trade,
} from "@/lib/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// Supabase REST caps each select() at the project's db_max_rows (default 1000),
// so we paginate with .range() to reach the full backfill (~5760 rows for 60d
// of 15m data). Hard ceiling so we don't accidentally fetch unbounded history.
const SNAPSHOT_PAGE = 1000;
const SNAPSHOT_HARD_LIMIT = 50_000;
const TRADES_LIMIT = 200;

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

async function loadInitial() {
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
    (t) => Math.trunc(t.from_position * 1000) !== Math.trunc(t.to_position * 1000),
  );
  return { prediction, state, snapshots, trades };
}

export default async function Page() {
  const initial = await loadInitial();
  return <Dashboard initial={initial} />;
}
