# PharmacoGuard

> AI-powered pharmacovigilance platform for monitoring drug interactions, adverse events, and medication safety.

LIVE VERCEL LINK:- pharmacoguard.vercel.app

---

## Architecture

```
pharmacoguard/
├── backend/          # FastAPI + SQLAlchemy + Celery
│   ├── app/
│   │   ├── api/v1/   # Versioned REST endpoints
│   │   ├── core/     # Config, security, Celery
│   │   ├── db/       # PostgreSQL, MongoDB, Redis clients
│   │   ├── models/   # SQLAlchemy ORM models
│   │   ├── schemas/  # Pydantic v2 request/response schemas
│   │   └── services/ # Business logic, Groq AI, background tasks
│   ├── alembic/      # Database migrations
│   ├── tests/
│   └── Dockerfile
├── frontend/         # React 18 + TypeScript + Vite + Tailwind + shadcn/ui
│   ├── src/
│   │   ├── components/  # UI components (shadcn/ui + custom)
│   │   ├── lib/         # API client, Supabase, utils
│   │   ├── pages/       # Route-level page components
│   │   └── stores/      # Zustand state stores
│   └── Dockerfile
├── docker-compose.yml
├── .env.example
└── README.md
```

## Tech Stack

| Layer       | Technology                                          |
| ----------- | --------------------------------------------------- |
| Frontend    | React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui |
| State       | Zustand + React Query (TanStack Query v5)           |
| Backend     | FastAPI (Python 3.12), Pydantic v2                  |
| ORM         | SQLAlchemy 2.0 (async)                              |
| Database    | Supabase (PostgreSQL) – structured data             |
| Logs DB     | MongoDB Atlas – audit & AI interaction logs         |
| Cache/Queue | Redis + Celery                                      |
| AI/LLM      | Groq API (llama-3.3-70b-versatile)                  |
| Auth        | Supabase Auth (JWT) – patient / doctor / admin      |

## Roles

| Role      | Capabilities                                                  |
| --------- | ------------------------------------------------------------- |
| `patient` | View medications, report adverse events, use AI analysis      |
| `doctor`  | All patient capabilities + create medications, review reports |
| `admin`   | Full access including user management                         |

## Getting Started

### Prerequisites

- **Node.js** ≥ 20
- **Python** ≥ 3.12
- **Docker** & **Docker Compose**
- Supabase project (free tier works)
- MongoDB Atlas cluster (free tier works)
- Groq API key

### 1. Clone & configure

```bash
git clone https://github.com/<your-org>/pharmacoguard.git
cd pharmacoguard
cp .env.example .env
# Fill in all values in .env
```

### 2. Run with Docker Compose (recommended)

```bash
docker compose up --build
```

- Frontend: http://localhost:5173
- Backend API docs: http://localhost:8000/api/docs

### 3. Run locally (without Docker)

**Backend:**

```bash
cd backend
python -m venv .venv && source .venv/bin/activate   # or .venv\Scripts\activate on Windows
pip install -e ".[dev]"
uvicorn app.main:app --reload
```

**Celery worker:**

```bash
cd backend
celery -A app.core.celery_app worker --loglevel=info
```

**Frontend:**

```bash
cd frontend
npm install
npm run dev
```

### 4. Database migrations

```bash
cd backend
alembic revision --autogenerate -m "initial"
alembic upgrade head
```

## API Endpoints

| Method | Path                          | Auth     | Description                |
| ------ | ----------------------------- | -------- | -------------------------- |
| POST   | `/api/v1/auth/signup`         | Public   | Register new user          |
| POST   | `/api/v1/auth/login`          | Public   | Sign in, receive JWT       |
| GET    | `/api/v1/users/me`            | Any      | Current user profile       |
| GET    | `/api/v1/users/`              | Admin    | List all users             |
| PATCH  | `/api/v1/users/:id`           | Admin    | Update user                |
| GET    | `/api/v1/medications/`        | Any      | List medications           |
| POST   | `/api/v1/medications/`        | Dr/Admin | Create medication          |
| GET    | `/api/v1/medications/:id`     | Any      | Get medication by ID       |
| POST   | `/api/v1/adverse-events/`     | Any      | Report adverse event       |
| GET    | `/api/v1/adverse-events/`     | Dr/Admin | List adverse events        |
| GET    | `/api/v1/adverse-events/:id`  | Any      | Get event by ID            |
| POST   | `/api/v1/ai/drug-interactions`| Any      | AI drug interaction check  |
| POST   | `/api/v1/ai/symptom-analysis` | Any      | AI symptom analysis        |

## License

MIT
