"use client";

import { useMemo } from "react";
import {
  Brush,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { tickLabel } from "@/lib/aggregate";
import { buildBuyAndHoldEquity } from "@/lib/metrics";
import { INITIAL_EQUITY, SYMBOL, TIMEFRAME, type EquitySnapshot } from "@/lib/types";

type Range = { startIndex: number; endIndex: number };

type Props = {
  // snapshots is expected to be sorted ascending at 15m granularity.
  snapshots: EquitySnapshot[];
  range: Range | null;
  onRangeChange: (range: Range) => void;
};

type Row = {
  t: number;
  label: string;
  equity: number;
  bnh: number;
};

function returnPercent(value: number, start: number): number {
  if (!Number.isFinite(value) || !Number.isFinite(start) || start <= 0) return 0;
  return ((value / start) - 1) * 100;
}

function formatPerformance(value: number): string {
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
}

export function PerformanceChart({ snapshots, range, onRangeChange }: Props) {
  const data: Row[] = useMemo(() => {
    if (snapshots.length === 0) return [];
    const bnhEquities = buildBuyAndHoldEquity(snapshots, INITIAL_EQUITY);
    const strategyStart = snapshots[0]?.equity ?? INITIAL_EQUITY;
    const bnhStart = bnhEquities[0] ?? INITIAL_EQUITY;
    const rows: Row[] = [];
    for (const s of snapshots) {
      const t = new Date(s.timestamp).getTime();
      rows.push({
        t,
        label: tickLabel(t),
        equity: returnPercent(s.equity, strategyStart),
        bnh: returnPercent(bnhEquities[rows.length] ?? bnhStart, bnhStart),
      });
    }
    return rows;
  }, [snapshots]);

  const lastIdx = Math.max(0, data.length - 1);
  const safeStart = range
    ? Math.max(0, Math.min(range.startIndex, lastIdx))
    : 0;
  const safeEnd = range
    ? Math.max(safeStart, Math.min(range.endIndex, lastIdx))
    : lastIdx;

  return (
    <section className="dashboard-chart dashboard-panel">
      <div className="dashboard-panel__header">
        <div>
          <div className="dashboard-panel__label">
            <span className="dashboard-panel__dot dashboard-panel__dot--cyan" />
            <span>{SYMBOL} / {TIMEFRAME}</span>
          </div>
          <h2>AI <span className="dashboard-chart__vs">vs</span> B&amp;H</h2>
        </div>
        <div className="dashboard-chart__header-side">
          <div className="dashboard-chart__legend" aria-label="Chart legend">
            <LegendSwatch color="#02b8cc" label="AI" />
            <LegendSwatch color="rgba(226,232,240,0.86)" label="B&amp;H" dashed />
          </div>
          <span className="dashboard-panel__meta">RETURN % · START 0</span>
        </div>
      </div>
      <div className="dashboard-chart__canvas">
        {data.length === 0 ? (
          <div className="dashboard-chart__empty">
            No equity history yet. Run the backfill or trigger the Edge Function.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 14, right: 18, bottom: 8, left: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#222831" />
              <XAxis
                dataKey="label"
                tick={{ fill: "#a1a8b3", fontSize: 12 }}
                stroke="#222831"
                interval="preserveStartEnd"
                minTickGap={48}
              />
              <YAxis
                tick={{ fill: "#a1a8b3", fontSize: 13 }}
                stroke="#222831"
                domain={["auto", "auto"]}
                tickFormatter={(v: number) => `${v > 0 ? "+" : ""}${Math.round(v)}%`}
                width={64}
              />
              <Tooltip
                contentStyle={{
                  background: "#13161b",
                  border: "1px solid #222831",
                  color: "#e5e7eb",
                  fontSize: 13,
                  padding: "8px 12px",
                }}
                labelStyle={{ color: "#8b95a5", fontSize: 12 }}
                formatter={(v: number, name: string) => {
                  if (name === "bnh") return [formatPerformance(v), "B&H"];
                  return [formatPerformance(v), "AI"];
                }}
              />
              <ReferenceLine y={0} stroke="#3a4150" strokeDasharray="4 4" />
              <Line
                type="monotone"
                dataKey="equity"
                stroke="#02b8cc"
                strokeWidth={2.5}
                dot={false}
                isAnimationActive={false}
                name="equity"
              />
              <Line
                type="monotone"
                dataKey="bnh"
                stroke="rgba(226,232,240,0.86)"
                strokeWidth={1.8}
                strokeDasharray="6 4"
                dot={false}
                isAnimationActive={false}
                name="bnh"
              />
              <Brush
                dataKey="label"
                height={28}
                stroke="rgba(255,255,255,0.15)"
                fill="rgba(255,255,255,0.03)"
                travellerWidth={10}
                startIndex={safeStart}
                endIndex={safeEnd}
                onChange={(r) => {
                  if (
                    typeof r?.startIndex === "number" &&
                    typeof r?.endIndex === "number"
                  ) {
                    onRangeChange({ startIndex: r.startIndex, endIndex: r.endIndex });
                  }
                }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>
    </section>
  );
}

function LegendSwatch({ color, label, dashed = false }: { color: string; label: string; dashed?: boolean }) {
  return (
    <span className="flex items-center gap-2">
      <span
        className="inline-block w-5 h-[3px] rounded"
        style={{ background: dashed ? `repeating-linear-gradient(90deg, ${color} 0 5px, transparent 5px 8px)` : color }}
      />
      <span>{label}</span>
    </span>
  );
}
