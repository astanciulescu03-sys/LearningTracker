import { useState } from "react";
import ProgressBar from "./ProgressBar.jsx";
import ModuleList from "./ModuleList.jsx";

const STATUS_LABELS = {
  active: "Activ",
  paused: "Pauza",
  completed: "Finalizat",
};

export default function CourseCard({
  course,
  onUpdate,
  onDelete,
  onAddModule,
  onUpdateModule,
  onDeleteModule,
  neglectedDays = 7,
}) {
  const [hoursSpent, setHoursSpent] = useState(course.hours_spent);
  const [startDate, setStartDate] = useState(course.start_date || "");
  const [saving, setSaving] = useState(false);

  const isNeglected =
    course.status !== "completed" &&
    course.days_since_activity !== null &&
    course.days_since_activity >= neglectedDays;

  const handleHoursSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onUpdate(course.id, { hours_spent: Number(hoursSpent) });
    } finally {
      setSaving(false);
    }
  };

  const handleStartDateChange = async (e) => {
    const value = e.target.value;
    setStartDate(value);
    await onUpdate(course.id, { start_date: value || null });
  };

  const handleStatusChange = async (e) => {
    await onUpdate(course.id, { status: e.target.value });
  };

  return (
    <div className={`course-card ${isNeglected ? "course-card--neglected" : ""}`}>
      <div className="course-card__header">
        <h3>{course.title}</h3>
        <button
          className="course-card__delete"
          onClick={() => onDelete(course.id)}
          aria-label="Sterge cursul"
          title="Sterge cursul"
        >
          &times;
        </button>
      </div>

      <div className="course-card__meta">
        {course.platform && <span className="badge">{course.platform}</span>}
        {isNeglected && (
          <span className="badge badge--warning">
            Neglijat ({course.days_since_activity} zile)
          </span>
        )}
      </div>

      <ProgressBar completed={course.completed_lessons} total={course.total_lessons} />

      <label className="course-card__start-date">
        Data de inceput
        <input type="date" value={startDate} onChange={handleStartDateChange} />
      </label>

      <div className="course-card__hours">{course.hours_spent} ore petrecute</div>

      <form className="course-card__progress-form" onSubmit={handleHoursSubmit}>
        <label>
          Ore petrecute
          <input
            type="number"
            min="0"
            step="0.5"
            value={hoursSpent}
            onChange={(e) => setHoursSpent(e.target.value)}
          />
        </label>
        <button type="submit" disabled={saving}>
          Actualizeaza
        </button>
      </form>

      <select
        className="course-card__status"
        value={course.status}
        onChange={handleStatusChange}
      >
        {Object.entries(STATUS_LABELS).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>

      <div className="course-card__activity">
        Ultima activitate:{" "}
        {course.days_since_activity === 0
          ? "azi"
          : `acum ${course.days_since_activity} zile`}
      </div>

      <ModuleList
        courseId={course.id}
        modules={course.modules || []}
        defaultLessonsPerModule={course.default_lessons_per_module}
        onAddModule={onAddModule}
        onUpdateModule={onUpdateModule}
        onDeleteModule={onDeleteModule}
      />
    </div>
  );
}
