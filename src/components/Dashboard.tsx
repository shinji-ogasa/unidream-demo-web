"use client";

import { useEffect, useMemo, useState } from "react";

import { aggregateSnapshots, ANNUALIZATION, type Tf } from "@/lib/aggregate";
import { fmtPercent, fmtTime, fmtUSD, pnlPercent } from "@/lib/format";
import { computeMetrics } from "@/lib/metrics";
import { getSupabase } from "@/lib/supabase";
import {
  DISPLAY_MODEL_NAME,
  INITIAL_EQUITY,
  RUN_ID,
  SYMBOL,
  TIMEFRAME,
  type EquitySnapshot,
  type Prediction,
  type StrategyState,
  type Trade,
} from "@/lib/types";

import { Countdown } from "./Countdown";
import { LongShortBar } from "./LongShortBar";
import { MetricsRow } from "./MetricsRow";
import { PerformanceChart } from "./PerformanceChart";
import { PositionGauge } from "./PositionGauge";
import { StatCard } from "./StatCard";
import { TradesTable } from "./TradesTable";

const TRADES_LIMIT = 50;

const SIGNAL_TONE: Record<string, "good" | "bad" | "warn" | "default"> = {
  overweight: "good",
  underweight: "bad",
  benchmark: "warn",
};

type DashboardProps = {
  initial: {
    prediction: Prediction | null;
    state: StrategyState | null;
    snapshots: EquitySnapshot[];
    trades: Trade[];
  };
};

export function Dashboard({ initial }: DashboardProps) {
  const [prediction, setPrediction] = useState<Prediction | null>(initial.prediction);
  const [state, setState] = useState<StrategyState | null>(initial.state);
  const [snapshots, setSnapshots] = useState<EquitySnapshot[]>(initial.snapshots);
  const [trades, setTrades] = useState<Trade[]>(initial.trades);
  const [tf, setTf] = useState<Tf>("15m");
  const [visibleRange, setVisibleRange] = useState<{ startIndex: number; endIndex: number } | null>(
    null,
  );

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
            setPrediction((prev) => {
              if (!prev) return next;
              const a = new Date(next.created_at).getTime();
              const b = new Date(prev.created_at).getTime();
              return a >= b ? next : prev;
            });
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
        {
          event: "INSERT",
          schema: "public",
          table: "equity_snapshots",
          filter: `run_id=eq.${RUN_ID}`,
        },
        (payload) => {
          const next = payload.new as EquitySnapshot;
          setSnapshots((prev) => {
            if (prev.some((s) => s.id === next.id)) return prev;
            return [...prev, next].sort(
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
          setTrades((prev) => {
            if (prev.some((t) => t.id === next.id)) return prev;
            return [next, ...prev].slice(0, TRADES_LIMIT);
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const aggregated = useMemo(() => aggregateSnapshots(snapshots, tf), [snapshots, tf]);

  const metrics = useMemo(() => {
    if (aggregated.length === 0) {
      return computeMetrics([], trades, ANNUALIZATION[tf]);
    }
    const start = visibleRange?.startIndex ?? 0;
    const end = visibleRange?.endIndex ?? aggregated.length - 1;
    const safeStart = Math.max(0, Math.min(start, aggregated.length - 1));
    const safeEnd = Math.max(safeStart, Math.min(end, aggregated.length - 1));
    const slice = aggregated.slice(safeStart, safeEnd + 1);
    return computeMetrics(slice, trades, ANNUALIZATION[tf]);
  }, [aggregated, trades, tf, visibleRange]);

  const equity = state?.equity ?? INITIAL_EQUITY;
  const cash = state?.cash ?? INITIAL_EQUITY;
  const assetQty = state?.asset_qty ?? 0;
  const currentPosition = state?.current_position ?? 0;
  const lastPrice = state?.last_price ?? prediction?.latest_close ?? null;
  const lastTimestamp = state?.last_timestamp ?? prediction?.latest_timestamp ?? null;
  const pnl = pnlPercent(equity, INITIAL_EQUITY);
  const pnlTone: "good" | "bad" | "default" = pnl > 0.001 ? "good" : pnl < -0.001 ? "bad" : "default";
  const signalKey = (prediction?.signal ?? "").toLowerCase();
  const signalTone = SIGNAL_TONE[signalKey] ?? "default";

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-baseline gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">UniDream Demo</h1>
            <span className="text-xs text-zinc-500 font-mono">
              {SYMBOL} · {TIMEFRAME} · {RUN_ID}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-[11px] font-mono text-zinc-500">
              model <span className="text-zinc-200">{DISPLAY_MODEL_NAME}</span>
            </span>
            <Countdown />
          </div>
        </div>
        <p className="text-xs text-amber-400/80">
          This is a research demo, not financial advice. Virtual paper-trading only.
        </p>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <StatCard
          label="Equity"
          value={fmtUSD(equity)}
          hint={`PnL ${pnl >= 0 ? "+" : ""}${pnl.toFixed(2)}%`}
          tone={pnlTone}
        />
        <StatCard label="Cash" value={fmtUSD(cash)} hint={`asset_qty ${assetQty.toFixed(6)}`} />
        <StatCard
          label="Last Price"
          value={fmtUSD(lastPrice)}
          hint={fmtTime(lastTimestamp)}
        />
        <StatCard
          label="Latest Signal"
          value={prediction?.signal ?? "—"}
          hint={`raw position ${prediction?.position?.toFixed(3) ?? "—"}`}
          tone={signalTone}
        />
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <PositionGauge
          position={currentPosition}
          equity={equity}
          cash={cash}
          assetQty={assetQty}
        />
        <div className="md:col-span-2 grid grid-cols-1 gap-3">
          <MetricsRow metrics={metrics} />
          <LongShortBar
            longPct={metrics.longPct}
            shortPct={metrics.shortPct}
            flatPct={metrics.flatPct}
          />
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <PerformanceChart
          snapshots={snapshots}
          trades={trades}
          tf={tf}
          onTfChange={(next) => {
            setTf(next);
            setVisibleRange(null);
          }}
          onVisibleChange={setVisibleRange}
        />
        <div className="text-[11px] font-mono text-zinc-500">
          Metrics are computed over the visible window ({metrics.bars} {tf} bars · {metrics.trades}{" "}
          trades). Drag the slider to see older data.
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <div className="label">Recent Trades</div>
        <TradesTable trades={trades.slice(0, 20)} />
      </section>

      <footer className="text-xs text-zinc-600 mt-2">
        Data: Binance public API · Inference: UniDream HF Space · Storage & realtime: Supabase ·
        Last inference {fmtTime(prediction?.created_at)} · Alpha (excess) ={" "}
        {fmtPercent(metrics.alphaEx, 2, true)}
      </footer>
    </div>
  );
}
