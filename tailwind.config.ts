import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#08090a",
        "bg-deep": "#050608",
        "bg-soft": "#0f1117",
        surface: "#12151d",
        "surface-raised": "#171b25",
        "surface-glass": "rgba(18, 21, 29, 0.72)",
        "surface-panel": "#1d2330",
        border: "rgba(255, 255, 255, 0.08)",
        "border-strong": "rgba(255, 255, 255, 0.16)",
        "border-blue": "rgba(94, 106, 210, 0.36)",
        text: "#f4f7fb",
        "text-soft": "#d0d6e0",
        "text-muted": "#8a93a3",
        "text-faint": "#626b7a",
        primary: "#5266eb",
        "primary-hover": "#6f81ff",
        "primary-soft": "rgba(82, 102, 235, 0.16)",
        cyan: "#02b8cc",
        "cyan-soft": "rgba(2, 184, 204, 0.14)",
        lime: "#e4f222",
        "lime-soft": "rgba(228, 242, 34, 0.12)",
        violet: "#8b5cf6",
        "violet-soft": "rgba(139, 92, 246, 0.14)",
        success: "#4ade80",
        warning: "#facc15",
        danger: "#ff6467",
      },
      fontFamily: {
        sans: ['"Inter"', '"Geist"', '"Noto Sans JP"', "system-ui", "sans-serif"],
        display: ['"Inter"', '"Geist"', '"Noto Sans JP"', "system-ui", "sans-serif"],
        mono: ['"Geist Mono"', '"SFMono-Regular"', '"Consolas"', "monospace"],
      },
      borderRadius: {
        card: "28px",
        panel: "16px",
      },
      boxShadow: {
        panel: "0 24px 80px rgba(0, 0, 0, 0.42)",
        "glow-primary": "0 0 80px rgba(82, 102, 235, 0.22)",
        "glow-cyan": "0 0 80px rgba(2, 184, 204, 0.16)",
      },
    },
  },
  plugins: [],
};

export default config;
