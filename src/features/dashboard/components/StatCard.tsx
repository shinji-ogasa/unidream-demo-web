type Props = {
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "good" | "bad" | "warn";
};

export function StatCard({ label, value, hint, tone = "default" }: Props) {
  return (
    <div className={`dashboard-stat dashboard-stat--${tone}`}>
      <div className="dashboard-stat__label">
        <span className={`dashboard-stat__dot dashboard-stat__dot--${tone}`} />
        <span>{label}</span>
      </div>
      <div className="dashboard-stat__value">
        {value}
      </div>
      {hint && <div className="dashboard-stat__hint">{hint}</div>}
    </div>
  );
}
