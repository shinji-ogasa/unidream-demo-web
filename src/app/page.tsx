import { createClient } from "@supabase/supabase-js";

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

const SNAPSHOT_LIMIT = 192;
const TRADES_LIMIT = 20;

function getServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Supabase env vars missing. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in .env.local",
    );
  }
  return createClient(url, key, { auth: { persistSession: false } });
}

async function loadInitial() {
  const supabase = getServerClient();
  const [predRes, stateRes, snapsRes, tradesRes] = await Promise.all([
    supabase
      .from("predictions")
      .select("*")
      .eq("symbol", SYMBOL)
      .eq("timeframe", TIMEFRAME)
      .order("created_at", { ascending: false })
      .limit(1),
    supabase.from("strategy_state").select("*").eq("id", RUN_ID).maybeSingle(),
    supabase
      .from("equity_snapshots")
      .select("*")
      .eq("run_id", RUN_ID)
      .order("timestamp", { ascending: false })
      .limit(SNAPSHOT_LIMIT),
    supabase
      .from("trades")
      .select("*")
      .eq("run_id", RUN_ID)
      .order("created_at", { ascending: false })
      .limit(TRADES_LIMIT),
  ]);

  const prediction = (predRes.data?.[0] as Prediction | undefined) ?? null;
  const state = (stateRes.data as StrategyState | null) ?? null;
  const snapshots = ((snapsRes.data ?? []) as EquitySnapshot[]).slice().reverse();
  const trades = (tradesRes.data ?? []) as Trade[];
  return { prediction, state, snapshots, trades };
}

export default async function Page() {
  const initial = await loadInitial();
  return <Dashboard initial={initial} />;
}
