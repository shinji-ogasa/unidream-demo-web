"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";

type FlowNode = {
  num: string;
  label: string;
  title: string;
  sub: string;
  accent: "blue" | "cyan" | "violet";
};

const NODES: FlowNode[] = [
  { num: "01", label: "Data", title: "OHLCV / Features", sub: "walk-forward ready", accent: "cyan" },
  { num: "02", label: "Teacher", title: "Hindsight Oracle", sub: "signal_aim labels", accent: "cyan" },
  { num: "03", label: "World Model", title: "Transformer WM", sub: "return / vol / drawdown state", accent: "blue" },
  { num: "04", label: "Policy", title: "BC + IAC", sub: "route + inventory recovery", accent: "blue" },
  { num: "05", label: "Selector", title: "Validation Gate", sub: "accept / reject / cooldown", accent: "violet" },
  { num: "06", label: "Report", title: "Test Scorecard", sub: "M2 / PBO / regime", accent: "violet" },
];

const ACCENT_RING: Record<FlowNode["accent"], string> = {
  blue: "rgba(82, 102, 235, 0.55)",
  cyan: "rgba(2, 184, 204, 0.55)",
  violet: "rgba(139, 92, 246, 0.55)",
};

const ACCENT_TEXT: Record<FlowNode["accent"], string> = {
  blue: "text-[#5266eb]",
  cyan: "text-[#02b8cc]",
  violet: "text-[#8b5cf6]",
};

function Connector({ horizontal }: { horizontal: boolean }) {
  return (
    <div
      aria-hidden
      className={
        horizontal
          ? "relative hidden md:block flex-1 self-center h-px min-w-[24px]"
          : "relative md:hidden flex self-stretch h-px my-1 mx-6"
      }
    >
      <div className="absolute inset-0 bg-[rgba(255,255,255,0.08)]" />
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-[#02b8cc] to-transparent"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.9, 0] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        style={
          horizontal
            ? { width: "40%" }
            : { height: "100%", width: "1px", backgroundImage: "linear-gradient(transparent, #02b8cc, transparent)" }
        }
      />
    </div>
  );
}

export function PipelineFlow() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <div ref={ref} className="relative">
      <div
        aria-hidden
        className="absolute -inset-6 rounded-[56px] bg-gradient-to-r from-[rgba(82,102,235,0.12)] via-[rgba(2,184,204,0.08)] to-[rgba(139,92,246,0.10)] blur-3xl pointer-events-none"
      />

      {/* desktop: horizontal row */}
      <div className="hidden md:flex items-stretch gap-0 relative">
        {NODES.map((node, i) => (
          <div key={node.num} className="flex items-stretch flex-1">
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 18 }}
              transition={{ duration: 0.5, delay: 0.08 * i, ease: [0.16, 1, 0.3, 1] }}
              className="group relative flex-1 rounded-panel border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.025)] p-5 backdrop-blur-md transition hover:-translate-y-1 hover:border-[rgba(255,255,255,0.16)]"
              style={{ boxShadow: `inset 0 1px 0 rgba(255,255,255,0.04)` }}
            >
              <div
                aria-hidden
                className="absolute inset-x-5 top-0 h-px opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ background: ACCENT_RING[node.accent] }}
              />
              <p className="font-mono text-xs tracking-[0.14em] text-[#626b7a]">{node.num}</p>
              <p className={`mt-2 text-xs font-semibold tracking-[0.12em] uppercase ${ACCENT_TEXT[node.accent]}`}>
                {node.label}
              </p>
              <p className="mt-3 text-base font-semibold tracking-[-0.02em] text-[#f4f7fb] leading-snug">
                {node.title}
              </p>
              <p className="mt-2 text-sm leading-5 text-[#8a93a3]">{node.sub}</p>
            </motion.div>
            {i < NODES.length - 1 && <Connector horizontal />}
          </div>
        ))}
      </div>

      {/* mobile: stacked */}
      <div className="md:hidden flex flex-col gap-0 relative">
        {NODES.map((node, i) => (
          <div key={node.num}>
            <motion.div
              initial={{ opacity: 0, x: -12 }}
              animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -12 }}
              transition={{ duration: 0.45, delay: 0.07 * i, ease: [0.16, 1, 0.3, 1] }}
              className="rounded-panel border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.025)] p-5"
            >
              <div className="flex items-baseline gap-3">
                <p className="font-mono text-xs tracking-[0.14em] text-[#626b7a]">{node.num}</p>
                <p className={`text-xs font-semibold tracking-[0.12em] uppercase ${ACCENT_TEXT[node.accent]}`}>
                  {node.label}
                </p>
              </div>
              <p className="mt-2 text-base font-semibold tracking-[-0.02em] text-[#f4f7fb] leading-snug">
                {node.title}
              </p>
              <p className="mt-2 text-sm leading-5 text-[#8a93a3]">{node.sub}</p>
            </motion.div>
            {i < NODES.length - 1 && <Connector horizontal={false} />}
          </div>
        ))}
      </div>
    </div>
  );
}
