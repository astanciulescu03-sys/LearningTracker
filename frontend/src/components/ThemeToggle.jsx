import { useEffect, useState } from "react";

const STORAGE_KEY = "learning-tracker-theme";

function getInitialTheme() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "light" || stored === "dark") return stored;
  } catch {
    // localStorage poate fi indisponibil (mod privat etc.) - ignoram
  }
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // ignoram daca localStorage nu e disponibil
    }
  }, [theme]);

  return (
    <div
      className="fixed top-3 right-3 z-50 flex items-center gap-1 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] p-1 text-xs shadow-sm"
      role="radiogroup"
      aria-label="Tema paginii"
    >
      <label
        className={`flex cursor-pointer items-center gap-1 rounded-full px-3 py-1 font-medium transition-colors ${
          theme === "light"
            ? "bg-[var(--color-primary)] text-white"
            : "text-[var(--color-muted)]"
        }`}
      >
        <input
          type="radio"
          name="theme"
          value="light"
          className="sr-only"
          checked={theme === "light"}
          onChange={() => setTheme("light")}
        />
        Light
      </label>
      <label
        className={`flex cursor-pointer items-center gap-1 rounded-full px-3 py-1 font-medium transition-colors ${
          theme === "dark"
            ? "bg-[var(--color-primary)] text-white"
            : "text-[var(--color-muted)]"
        }`}
      >
        <input
          type="radio"
          name="theme"
          value="dark"
          className="sr-only"
          checked={theme === "dark"}
          onChange={() => setTheme("dark")}
        />
        Dark
      </label>
    </div>
  );
}
