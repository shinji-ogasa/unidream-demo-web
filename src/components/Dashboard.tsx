"use client";

import { useEffect, useMemo, useRef, useState } from "react";

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

type Range = { startIndex: number; endIndex: number };

type DashboardProps = {
  initial: {
    prediction: Prediction | null;
    state: StrategyState | null;
    snapshots: EquitySnapshot[];
    trades: Trade[];
  };
};

function fullRange(length: number): Range | null {
  if (length === 0) return null;
  return { startIndex: 0, endIndex: length - 1 };
}

export function Dashboard({ initial }: DashboardProps) {
  const [prediction, setPrediction] = useState<Prediction | null>(initial.prediction);
  const [state, setState] = useState<StrategyState | null>(initial.state);
  const [snapshots, setSnapshots] = useState<EquitySnapshot[]>(initial.snapshots);
  const [trades, setTrades] = useState<Trade[]>(initial.trades);
  const [tf, setTf] = useState<Tf>("15m");
  const aggregated = useMemo(() => aggregateSnapshots(snapshots, tf), [snapshots, tf]);
  const [range, setRange] = useState<Range | null>(() =>
    fullRange(aggregateSnapshots(initial.snapshots, "15m").length),
  );
  const lastTfRef = useRef<Tf>("15m");

  // Reset the brush window on TF change to "show all aggregated bars"; on data
  // growth, follow the right edge if the user was already there, otherwise
  // leave their browsed position untouched.
  useEffect(() => {
    setRange((prev) => {
      const len = aggregated.length;
      if (len === 0) return null;
      const lastIdx = len - 1;
      if (lastTfRef.current !== tf) {
        lastTfRef.current = tf;
        return fullRange(len);
      }
      if (!prev) return fullRange(len);
      if (prev.endIndex >= lastIdx - 1) {
        const span = prev.endIndex - prev.startIndex;
        return { startIndex: Math.max(0, lastIdx - span), endIndex: lastIdx };
      }
      return prev;
    });
  }, [tf, aggregated.length]);

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

  const handleRangeChange = (next: Range) => {
    setRange((prev) => {
      if (prev && prev.startIndex === next.startIndex && prev.endIndex === next.endIndex) {
        return prev;
      }
      return next;
    });
  };

  const metrics = useMemo(() => {
    if (aggregated.length === 0) {
      return computeMetrics([], trades, ANNUALIZATION[tf]);
    }
    const lastIdx = aggregated.length - 1;
    const start = Math.max(0, Math.min(range?.startIndex ?? 0, lastIdx));
    const end = Math.max(start, Math.min(range?.endIndex ?? lastIdx, lastIdx));
    const slice = aggregated.slice(start, end + 1);
    return computeMetrics(slice, trades, ANNUALIZATION[tf]);
  }, [aggregated, trades, tf, range]);

  const equity = state?.equity ?? INITIAL_EQUITY;
  const cash = state?.cash ?? INITIAL_EQUITY;
  const assetQty = state?.asset_qty ?? 0;
  const currentPosition = state?.current_position ?? 0;
  const lastPrice = state?.last_price ?? prediction?.latest_close ?? null;
  const lastTimestamp = state?.last_timestamp ?? prediction?.latest_timestamp ?? null;
  const pnl = pnlPercent(equity, INITIAL_EQUITY);
  const pnlTone: "good" | "bad" | "default" =
    pnl > 0.001 ? "good" : pnl < -0.001 ? "bad" : "default";
  const signalKey = (prediction?.signal ?? "").toLowerCase();
  const signalTone = SIGNAL_TONE[signalKey] ?? "default";

  return (
    <div className="max-w-6xl mx-auto px-6 py-10 flex flex-col gap-7">
      <header className="flex flex-col gap-3">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-baseline gap-4">
            <h1 className="text-3xl font-semibold tracking-tight">UniDream Demo</h1>
            <span className="text-sm text-zinc-500 font-mono">
              {SYMBOL} · {TIMEFRAME} · {RUN_ID}
            </span>
          </div>
          <div className="flex items-center gap-5">
            <span className="text-sm font-mono text-zinc-500">
              model <span className="text-zinc-100">{DISPLAY_MODEL_NAME}</span>
            </span>
            <Countdown />
          </div>
        </div>
        <p className="text-sm text-amber-400/80">
          This is a research demo, not financial advice. Virtual paper-trading only.
        </p>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-4 gap-4 items-stretch">
        <StatCard
          label="Equity"
          value={fmtUSD(equity)}
          hint={`PnL ${pnl >= 0 ? "+" : ""}${pnl.toFixed(2)}%`}
          tone={pnlTone}
        />
        <StatCard
          label="Cash"
          value={fmtUSD(cash)}
          hint={`asset_qty ${assetQty.toFixed(6)}`}
        />
        <StatCard label="Last Price" value={fmtUSD(lastPrice)} hint={fmtTime(lastTimestamp)} />
        <StatCard
          label="Latest Signal"
          value={prediction?.signal ?? "—"}
          hint={`raw position ${prediction?.position?.toFixed(3) ?? "—"}`}
          tone={signalTone}
        />
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
        <PositionGauge
          position={currentPosition}
          equity={equity}
          cash={cash}
          assetQty={assetQty}
        />
        <div className="md:col-span-2 flex flex-col gap-4">
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
          snapshots={aggregated}
          trades={trades}
          tf={tf}
          range={range}
          onTfChange={setTf}
          onRangeChange={handleRangeChange}
        />
        <div className="text-sm font-mono text-zinc-500">
          Metrics computed over the visible window ({metrics.bars} {tf} bars · {metrics.trades}{" "}
          trades). Drag the slider to see older data.
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <div className="text-sm uppercase tracking-[0.18em] text-zinc-400">Recent Trades</div>
        <TradesTable trades={trades.slice(0, 20)} />
      </section>

      <section className="panel p-5 flex flex-col gap-3">
        <div className="text-sm text-zinc-300">
          研究本体と HF Space の推論サーバはオープンソース。コードと bundle は誰でも見れる。
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-2 font-mono text-sm">
          <a
            href="https://github.com/shinji-ogasa/UniDream"
            target="_blank"
            rel="noopener noreferrer"
            className="text-zinc-200 hover:text-emerald-400 underline-offset-4 hover:underline transition-colors"
          >
            → UniDream (research repo) on GitHub
          </a>
          <a
            href="https://huggingface.co/spaces/ShinjiAA/unidream-space"
            target="_blank"
            rel="noopener noreferrer"
            className="text-zinc-200 hover:text-emerald-400 underline-offset-4 hover:underline transition-colors"
          >
            → unidream-space on Hugging Face
          </a>
        </div>
      </section>

      <footer className="text-sm text-zinc-500 mt-2">
        Data: Binance public API · Inference: UniDream HF Space · Storage &amp; realtime: Supabase ·
        Last inference {fmtTime(prediction?.created_at)} · Alpha (excess) ={" "}
        {fmtPercent(metrics.alphaEx, 2, true)}
      </footer>
    </div>
  );
}
