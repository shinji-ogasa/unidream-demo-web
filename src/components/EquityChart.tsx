"use client";

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

import type { EquitySnapshot } from "@/lib/types";
import { INITIAL_EQUITY } from "@/lib/types";
import { fmtUSD } from "@/lib/format";

type Props = {
  snapshots: EquitySnapshot[];
};

export function EquityChart({ snapshots }: Props) {
  const data = snapshots
    .slice()
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    .map((s) => ({
      t: new Date(s.timestamp).getTime(),
      equity: s.equity,
      label: new Date(s.timestamp).toISOString().slice(5, 16).replace("T", " "),
    }));

  if (data.length === 0) {
    return (
      <div className="panel p-6 h-72 flex items-center justify-center text-zinc-500 text-sm">
        No equity history yet. Trigger the Edge Function to record the first snapshot.
      </div>
    );
  }

  return (
    <div className="panel p-4 h-72">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 16, bottom: 8, left: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#222831" />
          <XAxis dataKey="label" tick={{ fill: "#8b95a5", fontSize: 11 }} stroke="#222831" />
          <YAxis
            tick={{ fill: "#8b95a5", fontSize: 11 }}
            stroke="#222831"
            domain={["auto", "auto"]}
            tickFormatter={(v) => `$${Math.round(v).toLocaleString()}`}
          />
          <Tooltip
            contentStyle={{ background: "#13161b", border: "1px solid #222831", color: "#e5e7eb" }}
            formatter={(v: number) => [fmtUSD(v), "equity"]}
          />
          <ReferenceLine y={INITIAL_EQUITY} stroke="#444" strokeDasharray="4 4" label={{ value: `start ${fmtUSD(INITIAL_EQUITY)}`, fill: "#8b95a5", fontSize: 10, position: "right" }} />
          <Line type="monotone" dataKey="equity" stroke="#6ee7b7" dot={false} strokeWidth={2} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
