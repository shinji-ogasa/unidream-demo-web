"use client";

import { useState } from "react";

import type { Trade } from "@/lib/types";
import { fmtNumber, fmtPosition, fmtTime, fmtUSD } from "@/lib/format";

const PAGE_SIZE = 6;

type Props = {
  // Trades sorted descending by timestamp (latest first).
  trades: Trade[];
};

type Direction = "up" | "down" | "flat";

function getDirection(from: number, to: number): Direction {
  if (to > from) return "up";
  if (to < from) return "down";
  return "flat";
}

function getDirectionLabel(direction: Direction): string {
  if (direction === "up") return "INCREASE";
  if (direction === "down") return "DECREASE";
  return "UNCHANGED";
}

function getDirectionGlyph(direction: Direction): string {
  if (direction === "up") return "↑";
  if (direction === "down") return "↓";
  return "→";
}

function roundedPosition(value: number): number {
  return Math.round(value * 10000) / 10000;
}

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
        <table aria-label="Trade executions">
          <thead>
            <tr>
              <th scope="col">time</th>
              <th scope="col">position change</th>
              <th scope="col">price</th>
              <th scope="col">notional</th>
              <th scope="col" title="Fee + half-spread + slippage in quote currency">
                cost (USDT)
              </th>
            </tr>
          </thead>
          <tbody>
            {visible.map((t) => {
              const from = roundedPosition(t.from_position);
              const to = roundedPosition(t.to_position);
              const direction = getDirection(from, to);
              const directionLabel = getDirectionLabel(direction);

              return (
                <tr className={`trade-row trade-row--${direction}`} key={t.id}>
                  <td className="trade-time">
                    <time dateTime={t.timestamp}>{fmtTime(t.timestamp)}</time>
                  </td>
                  <td
                    className={`trade-transition trade-transition--${direction}`}
                    aria-label={`${directionLabel}: ${fmtPosition(from)} to ${fmtPosition(to)}`}
                  >
                    <span
                      className={`trade-direction trade-direction--${direction}`}
                      aria-hidden="true"
                    >
                      {getDirectionGlyph(direction)}
                    </span>
                    <span className="trade-transition__content">
                      <span className="trade-transition__values">
                        <span>{fmtPosition(from)}</span>
                        <span className="trade-transition__arrow" aria-hidden="true">→</span>
                        <strong>{fmtPosition(to)}</strong>
                      </span>
                      <span className="trade-transition__label">{directionLabel}</span>
                    </span>
                  </td>
                  <td className="trade-number">{fmtUSD(t.price)}</td>
                  <td className="trade-number">{fmtNumber(t.trade_notional)}</td>
                  <td
                    className={`trade-number ${t.fee === 0 ? "trade-number--zero" : ""}`}
                    title="Legacy fee column; all-in quote transaction cost"
                  >
                    {fmtUSD(t.fee)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div className="dashboard-trades-table__mobile" role="list" aria-label="Recent trade executions">
          {visible.map((t) => {
            const from = roundedPosition(t.from_position);
            const to = roundedPosition(t.to_position);
            const direction = getDirection(from, to);
            const directionLabel = getDirectionLabel(direction);

            return (
              <article
                className={`dashboard-trade-card dashboard-trade-card--${direction}`}
                key={t.id}
                aria-label={`${directionLabel} trade at ${fmtTime(t.timestamp)}`}
                role="listitem"
              >
                <div className="dashboard-trade-card__head">
                  <time dateTime={t.timestamp}>{fmtTime(t.timestamp)}</time>
                  <span className={`trade-card-status trade-card-status--${direction}`}>
                    <span className="trade-card-status__glyph" aria-hidden="true">
                      {getDirectionGlyph(direction)}
                    </span>
                    {directionLabel}
                  </span>
                </div>

                <div className="dashboard-trade-card__position">
                  <span className="dashboard-trade-card__eyebrow">POSITION CHANGE</span>
                  <span className="dashboard-trade-card__values">
                    <span>{fmtPosition(from)}</span>
                    <span className="dashboard-trade-card__arrow" aria-hidden="true">→</span>
                    <strong>{fmtPosition(to)}</strong>
                  </span>
                </div>

                <dl className="dashboard-trade-card__metrics">
                  <div>
                    <dt>PRICE</dt>
                    <dd>{fmtUSD(t.price)}</dd>
                  </div>
                  <div>
                    <dt>NOTIONAL</dt>
                    <dd>{fmtNumber(t.trade_notional)}</dd>
                  </div>
                  <div>
                    <dt>COST</dt>
                    <dd className={t.fee === 0 ? "dashboard-trade-card__zero" : ""}>
                      {fmtUSD(t.fee)}
                    </dd>
                  </div>
                </dl>
              </article>
            );
          })}
        </div>
      </div>

      <div className="dashboard-trades-table__footer">
        <span className="dashboard-trades-table__range">
          {startIdx + 1}–{showingTo} of {trades.length}
        </span>
        <div className="dashboard-pagination" aria-label="Trade pages">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={safePage === 0}
            className="dashboard-pagination__button"
            aria-label="Previous trades"
          >
            ← <span>prev</span>
          </button>
          <span className="dashboard-pagination__count" aria-live="polite">
            {safePage + 1} / {totalPages}
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={safePage >= totalPages - 1}
            className="dashboard-pagination__button"
            aria-label="Next trades"
          >
            <span>next</span> →
          </button>
        </div>
      </div>
    </div>
  );
}
