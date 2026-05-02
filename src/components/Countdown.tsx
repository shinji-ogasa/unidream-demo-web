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
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#4ade80] opacity-60" />
        <span className="relative inline-flex rounded-full h-3 w-3 bg-[#4ade80]" />
      </span>
      <span className="text-[#4ade80] tracking-widest">LIVE</span>
      <span className="text-[#626b7a]">·</span>
      <span className="text-[#d0d6e0]">
        next in <span className="text-[#f4f7fb]">{secs == null ? "--:--" : fmtSeconds(secs)}</span>
      </span>
    </div>
  );
}
