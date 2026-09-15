from datetime import date, datetime, timezone

from flask import Blueprint, jsonify, request

from models import Course, Module, db

api = Blueprint("api", __name__, url_prefix="/api")

VALID_STATUSES = {"active", "paused", "completed"}

# campurile de pe Course a caror modificare inseamna "activitate"
COURSE_ACTIVITY_FIELDS = {"hours_spent", "status"}


def _error(message, status_code=400):
    return jsonify({"error": message}), status_code


def _touch(course):
    """Marcheaza cursul ca avand activitate recenta (actualizeaza last_activity)."""
    course.last_activity = datetime.now(timezone.utc)


def _parse_int(value, field_name, allow_none=False):
    if value is None:
        if allow_none:
            return None
        raise ValueError(f"Campul '{field_name}' este obligatoriu.")
    try:
        parsed = int(value)
    except (TypeError, ValueError):
        raise ValueError(f"Campul '{field_name}' trebuie sa fie un numar intreg.")
    if parsed < 0:
        raise ValueError(f"Campul '{field_name}' nu poate fi negativ.")
    return parsed


def _parse_course_payload(data, partial=False):
    """Valideaza si extrage campurile unui curs din payload-ul JSON."""
    fields = {}

    if "title" in data or not partial:
        title = (data.get("title") or "").strip()
        if not title:
            raise ValueError("Campul 'title' este obligatoriu.")
        fields["title"] = title

    if "platform" in data:
        fields["platform"] = (data.get("platform") or "").strip() or None
    elif not partial:
        fields["platform"] = None

    if "hours_spent" in data:
        try:
            value = float(data.get("hours_spent") or 0)
        except (TypeError, ValueError):
            raise ValueError("Campul 'hours_spent' trebuie sa fie numeric.")
        if value < 0:
            raise ValueError("Campul 'hours_spent' nu poate fi negativ.")
        fields["hours_spent"] = value
    elif not partial:
        fields["hours_spent"] = 0

    if "status" in data:
        status = data.get("status") or "active"
        if status not in VALID_STATUSES:
            raise ValueError(
                f"Status invalid. Valori acceptate: {', '.join(sorted(VALID_STATUSES))}."
            )
        fields["status"] = status
    elif not partial:
        fields["status"] = "active"

    if "default_lessons_per_module" in data:
        fields["default_lessons_per_module"] = _parse_int(
            data.get("default_lessons_per_module"), "default_lessons_per_module"
        ) or 1
    elif not partial:
        fields["default_lessons_per_module"] = int(
            data.get("default_lessons_per_module") or 1
        )

    if "start_date" in data:
        raw = data.get("start_date")
        if not raw:
            fields["start_date"] = None
        else:
            try:
                fields["start_date"] = date.fromisoformat(raw)
            except (TypeError, ValueError):
                raise ValueError(
                    "Campul 'start_date' trebuie sa fie o data valida (YYYY-MM-DD)."
                )

    return fields


def _parse_module_payload(data, default_lessons, partial=False):
    """Valideaza si extrage campurile unui modul din payload-ul JSON."""
    fields = {}

    if "title" in data:
        fields["title"] = (data.get("title") or "").strip() or None
    elif not partial:
        fields["title"] = None

    if "total_lessons" in data:
        fields["total_lessons"] = _parse_int(
            data.get("total_lessons"), "total_lessons"
        )
    elif not partial:
        # daca nu se specifica, se foloseste numarul standard al cursului
        fields["total_lessons"] = default_lessons

    if "completed_lessons" in data:
        fields["completed_lessons"] = _parse_int(
            data.get("completed_lessons"), "completed_lessons"
        )
    elif not partial:
        fields["completed_lessons"] = 0

    return fields


# ---------------------------------------------------------------------------
# Cursuri
# ---------------------------------------------------------------------------


