export default function ProgressBar({ completed = 0, total = 0, unit = "cursuri" }) {
  const percent =
    total > 0 ? Math.min(Math.max((completed / total) * 100, 0), 100) : 0;
  const rounded = Math.round(percent * 10) / 10;

  let colorClass = "progress-bar__fill--low";
  if (rounded >= 100) {
    colorClass = "progress-bar__fill--done";
  } else if (rounded >= 50) {
    colorClass = "progress-bar__fill--mid";
  }

  return (
    <div className="progress-bar-wrap" title={`${rounded}%`}>
      <div className="progress-bar">
        <div
          className={`progress-bar__fill ${colorClass}`}
          style={{ width: `${rounded}%` }}
        />
      </div>
      <span className="progress-bar__label">
        {completed}/{total} {unit} ({rounded}%)
      </span>
    </div>
  );
}
