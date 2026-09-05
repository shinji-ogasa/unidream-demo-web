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
    <div className={`dashboard-metric-cell dashboard-metric-cell--${t}`}>
      <div className="dashboard-metric-cell__label">
        <span className="dashboard-metric-cell__dot" />
        <span>{label}</span>
      </div>
      <div className="dashboard-metric-cell__value">{value}</div>
      {hint && <div className="dashboard-metric-cell__hint">{hint}</div>}
    </div>
  );
}

export function MetricsRow({ metrics }: Props) {
  return (
    <div className="dashboard-metrics-grid">
      <Cell
        label="ALPHAEX"
        value={fmtPercent(metrics.alphaEx, 2, true)}
        hint={`AI ${fmtPercent(metrics.stratReturn, 2, true)} · B&H ${fmtPercent(metrics.bnhReturn, 2, true)}`}
        tone={tone(metrics.alphaEx, true)}
      />
      <Cell
        label="MAXDD Δ"
        value={fmtPercent(metrics.maxDDDelta, 2, true)}
        hint={`lower is better · AI ${fmtPercent(metrics.maxDDStrat)} · B&H ${fmtPercent(metrics.maxDDBnh)}`}
        tone={tone(metrics.maxDDDelta, false)}
      />
      <Cell
        label="SHARPE Δ"
        value={fmtSigned(metrics.sharpeDelta, 2)}
        hint={`AI ${metrics.sharpeStrat.toFixed(2)} · B&H ${metrics.sharpeBnh.toFixed(2)}`}
        tone={tone(metrics.sharpeDelta, true)}
      />
      <Cell
        label="TURNOVER"
        value={metrics.turnover.toFixed(2)}
        hint={`${metrics.trades} trades · ${metrics.bars} bars`}
      />
    </div>
  );
}
