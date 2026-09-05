"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";

import { ANNUALIZATION, sortedAscending } from "@/lib/aggregate";
import { fmtPercent, fmtTime, fmtUSD, pnlPercent } from "@/lib/format";
import { buildBuyAndHoldEquity, computeMetrics } from "@/lib/metrics";
import {
  INITIAL_EQUITY,
  SYMBOL,
  TIMEFRAME,
} from "@/lib/types";
import { useLiveDashboard, type DashboardInitialData } from "@/features/dashboard/hooks/useLiveDashboard";

import { Countdown } from "./Countdown";
import { MetricsRow } from "./MetricsRow";
import { PerformanceChart } from "./PerformanceChart";
import { TradesTable } from "./TradesTable";

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

  const equity = state?.equity ?? INITIAL_EQUITY;
  const currentPosition = state?.current_position ?? 0;
  const lastPrice = state?.last_price ?? prediction?.latest_close ?? null;
  const lastTimestamp = state?.last_timestamp ?? prediction?.latest_timestamp ?? null;
  const bnhEquity = useMemo(() => {
    const values = buildBuyAndHoldEquity(sortedSnapshots, INITIAL_EQUITY);
    return values.at(-1) ?? INITIAL_EQUITY;
  }, [sortedSnapshots]);
  const pnl = pnlPercent(equity, INITIAL_EQUITY);
  const bnhPnl = pnlPercent(bnhEquity, INITIAL_EQUITY);
  const equityDelta = equity - bnhEquity;
  const equityDeltaPercent = equityDelta / INITIAL_EQUITY;
  const pnlTone: "good" | "bad" | "default" =
    pnl > 0.001 ? "good" : pnl < -0.001 ? "bad" : "default";
  const deltaTone: "good" | "bad" | "default" =
    equityDelta > 0.005 ? "good" : equityDelta < -0.005 ? "bad" : "default";
  const signalKey = (prediction?.signal ?? "").toLowerCase();
  const signalTone = SIGNAL_TONE[signalKey] ?? "default";
  const modelName = initial.contract.model;

  return (
    <main className="dashboard-shell dashboard-shell--result-only">
      <div className="dashboard-shell__ambient" aria-hidden="true" />

      <div className="dashboard-container">
        <header className="dashboard-header">
          <div className="dashboard-header__brand-group">
            <Link href="/homepage" className="dashboard-header__brand" aria-label="Zeniq / UniDream">
              <Image
                src="/Zeniq-logo.png"
                alt="Zeniq"
                height={56}
                width={224}
                priority
                unoptimized
                className="dashboard-header__logo"
              />
            </Link>
            <span className="dashboard-header__divider" aria-hidden="true" />
            <div className="dashboard-header__context">
              <span>{SYMBOL} / {TIMEFRAME}</span>
            </div>
          </div>

          <div className="dashboard-header__status">
            <span className="dashboard-live"><i aria-hidden="true" /> PAPER / LIVE</span>
            <span className="dashboard-model"><small>MODEL</small>{modelName}</span>
            <Countdown />
          </div>
        </header>

        <section className="dashboard-result-stage" aria-label="UniDream demo result">
          <div className="dashboard-result-stage__topline">
            <div className="dashboard-result-stage__identity">
              <strong>{SYMBOL}</strong>
              <span>{TIMEFRAME}</span>
              <time dateTime={lastTimestamp ?? undefined}>{fmtTime(lastTimestamp)}</time>
            </div>
          </div>

          <section className="dashboard-result-summary" aria-label="Current equity result">
            <div className="dashboard-result-summary__hero">
              <span>AI EQUITY</span>
              <strong>{fmtUSD(equity)}</strong>
              <em className={`dashboard-result-summary__change dashboard-result-summary__change--${pnlTone}`}>
                {pnl >= 0 ? "+" : ""}{pnl.toFixed(2)}%
              </em>
            </div>

            <div className="dashboard-result-summary__benchmark">
              <span>B&amp;H</span>
              <strong>{fmtUSD(bnhEquity)}</strong>
              <small>{bnhPnl >= 0 ? "+" : ""}{bnhPnl.toFixed(2)}%</small>
            </div>

            <div className="dashboard-result-summary__delta">
              <span>CURRENT VS B&amp;H</span>
              <strong className={`dashboard-result-summary__delta--${deltaTone}`}>
                {fmtPercent(equityDeltaPercent, 2, true)}
              </strong>
              <small>{fmtUSD(Math.abs(equityDelta))} · AI − B&amp;H</small>
            </div>
          </section>

          <section className="dashboard-result-window" aria-label="Window results">
            <div className="dashboard-result-window__head">
              <span>WINDOW RESULTS</span>
              <small>{metrics.bars.toLocaleString()} BARS · {metrics.trades} TRADES</small>
            </div>
            <MetricsRow metrics={metrics} />
            <div className="dashboard-result-window__state">
              <span>POSITION <strong>{currentPosition.toFixed(3)}</strong></span>
              <span>SIGNAL <strong className={`dashboard-result-window__signal--${signalTone}`}>{prediction?.signal ?? "—"}</strong></span>
              <span>LAST PRICE <strong>{fmtUSD(lastPrice)}</strong></span>
            </div>
          </section>

          <PerformanceChart
            snapshots={sortedSnapshots}
            range={range}
            onRangeChange={handleRangeChange}
          />
        </section>

        <section className="dashboard-section dashboard-trades dashboard-trades--minimal" aria-label="Trades">
          <div className="dashboard-trades__simple-head">
            <span>TRADES</span>
            <span>{trades.length} fills</span>
          </div>
          <TradesTable trades={trades} />
        </section>

        <footer className="dashboard-footer dashboard-footer--minimal">
          <nav className="dashboard-footer__links dashboard-footer__links--result" aria-label="Resources">
            <Link href="/homepage">Company overview ↗</Link>
            <a href="https://github.com/shinji-ogasa/UniDream" target="_blank" rel="noopener noreferrer">GitHub ↗</a>
            <a href="https://huggingface.co/spaces/ShinjiAA/unidream-space" target="_blank" rel="noopener noreferrer">HF Space ↗</a>
          </nav>
          <span>PAPER · {SYMBOL} · {TIMEFRAME}</span>
          <span>{fmtTime(lastTimestamp)} · {modelName}</span>
        </footer>
      </div>
    </main>
  );
}
