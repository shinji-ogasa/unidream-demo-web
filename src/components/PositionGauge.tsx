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
  const ringColor = isFlat ? "#52525b" : isLong ? "#6ee7b7" : "#f87171";
  const labelTone = isFlat ? "text-zinc-400" : isLong ? "text-emerald-400" : "text-rose-400";
  const labelText = isFlat ? "FLAT" : isLong ? "LONG" : "SHORT";

  const sparkPoints = useSparkPoints(positionHistory);
  const sparkColor = position > 0 ? "#6ee7b7" : position < 0 ? "#f87171" : "#52525b";
  const sparkBars = positionHistory.length;
  const sparkSpanLabel = sparkSpan(sparkBars);

  return (
    <div className="panel p-5 flex flex-col gap-4">
      <div className="label">Position</div>
      <div className="flex items-center gap-5">
        <div className="relative w-[140px] h-[140px] shrink-0">
          <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
            <circle cx="50" cy="50" r={r} stroke="#222831" strokeWidth="9" fill="none" />
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
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className={`text-2xl font-mono leading-none ${labelTone}`}>
              {(fraction * 100).toFixed(0)}%
            </div>
            <div className={`text-xs tracking-[0.22em] mt-1.5 ${labelTone}`}>{labelText}</div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-sm font-mono w-full">
          <div className="text-zinc-500">target</div>
          <div className="text-right text-zinc-200">{position.toFixed(3)}</div>
          <div className="text-zinc-500">cash</div>
          <div className="text-right text-zinc-200">{fmtUSD(cash)}</div>
          <div className="text-zinc-500">qty</div>
          <div className="text-right text-zinc-200">{fmtNumber(assetQty, 6)}</div>
          <div className="text-zinc-500">equity</div>
          <div className="text-right text-white">{fmtUSD(equity)}</div>
        </div>
      </div>
      <div className="pt-3 border-t border-[#1a1d23] flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs">
          <span className="uppercase tracking-[0.18em] text-zinc-500">
            position history
          </span>
          <span className="font-mono text-zinc-500">{sparkSpanLabel}</span>
        </div>
        <svg viewBox="0 0 100 30" preserveAspectRatio="none" className="w-full h-12">
          <line
            x1="0"
            y1="2"
            x2="100"
            y2="2"
            stroke="#222831"
            strokeDasharray="2 2"
            strokeWidth="0.4"
          />
          <line
            x1="0"
            y1="15"
            x2="100"
            y2="15"
            stroke="#222831"
            strokeDasharray="2 2"
            strokeWidth="0.4"
          />
          <line
            x1="0"
            y1="28"
            x2="100"
            y2="28"
            stroke="#222831"
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
