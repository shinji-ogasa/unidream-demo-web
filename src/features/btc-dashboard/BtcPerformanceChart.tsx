"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Area,
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
import type { BtcEvent, BtcSnapshot } from "@/lib/btc-release";
import { fmtTime } from "@/lib/format";

type ChartPoint = {
  time: number;
  strategy: number;
  benchmark: number;
};

type MarkerKind = "fill" | "intent" | "expired";
type MarkerDirection = "up" | "down" | "flat";

type EventMarker = {
  index: number;
  time: number;
  y: number;
  kind: MarkerKind;
  direction: MarkerDirection;
};

function eventKind(event: BtcEvent): MarkerKind | null {
  if (event.kind === "fill" || event.kind === "intent" || event.kind === "expired") {
    return event.kind;
  }
  if (event.kind !== "account") return null;
  const fill = event.details.fill;
  if (!fill || typeof fill !== "object" || Array.isArray(fill)) return null;
  const fillRecord = fill as Record<string, unknown>;
  if (fillRecord.status === "filled") return "fill";
  if (fillRecord.status === "expired_missing_open") return "expired";
  return null;
}

function nearestPointIndex(points: ChartPoint[], timestamp: number): number {
  let nearest = 0;
  let distance = Number.POSITIVE_INFINITY;
  for (let index = 0; index < points.length; index += 1) {
    const nextDistance = Math.abs(points[index].time - timestamp);
    if (nextDistance < distance) {
      nearest = index;
      distance = nextDistance;
    }
  }
  return nearest;
}

function recordsForEvent(event: BtcEvent): Record<string, unknown>[] {
  const records = [event.details];
  const fill = event.details.fill;
  if (fill && typeof fill === "object" && !Array.isArray(fill)) {
    records.push(fill as Record<string, unknown>);
  }
  return records;
}

function numericDetail(records: Record<string, unknown>[], ...keys: string[]): number | null {
  for (const record of records) {
    for (const key of keys) {
      const value = record[key];
      if (typeof value === "number" && Number.isFinite(value)) return value;
    }
  }
  return null;
}

function eventDirection(event: BtcEvent): MarkerDirection {
  const records = recordsForEvent(event);
  const from = numericDetail(
    records,
    "from_position",
    "exposure_before",
    "previous_exposure",
    "known_open_exposure",
  );
  const to = numericDetail(
    records,
    "to_position",
    "exposure_after",
    "current_position",
    "target_position",
    "target",
    "due_target",
  );
  if (from === null || to === null || to === from) return "flat";
  return to > from ? "up" : "down";
}

function chartPercent(value: number): string {
  return `${value >= 0 ? "+" : ""}${value.toFixed(3)}%`;
}

