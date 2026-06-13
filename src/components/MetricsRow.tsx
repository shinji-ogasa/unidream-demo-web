import { fmtPercent, fmtSigned } from "@/lib/format";
import type { WindowMetrics } from "@/lib/metrics";

type Props = {
  metrics: WindowMetrics;
};

type Tone = "good" | "bad" | "default";

function tone(value: number, betterIsHigher: boolean): Tone {
  if (Math.abs(value) < 1e-9) return "default";
  if (betterIsHigher) return value > 0 ? "good" : "bad";
  return value < 0 ? "good" : "bad";
}

const TONE_CLASS: Record<Tone, string> = {
  good: "text-[#4ade80]",
  bad: "text-[#ff6467]",
  default: "text-[#d0d6e0]",
};

const TONE_DOT: Record<Tone, string> = {
  good: "bg-[#4ade80]",
  bad: "bg-[#ff6467]",
  default: "bg-white/30",
};

function Cell({
  label,
  value,
  hint,
  tone: t = "default",
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: Tone;
}) {
  return (
    <div className="rounded-[28px] border border-white/[0.08] bg-gradient-to-b from-white/[0.06] to-white/[0.02] backdrop-blur-sm p-4 flex flex-col gap-1.5 hover:-translate-y-0.5 transition-transform duration-200 shadow-panel">
      <div className="flex items-center gap-2">
        <span className={`h-1.5 w-1.5 rounded-full ${TONE_DOT[t]}`} />
        <div className="label">{label}</div>
      </div>
      <div className={`text-2xl font-mono leading-tight ${TONE_CLASS[t]}`}>{value}</div>
      {hint && <div className="text-sm font-mono text-[#8a93a3] leading-snug">{hint}</div>}
    </div>
  );
}

export function MetricsRow({ metrics }: Props) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <Cell
        label="Alpha (excess)"
        value={fmtPercent(metrics.alphaEx, 2, true)}
        hint={`strat ${fmtPercent(metrics.stratReturn, 2, true)} · B&H ${fmtPercent(metrics.bnhReturn, 2, true)}`}
        tone={tone(metrics.alphaEx, true)}
      />
      <Cell
        label="Sharpe Δ"
        value={fmtSigned(metrics.sharpeDelta, 2)}
        hint={`strat ${metrics.sharpeStrat.toFixed(2)} · B&H ${metrics.sharpeBnh.toFixed(2)}`}
        tone={tone(metrics.sharpeDelta, true)}
      />
      <Cell
        label="MaxDD Δ"
        value={fmtPercent(metrics.maxDDDelta, 2, true)}
        hint={`strat ${fmtPercent(metrics.maxDDStrat)} · B&H ${fmtPercent(metrics.maxDDBnh)}`}
        tone={tone(metrics.maxDDDelta, false)}
      />
      <Cell
        label="Turnover"
        value={`${metrics.turnover.toFixed(2)}x`}
        hint={`${metrics.trades} trades · ${metrics.bars} bars`}
      />
    </div>
  );
}
