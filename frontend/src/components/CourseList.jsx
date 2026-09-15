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
  if (courses.length === 0) {
    return <p className="empty-state">Niciun curs inca. Adauga unul mai jos!</p>;
  }

  return (
    <div className="course-list">
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
  );
}
