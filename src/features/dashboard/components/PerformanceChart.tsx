"use client";

import { useMemo } from "react";
import {
  Brush,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { tickLabel } from "@/lib/aggregate";
import { fmtUSD } from "@/lib/format";
import { buildBuyAndHoldEquity } from "@/lib/metrics";
import { INITIAL_EQUITY, SYMBOL, TIMEFRAME, type EquitySnapshot, type Trade } from "@/lib/types";

type Range = { startIndex: number; endIndex: number };

type Props = {
  // snapshots is expected to be sorted ascending at 15m granularity.
  snapshots: EquitySnapshot[];
  trades: Trade[];
  range: Range | null;
  onRangeChange: (range: Range) => void;
};

type Row = {
  t: number;
  label: string;
  equity: number;
  bnh: number;
  buyMarker: number | null;
  sellMarker: number | null;
};

export function PerformanceChart({ snapshots, trades, range, onRangeChange }: Props) {
  const data: Row[] = useMemo(() => {
    if (snapshots.length === 0) return [];
    const bnhEquities = buildBuyAndHoldEquity(snapshots, INITIAL_EQUITY);
    const sortedTrades = [...trades].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    );
    let tIdx = 0;
    let prevT = -Infinity;
    const rows: Row[] = [];
    for (const s of snapshots) {
      const t = new Date(s.timestamp).getTime();
      let buyMarker: number | null = null;
      let sellMarker: number | null = null;
      while (tIdx < sortedTrades.length) {
        const tr = sortedTrades[tIdx];
        const trT = new Date(tr.timestamp).getTime();
        if (trT > t) break;
        if (trT > prevT) {
          if (tr.to_position > tr.from_position) buyMarker = s.equity;
          else if (tr.to_position < tr.from_position) sellMarker = s.equity;
        }
        tIdx += 1;
      }
      prevT = t;
      rows.push({
        t,
        label: tickLabel(t),
        equity: s.equity,
        bnh: bnhEquities[rows.length] ?? 0,
        buyMarker,
        sellMarker,
      });
    }
    return rows;
  }, [snapshots, trades]);

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
        <span className="dashboard-panel__meta">NET EQUITY</span>
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
                tickFormatter={(v: number) => `$${Math.round(v).toLocaleString()}`}
                width={72}
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
                  if (name === "buyMarker") return [fmtUSD(v), "buy"];
                  if (name === "sellMarker") return [fmtUSD(v), "sell"];
                  if (name === "bnh") return [fmtUSD(v), "B&H (net entry)"];
                  return [fmtUSD(v), "strategy"];
                }}
              />
              <ReferenceLine y={INITIAL_EQUITY} stroke="#3a4150" strokeDasharray="4 4" />
              <Line
                type="monotone"
                dataKey="bnh"
                stroke="rgba(255,255,255,0.25)"
                strokeWidth={1.5}
                dot={false}
                isAnimationActive={false}
                name="bnh"
              />
              <Line
                type="monotone"
                dataKey="equity"
                stroke="#02b8cc"
                strokeWidth={2.5}
                dot={false}
                isAnimationActive={false}
                name="equity"
              />
              <Scatter
                dataKey="buyMarker"
                fill="#5266eb"
                shape={UpTriangle}
                isAnimationActive={false}
                legendType="none"
              />
              <Scatter
                dataKey="sellMarker"
                fill="#ff6467"
                shape={DownTriangle}
                isAnimationActive={false}
                legendType="none"
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
      <div className="dashboard-chart__legend">
        <LegendSwatch color="#02b8cc" label="strategy" />
        <LegendSwatch color="rgba(255,255,255,0.25)" label="B&H (net entry cost)" />
        <LegendTriangle color="#5266eb" label="buy" up />
        <LegendTriangle color="#ff6467" label="sell" />
      </div>
    </section>
  );
}

function LegendSwatch({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-2">
      <span className="inline-block w-5 h-[3px] rounded" style={{ background: color }} />
      <span>{label}</span>
    </span>
  );
}

function LegendTriangle({ color, label, up }: { color: string; label: string; up?: boolean }) {
  return (
    <span className="flex items-center gap-2">
      <svg width={12} height={12} viewBox="0 0 12 12" aria-hidden="true">
        {up ? (
          <polygon points="6,1 1,11 11,11" fill={color} />
        ) : (
          <polygon points="6,11 1,1 11,1" fill={color} />
        )}
      </svg>
      <span>{label}</span>
    </span>
  );
}

type ShapeProps = {
  cx?: number;
  cy?: number;
  fill?: string;
};

function UpTriangle(props: ShapeProps) {
  const { cx, cy, fill } = props;
  if (cx == null || cy == null) return <g />;
  const size = 6;
  return (
    <polygon
      points={`${cx},${cy - size} ${cx - size},${cy + size} ${cx + size},${cy + size}`}
      fill={fill}
      stroke="#0b0d10"
      strokeWidth={0.8}
    />
  );
}

function DownTriangle(props: ShapeProps) {
  const { cx, cy, fill } = props;
  if (cx == null || cy == null) return <g />;
  const size = 6;
  return (
    <polygon
      points={`${cx},${cy + size} ${cx - size},${cy - size} ${cx + size},${cy - size}`}
      fill={fill}
      stroke="#0b0d10"
      strokeWidth={0.8}
    />
  );
}
