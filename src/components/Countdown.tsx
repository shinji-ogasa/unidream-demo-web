"use client";

import { useEffect, useState } from "react";

import { fmtSeconds } from "@/lib/format";

// Cron schedule: minute 1, 16, 31, 46 of each hour.
const FIRE_MINUTES = [1, 16, 31, 46] as const;

function nextFireMs(now: Date): number {
  const m = now.getMinutes();
  for (const fm of FIRE_MINUTES) {
    if (m < fm) {
      const d = new Date(now);
      d.setMinutes(fm, 0, 0);
      return d.getTime();
    }
  }
  const d = new Date(now);
  d.setHours(d.getHours() + 1, FIRE_MINUTES[0], 0, 0);
  return d.getTime();
}

export function Countdown() {
  const [secs, setSecs] = useState<number | null>(null);

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const ms = nextFireMs(now) - now.getTime();
      setSecs(Math.max(0, Math.floor(ms / 1000)));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex items-center gap-2 font-mono text-sm">
      <span className="relative flex h-3 w-3">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
        <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-400" />
      </span>
      <span className="text-emerald-400 tracking-widest">LIVE</span>
      <span className="text-zinc-600">·</span>
      <span className="text-zinc-300">
        next in <span className="text-white">{secs == null ? "--:--" : fmtSeconds(secs)}</span>
      </span>
    </div>
  );
}