@api.get("/courses")
def list_courses():
    """Returneaza toate cursurile, optional filtrate si sortate.

    Query params:
      status=active|paused|completed
      platform=<nume platforma>
      sort=neglected  -> cele mai neglijate primele (last_activity cel mai vechi)
    """
    query = Course.query

    status = request.args.get("status")
    if status:
        query = query.filter(Course.status == status)

    platform = request.args.get("platform")
    if platform:
        query = query.filter(Course.platform == platform)

    sort = request.args.get("sort")
    if sort == "neglected":
        query = query.order_by(Course.last_activity.asc())
    else:
        query = query.order_by(Course.created_at.desc())

    courses = query.all()
    return jsonify([c.to_dict() for c in courses])


@api.get("/courses/<int:course_id>")
def get_course(course_id):
    course = Course.query.get_or_404(course_id)
    return jsonify(course.to_dict())


@api.post("/courses")
def create_course():
    """Creeaza un curs. Optional poate genera automat modulele initiale:

    - "total_modules": <int>  -> creeaza atatea module, fiecare cu
      "default_lessons_per_module" cursuri (numarul standard)
    - "modules": [{"title": ..., "total_lessons": ...}, ...]  -> creeaza
      module custom (are prioritate fata de "total_modules")
    """
    data = request.get_json(silent=True) or {}
    try:
        fields = _parse_course_payload(data, partial=False)
    except ValueError as exc:
        return _error(str(exc))

    now = datetime.now(timezone.utc)
    course = Course(**fields, created_at=now, last_activity=now)

    custom_modules = data.get("modules")
    if custom_modules:
        if not isinstance(custom_modules, list):
            return _error("Campul 'modules' trebuie sa fie o lista.")
        for i, m in enumerate(custom_modules):
            try:
                total_lessons = _parse_int(
                    (m or {}).get("total_lessons", fields["default_lessons_per_module"]),
                    "total_lessons",
                )
            except ValueError as exc:
                return _error(str(exc))
            course.modules.append(
                Module(
                    title=((m or {}).get("title") or "").strip() or None,
                    position=i,
                    total_lessons=total_lessons,
                    completed_lessons=0,
                )
            )
    else:
        try:
            total_modules = _parse_int(
                data.get("total_modules", 0), "total_modules"
            )
        except ValueError as exc:
            return _error(str(exc))
        for i in range(total_modules):
            course.modules.append(
                Module(
                    position=i,
                    total_lessons=fields["default_lessons_per_module"],
                    completed_lessons=0,
                )
            )

    db.session.add(course)
    db.session.commit()
    return jsonify(course.to_dict()), 201


@api.put("/courses/<int:course_id>")
@api.patch("/courses/<int:course_id>")
def update_course(course_id):
    course = Course.query.get_or_404(course_id)
    data = request.get_json(silent=True) or {}

    try:
        fields = _parse_course_payload(data, partial=True)
    except ValueError as exc:
        return _error(str(exc))

    touched_activity = any(key in fields for key in COURSE_ACTIVITY_FIELDS)

    for key, value in fields.items():
        setattr(course, key, value)

    if touched_activity:
        _touch(course)

    db.session.commit()
    return jsonify(course.to_dict())


@api.delete("/courses/<int:course_id>")
def delete_course(course_id):
    course = Course.query.get_or_404(course_id)
    db.session.delete(course)
    db.session.commit()
    return "", 204


# ---------------------------------------------------------------------------
# Module (cu cursurile/lectiile lor)
# ---------------------------------------------------------------------------


@api.post("/courses/<int:course_id>/modules")
def create_module(course_id):
    """Adauga un modul nou la un curs.

    Daca 'total_lessons' nu e specificat, se foloseste numarul standard
    al cursului (Course.default_lessons_per_module) — altfel, valoarea
    trimisa customizeaza doar acest modul.
    """
    course = Course.query.get_or_404(course_id)
    data = request.get_json(silent=True) or {}

    try:
        fields = _parse_module_payload(
            data, default_lessons=course.default_lessons_per_module, partial=False
        )
    except ValueError as exc:
        return _error(str(exc))

    module = Module(
        course_id=course.id,
        position=len(course.modules),
        **fields,
    )
    db.session.add(module)
    _touch(course)
    db.session.commit()
    return jsonify(module.to_dict()), 201


