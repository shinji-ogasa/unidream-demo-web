type Props = {
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "good" | "bad" | "warn";
};

const TONE: Record<NonNullable<Props["tone"]>, string> = {
  default: "text-white",
  good: "text-[#4ade80]",
  bad: "text-[#ff6467]",
  warn: "text-[#facc15]",
};

const TONE_DOT: Record<NonNullable<Props["tone"]>, string> = {
  default: "bg-white/30",
  good: "bg-[#4ade80]",
  bad: "bg-[#ff6467]",
  warn: "bg-[#facc15]",
};

export function StatCard({ label, value, hint, tone = "default" }: Props) {
  return (
    <div className="rounded-[32px] border border-white/[0.08] bg-gradient-to-b from-white/[0.07] to-white/[0.02] backdrop-blur-md p-5 flex flex-col gap-2 shadow-panel hover:-translate-y-0.5 transition-transform duration-200">
      <div className="flex items-center gap-2">
        <span className={`h-1.5 w-1.5 rounded-full ${TONE_DOT[tone]}`} />
        <div className="label">{label}</div>
      </div>
      <div className={`text-2xl md:text-3xl font-mono leading-tight ${TONE[tone]}`}>
        {value}
      </div>
      {hint && <div className="text-xs md:text-sm text-[#8a93a3] font-mono">{hint}</div>}
    </div>
  );
}
