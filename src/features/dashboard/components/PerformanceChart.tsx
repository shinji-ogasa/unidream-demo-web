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
import {
  INITIAL_EQUITY,
  SYMBOL,
  TIMEFRAME,
  type EquitySnapshot,
  type Trade,
} from "@/lib/types";

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
};

type TradeDirection = "up" | "down" | "flat";

type TradeMarker = {
  x: number;
  y: number;
  direction: TradeDirection;
};

function returnPercent(value: number, start: number): number {
  if (!Number.isFinite(value) || !Number.isFinite(start) || start <= 0) return 0;
  return ((value / start) - 1) * 100;
}

function formatPerformance(value: number): string {
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
}

export function PerformanceChart({ snapshots, trades, range, onRangeChange }: Props) {
  const data: Row[] = useMemo(() => {
    if (snapshots.length === 0) return [];
    const strategyStart = snapshots[0]?.equity ?? INITIAL_EQUITY;
    // AlphaEx compares the strategy return with the raw B&H price return.
    const bnhStart = snapshots[0]?.price ?? 0;
    const rows: Row[] = [];
    for (const s of snapshots) {
      const t = new Date(s.timestamp).getTime();
      rows.push({
        t,
        label: tickLabel(t),
        equity: returnPercent(s.equity, strategyStart),
        bnh: returnPercent(s.price, bnhStart),
      });
    }
    return rows;
  }, [snapshots]);

  const tradeMarkers: TradeMarker[] = useMemo(() => {
    if (data.length === 0 || trades.length === 0) return [];

    return trades.flatMap((trade) => {
      const tradeTime = new Date(trade.timestamp).getTime();
      if (!Number.isFinite(tradeTime)) return [];

      let nearestIndex = 0;
      let nearestDistance = Number.POSITIVE_INFINITY;
      for (let index = 0; index < snapshots.length; index += 1) {
        const snapshotTime = new Date(snapshots[index]?.timestamp ?? "").getTime();
        const distance = Math.abs(snapshotTime - tradeTime);
        if (distance < nearestDistance) {
          nearestIndex = index;
          nearestDistance = distance;
        }
      }

      const row = data[nearestIndex];
      if (!row) return [];

      const direction: TradeDirection =
        trade.to_position > trade.from_position
          ? "up"
          : trade.to_position < trade.from_position
            ? "down"
            : "flat";

      return [{ x: nearestIndex, y: row.equity, direction }];
    });
  }, [data, snapshots, trades]);

  const lastIdx = Math.max(0, data.length - 1);
  const safeStart = range
    ? Math.max(0, Math.min(range.startIndex, lastIdx))
    : 0;
  const safeEnd = range
    ? Math.max(safeStart, Math.min(range.endIndex, lastIdx))
    : lastIdx;
  const visibleTradeMarkers = tradeMarkers.filter(
    (marker) => marker.x >= safeStart && marker.x <= safeEnd,
  );
  const tradeAxisEnd = Math.max(safeStart + 1, safeEnd);

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
            <TradeLegend />
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
              <XAxis
                xAxisId="trade"
                type="number"
                dataKey="x"
                domain={[safeStart, tradeAxisEnd]}
                allowDataOverflow
                hide
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
              <Scatter
                xAxisId="trade"
                yAxisId={0}
                data={visibleTradeMarkers}
                dataKey="y"
                name="trades"
                shape={<TradeMarkerShape />}
                isAnimationActive={false}
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

function TradeLegend() {
  return (
    <span className="dashboard-chart__trade-legend">
      <span className="dashboard-chart__trade-legend-mark" aria-hidden="true">
        <span className="dashboard-chart__trade-legend-mark--up">▲</span>
        <span className="dashboard-chart__trade-legend-mark--down">▼</span>
      </span>
      <span>TRADES</span>
    </span>
  );
}

function TradeMarkerShape({
  cx,
  cy,
  direction,
}: {
  cx?: number;
  cy?: number;
  direction?: TradeDirection;
}) {
  if (typeof cx !== "number" || typeof cy !== "number") return null;

  const isDown = direction === "down";
  const color = direction === "up" ? "#b9ef6d" : isDown ? "#ff7d8b" : "#a1a8b3";
  const points = isDown
    ? `${cx},${cy + 7} ${cx - 6},${cy - 5} ${cx + 6},${cy - 5}`
    : `${cx},${cy - 7} ${cx - 6},${cy + 5} ${cx + 6},${cy + 5}`;

  return (
    <g pointerEvents="none">
      <polygon points={points} fill={color} stroke="#05070b" strokeWidth={1.5} />
    </g>
  );
}
