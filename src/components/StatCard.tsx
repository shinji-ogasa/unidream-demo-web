type Props = {
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "good" | "bad" | "warn";
};

const TONE: Record<NonNullable<Props["tone"]>, string> = {
  default: "text-white",
  good: "text-emerald-400",
  bad: "text-rose-400",
  warn: "text-amber-400",
};

export function StatCard({ label, value, hint, tone = "default" }: Props) {
  return (
    <div className="panel p-5 flex flex-col gap-2">
      <div className="label">{label}</div>
      <div className={`text-3xl font-mono leading-tight ${TONE[tone]}`}>{value}</div>
      {hint && <div className="text-sm text-zinc-500 font-mono">{hint}</div>}
    </div>
  );
}
