type Props = {
  longPct: number;
  shortPct: number;
  flatPct: number;
};

export function LongShortBar({ longPct, shortPct, flatPct }: Props) {
  const longW = Math.max(0, Math.min(1, longPct)) * 100;
  const shortW = Math.max(0, Math.min(1, shortPct)) * 100;
  const flatW = Math.max(0, 100 - longW - shortW);

  return (
    <div className="dashboard-exposure">
      <div className="dashboard-panel__label">
        <span className="dashboard-panel__dot dashboard-panel__dot--warning" />
        <span>Long / Short / Flat</span>
      </div>
      <div className="dashboard-exposure__bar">
        {longW > 0 && (
          <div
            style={{ width: `${longW}%` }}
            className="dashboard-exposure__segment dashboard-exposure__segment--long"
            title={`long ${longW.toFixed(1)}%`}
          />
        )}
        {flatW > 0 && (
          <div
            style={{ width: `${flatW}%` }}
            className="dashboard-exposure__segment dashboard-exposure__segment--flat"
            title={`flat ${flatW.toFixed(1)}%`}
          />
        )}
        {shortW > 0 && (
          <div
            style={{ width: `${shortW}%` }}
            className="dashboard-exposure__segment dashboard-exposure__segment--short"
            title={`short ${shortW.toFixed(1)}%`}
          />
        )}
      </div>
      <div className="dashboard-exposure__legend">
        <div className="dashboard-exposure__legend-item dashboard-exposure__legend-item--long">
          <span>long</span>
          <strong>{longW.toFixed(1)}%</strong>
        </div>
        <div className="dashboard-exposure__legend-item dashboard-exposure__legend-item--flat">
          <span>flat</span>
          <strong>{flatW.toFixed(1)}%</strong>
        </div>
        <div className="dashboard-exposure__legend-item dashboard-exposure__legend-item--short">
          <span>short</span>
          <strong>{shortW.toFixed(1)}%</strong>
        </div>
      </div>
    </div>
  );
}
