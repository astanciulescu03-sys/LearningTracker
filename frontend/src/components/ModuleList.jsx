import { useState } from "react";
import ProgressBar from "./ProgressBar.jsx";

function ModuleRow({ module, onUpdate, onDelete }) {
  const [completed, setCompleted] = useState(module.completed_lessons);
  const [total, setTotal] = useState(module.total_lessons);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await onUpdate(module.id, {
      completed_lessons: Number(completed),
      total_lessons: Number(total),
    });
  };

  return (
    <li className="module-row">
      <div className="module-row__top">
        <span className="module-row__title">{module.title}</span>
        <button
          type="button"
          className="module-row__delete"
          onClick={() => onDelete(module.id)}
          aria-label="Sterge modulul"
          title="Sterge modulul"
        >
          &times;
        </button>
      </div>

      <ProgressBar completed={module.completed_lessons} total={module.total_lessons} />

      <form className="module-row__form" onSubmit={handleSubmit}>
        <label>
          Cursuri facute
          <input
            type="number"
            min="0"
            value={completed}
            onChange={(e) => setCompleted(e.target.value)}
          />
        </label>
        <label>
          Total cursuri
          <input
            type="number"
            min="0"
            value={total}
            onChange={(e) => setTotal(e.target.value)}
          />
        </label>
        <button type="submit">Salveaza</button>
      </form>
    </li>
  );
}

export default function ModuleList({
  courseId,
  modules,
  defaultLessonsPerModule,
  onAddModule,
  onUpdateModule,
  onDeleteModule,
}) {
  const [newTitle, setNewTitle] = useState("");
  const [newTotal, setNewTotal] = useState(defaultLessonsPerModule);

  const handleAdd = async (e) => {
    e.preventDefault();
    await onAddModule(courseId, {
      title: newTitle.trim() || undefined,
      total_lessons: Number(newTotal) || defaultLessonsPerModule,
    });
    setNewTitle("");
    setNewTotal(defaultLessonsPerModule);
  };

  return (
    <div className="module-list">
      <div className="module-list__header">
        <span>Module ({modules.length})</span>
        <span className="module-list__hint">
          standard: {defaultLessonsPerModule} cursuri/modul
        </span>
      </div>

      {modules.length > 0 && (
        <ul className="module-list__items">
          {modules.map((module) => (
            <ModuleRow
              key={module.id}
              module={module}
              onUpdate={(moduleId, updates) =>
                onUpdateModule(courseId, moduleId, updates)
              }
              onDelete={(moduleId) => onDeleteModule(courseId, moduleId)}
            />
          ))}
        </ul>
      )}

      <form className="module-list__add-form" onSubmit={handleAdd}>
        <input
          type="text"
          placeholder="Titlu modul (optional)"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
        />
        <input
          type="number"
          min="0"
          title="Numar de cursuri in acest modul"
          value={newTotal}
          onChange={(e) => setNewTotal(e.target.value)}
        />
        <button type="submit">+ Modul</button>
      </form>
    </div>
  );
}
