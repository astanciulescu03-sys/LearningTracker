# Learning Tracker

Aplicatie full-stack pentru urmarirea progresului la cursuri: backend Flask (API REST + SQLite) si frontend React (Vite + Tailwind CSS).

## Structura

```
learning-tracker/
├── backend/            # API Flask
│   ├── app.py          # punctul de intrare, creeaza aplicatia si baza de date
│   ├── models.py       # modelele Course si Module (SQLAlchemy)
│   ├── routes.py       # endpoint-urile /api/courses, /api/courses/<id>/modules, /api/stats
│   ├── config.py       # configurare DB + CORS
│   ├── requirements.txt
│   └── instance/
│       └── tracker.db  # SQLite, generat automat la prima rulare
│
├── frontend/           # aplicatie React (Vite + Tailwind)
│   ├── index.html
│   ├── src/
│   │   ├── main.jsx
│   │   ├── App.jsx
│   │   ├── api.js       # toate apelurile catre backend
│   │   ├── components/
│   │   │   ├── CourseList.jsx
│   │   │   ├── CourseCard.jsx
│   │   │   ├── ModuleList.jsx
│   │   │   ├── ProgressBar.jsx
│   │   │   ├── AddCourseForm.jsx
│   │   │   ├── StatsPanel.jsx
│   │   │   └── ThemeToggle.jsx
│   │   └── styles.css   # @import "tailwindcss" + variabile CSS pentru tema light/dark
│   ├── package.json
│   └── vite.config.js
│
├── docker-compose.yml
└── README.md
```

> Nota: `index.html` este la radacina `frontend/` (nu in `public/`), pentru ca asa cere Vite implicit — `public/` e rezervat pentru fisiere statice servite ca atare (imagini, favicon etc.).

## Model de date

Un **Course** (curs) e impartit in **Module**, iar fiecare modul e format dintr-un numar de **cursuri/lectii** (`total_lessons` / `completed_lessons`). Poti seta un numar standard de lectii per modul la nivel de curs (`default_lessons_per_module`), dar fiecare modul poate avea propriul numar, customizat.

### Course

| Camp | Tip | Descriere |
|---|---|---|
| id | int | identificator |
| title | string | titlul cursului, ex: "Microsoft Azure Fundamentals AZ-900" (obligatoriu) |
| platform | string | ex: "Coursera", "TryHackMe", "YouTube" |
| hours_spent | float | ore petrecute pe curs |
| status | string | `active` \| `paused` \| `completed` |
| default_lessons_per_module | int | numarul standard de cursuri/lectii pentru un modul nou (customizabil per modul) |
| start_date | date | ziua calendaristica in care ai inceput efectiv cursul (setata manual) |
| created_at | datetime | data la care a fost adaugat in tracker |
| last_activity | datetime | cheia pentru "ce am neglijat" — actualizat automat cand se schimba ore/status/progres pe module |
| modules | Module[] | lista modulelor cursului |
| total_modules / completed_modules | int | calculate din `modules` |
| total_lessons / completed_lessons | int | calculate din `modules` |
| progress_percent | float | calculat din `completed_lessons / total_lessons` |
| days_since_activity | int | calculat din `last_activity` |

### Module

| Camp | Tip | Descriere |
|---|---|---|
| id | int | identificator |
| course_id | int | cursul parinte |
| title | string | optional, implicit "Modul N" |
| position | int | ordinea de afisare |
| total_lessons | int | numarul de cursuri/lectii din modul (implicit = `default_lessons_per_module` al cursului, dar customizabil) |
| completed_lessons | int | cursuri/lectii finalizate din modul |
| progress_percent / is_complete | — | calculate |

## Rulare locala (fara Docker)

### Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate      # Windows
pip install -r requirements.txt
python app.py                # porneste pe http://localhost:5000
```

### Frontend

```bash
cd frontend
npm install
npm run dev                  # porneste pe http://localhost:5173
```

Vite face proxy automat pentru cererile `/api/*` catre `http://localhost:5000` (vezi `vite.config.js`), asa ca frontend-ul si backend-ul pot rula independent in dezvoltare.

## Rulare cu Docker Compose

```bash
docker compose up --build
```

- Backend: http://localhost:5000
- Frontend: http://localhost:5173

> In interiorul containerelor Docker, frontend-ul ar trebui sa apeleze backend-ul prin numele serviciului (`backend`), nu prin `localhost`. Pentru dezvoltare locala fara Docker, proxy-ul din `vite.config.js` (catre `localhost:5000`) este suficient.

## API

| Metoda | Ruta | Descriere |
|---|---|---|
| GET | `/api/courses` | toate cursurile (filtre optionale: `?status=`, `?platform=`, `?sort=neglected`) |
| GET | `/api/courses/<id>` | un curs specific, cu modulele lui |
| POST | `/api/courses` | adauga un curs nou (`total_modules` + `default_lessons_per_module` genereaza modulele automat, sau `modules: [...]` pentru module custom de la inceput) |
| PATCH | `/api/courses/<id>` | actualizeaza titlu/platforma/ore/status/`default_lessons_per_module`/`start_date` |
| DELETE | `/api/courses/<id>` | sterge un curs (si modulele lui) |
| POST | `/api/courses/<id>/modules` | adauga un modul nou (optional `title`, `total_lessons` — daca lipseste, se foloseste numarul standard al cursului) |
| PATCH | `/api/courses/<id>/modules/<module_id>` | actualizeaza `title`/`total_lessons`/`completed_lessons` pentru un modul |
| DELETE | `/api/courses/<id>/modules/<module_id>` | sterge un modul |
| GET | `/api/stats` | statistici agregate (total cursuri/module/lectii/ore, progres mediu, pe status/platforma, cele mai neglijate — `?neglected_days=` seteaza pragul, implicit 7) |

`?sort=neglected` pe `GET /api/courses` sorteaza cursurile dupa `last_activity` (cel mai vechi prima), util pentru a vedea rapid ce ai lasat balta.

## Tema light/dark

Butonul din coltul din dreapta sus (radio Light/Dark) comuta clasa `.dark` pe `<html>`; preferinta e salvata in `localStorage`. Stilizarea foloseste Tailwind CSS (strategia de dark mode bazata pe clasa `.dark`, configurata in `styles.css` prin `@custom-variant dark`) impreuna cu variabile CSS custom pentru componentele mai vechi.

## Ierarhia componentelor React

```
App
├── ThemeToggle         (comuta light/dark, fara props)
├── StatsPanel          (primeste: stats)
├── AddCourseForm       (primeste: onCourseAdded)
└── CourseList          (primeste: courses, onUpdate, onDelete, onAddModule, onUpdateModule, onDeleteModule)
    └── CourseCard       (cate unul per curs)
        ├── ProgressBar   (primeste: completed, total)
        └── ModuleList    (primeste: modules, onAddModule, onUpdateModule, onDeleteModule)
            └── ProgressBar (per modul)
```
