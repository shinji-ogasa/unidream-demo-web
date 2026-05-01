type Props = {
  longPct: number;
  shortPct: number;
  flatPct: number;
};

export function LongShortBar({ longPct, shortPct, flatPct }: Props) {
  const longW = Math.max(0, Math.min(1, longPct)) * 100;
  const shortW = Math.max(0, Math.min(1, shortPct)) * 100;
  const flatW = Math.max(0, 100 - longW - shortW);

  return (
    <div className="panel p-4 flex flex-col gap-2">
      <div className="label">Long / Short / Flat</div>
      <div className="flex h-3 rounded-full overflow-hidden bg-[#0f1115] mt-1">
        {longW > 0 && <div style={{ width: `${longW}%` }} className="bg-emerald-400" title={`long ${longW.toFixed(1)}%`} />}
        {flatW > 0 && <div style={{ width: `${flatW}%` }} className="bg-zinc-600" title={`flat ${flatW.toFixed(1)}%`} />}
        {shortW > 0 && <div style={{ width: `${shortW}%` }} className="bg-rose-400" title={`short ${shortW.toFixed(1)}%`} />}
      </div>
      <div className="grid grid-cols-3 gap-2 text-[11px] font-mono mt-1">
        <div>
          <div className="text-emerald-400">long</div>
          <div className="text-zinc-200">{longW.toFixed(1)}%</div>
        </div>
        <div>
          <div className="text-zinc-400">flat</div>
          <div className="text-zinc-200">{flatW.toFixed(1)}%</div>
        </div>
        <div>
          <div className="text-rose-400">short</div>
          <div className="text-zinc-200">{shortW.toFixed(1)}%</div>
        </div>
      </div>
    </div>
  );
}