export function BtcPerformanceChart({
  snapshots,
  events,
}: {
  snapshots: BtcSnapshot[];
  events: BtcEvent[];
}) {
  const points = useMemo<ChartPoint[]>(
    () =>
      snapshots
        .map((s) => ({
          time: new Date(s.timestamp).getTime(),
          strategy: (s.equity - 1) * 100,
          benchmark: (s.benchmark_equity - 1) * 100,
        }))
        .filter(
          (point) =>
            Number.isFinite(point.time) &&
            Number.isFinite(point.strategy) &&
            Number.isFinite(point.benchmark),
        ),
    [snapshots],
  );
  const eventMarkers = useMemo<EventMarker[]>(() => {
    if (points.length === 0) return [];
    return events.flatMap((event) => {
      const kind = eventKind(event);
      const timestamp = new Date(event.timestamp).getTime();
      if (!kind || !Number.isFinite(timestamp)) return [];
      const index = nearestPointIndex(points, timestamp);
      const point = points[index];
      return [{
        index,
        time: point.time,
        y: point.strategy,
        kind,
        direction: eventDirection(event),
      }];
    });
  }, [events, points]);
  const [range, setRange] = useState({ startIndex: 0, endIndex: 0 });

  useEffect(() => {
    const lastIndex = Math.max(0, points.length - 1);
    setRange((previous) => {
      if (points.length <= 1 || (previous.startIndex === 0 && previous.endIndex === 0)) {
        return { startIndex: 0, endIndex: lastIndex };
      }
      const span = Math.min(lastIndex, previous.endIndex - previous.startIndex);
      return {
        startIndex: Math.max(0, lastIndex - span),
        endIndex: lastIndex,
      };
    });
  }, [points.length]);

  const lastIndex = Math.max(0, points.length - 1);
  const safeStart = Math.max(0, Math.min(range.startIndex, lastIndex));
  const safeEnd = Math.max(safeStart, Math.min(range.endIndex, lastIndex));
  const visibleEventMarkers = eventMarkers.filter(
    (marker) => marker.index >= safeStart && marker.index <= safeEnd,
  );
  // Recharts includes child-level data (the event marker Scatter) when it
  // derives an axis domain. The marker list can contain only one timestamp,
  // which would collapse every performance point onto one vertical line.
  // Anchor the domain to the actual performance series and current Brush span.
  const xDomain: [number, number] | ["dataMin", "dataMax"] = points.length > 0
    ? [points[safeStart]?.time ?? 0, points[safeEnd]?.time ?? 0]
    : ["dataMin", "dataMax"];
  const latest = points.at(-1);
  const latestDelta = latest ? latest.strategy - latest.benchmark : null;

  return (
    <section
      className="dashboard-chart dashboard-panel btc-chart"
      aria-label="公開後のペーパートレードとB&Hの比較"
    >
      <div className="dashboard-panel__header btc-chart__header">
        <div>
          <div className="dashboard-panel__label">PUBLIC PAPER · START 0%</div>
          <h2>
            WM + RL <span className="dashboard-chart__vs">vs</span> B&amp;H
          </h2>
        </div>
        <div className="btc-chart__header-side">
          <div className="btc-chart-legend" aria-label="Chart legend">
            <span className="btc-chart-legend__strategy">● WM + RL</span>
            <span className="btc-chart-legend__benchmark">┄ B&amp;H</span>
            <span className="btc-chart-legend__events">▲▼ fills · ◇ orders · × expired</span>
          </div>
          <div className="btc-chart__meta">
            <span>{points.length.toLocaleString()} BARS</span>
            <span>{latest ? fmtTime(new Date(latest.time).toISOString()) : "—"}</span>
            {latestDelta !== null ? <strong>Δ {chartPercent(latestDelta)}</strong> : null}
          </div>
        </div>
      </div>
      <div className="dashboard-chart__canvas">
        {points.length < 2 ? (
          <div className="dashboard-chart__empty">
            {points.length === 0
              ? "最初の確定足を待っています。"
              : "比較曲線は2本目の確定足から表示します。"}
            <small>
              新しい実行履歴が届くと、ここに同じ初期保有からの変化を表示します。
            </small>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={points}
              margin={{ top: 12, right: 16, bottom: 8, left: 0 }}
            >
              <defs>
                <linearGradient id="btcStrategyFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#02b8cc" stopOpacity={0.22} />
                  <stop offset="100%" stopColor="#02b8cc" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#222831" />
              <XAxis
                dataKey="time"
                type="number"
                domain={xDomain}
                tickFormatter={(value) => new Date(value).toISOString().slice(5, 10)}
                tick={{ fill: "#a1a8b3", fontSize: 11 }}
                minTickGap={40}
              />
              <YAxis
                width={58}
                tickFormatter={(value) => `${value.toFixed(1)}%`}
                tick={{ fill: "#a1a8b3", fontSize: 11 }}
                domain={["auto", "auto"]}
              />
              <Tooltip
                labelFormatter={(value) =>
                  fmtTime(new Date(Number(value)).toISOString())
                }
                formatter={(value: number, name: string) => [
                  chartPercent(value),
                  name === "strategy" ? "WM + RL" : name === "benchmark" ? "B&H" : "event",
                ]}
                contentStyle={{
                  background: "#13161b",
                  border: "1px solid #303843",
                  fontSize: 12,
                }}
              />
              <ReferenceLine y={0} stroke="#58616f" />
              <Area
                type="monotone"
                dataKey="strategy"
                stroke="none"
                fill="url(#btcStrategyFill)"
                isAnimationActive={false}
              />
              <Line
                type="monotone"
                dataKey="benchmark"
                stroke="#d6dce5"
                strokeDasharray="6 4"
                strokeWidth={1.5}
                dot={false}
                isAnimationActive={false}
              />
              <Line
                type="monotone"
                dataKey="strategy"
                stroke="#02b8cc"
                strokeWidth={2.2}
                dot={false}
                isAnimationActive={false}
              />
              <Scatter
                data={visibleEventMarkers}
                dataKey="y"
                name="events"
                shape={<EventMarkerShape />}
                isAnimationActive={false}
              />
              <Brush
                dataKey="time"
                height={24}
                stroke="rgba(2,184,204,0.7)"
                fill="rgba(2,184,204,0.05)"
                travellerWidth={9}
                startIndex={safeStart}
                endIndex={safeEnd}
                tickFormatter={(value) => new Date(value).toISOString().slice(5, 10)}
                onChange={(next) => {
                  if (
                    typeof next?.startIndex === "number" &&
                    typeof next?.endIndex === "number"
                  ) {
                    setRange({
                      startIndex: next.startIndex,
                      endIndex: next.endIndex,
                    });
                  }
                }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>
      <p className="btc-caption">
        初期NAV 1からの変化。約定・借入コストを反映した確定足の値です。下部の範囲つまみで期間を絞り、注文・約定・期限切れを同じ時間軸で確認できます。
      </p>
    </section>
  );
}

function EventMarkerShape({
  cx,
  cy,
  kind,
  direction,
  payload,
}: {
  cx?: number;
  cy?: number;
  kind?: MarkerKind;
  direction?: MarkerDirection;
  payload?: { kind?: MarkerKind; direction?: MarkerDirection };
}) {
  if (typeof cx !== "number" || typeof cy !== "number") return null;
  const markerKind = kind ?? payload?.kind;
  const markerDirection = direction ?? payload?.direction ?? "flat";
  if (markerKind === "intent") {
    return (
      <polygon
        points={`${cx},${cy - 5} ${cx + 5},${cy} ${cx},${cy + 5} ${cx - 5},${cy}`}
        fill="#02b8cc"
        stroke="#071018"
        strokeWidth={1.5}
      />
    );
  }
  if (markerKind === "expired") {
    return (
      <path
        d={`M ${cx - 4.5} ${cy - 4.5} L ${cx + 4.5} ${cy + 4.5} M ${cx + 4.5} ${cy - 4.5} L ${cx - 4.5} ${cy + 4.5}`}
        stroke="#e5b765"
        strokeWidth={2}
        strokeLinecap="round"
      />
    );
  }
  const fillColor = markerDirection === "down" ? "#ff7d8b" : markerDirection === "flat" ? "#a1a8b3" : "#b9ef6d";
  const points = markerDirection === "down"
    ? `${cx},${cy + 7} ${cx - 6},${cy - 5} ${cx + 6},${cy - 5}`
    : `${cx},${cy - 7} ${cx - 6},${cy + 5} ${cx + 6},${cy + 5}`;
  return (
    <polygon
      points={points}
      fill={fillColor}
      stroke="#071018"
      strokeWidth={1.5}
    />
  );
}
