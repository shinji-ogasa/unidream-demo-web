"use client";

import { useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabase";
import { BTC_RUN_ID, type BtcDashboardData } from "@/lib/btc-release";

export function useBtcDashboard(initial: BtcDashboardData) {
  const [data, setData] = useState(initial);
  const [connection, setConnection] = useState<
    "connecting" | "subscribed" | "polling"
  >("connecting");
  useEffect(() => {
    let disposed = false;
    let inFlight = false;
    let pending = false;
    let queued: ReturnType<typeof setTimeout> | undefined;
    const abort = new AbortController();
    const refresh = async () => {
      if (disposed) return;
      if (inFlight) {
        pending = true;
        return;
      }
      inFlight = true;
      try {
        const response = await fetch("/api/btc-dashboard", {
          cache: "no-store",
          signal: abort.signal,
        });
        if (!response.ok) throw new Error("read unavailable");
        const next = (await response.json()) as BtcDashboardData;
        if (!disposed)
          setData((previous) => {
            if (next.readStatus === "unavailable")
              return {
                ...previous,
                readStatus: next.readStatus,
                checkedAt: next.checkedAt,
              };
            if (next.readStatus !== "ready") return next;
            if (
              previous.state &&
              next.state &&
              next.state.version < previous.state.version
            )
              return previous;
            return next;
          });
      } catch {
        if (!disposed)
          setData((previous) => ({ ...previous, readStatus: "unavailable" }));
      } finally {
        inFlight = false;
        if (pending && !disposed) {
          pending = false;
          void refresh();
        }
      }
    };
    const enqueue = () => {
      if (queued) clearTimeout(queued);
      queued = setTimeout(() => void refresh(), 250);
    };
    const onFocus = () => void refresh();
    window.addEventListener("focus", onFocus);
    const interval = setInterval(() => void refresh(), 30_000);
    let cleanupChannel: (() => void) | undefined;
    try {
      const db = getSupabase();
      const channel = db.channel(`btc-dashboard-${BTC_RUN_ID}`);
      for (const table of [
        "btc_demo_runs",
        "btc_demo_state",
        "btc_demo_snapshots",
        "btc_demo_forecasts",
        "btc_demo_events",
      ]) {
        channel.on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table,
            filter: `run_id=eq.${BTC_RUN_ID}`,
          },
          enqueue,
        );
      }
      channel.subscribe((status) => {
        if (disposed) return;
        setConnection(
          status === "SUBSCRIBED"
            ? "subscribed"
            : status === "CHANNEL_ERROR" ||
                status === "TIMED_OUT" ||
                status === "CLOSED"
              ? "polling"
              : "connecting",
        );
        if (status === "SUBSCRIBED") void refresh();
      });
      cleanupChannel = () => {
        void db.removeChannel(channel);
      };
    } catch {
      setConnection("polling");
    }
    void refresh();
    return () => {
      disposed = true;
      abort.abort();
      clearInterval(interval);
      if (queued) clearTimeout(queued);
      window.removeEventListener("focus", onFocus);
      cleanupChannel?.();
    };
  }, []);
  return { ...data, connection };
}
