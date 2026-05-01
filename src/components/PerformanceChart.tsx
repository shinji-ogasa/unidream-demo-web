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
import { INITIAL_EQUITY, type EquitySnapshot, type Trade } from "@/lib/types";

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
    const firstPrice = snapshots[0].price > 0 ? snapshots[0].price : 1;
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
        bnh: (s.price / firstPrice) * INITIAL_EQUITY,
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
    <div className="panel p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="text-base font-semibold tracking-tight text-zinc-200">
          Performance vs Buy &amp; Hold
        </div>
        <div className="text-sm font-mono text-zinc-500">15m bars</div>
      </div>
      <div className="h-[480px]">
        {data.length === 0 ? (
          <div className="h-full flex items-center justify-center text-zinc-500 text-base">
            No equity history yet. Run the backfill or trigger the Edge Function.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 12, right: 24, bottom: 8, left: 12 }}>
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
                  if (name === "bnh") return [fmtUSD(v), "B&H"];
                  return [fmtUSD(v), "strategy"];
                }}
              />
              <ReferenceLine y={INITIAL_EQUITY} stroke="#3a4150" strokeDasharray="4 4" />
              <Line
                type="monotone"
                dataKey="bnh"
                stroke="#5b6573"
                strokeWidth={1.5}
                dot={false}
                isAnimationActive={false}
                name="bnh"
              />
              <Line
                type="monotone"
                dataKey="equity"
                stroke="#6ee7b7"
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
                name="equity"
              />
              <Scatter
                dataKey="buyMarker"
                fill="#60a5fa"
                shape={UpTriangle}
                isAnimationActive={false}
                legendType="none"
              />
              <Scatter
                dataKey="sellMarker"
                fill="#f87171"
                shape={DownTriangle}
                isAnimationActive={false}
                legendType="none"
              />
              <Brush
                dataKey="label"
                height={28}
                stroke="#3a4150"
                fill="#0f1115"
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
      <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm font-mono text-zinc-400">
        <LegendSwatch color="#6ee7b7" label="strategy" />
        <LegendSwatch color="#5b6573" label="B&H" />
        <LegendTriangle color="#60a5fa" label="buy" up />
        <LegendTriangle color="#f87171" label="sell" />
      </div>
    </div>
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
