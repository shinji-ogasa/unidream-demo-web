"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";

import { ANNUALIZATION, sortedAscending } from "@/lib/aggregate";
import { fmtPercent, fmtTime, fmtUSD, pnlPercent } from "@/lib/format";
import { computeMetrics } from "@/lib/metrics";
import {
  INITIAL_EQUITY,
  SYMBOL,
  TIMEFRAME,
} from "@/lib/types";
import { useLiveDashboard, type DashboardInitialData } from "@/features/dashboard/hooks/useLiveDashboard";

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
  const { prediction, state, snapshots, trades, contract } = useLiveDashboard(initial);
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
  // Some public rows contain a long JSON artifact in model_version. The
  // source contract is the stable display label and keeps layout bounded.
  const modelName = contract.model;
  const costs = contract.tradingCosts;

  return (
    <main className="dashboard-shell">
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
              <span>UNIDREAM / PAPER TRADING</span>
              <strong>{SYMBOL} · {TIMEFRAME}</strong>
            </div>
          </div>

          <div className="dashboard-header__status">
            <span className="dashboard-model"><small>MODEL</small>{modelName}</span>
            <Countdown />
          </div>
        </header>

        <div className="dashboard-alert">
          <span className="dashboard-alert__dot" aria-hidden="true" />
          <p>This is a research demo, not financial advice. Virtual paper-trading only.</p>
          <Link href="/homepage">Company overview <span aria-hidden="true">↗</span></Link>
        </div>

        <section className="dashboard-intro" aria-labelledby="dashboard-title">
          <div className="dashboard-intro__copy">
            <p className="dashboard-kicker">LIVE SURFACE / B&amp;H-RELATIVE VIEW</p>
            <h1 id="dashboard-title">B&amp;Hを基準に、<br /><em>AIの差分を見る。</em></h1>
            <p className="dashboard-intro__lead">
              Buy &amp; Holdを1.0の基準に置き、ライブのequity、position、tradesを同じ時間軸で確認します。
              ここで表示するのは仮想ペーパートレードの観測値です。
            </p>
          </div>

          <div className="dashboard-intro__readout" aria-label="Current B&H overlay readout">
            <div>
              <span>BASELINE / B&amp;H</span>
              <strong>1.0000</strong>
              <small>reference position</small>
            </div>
            <div>
              <span>CURRENT TARGET</span>
              <strong>{currentPosition.toFixed(3)}</strong>
              <small>live strategy position</small>
            </div>
            <div>
              <span>LAST CLOSED BAR</span>
              <strong>{fmtTime(lastTimestamp)}</strong>
              <small>{SYMBOL} · {TIMEFRAME}</small>
            </div>
          </div>
        </section>

        <section className="dashboard-kpi-grid" aria-label="Live account snapshot">
          <StatCard
            label="Equity"
            value={fmtUSD(equity)}
            hint={`PnL ${pnl >= 0 ? "+" : ""}${pnl.toFixed(2)}% from start`}
            tone={pnlTone}
          />
          <StatCard
            label="Cash"
            value={fmtUSD(cash)}
            hint={`asset_qty ${assetQty.toFixed(6)}`}
          />
          <StatCard label="Last price" value={fmtUSD(lastPrice)} hint={fmtTime(lastTimestamp)} />
          <StatCard
            label="Latest signal"
            value={prediction?.signal ?? "—"}
            hint={`raw position ${prediction?.position?.toFixed(3) ?? "—"}`}
            tone={signalTone}
          />
        </section>

        <section className="dashboard-primary-grid" aria-label="Performance and current position">
          <div className="dashboard-primary-grid__chart">
            <PerformanceChart
              snapshots={sortedSnapshots}
              trades={trades}
              range={range}
              onRangeChange={handleRangeChange}
            />
          </div>
          <aside className="dashboard-primary-grid__aside">
            <PositionGauge
              position={currentPosition}
              equity={equity}
              cash={cash}
              assetQty={assetQty}
              positionHistory={positionHistory}
            />
            <LongShortBar
              longPct={metrics.longPct}
              shortPct={metrics.shortPct}
              flatPct={metrics.flatPct}
            />
          </aside>
        </section>

        <section className="dashboard-section" aria-labelledby="metrics-title">
          <div className="dashboard-section__heading">
            <div>
              <p className="dashboard-kicker">WINDOW METRICS</p>
              <h2 id="metrics-title">B&amp;Hとの差分を、同じ窓で読む。</h2>
            </div>
            <span>selected chart window · {metrics.bars.toLocaleString()} bars</span>
          </div>
          <MetricsRow metrics={metrics} />
        </section>

        <section className="dashboard-section dashboard-trades" aria-labelledby="trades-title">
          <div className="dashboard-section__heading">
            <div>
              <p className="dashboard-kicker">EXECUTION TRACE</p>
              <h2 id="trades-title">Recent trades</h2>
            </div>
            <span>paper fills · latest first</span>
          </div>
          <TradesTable trades={trades} />
        </section>

        <section className="dashboard-contract" aria-labelledby="contract-title">
          <div className="dashboard-section__heading">
            <div>
              <p className="dashboard-kicker">PROVENANCE / DISPLAY CONTRACT</p>
              <h2 id="contract-title">推論を、表示契約まで戻れる形にする。</h2>
            </div>
            <span className="dashboard-contract__badge">SOURCE-CONFIGURED</span>
          </div>

          <dl className="dashboard-contract__grid">
            <div><dt>MODEL</dt><dd>{contract.model}</dd></div>
            <div><dt>SCHEMA</dt><dd>{contract.featureSchema}</dd></div>
            <div><dt>PARITY</dt><dd>{contract.featureParity}</dd></div>
            <div><dt>DERIVATIVES</dt><dd>{contract.derivativeInputs}</dd></div>
            <div><dt>CUTOFF</dt><dd>{contract.observationCutoff}</dd></div>
            <div><dt>WRITE PATH</dt><dd>{contract.atomicCommit}</dd></div>
            <div>
              <dt>COSTS</dt>
              <dd>fee {(costs.fee_rate * 10_000).toFixed(1)}bps · spread {costs.spread_bps.toFixed(1)}bps · slippage {costs.slippage_bps.toFixed(1)}bps</dd>
            </div>
          </dl>
          <p className="dashboard-contract__note">
            These fields describe the deployed source contract. The current public rows do not persist per-row provenance or a live health verdict.
          </p>
        </section>

        <footer className="dashboard-footer">
          <div className="dashboard-footer__links">
            <a href="https://github.com/shinji-ogasa/UniDream" target="_blank" rel="noopener noreferrer">Research repo ↗</a>
            <a href="https://huggingface.co/spaces/ShinjiAA/unidream-space" target="_blank" rel="noopener noreferrer">Inference Space ↗</a>
            <Link href="/homepage">Company overview ↗</Link>
          </div>
          <p>Data: Binance public API · Inference: UniDream HF Space · Storage &amp; realtime: Supabase</p>
          <p>Last closed bar {fmtTime(lastTimestamp)} · recorded {fmtTime(prediction?.created_at)} · Alpha (window excess) {fmtPercent(metrics.alphaEx, 2, true)}</p>
        </footer>
      </div>
    </main>
  );
}
