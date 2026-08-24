"use client";

import { useEffect, useState } from "react";

import { getSupabase } from "@/lib/supabase";
import {
  RUN_ID,
  SYMBOL,
  TIMEFRAME,
  type EquitySnapshot,
  type Prediction,
  type StrategyState,
  type Trade,
} from "@/lib/types";

const TRADES_LIMIT = 10_000;

export type DashboardInitialData = {
  prediction: Prediction | null;
  state: StrategyState | null;
  snapshots: EquitySnapshot[];
  trades: Trade[];
};

export function useLiveDashboard(initial: DashboardInitialData) {
  const [prediction, setPrediction] = useState<Prediction | null>(initial.prediction);
  const [state, setState] = useState<StrategyState | null>(initial.state);
  const [snapshots, setSnapshots] = useState<EquitySnapshot[]>(initial.snapshots);
  const [trades, setTrades] = useState<Trade[]>(initial.trades);

  useEffect(() => {
    const supabase = getSupabase();
    const channel = supabase
      .channel("unidream-demo")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "predictions" },
        (payload) => {
          const next = payload.new as Prediction;
          if (next.symbol !== SYMBOL || next.timeframe !== TIMEFRAME) return;
          setPrediction((previous) => {
            if (!previous) return next;
            return new Date(next.created_at).getTime() >= new Date(previous.created_at).getTime()
              ? next
              : previous;
          });
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "strategy_state", filter: `id=eq.${RUN_ID}` },
        (payload) => {
          if (payload.new) setState(payload.new as StrategyState);
        },
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "equity_snapshots",
          filter: `run_id=eq.${RUN_ID}`,
        },
        (payload) => {
          const next = payload.new as EquitySnapshot;
          setSnapshots((previous) => {
            if (previous.some((snapshot) => snapshot.id === next.id)) return previous;
            return [...previous, next].sort(
              (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
            );
          });
        },
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "trades",
          filter: `run_id=eq.${RUN_ID}`,
        },
        (payload) => {
          const next = payload.new as Trade;
          if (Math.round(next.from_position * 10000) === Math.round(next.to_position * 10000)) return;
          setTrades((previous) => {
            if (previous.some((trade) => trade.id === next.id)) return previous;
            return [next, ...previous].slice(0, TRADES_LIMIT);
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { prediction, state, snapshots, trades };
}
