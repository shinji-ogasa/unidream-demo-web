import { fmtNumber, fmtUSD } from "@/lib/format";

type Props = {
  position: number;
  equity: number;
  cash: number;
  assetQty: number;
  // Recent position values (oldest -> newest), used for a sparkline at the
  // bottom so the panel height matches the metrics column on the right and
  // the user can see whether the model has been changing exposure.
  positionHistory: number[];
};

export function PositionGauge({
  position,
  equity,
  cash,
  assetQty,
  positionHistory,
}: Props) {
  const fraction = Math.max(0, Math.min(1, Math.abs(position)));
  const r = 38;
  const circumference = 2 * Math.PI * r;
  const dash = fraction * circumference;
  const isFlat = Math.abs(position) < 1e-6;
  const isLong = position > 0;
  const ringColor = isFlat ? "#626b7a" : isLong ? "#4ade80" : "#ff6467";
  const positionTone = isFlat ? "flat" : isLong ? "long" : "short";
  const labelText = isFlat ? "FLAT" : isLong ? "LONG" : "SHORT";

  const sparkPoints = useSparkPoints(positionHistory);
  const sparkColor = position > 0 ? "#4ade80" : position < 0 ? "#ff6467" : "#626b7a";
  const sparkBars = positionHistory.length;
  const sparkSpanLabel = sparkSpan(sparkBars);

  return (
    <div className="dashboard-position">
      <div className="dashboard-panel__label">
        <span className={`dashboard-panel__dot dashboard-panel__dot--${positionTone}`} />
        <span>Position</span>
      </div>
      <div className="dashboard-position__summary">
        <div className="dashboard-position__gauge">
          <svg viewBox="0 0 100 100" className="dashboard-position__ring -rotate-90">
            <circle cx="50" cy="50" r={r} stroke="rgba(255,255,255,0.08)" strokeWidth="9" fill="none" />
            <circle
              cx="50"
              cy="50"
              r={r}
              stroke={ringColor}
              strokeWidth="9"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={`${dash} ${circumference}`}
              style={{ transition: "stroke-dasharray 400ms ease-out, stroke 200ms ease-out" }}
            />
          </svg>
          <div className="dashboard-position__gauge-label">
            <div className={`dashboard-position__percent dashboard-position__percent--${positionTone}`}>
              {(fraction * 100).toFixed(0)}%
            </div>
            <div className={`dashboard-position__side dashboard-position__side--${positionTone}`}>{labelText}</div>
          </div>
        </div>
        <div className="dashboard-position__details">
          <span>target</span>
          <strong>{position.toFixed(3)}</strong>
          <span>cash</span>
          <strong>{fmtUSD(cash)}</strong>
          <span>qty</span>
          <strong>{fmtNumber(assetQty, 6)}</strong>
          <span>equity</span>
          <strong>{fmtUSD(equity)}</strong>
        </div>
      </div>
      <div className="dashboard-position__history">
        <div className="dashboard-position__history-head">
          <span>POSITION HISTORY</span>
          <span>{sparkSpanLabel}</span>
        </div>
        <svg viewBox="0 0 100 30" preserveAspectRatio="none" className="dashboard-position__sparkline">
          <line
            x1="0"
            y1="2"
            x2="100"
            y2="2"
            stroke="rgba(255,255,255,0.08)"
            strokeDasharray="2 2"
            strokeWidth="0.4"
          />
          <line
            x1="0"
            y1="15"
            x2="100"
            y2="15"
            stroke="rgba(255,255,255,0.08)"
            strokeDasharray="2 2"
            strokeWidth="0.4"
          />
          <line
            x1="0"
            y1="28"
            x2="100"
            y2="28"
            stroke="rgba(255,255,255,0.08)"
            strokeDasharray="2 2"
            strokeWidth="0.4"
          />
          {sparkPoints && (
            <polyline
              points={sparkPoints}
              fill="none"
              stroke={sparkColor}
              strokeWidth="1.4"
              strokeLinejoin="round"
            />
          )}
        </svg>
      </div>
    </div>
  );
}

function useSparkPoints(values: number[]): string | null {
  if (values.length < 2) return null;
  const n = values.length;
  const pts: string[] = [];
  for (let i = 0; i < n; i++) {
    const x = (i / (n - 1)) * 100;
    const v = Math.max(-1, Math.min(1, values[i]));
    // Map [-1, 1] -> y in [28, 2] (top = +1, middle = 0, bottom = -1).
    const y = 15 - v * 13;
    pts.push(`${x.toFixed(2)},${y.toFixed(2)}`);
  }
  return pts.join(" ");
}

function sparkSpan(bars: number): string {
  if (bars === 0) return "no history";
  const minutes = bars * 15;
  if (minutes < 60) return `last ${bars} bars`;
  const hours = minutes / 60;
  if (hours < 48) return `last ${hours.toFixed(0)}h (${bars} bars)`;
  const days = hours / 24;
  return `last ${days.toFixed(1)}d (${bars} bars)`;
}
