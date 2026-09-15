import { useState } from "react";

const initialState = {
  title: "",
  platform: "",
  total_modules: "",
  default_lessons_per_module: "1",
  start_date: "",
};

export default function AddCourseForm({ onCourseAdded }) {
  const [form, setForm] = useState(initialState);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!form.title.trim()) {
      setError("Titlul cursului este obligatoriu.");
      return;
    }

    setSubmitting(true);
    try {
      await onCourseAdded({
        title: form.title.trim(),
        platform: form.platform.trim() || null,
        total_modules: Number(form.total_modules) || 0,
        default_lessons_per_module: Number(form.default_lessons_per_module) || 1,
        start_date: form.start_date || null,
      });
      setForm(initialState);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="add-course-form" onSubmit={handleSubmit}>
      <h3>Adauga un curs</h3>

      {error && <div className="form-error">{error}</div>}

      <div className="form-row">
        <label>
          Titlu *
          <input
            type="text"
            name="title"
            value={form.title}
            onChange={handleChange}
            placeholder="ex: Microsoft Azure Fundamentals AZ-900"
          />
        </label>

        <label>
          Platforma
          <input
            type="text"
            name="platform"
            value={form.platform}
            onChange={handleChange}
            placeholder="ex: Coursera, TryHackMe, YouTube"
          />
        </label>
      </div>

      <div className="form-row">
        <label>
          Numar de module
          <input
            type="number"
            name="total_modules"
            min="0"
            step="1"
            value={form.total_modules}
            onChange={handleChange}
            placeholder="ex: 8"
          />
        </label>

        <label>
          Cursuri standard / modul
          <input
            type="number"
            name="default_lessons_per_module"
            min="1"
            step="1"
            value={form.default_lessons_per_module}
            onChange={handleChange}
          />
        </label>
      </div>

      <label>
        Data de inceput
        <input
          type="date"
          name="start_date"
          value={form.start_date}
          onChange={handleChange}
        />
      </label>

      <p className="add-course-form__hint">
        Fiecare din cele {form.total_modules || 0} module va avea implicit{" "}
        {form.default_lessons_per_module || 1} cursuri — poti customiza numarul
        pentru fiecare modul dupa ce adaugi cursul.
      </p>

      <button type="submit" disabled={submitting}>
        {submitting ? "Se adauga..." : "Adauga curs"}
      </button>
    </form>
  );
}
