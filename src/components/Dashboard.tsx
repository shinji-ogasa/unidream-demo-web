"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";

import { ANNUALIZATION, sortedAscending } from "@/lib/aggregate";
import { fmtPercent, fmtTime, fmtUSD, pnlPercent } from "@/lib/format";
import { computeMetrics } from "@/lib/metrics";
import {
  DISPLAY_MODEL_NAME,
  INITIAL_EQUITY,
  SYMBOL,
  TIMEFRAME,
} from "@/lib/types";
import { useLiveDashboard, type DashboardInitialData } from "@/hooks/useLiveDashboard";

import { Countdown } from "./Countdown";
import { LongShortBar } from "./LongShortBar";
import { MetricsRow } from "./MetricsRow";
import { PerformanceChart } from "./PerformanceChart";
import { PositionGauge } from "./PositionGauge";
import { StatCard } from "./StatCard";
import { TradesTable } from "./TradesTable";

const POSITION_HISTORY_BARS = 96;

const SIGNAL_TONE: Record<string, "good" | "bad" | "warn" | "default"> = {
  overweight: "good",
  underweight: "bad",
  benchmark: "warn",
};

type Range = { startIndex: number; endIndex: number };

type DashboardProps = {
  initial: DashboardInitialData;
};

function fullRange(length: number): Range | null {
  if (length === 0) return null;
  return { startIndex: 0, endIndex: length - 1 };
}

