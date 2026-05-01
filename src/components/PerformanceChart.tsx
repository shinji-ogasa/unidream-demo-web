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

import { aggregateSnapshots, bucketLabel, TF_OPTIONS, type Tf } from "@/lib/aggregate";
import { fmtUSD } from "@/lib/format";
import { INITIAL_EQUITY, type EquitySnapshot, type Trade } from "@/lib/types";

type Props = {
  snapshots: EquitySnapshot[];
  trades: Trade[];
  tf: Tf;
  onTfChange: (tf: Tf) => void;
  onVisibleChange?: (range: { startIndex: number; endIndex: number }) => void;
};

type Row = {
  t: number;
  label: string;
  equity: number;
  bnh: number;
  buyMarker: number | null;
  sellMarker: number | null;
};

const INITIAL_BRUSH_WINDOW = 100;

export function PerformanceChart({ snapshots, trades, tf, onTfChange, onVisibleChange }: Props) {
  const aggregated = useMemo(() => aggregateSnapshots(snapshots, tf), [snapshots, tf]);

  const data: Row[] = useMemo(() => {
    if (aggregated.length === 0) return [];
    const firstPrice = aggregated[0].price > 0 ? aggregated[0].price : 1;
    const sortedTrades = [...trades].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    );
    let tIdx = 0;
    let prevT = -Infinity;
    const rows: Row[] = [];
    for (const s of aggregated) {
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
      const bnh = (s.price / firstPrice) * INITIAL_EQUITY;
      rows.push({
        t,
        label: bucketLabel(t, tf),
        equity: s.equity,
        bnh,
        buyMarker,
        sellMarker,
      });
    }
    return rows;
  }, [aggregated, trades, tf]);

  const initialEnd = data.length === 0 ? 0 : data.length - 1;
  const initialStart = Math.max(0, data.length - INITIAL_BRUSH_WINDOW);

  return (
    <div className="panel p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="label">Performance vs Buy & Hold</div>
        <div className="flex items-center gap-1 text-xs font-mono">
          {TF_OPTIONS.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => onTfChange(opt)}
              className={`px-2 py-1 rounded border transition-colors ${
                opt === tf
                  ? "bg-emerald-400/10 border-emerald-400/40 text-emerald-300"
                  : "bg-transparent border-[#222831] text-zinc-400 hover:text-zinc-200"
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>
      <div className="h-96">
        {data.length === 0 ? (
          <div className="h-full flex items-center justify-center text-zinc-500 text-sm">
            No equity history yet. Run the backfill or trigger the Edge Function.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart key={tf} data={data} margin={{ top: 8, right: 16, bottom: 4, left: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#222831" />
              <XAxis
                dataKey="label"
                tick={{ fill: "#8b95a5", fontSize: 10 }}
                stroke="#222831"
                interval="preserveStartEnd"
                minTickGap={32}
              />
              <YAxis
                tick={{ fill: "#8b95a5", fontSize: 11 }}
                stroke="#222831"
                domain={["auto", "auto"]}
                tickFormatter={(v: number) => `$${Math.round(v).toLocaleString()}`}
              />
              <Tooltip
                contentStyle={{
                  background: "#13161b",
                  border: "1px solid #222831",
                  color: "#e5e7eb",
                  fontSize: 12,
                }}
                labelStyle={{ color: "#8b95a5" }}
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
                height={22}
                stroke="#3a4150"
                fill="#0f1115"
                travellerWidth={8}
                startIndex={initialStart}
                endIndex={initialEnd}
                onChange={(range) => {
                  if (
                    onVisibleChange &&
                    typeof range?.startIndex === "number" &&
                    typeof range?.endIndex === "number"
                  ) {
                    onVisibleChange({ startIndex: range.startIndex, endIndex: range.endIndex });
                  }
                }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] font-mono text-zinc-400">
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
    <span className="flex items-center gap-1.5">
      <span className="inline-block w-4 h-[2px]" style={{ background: color }} />
      <span>{label}</span>
    </span>
  );
}

function LegendTriangle({ color, label, up }: { color: string; label: string; up?: boolean }) {
  return (
    <span className="flex items-center gap-1.5">
      <svg width={10} height={10} viewBox="0 0 10 10" aria-hidden="true">
        {up ? (
          <polygon points="5,1 1,9 9,9" fill={color} />
        ) : (
          <polygon points="5,9 1,1 9,1" fill={color} />
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
  const size = 5;
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
  const size = 5;
  return (
    <polygon
      points={`${cx},${cy + size} ${cx - size},${cy - size} ${cx + size},${cy - size}`}
      fill={fill}
      stroke="#0b0d10"
      strokeWidth={0.8}
    />
  );
}
