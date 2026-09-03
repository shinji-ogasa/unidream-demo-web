"use client";

import { useEffect, useState } from "react";

import { getSupabase } from "@/lib/supabase";
import type { DashboardContract } from "@/lib/contract";
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
  contract: DashboardContract;
};

function predictionTime(prediction: Prediction): number {
  const value = new Date(prediction.latest_timestamp ?? prediction.created_at).getTime();
  return Number.isFinite(value) ? value : -Infinity;
}

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
        { event: "*", schema: "public", table: "predictions" },
        (payload) => {
          if (!payload.new || typeof payload.new !== "object") return;
          const next = payload.new as Prediction;
          if (next.symbol !== SYMBOL || next.timeframe !== TIMEFRAME) return;
          setPrediction((previous) => {
            if (!previous) return next;
            return predictionTime(next) >= predictionTime(previous)
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
          event: "*",
          schema: "public",
          table: "equity_snapshots",
          filter: `run_id=eq.${RUN_ID}`,
        },
        (payload) => {
          if (!payload.new || typeof payload.new !== "object") return;
          const next = payload.new as EquitySnapshot;
          setSnapshots((previous) => {
            const withoutNext = previous.filter(
              (snapshot) => snapshot.id !== next.id && snapshot.timestamp !== next.timestamp,
            );
            return [...withoutNext, next].sort(
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
            return [...previous, next]
              .sort(
                (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
              )
              .slice(0, TRADES_LIMIT);
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { prediction, state, snapshots, trades, contract: initial.contract };
}
