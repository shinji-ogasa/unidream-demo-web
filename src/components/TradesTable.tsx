import type { Trade } from "@/lib/types";
import { fmtNumber, fmtPosition, fmtTime, fmtUSD } from "@/lib/format";

type Props = {
  trades: Trade[];
};

export function TradesTable({ trades }: Props) {
  if (trades.length === 0) {
    return (
      <div className="panel p-6 text-zinc-500 text-sm">No trades yet.</div>
    );
  }
  return (
    <div className="panel overflow-hidden">
      <table className="w-full text-sm font-mono">
        <thead className="bg-[#0f1115] text-zinc-400 text-xs uppercase tracking-wider">
          <tr>
            <th className="text-left px-3 py-2">time</th>
            <th className="text-right px-3 py-2">from</th>
            <th className="text-right px-3 py-2">to</th>
            <th className="text-right px-3 py-2">price</th>
            <th className="text-right px-3 py-2">notional</th>
          </tr>
        </thead>
        <tbody>
          {trades.map((t) => {
            const direction = t.to_position - t.from_position;
            const tone =
              direction > 0
                ? "text-emerald-400"
                : direction < 0
                  ? "text-rose-400"
                  : "text-zinc-400";
            return (
              <tr key={t.id} className="border-t border-[#222831]">
                <td className="px-3 py-2 text-zinc-300">{fmtTime(t.timestamp)}</td>
                <td className="px-3 py-2 text-right text-zinc-400">{fmtPosition(t.from_position)}</td>
                <td className={`px-3 py-2 text-right ${tone}`}>{fmtPosition(t.to_position)}</td>
                <td className="px-3 py-2 text-right">{fmtUSD(t.price)}</td>
                <td className="px-3 py-2 text-right text-zinc-300">{fmtNumber(t.trade_notional ?? 0)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
