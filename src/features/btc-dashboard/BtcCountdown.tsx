"use client";

import { useEffect, useMemo, useState } from "react";
import { fmtSeconds } from "@/lib/format";

function nextQuarterHour(now: number): number {
  const target = new Date(now);
  target.setSeconds(0, 0);
  target.setMinutes(target.getMinutes() + (15 - (target.getMinutes() % 15)));
  return target.getTime();
}

function utcClock(timestamp: number | null): string {
  if (timestamp === null) return "--:-- UTC";
  return new Date(timestamp).toISOString().slice(11, 16) + " UTC";
}

export function BtcCountdown({ pendingDueAt }: { pendingDueAt: string | null | undefined }) {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    const tick = () => setNow(Date.now());
    tick();
    const timer = window.setInterval(tick, 1_000);
    return () => window.clearInterval(timer);
  }, []);

  const countdown = useMemo(() => {
    if (now === null) {
      return { seconds: null, target: null, label: "NEXT OPEN" };
    }
    const pending = pendingDueAt ? new Date(pendingDueAt).getTime() : NaN;
    const hasPendingTarget = Number.isFinite(pending);
    const target = hasPendingTarget ? pending : nextQuarterHour(now);
    return {
      seconds: Math.max(0, Math.floor((target - now) / 1_000)),
      target,
      label: hasPendingTarget ? "NEXT FILL" : "NEXT OPEN",
    };
  }, [now, pendingDueAt]);

  const seconds = countdown.seconds === null ? "--:--" : fmtSeconds(countdown.seconds);
  const target = utcClock(countdown.target);

  return (
    <span
      className="btc-countdown"
      role="timer"
      aria-live="off"
      aria-label={`${countdown.label} ${seconds}, ${target}`}
      title={`${countdown.label} · ${target}`}
    >
      <i aria-hidden="true" />
      <span className="btc-countdown__label">{countdown.label}</span>
      <strong>{seconds}</strong>
      <small>→ {target}</small>
    </span>
  );
}
