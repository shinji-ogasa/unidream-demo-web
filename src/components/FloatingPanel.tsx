import type { ReactNode } from "react";

interface Props {
  children: ReactNode;
  className?: string;
  glow?: "primary" | "cyan" | "none";
}

const GLOW = {
  primary: "shadow-[0_24px_80px_rgba(0,0,0,0.42),0_0_80px_rgba(82,102,235,0.12)]",
  cyan: "shadow-[0_24px_80px_rgba(0,0,0,0.42),0_0_80px_rgba(2,184,204,0.10)]",
  none: "shadow-panel",
};

export function FloatingPanel({ children, className = "", glow = "none" }: Props) {
  return (
    <div
      className={`
        rounded-[32px] border border-white/[0.08]
        bg-gradient-to-b from-white/[0.07] to-white/[0.02]
        backdrop-blur-md
        ${GLOW[glow]}
        ${className}
      `}
    >
      {children}
    </div>
  );
}
