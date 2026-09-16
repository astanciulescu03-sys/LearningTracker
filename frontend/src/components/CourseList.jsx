import { useRef } from "react";
import CourseCard from "./CourseCard.jsx";

export default function CourseList({
  courses,
  onUpdate,
  onDelete,
  onAddModule,
  onUpdateModule,
  onDeleteModule,
  neglectedDays,
}) {
  const scrollRef = useRef(null);

  const scrollByAmount = (direction) => {
    const el = scrollRef.current;
    if (!el) return;
    // o "pagina" = exact latimea vizibila (numarul de carduri configurat prin
    // --cards-per-view in CSS), ca sageata sa avanseze cu un set intreg de
    // carduri, nu cu unul taiat pe jumatate
    el.scrollBy({ left: el.clientWidth * direction, behavior: "smooth" });
  };

  if (courses.length === 0) {
    return <p className="empty-state">Niciun curs inca. Adauga unul mai jos!</p>;
  }

  return (
    <div className="course-list-wrapper">
      <button
        type="button"
        className="course-list__nav course-list__nav--left"
        onClick={() => scrollByAmount(-1)}
        aria-label="Deruleaza spre stanga"
      >
        &#8249;
      </button>

      <div className="course-list" ref={scrollRef}>
        {courses.map((course) => (
          <CourseCard
            key={course.id}
            course={course}
            onUpdate={onUpdate}
            onDelete={onDelete}
            onAddModule={onAddModule}
            onUpdateModule={onUpdateModule}
            onDeleteModule={onDeleteModule}
            neglectedDays={neglectedDays}
          />
        ))}
      </div>

      <button
        type="button"
        className="course-list__nav course-list__nav--right"
        onClick={() => scrollByAmount(1)}
        aria-label="Deruleaza spre dreapta"
      >
        &#8250;
      </button>
    </div>
  );
}
