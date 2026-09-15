import { useEffect, useState, useCallback } from "react";
import CourseList from "./components/CourseList.jsx";
import AddCourseForm from "./components/AddCourseForm.jsx";
import StatsPanel from "./components/StatsPanel.jsx";
import ThemeToggle from "./components/ThemeToggle.jsx";
import * as api from "./api.js";

const NEGLECTED_THRESHOLD_OPTIONS = [
  { value: 1, label: "1 zi" },
  { value: 7, label: "7 zile" },
  { value: 14, label: "14 zile" },
  { value: 30, label: "1 luna" },
];

export default function App() {
  const [courses, setCourses] = useState([]);
  const [stats, setStats] = useState(null);
  // "initialLoading" tine cont doar de primul fetch (cand n-avem inca nimic
  // de afisat). Reincarcarile ulterioare (dupa un update/add/delete) se fac
  // "silentios", fara sa demonteze lista si sa arate "Se incarca..." din nou —
  // altfel fiecare mica modificare (ex: bifat 3 cursuri intr-un modul)
  // parea ca reincarca toata pagina si sarea scroll-ul sus.
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [neglectedDays, setNeglectedDays] = useState(7);

  const loadData = useCallback(async () => {
    setError(null);
    try {
      const [coursesData, statsData] = await Promise.all([
        api.getCourses(statusFilter ? { status: statusFilter } : {}),
        api.getStats({ neglected_days: neglectedDays }),
      ]);
      setCourses(coursesData);
      setStats(statsData);
    } catch (err) {
      setError(err.message);
    } finally {
      setInitialLoading(false);
    }
  }, [statusFilter, neglectedDays]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCourseAdded = async (course) => {
    await api.createCourse(course);
    await loadData();
  };

  const handleUpdate = async (id, updates) => {
    await api.updateCourse(id, updates);
    await loadData();
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Sigur vrei sa stergi acest curs?")) return;
    await api.deleteCourse(id);
    await loadData();
  };

  const handleAddModule = async (courseId, module) => {
    await api.createModule(courseId, module);
    await loadData();
  };

  const handleUpdateModule = async (courseId, moduleId, updates) => {
    await api.updateModule(courseId, moduleId, updates);
    await loadData();
  };

  const handleDeleteModule = async (courseId, moduleId) => {
    await api.deleteModule(courseId, moduleId);
    await loadData();
  };

  return (
    <div className="app">
      <ThemeToggle />

      <header className="app__header">
        <h1>Learning Tracker</h1>
        <p>Urmareste-ti progresul la cursuri intr-un singur loc.</p>
      </header>

      <StatsPanel stats={stats} />

      <div className="app__filters">
        <label>
          Filtreaza dupa status:
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">Toate</option>
            <option value="active">Active</option>
            <option value="paused">In pauza</option>
            <option value="completed">Finalizate</option>
          </select>
        </label>

        <label>
          Prag "neglijat":
          <select
            value={neglectedDays}
            onChange={(e) => setNeglectedDays(Number(e.target.value))}
          >
            {NEGLECTED_THRESHOLD_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {error && <div className="app__error">Eroare: {error}</div>}

      {initialLoading ? (
        <p className="loading-state">Se incarca...</p>
      ) : (
        <CourseList
          courses={courses}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
          onAddModule={handleAddModule}
          onUpdateModule={handleUpdateModule}
          onDeleteModule={handleDeleteModule}
          neglectedDays={neglectedDays}
        />
      )}

      <AddCourseForm onCourseAdded={handleCourseAdded} />
    </div>
  );
}
