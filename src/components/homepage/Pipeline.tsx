"use client";

import { useEffect, useRef, useState } from "react";

const STAGES = [
  { label: "Market Data", x: 80, y: 200 },
  { label: "Feature Encoder", x: 280, y: 120 },
  { label: "World Model", x: 520, y: 200 },
  { label: "RL Policy", x: 760, y: 120 },
  { label: "Execution", x: 960, y: 200 },
  { label: "Dashboard", x: 1120, y: 200 },
];

function buildPath(): string {
  let d = `M ${STAGES[0].x} ${STAGES[0].y}`;
  for (let i = 1; i < STAGES.length; i++) {
    const prev = STAGES[i - 1];
    const curr = STAGES[i];
    const cp1x = prev.x + (curr.x - prev.x) * 0.5;
    const cp1y = prev.y;
    const cp2x = prev.x + (curr.x - prev.x) * 0.5;
    const cp2y = curr.y;
    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${curr.x} ${curr.y}`;
  }
  return d;
}

export function Pipeline() {
  const containerRef = useRef<HTMLDivElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const [progress, setProgress] = useState(0);
  const [activeIndex, setActiveIndex] = useState(-1);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setProgress(1);
          }
        });
      },
      { threshold: 0.4 }
    );

    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (progress < 1) return;
    const duration = 2200;
    const start = performance.now();
    let raf: number;

    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setActiveIndex(Math.floor(eased * STAGES.length));
      if (t < 1) raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [progress]);

  const pathD = buildPath();

  return (
    <div ref={containerRef} className="w-full overflow-x-auto">
      <svg
        viewBox="0 0 1200 320"
        className="w-full min-w-[800px] h-auto"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id="pipelineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#5266eb" />
            <stop offset="100%" stopColor="#02b8cc" />
          </linearGradient>
        </defs>

        {/* glow path */}
        <path
          d={pathD}
          fill="none"
          stroke="url(#pipelineGradient)"
          strokeWidth="4"
          strokeLinecap="round"
          opacity="0.2"
          filter="blur(8px)"
        />

        {/* main animated path */}
        <path
          ref={pathRef}
          d={pathD}
          fill="none"
          stroke="url(#pipelineGradient)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray={pathRef.current?.getTotalLength() || 2000}
          strokeDashoffset={pathRef.current ? pathRef.current.getTotalLength() * (1 - progress) : 2000}
          style={{
            transition: "stroke-dashoffset 2.2s cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        />

        {/* nodes */}
        {STAGES.map((stage, i) => (
          <g key={stage.label}>
            <circle
              cx={stage.x}
              cy={stage.y}
              r="10"
              fill="#08090a"
              stroke={i <= activeIndex ? "#02b8cc" : "rgba(255,255,255,0.2)"}
              strokeWidth="2"
              style={{ transition: "stroke 0.4s ease" }}
            />
            <circle
              cx={stage.x}
              cy={stage.y}
              r="4"
              fill={i <= activeIndex ? "#02b8cc" : "rgba(255,255,255,0.3)"}
              style={{ transition: "fill 0.4s ease" }}
            />
            <text
              x={stage.x}
              y={stage.y + 36}
              textAnchor="middle"
              fill={i <= activeIndex ? "#f4f7fb" : "#8a93a3"}
              fontSize="13"
              fontWeight="600"
              letterSpacing="0.04em"
              style={{ transition: "fill 0.4s ease" }}
            >
              {stage.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}
