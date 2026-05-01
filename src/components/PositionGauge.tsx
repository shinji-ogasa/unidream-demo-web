import { fmtNumber, fmtUSD } from "@/lib/format";

type Props = {
  position: number;
  equity: number;
  cash: number;
  assetQty: number;
};

export function PositionGauge({ position, equity, cash, assetQty }: Props) {
  const fraction = Math.max(0, Math.min(1, Math.abs(position)));
  const r = 38;
  const circumference = 2 * Math.PI * r;
  const dash = fraction * circumference;
  const isFlat = Math.abs(position) < 1e-6;
  const isLong = position > 0;
  const ringColor = isFlat ? "#52525b" : isLong ? "#6ee7b7" : "#f87171";
  const labelTone = isFlat ? "text-zinc-400" : isLong ? "text-emerald-400" : "text-rose-400";
  const labelText = isFlat ? "FLAT" : isLong ? "LONG" : "SHORT";

  return (
    <div className="panel p-4 flex flex-col">
      <div className="label">Position</div>
      <div className="flex items-center gap-4 mt-2">
        <div className="relative w-[112px] h-[112px] shrink-0">
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
            <div className={`text-xl font-mono leading-none ${labelTone}`}>
              {(fraction * 100).toFixed(0)}%
            </div>
            <div className={`text-[10px] tracking-[0.2em] mt-1 ${labelTone}`}>{labelText}</div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] font-mono w-full">
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
    </div>
  );
}
