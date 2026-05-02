"use client";

import { useEffect, useState } from "react";

import { fmtSeconds } from "@/lib/format";

// Supabase Cron schedule for run-unidream-inference: `1,16,31,46 * * * *`.
// The +1 min offset gives Binance time to publish the just-closed 15m bar
// before the Edge Function fetches it.
const FIRE_MINUTES = [1, 16, 31, 46] as const;
const SCHEDULE_LABEL = ":01  :16  :31  :46";

function nextFire(now: Date): Date {
  const next = new Date(now);
  next.setSeconds(0, 0);
  const m = now.getMinutes();
  for (const fm of FIRE_MINUTES) {
    if (m < fm) {
      next.setMinutes(fm);
      return next;
    }
  }
  next.setHours(now.getHours() + 1);
  next.setMinutes(FIRE_MINUTES[0]);
  return next;
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

export function Countdown() {
  const [state, setState] = useState<{ secs: number; at: string } | null>(null);

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const target = nextFire(now);
      const secs = Math.max(0, Math.floor((target.getTime() - now.getTime()) / 1000));
      setState({ secs, at: `${pad2(target.getHours())}:${pad2(target.getMinutes())}` });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div
      className="flex items-center gap-2 font-mono text-sm"
      title={`Inference fires every 15 min at ${SCHEDULE_LABEL}`}
    >
      <span className="relative flex h-3 w-3">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#4ade80] opacity-60" />
        <span className="relative inline-flex rounded-full h-3 w-3 bg-[#4ade80]" />
      </span>
      <span className="text-[#4ade80] tracking-widest">LIVE</span>
      <span className="text-[#626b7a]">·</span>
      <span className="text-[#d0d6e0]">
        next in{" "}
        <span className="text-[#f4f7fb]">
          {state ? fmtSeconds(state.secs) : "--:--"}
        </span>
        <span className="text-[#626b7a] ml-1.5">→ {state?.at ?? "--:--"}</span>
      </span>
    </div>
  );
}
