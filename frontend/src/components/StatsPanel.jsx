const STATUS_LABELS = {
  active: "Active",
  paused: "In pauza",
  completed: "Finalizate",
};

export default function StatsPanel({ stats }) {
  if (!stats) return null;

  return (
    <div className="stats-panel">
      <div className="stat-tile">
        <span className="stat-tile__value">{stats.total_courses}</span>
        <span className="stat-tile__label">Cursuri</span>
      </div>

      <div className="stat-tile">
        <span className="stat-tile__value">
          {stats.completed_modules}/{stats.total_modules}
        </span>
        <span className="stat-tile__label">Module</span>
      </div>

      <div className="stat-tile">
        <span className="stat-tile__value">
          {stats.completed_lessons}/{stats.total_lessons}
        </span>
        <span className="stat-tile__label">Cursuri</span>
      </div>

      <div className="stat-tile">
        <span className="stat-tile__value">{stats.total_hours}h</span>
        <span className="stat-tile__label">Ore petrecute</span>
      </div>

      <div className="stat-tile">
        <span className="stat-tile__value">{stats.average_progress_percent}%</span>
        <span className="stat-tile__label">Progres mediu</span>
      </div>

      <div className="stat-tile stat-tile--breakdown">
        {Object.entries(STATUS_LABELS).map(([key, label]) => (
          <div key={key} className="stat-tile__row">
            <span>{label}</span>
            <span>{stats.by_status?.[key] ?? 0}</span>
          </div>
        ))}
      </div>

      {stats.most_neglected?.length > 0 && (
        <div className="stat-tile stat-tile--neglected">
          <span className="stat-tile__label">Ce am neglijat</span>
          {stats.most_neglected.map((c) => (
            <div key={c.id} className="stat-tile__row">
              <span>{c.title}</span>
              <span>{c.days_since_activity} zile</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
