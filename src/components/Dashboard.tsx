"use client";

import { useEffect, useState } from "react";

import { getSupabase } from "@/lib/supabase";
import {
  type EquitySnapshot,
  type Prediction,
  RUN_ID,
  SYMBOL,
  TIMEFRAME,
  type StrategyState,
  type Trade,
  INITIAL_EQUITY,
} from "@/lib/types";
import { fmtPosition, fmtTime, fmtUSD, pnlPercent } from "@/lib/format";

import { EquityChart } from "./EquityChart";
import { StatCard } from "./StatCard";
import { TradesTable } from "./TradesTable";

const SNAPSHOT_LIMIT = 192; // ~2 days of 15m bars
const TRADES_LIMIT = 20;

type DashboardProps = {
  initial: {
    prediction: Prediction | null;
    state: StrategyState | null;
    snapshots: EquitySnapshot[];
    trades: Trade[];
  };
};

const SIGNAL_TONE: Record<string, "good" | "bad" | "warn" | "default"> = {
  overweight: "good",
  underweight: "bad",
  benchmark: "warn",
};

export function Dashboard({ initial }: DashboardProps) {
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
          if (next.symbol === SYMBOL && next.timeframe === TIMEFRAME) {
            setPrediction(next);
          }
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
        { event: "INSERT", schema: "public", table: "equity_snapshots", filter: `run_id=eq.${RUN_ID}` },
        (payload) => {
          const next = payload.new as EquitySnapshot;
          setSnapshots((prev) => {
            if (prev.some((s) => s.id === next.id)) return prev;
            const merged = [...prev, next].slice(-SNAPSHOT_LIMIT);
            return merged;
          });
        },
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "trades", filter: `run_id=eq.${RUN_ID}` },
        (payload) => {
          const next = payload.new as Trade;
          setTrades((prev) => [next, ...prev].slice(0, TRADES_LIMIT));
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const equity = state?.equity ?? INITIAL_EQUITY;
  const pnl = pnlPercent(equity, INITIAL_EQUITY);
  const pnlTone: "good" | "bad" | "default" = pnl > 0.001 ? "good" : pnl < -0.001 ? "bad" : "default";
  const signalKey = (prediction?.signal ?? "").toLowerCase();
  const signalTone = SIGNAL_TONE[signalKey] ?? "default";

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between flex-wrap gap-2">
          <h1 className="text-2xl font-semibold">UniDream Demo</h1>
          <div className="text-xs text-zinc-500 font-mono">
            {SYMBOL} · {TIMEFRAME} · {RUN_ID}
          </div>
        </div>
        <p className="text-xs text-amber-400/80">
          This is a research demo, not financial advice. Virtual paper-trading only.
        </p>
      </header>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          label="Equity"
          value={fmtUSD(equity)}
          hint={`PnL ${pnl >= 0 ? "+" : ""}${pnl.toFixed(2)}%`}
          tone={pnlTone}
        />
        <StatCard label="Cash" value={fmtUSD(state?.cash ?? INITIAL_EQUITY)} />
        <StatCard
          label="Position"
          value={fmtPosition(state?.current_position ?? 0)}
          hint={`asset_qty ${(state?.asset_qty ?? 0).toFixed(6)}`}
        />
        <StatCard
          label="Last Price"
          value={fmtUSD(state?.last_price ?? prediction?.latest_close ?? null)}
          hint={fmtTime(state?.last_timestamp ?? prediction?.latest_timestamp)}
        />
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <StatCard
          label="Latest Signal"
          value={prediction?.signal ?? "—"}
          hint={`raw position ${fmtPosition(prediction?.position ?? null)}`}
          tone={signalTone}
        />
        <StatCard
          label="Model Version"
          value={prediction?.model_version ?? "—"}
          hint={prediction?.feature_version ?? ""}
        />
        <StatCard
          label="Last Inference"
          value={fmtTime(prediction?.created_at)}
          hint={`bar ${fmtTime(prediction?.latest_timestamp)}`}
        />
      </section>

      <section className="flex flex-col gap-2">
        <div className="label">Equity (last {SNAPSHOT_LIMIT} bars)</div>
        <EquityChart snapshots={snapshots} />
      </section>

      <section className="flex flex-col gap-2">
        <div className="label">Recent Trades</div>
        <TradesTable trades={trades} />
      </section>

      <footer className="text-xs text-zinc-600 mt-4">
        Data: Binance public API. Inference: UniDream HF Space. Storage & realtime: Supabase.
      </footer>
    </div>
  );
}
