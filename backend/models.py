from datetime import datetime, timezone

from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()


def _now():
    return datetime.now(timezone.utc)


class Course(db.Model):
    """Un curs urmarit de utilizator (ex: un curriculum de pe o platforma),
    impartit in module, iar fiecare modul e format din cursuri (lectii)."""

    __tablename__ = "courses"

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    # ex: "Microsoft Azure Fundamentals AZ-900"
    platform = db.Column(db.String(100), nullable=True)
    # ex: "Coursera", "TryHackMe", "YouTube"
    hours_spent = db.Column(db.Float, nullable=False, default=0)
    status = db.Column(db.String(20), nullable=False, default="active")
    # status posibil: active | paused | completed
    # numarul standard de cursuri/lectii per modul, folosit ca valoare
    # implicita cand se adauga un modul nou fara sa specifici altceva
    # (fiecare modul poate totusi sa aiba propriul numar, customizat)
    default_lessons_per_module = db.Column(db.Integer, nullable=False, default=1)
    # ziua (calendaristica) in care ai inceput efectiv cursul — se seteaza
    # manual, e diferita de created_at (cand a fost adaugat in tracker)
    start_date = db.Column(db.Date, nullable=True)
    created_at = db.Column(db.DateTime, nullable=False, default=_now)
    last_activity = db.Column(db.DateTime, nullable=False, default=_now)
    # cheia pentru "ce am neglijat": actualizat de fiecare data cand
    # progresul (lectii/ore/status) se schimba

    modules = db.relationship(
        "Module",
        backref="course",
        order_by="Module.position",
        cascade="all, delete-orphan",
    )

    @property
    def total_modules(self):
        return len(self.modules)

    @property
    def completed_modules(self):
        return sum(1 for m in self.modules if m.is_complete)

    @property
    def total_lessons(self):
        return sum(m.total_lessons or 0 for m in self.modules)

    @property
    def completed_lessons(self):
        return sum(m.completed_lessons or 0 for m in self.modules)

    @property
    def progress_percent(self):
        total = self.total_lessons
        if not total:
            return 0
        percent = (self.completed_lessons / total) * 100
        return round(min(max(percent, 0), 100), 1)

    @property
    def days_since_activity(self):
        if not self.last_activity:
            return None
        last = self.last_activity
        if last.tzinfo is None:
            last = last.replace(tzinfo=timezone.utc)
        delta = _now() - last
        return delta.days

    def to_dict(self, include_modules=True):
        data = {
            "id": self.id,
            "title": self.title,
            "platform": self.platform,
            "hours_spent": self.hours_spent,
            "status": self.status,
            "default_lessons_per_module": self.default_lessons_per_module,
            "start_date": self.start_date.isoformat() if self.start_date else None,
            "total_modules": self.total_modules,
            "completed_modules": self.completed_modules,
            "total_lessons": self.total_lessons,
            "completed_lessons": self.completed_lessons,
            "progress_percent": self.progress_percent,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "last_activity": self.last_activity.isoformat()
            if self.last_activity
            else None,
            "days_since_activity": self.days_since_activity,
        }
        if include_modules:
            data["modules"] = [m.to_dict() for m in self.modules]
        return data


class Module(db.Model):
    """Un modul dintr-un curs, format dintr-un numar de cursuri/lectii."""

    __tablename__ = "modules"

    id = db.Column(db.Integer, primary_key=True)
    course_id = db.Column(
        db.Integer, db.ForeignKey("courses.id"), nullable=False, index=True
    )
    title = db.Column(db.String(200), nullable=True)
    # pozitia modulului in cadrul cursului (ordinea de afisare)
    position = db.Column(db.Integer, nullable=False, default=0)
    # numarul de cursuri/lectii din acest modul (implicit preluat din
    # Course.default_lessons_per_module, dar customizabil per modul)
    total_lessons = db.Column(db.Integer, nullable=False, default=1)
    completed_lessons = db.Column(db.Integer, nullable=False, default=0)

    @property
    def is_complete(self):
        return self.total_lessons > 0 and self.completed_lessons >= self.total_lessons

    @property
    def progress_percent(self):
        if not self.total_lessons or self.total_lessons <= 0:
            return 0
        percent = (self.completed_lessons / self.total_lessons) * 100
        return round(min(max(percent, 0), 100), 1)

    def to_dict(self):
        return {
            "id": self.id,
            "course_id": self.course_id,
            "title": self.title or f"Modul {self.position + 1}",
            "position": self.position,
            "total_lessons": self.total_lessons,
            "completed_lessons": self.completed_lessons,
            "progress_percent": self.progress_percent,
            "is_complete": self.is_complete,
        }
