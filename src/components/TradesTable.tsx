"use client";

import { useState } from "react";

import type { Trade } from "@/lib/types";
import { fmtNumber, fmtPosition, fmtTime, fmtUSD } from "@/lib/format";

const PAGE_SIZE = 10;

type Props = {
  // Trades sorted descending by timestamp (latest first).
  trades: Trade[];
};

export function TradesTable({ trades }: Props) {
  const [page, setPage] = useState(0);
  const totalPages = Math.max(1, Math.ceil(trades.length / PAGE_SIZE));
  // Clamp on render so realtime inserts that shrink the page count never
  // leave us pointing past the last page.
  const safePage = Math.max(0, Math.min(page, totalPages - 1));
  const startIdx = safePage * PAGE_SIZE;
  const visible = trades.slice(startIdx, startIdx + PAGE_SIZE);

  if (trades.length === 0) {
    return <div className="panel p-6 text-[#8a93a3] text-base">No trades yet.</div>;
  }

  const showingTo = Math.min(startIdx + PAGE_SIZE, trades.length);

  return (
    <div className="flex flex-col gap-3">
      <div className="panel overflow-x-auto">
        <table className="w-full text-sm font-mono min-w-[520px]">
          <thead className="bg-[#12151d] text-[#8a93a3] text-xs uppercase tracking-[0.14em]">
            <tr>
              <th className="text-left px-4 py-3">time</th>
              <th className="text-right px-4 py-3">from</th>
              <th className="text-right px-4 py-3">to</th>
              <th className="text-right px-4 py-3">price</th>
              <th className="text-right px-4 py-3">notional</th>
            </tr>
          </thead>
          <tbody className="text-base">
            {visible.map((t) => {
              const direction = t.to_position - t.from_position;
              const tone =
                direction > 0
                  ? "text-[#4ade80]"
                  : direction < 0
                    ? "text-[#ff6467]"
                    : "text-[#8a93a3]";
              return (
                <tr key={t.id} className="border-t border-[rgba(255,255,255,0.08)]">
                  <td className="px-4 py-2.5 text-[#d0d6e0] whitespace-nowrap">
                    {fmtTime(t.timestamp)}
                  </td>
                  <td className="px-4 py-2.5 text-right text-[#8a93a3]">
                    {fmtPosition(t.from_position)}
                  </td>
                  <td className={`px-4 py-2.5 text-right ${tone}`}>
                    {fmtPosition(t.to_position)}
                  </td>
                  <td className="px-4 py-2.5 text-right whitespace-nowrap">
                    {fmtUSD(t.price)}
                  </td>
                  <td className="px-4 py-2.5 text-right text-[#d0d6e0]">
                    {fmtNumber(t.trade_notional ?? 0)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between text-sm font-mono text-[#8a93a3] px-1 flex-wrap gap-2">
        <span>
          {startIdx + 1}–{showingTo} of {trades.length}
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={safePage === 0}
            className="px-3 py-1 rounded border border-[rgba(255,255,255,0.08)] text-[#d0d6e0] hover:text-[#f4f7fb] hover:border-[#3a4150] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            ← prev
          </button>
          <span className="text-[#d0d6e0] tabular-nums px-1">
            {safePage + 1} / {totalPages}
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={safePage >= totalPages - 1}
            className="px-3 py-1 rounded border border-[rgba(255,255,255,0.08)] text-[#d0d6e0] hover:text-[#f4f7fb] hover:border-[#3a4150] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            next →
          </button>
        </div>
      </div>
    </div>
  );
}