@api.put("/courses/<int:course_id>/modules/<int:module_id>")
@api.patch("/courses/<int:course_id>/modules/<int:module_id>")
def update_module(course_id, module_id):
    course = Course.query.get_or_404(course_id)
    module = Module.query.filter_by(id=module_id, course_id=course.id).first_or_404()
    data = request.get_json(silent=True) or {}

    try:
        fields = _parse_module_payload(
            data, default_lessons=course.default_lessons_per_module, partial=True
        )
    except ValueError as exc:
        return _error(str(exc))

    if "total_lessons" in fields and "completed_lessons" not in fields:
        # nu lasam completed_lessons sa ramana peste noul total
        fields["completed_lessons"] = min(module.completed_lessons, fields["total_lessons"])

    for key, value in fields.items():
        setattr(module, key, value)

    if fields:
        _touch(course)

    db.session.commit()
    return jsonify(module.to_dict())


@api.delete("/courses/<int:course_id>/modules/<int:module_id>")
def delete_module(course_id, module_id):
    course = Course.query.get_or_404(course_id)
    module = Module.query.filter_by(id=module_id, course_id=course.id).first_or_404()
    db.session.delete(module)
    _touch(course)
    db.session.commit()
    return "", 204


# ---------------------------------------------------------------------------
# Statistici
# ---------------------------------------------------------------------------


@api.get("/stats")
def get_stats():
    """Statistici agregate: total, pe status, module, lectii, ore, progres mediu, neglijate.

    Query params:
      neglected_days=<int>  -> prag (in zile) pentru sectiunea "most_neglected"
                                (implicit 7)
    """
    try:
        neglected_days = int(request.args.get("neglected_days", 7))
    except (TypeError, ValueError):
        return _error("Parametrul 'neglected_days' trebuie sa fie un numar intreg.")
    if neglected_days < 0:
        return _error("Parametrul 'neglected_days' nu poate fi negativ.")

    courses = Course.query.all()
    total = len(courses)

    by_status = {"active": 0, "paused": 0, "completed": 0}
    total_modules = 0
    completed_modules = 0
    total_lessons = 0
    completed_lessons = 0
    total_hours = 0.0

    for c in courses:
        by_status[c.status] = by_status.get(c.status, 0) + 1
        total_modules += c.total_modules
        completed_modules += c.completed_modules
        total_lessons += c.total_lessons
        completed_lessons += c.completed_lessons
        total_hours += c.hours_spent or 0

    avg_progress = (
        round(sum(c.progress_percent for c in courses) / total, 1) if total else 0
    )

    platforms = {}
    for c in courses:
        key = c.platform or "Nespecificat"
        platforms[key] = platforms.get(key, 0) + 1

    # cursuri neglijate: nu sunt finalizate si nu au avut activitate de cel
    # putin `neglected_days` zile, sortate dupa cea mai veche activitate
    neglected = sorted(
        (
            c
            for c in courses
            if c.status != "completed"
            and c.days_since_activity is not None
            and c.days_since_activity >= neglected_days
        ),
        key=lambda c: c.last_activity,
    )

    return jsonify(
        {
            "total_courses": total,
            "by_status": by_status,
            "total_modules": total_modules,
            "completed_modules": completed_modules,
            "total_lessons": total_lessons,
            "completed_lessons": completed_lessons,
            "total_hours": round(total_hours, 1),
            "average_progress_percent": avg_progress,
            "by_platform": platforms,
            "neglected_days_threshold": neglected_days,
            "most_neglected": [c.to_dict(include_modules=False) for c in neglected],
        }
    )