export function Dashboard({ initial }: DashboardProps) {
  const { prediction, state, snapshots, trades } = useLiveDashboard(initial);
  const sortedSnapshots = useMemo(() => sortedAscending(snapshots), [snapshots]);
  const [range, setRange] = useState<Range | null>(() =>
    fullRange(sortedAscending(initial.snapshots).length),
  );

  useEffect(() => {
    setRange((prev) => {
      const len = sortedSnapshots.length;
      if (len === 0) return null;
      const lastIdx = len - 1;
      if (!prev) return fullRange(len);
      if (prev.endIndex >= lastIdx - 1) {
        const span = prev.endIndex - prev.startIndex;
        return { startIndex: Math.max(0, lastIdx - span), endIndex: lastIdx };
      }
      return prev;
    });
  }, [sortedSnapshots.length]);

  const rafRef = useRef<number | null>(null);
  const pendingRangeRef = useRef<Range | null>(null);

  useEffect(() => {
    return () => {
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, []);

  const handleRangeChange = useCallback((next: Range) => {
    pendingRangeRef.current = next;
    if (rafRef.current != null) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      const r = pendingRangeRef.current;
      pendingRangeRef.current = null;
      if (!r) return;
      setRange((prev) => {
        if (prev && prev.startIndex === r.startIndex && prev.endIndex === r.endIndex) {
          return prev;
        }
        return r;
      });
    });
  }, []);

  const metrics = useMemo(() => {
    if (sortedSnapshots.length === 0) return computeMetrics([], trades, ANNUALIZATION);
    const lastIdx = sortedSnapshots.length - 1;
    const start = Math.max(0, Math.min(range?.startIndex ?? 0, lastIdx));
    const end = Math.max(start, Math.min(range?.endIndex ?? lastIdx, lastIdx));
    const slice = sortedSnapshots.slice(start, end + 1);
    return computeMetrics(slice, trades, ANNUALIZATION);
  }, [sortedSnapshots, trades, range]);

  const positionHistory = useMemo(
    () => sortedSnapshots.slice(-POSITION_HISTORY_BARS).map((s) => s.position),
    [sortedSnapshots],
  );

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
    <div className="min-h-screen bg-bg-deep text-text antialiased">
      {/* ambient background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(82,102,235,0.08),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,rgba(2,184,204,0.06),transparent_50%)]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-10 flex flex-col gap-5 md:gap-6">
        {/* header */}
        <header className="rounded-[32px] border border-white/[0.08] bg-gradient-to-b from-white/[0.07] to-white/[0.02] backdrop-blur-md p-4 md:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-panel">
          <div className="flex items-center gap-4">
            <Link href="/homepage" className="flex items-center shrink-0">
              <Image
                src="/Zeniq-logo.png"
                alt="Zeniq"
                height={56}
                width={224}
                priority
                unoptimized
                className="h-8 md:h-10 w-auto brightness-0 invert"
              />
            </Link>
            <div className="h-6 w-px bg-white/[0.12] hidden md:block" />
            <div className="hidden md:flex flex-col">
              <span className="text-sm font-semibold tracking-tight">UniDream Live</span>
              <span className="text-xs font-mono text-text-muted">
                {SYMBOL} · {TIMEFRAME}
              </span>
            </div>
          </div>
          <div className="flex items-center flex-wrap gap-x-5 gap-y-2">
            <span className="text-xs md:text-sm font-mono text-text-muted">
              model <span className="text-text">{DISPLAY_MODEL_NAME}</span>
            </span>
            <span className="flex items-center gap-2 text-xs text-text-muted">
              <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
              Live
            </span>
            <Countdown />
          </div>
        </header>

        <p className="text-xs md:text-sm text-warning/80 px-1">
          This is a research demo, not financial advice. Virtual paper-trading only.
        </p>

        {/* stats */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
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

        {/* position + metrics */}
        <section className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-4 md:gap-5">
          <PositionGauge
            position={currentPosition}
            equity={equity}
            cash={cash}
            assetQty={assetQty}
            positionHistory={positionHistory}
          />
          <div className="flex flex-col gap-4 justify-between">
            <MetricsRow metrics={metrics} />
            <LongShortBar
              longPct={metrics.longPct}
              shortPct={metrics.shortPct}
              flatPct={metrics.flatPct}
            />
          </div>
        </section>

        {/* chart */}
        <PerformanceChart
          snapshots={sortedSnapshots}
          trades={trades}
          range={range}
          onRangeChange={handleRangeChange}
        />

        {/* trades */}
        <section className="flex flex-col gap-3">
          <div className="flex items-center gap-2 px-1">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            <div className="text-xs font-semibold tracking-[0.2em] uppercase text-text-muted">
              Recent Trades
            </div>
          </div>
          <TradesTable trades={trades} />
        </section>

        {/* info + footer */}
        <section className="rounded-[32px] border border-white/[0.08] bg-gradient-to-b from-white/[0.05] to-white/[0.02] backdrop-blur-sm p-5 md:p-6 flex flex-col gap-4 shadow-panel">
          <p className="text-sm text-text-soft leading-relaxed">
            Both the research codebase and the inference server behind this demo are open source.
            The trained model bundle is published alongside the code, so anyone can reproduce or
            extend the same experiments end to end.
          </p>
          <div className="flex flex-wrap gap-x-6 gap-y-2 font-mono text-sm">
            <a
              href="https://github.com/shinji-ogasa/UniDream"
              target="_blank"
              rel="noopener noreferrer"
              className="text-text-soft hover:text-success underline-offset-4 hover:underline transition-colors"
            >
              → UniDream (research repo) on GitHub
            </a>
            <a
              href="https://huggingface.co/spaces/ShinjiAA/unidream-space"
              target="_blank"
              rel="noopener noreferrer"
              className="text-text-soft hover:text-success underline-offset-4 hover:underline transition-colors"
            >
              → unidream-space on Hugging Face
            </a>
            <Link
              href="/homepage"
              className="text-text-soft hover:text-primary underline-offset-4 hover:underline transition-colors"
            >
              → Zeniq (Company Overview)
            </Link>
          </div>
        </section>

        <footer className="text-sm text-text-muted px-1">
          Data: Binance public API · Inference: UniDream HF Space · Storage &amp; realtime: Supabase ·
          Last inference {fmtTime(prediction?.created_at)} · Alpha (excess) ={" "}
          {fmtPercent(metrics.alphaEx, 2, true)}
        </footer>
      </div>
    </div>
  );
}
