"use client";

import { useState } from "react";

import type { Trade } from "@/lib/types";
import { fmtNumber, fmtPosition, fmtTime, fmtUSD } from "@/lib/format";

const PAGE_SIZE = 6;

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
    return <div className="dashboard-empty">No trades yet.</div>;
  }

  const showingTo = Math.min(startIdx + PAGE_SIZE, trades.length);

  return (
    <div className="dashboard-trades-table">
      <div className="dashboard-trades-table__scroll">
        <table>
          <thead>
            <tr>
              <th>time</th>
              <th>from</th>
              <th>to</th>
              <th>price</th>
              <th>notional</th>
              <th title="Fee + half-spread + slippage in quote currency">
                cost (USDT)
              </th>
            </tr>
          </thead>
          <tbody>
            {visible.map((t) => {
              const from = Math.round(t.from_position * 10000) / 10000;
              const to = Math.round(t.to_position * 10000) / 10000;
              const direction = to - from;
              return (
                <tr
                  className={`trade-row ${direction > 0 ? "trade-row--up" : direction < 0 ? "trade-row--down" : "trade-row--flat"}`}
                  key={t.id}
                >
                  <td className="trade-time">
                    {fmtTime(t.timestamp)}
                  </td>
                  <td className="trade-from">
                    {fmtPosition(t.from_position)}
                  </td>
                  <td className={`trade-to ${direction > 0 ? "trade-to--up" : direction < 0 ? "trade-to--down" : ""}`}>
                    <span
                      className="trade-direction"
                      aria-label={direction > 0 ? "increase" : direction < 0 ? "decrease" : "unchanged"}
                    >
                      {direction > 0 ? "↑" : direction < 0 ? "↓" : "→"}
                    </span>
                    {fmtPosition(t.to_position)}
                  </td>
                  <td className="trade-number">
                    {fmtUSD(t.price)}
                  </td>
                  <td className="trade-number">
                    {fmtNumber(t.trade_notional)}
                  </td>
                  <td
                    className="trade-number"
                    title="Legacy fee column; all-in quote transaction cost"
                  >
                    {fmtUSD(t.fee)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="dashboard-trades-table__mobile" role="group" aria-label="Recent trades mobile view">
          {visible.map((t) => {
            const from = Math.round(t.from_position * 10000) / 10000;
            const to = Math.round(t.to_position * 10000) / 10000;
            const direction = to - from;
            const directionLabel = direction > 0 ? "INCREASE" : direction < 0 ? "DECREASE" : "UNCHANGED";
            return (
              <article
                className={`dashboard-trade-card ${direction > 0 ? "dashboard-trade-card--up" : direction < 0 ? "dashboard-trade-card--down" : "dashboard-trade-card--flat"}`}
                key={t.id}
              >
                <div className="dashboard-trade-card__head">
                  <time>{fmtTime(t.timestamp)}</time>
                  <span className={direction > 0 ? "trade-to--up" : direction < 0 ? "trade-to--down" : ""}>
                    {directionLabel}
                  </span>
                </div>
                <dl>
                  <div><dt>FROM</dt><dd>{fmtPosition(from)}</dd></div>
                  <div><dt>TO</dt><dd className={direction > 0 ? "trade-to--up" : direction < 0 ? "trade-to--down" : ""}>{fmtPosition(to)}</dd></div>
                  <div><dt>PRICE</dt><dd>{fmtUSD(t.price)}</dd></div>
                  <div><dt>NOTIONAL</dt><dd>{fmtNumber(t.trade_notional)}</dd></div>
                  <div><dt>COST</dt><dd>{fmtUSD(t.fee)}</dd></div>
                </dl>
              </article>
            );
          })}
        </div>
      </div>
      <div className="dashboard-trades-table__footer">
        <span>
          {startIdx + 1}–{showingTo} of {trades.length}
        </span>
        <div className="dashboard-pagination">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={safePage === 0}
            className="dashboard-pagination__button"
          >
            ← prev
          </button>
          <span className="dashboard-pagination__count">
            {safePage + 1} / {totalPages}
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={safePage >= totalPages - 1}
            className="dashboard-pagination__button"
          >
            next →
          </button>
        </div>
      </div>
    </div>
  );
}
