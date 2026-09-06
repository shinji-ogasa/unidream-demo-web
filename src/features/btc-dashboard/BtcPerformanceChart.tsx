"use client";

import { useMemo } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { BtcSnapshot } from "@/lib/btc-release";
import { fmtTime } from "@/lib/format";

export function BtcPerformanceChart({
  snapshots,
}: {
  snapshots: BtcSnapshot[];
}) {
  const points = useMemo(
    () =>
      snapshots.map((s) => ({
        time: new Date(s.timestamp).getTime(),
        strategy: (s.equity - 1) * 100,
        benchmark: (s.benchmark_equity - 1) * 100,
      })),
    [snapshots],
  );
  return (
    <section
      className="dashboard-chart dashboard-panel btc-chart"
      aria-label="公開後のペーパートレードとB&Hの比較"
    >
      <div className="dashboard-panel__header">
        <div>
          <div className="dashboard-panel__label">PUBLIC PAPER · START 0%</div>
          <h2>
            WM + RL <span className="dashboard-chart__vs">vs</span> B&amp;H
          </h2>
        </div>
        <div className="btc-chart-legend">
          <span>● WM + RL</span>
          <span>┄ B&amp;H</span>
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
            <LineChart
              data={points}
              margin={{ top: 12, right: 16, bottom: 8, left: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#222831" />
              <XAxis
                dataKey="time"
                type="number"
                domain={["dataMin", "dataMax"]}
                tickFormatter={(value) =>
                  new Date(value).toISOString().slice(5, 10)
                }
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
                  `${value >= 0 ? "+" : ""}${value.toFixed(3)}%`,
                  name === "strategy" ? "WM + RL" : "B&H",
                ]}
                contentStyle={{
                  background: "#13161b",
                  border: "1px solid #303843",
                  fontSize: 12,
                }}
              />
              <ReferenceLine y={0} stroke="#58616f" />
              <Line
                type="linear"
                dataKey="benchmark"
                stroke="#d6dce5"
                strokeDasharray="6 4"
                strokeWidth={1.5}
                dot={false}
                isAnimationActive={false}
              />
              <Line
                type="linear"
                dataKey="strategy"
                stroke="#02b8cc"
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
      <p className="btc-caption">
        初期NAV
        1からの変化。約定・借入コストを反映した確定足の値です。最大10,000本を表示し、基準は実行開始時のまま保持します。
      </p>
    </section>
  );
}
