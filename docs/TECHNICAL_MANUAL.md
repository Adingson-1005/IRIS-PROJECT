# IRIS Technical Manual

**Institutional Research Repository System**
St. Joseph College Olongapo

---

## 1. System Overview

### Purpose

IRIS is a full-stack web application that serves as the institutional research repository for St. Joseph College Olongapo. It supports three roles (admin, instructor, student) and combines a custom keyword-search engine with two LLM-powered features: a research draft checker and a retrieval-augmented question-answering assistant.

### Architecture

```
+--------------------+        HTTPS / JSON       +-----------------------+
|  React 19 frontend | <-----------------------> |  FastAPI backend      |
|  (Vite, Vercel)    |       JWT in headers      |  (Render)             |
+--------------------+                           +----------+------------+
                                                            |
                          +---------------------------------+----------+
                          |                                            |
                  +-------v--------+                          +--------v--------+
                  | Supabase       |                          | PostgreSQL      |
                  | Storage bucket |                          | (Supabase or    |
                  | "iris-files"   |                          |  managed PG)    |
                  +----------------+                          +-----------------+
                                                                       |
                                                          +------------v------------+
                                                          | Groq Cloud              |
                                                          | llama-3.3-70b-versatile |
                                                          +-------------------------+
```

### Technologies

**Frontend**
- React 19, React Router 7
- Vite 8 build tool
- Axios for HTTP
- Plain CSS, no UI framework

**Backend**
- Python 3.10+
- FastAPI with `uvicorn[standard]`
- SQLAlchemy 2.x (using raw `text()` queries)
- Pydantic for request schemas
- `python-jose` for JWT, `bcrypt==4.0.1` for hashing
- PyMuPDF (`fitz`) for PDF extraction
- `httpx` for outbound requests
- `groq` SDK for LLM calls
- `supabase` SDK for object storage

**Database & Storage**
- PostgreSQL (any managed provider; Supabase Postgres works out of the box)
- Supabase Storage bucket `iris-files`

**Hosting**
- Frontend: Vercel
- Backend: Render
- Database & files: Supabase

---

## 2. Installation Guide

### Required tools

- Node.js 18+ and npm
- Python 3.10+
- Git
- A Supabase project (for Postgres + Storage)
- A Groq Cloud API key

### Clone the repository

```bash
git clone <your-repo-url> IRIS-PROJECT
cd IRIS-PROJECT
```

### Backend setup

```bash
cd backend
python -m venv venv
venv\Scripts\activate                  # Windows
# source venv/bin/activate              # macOS / Linux
pip install -r requirements.txt
```

Create `backend/.env` with the variables listed in section 7. Then run:

```bash
uvicorn main:app --reload --port 8000
```

The API is available at `http://localhost:8000`. Visit `/docs` for the auto-generated Swagger UI.

### Frontend setup

```bash
cd frontend
npm install
npm run dev
```

Vite serves the app at `http://localhost:5173` by default.

> The frontend currently hardcodes the production backend URL `https://iris-backend-7717.onrender.com`. To run the frontend against a local backend, replace those URLs (or refactor them into a single `API_BASE` constant in `src/api/`).

### Database setup

Connect to your Postgres instance and create the schema. The application expects these tables (definitions inferred from the queries used):

```sql
-- users
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,           -- bcrypt hash
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin','instructor','student')),
  class_name TEXT,                  -- student's selected class
  created_at TIMESTAMPTZ DEFAULT now()
);

-- classes
CREATE TABLE classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  instructor_id UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- papers
CREATE TABLE papers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  authors TEXT NOT NULL,
  abstract TEXT,
  category TEXT,                    -- strand: STEM/HUMSS/ABM/GAS
  methodology TEXT,
  year INT,
  file_url TEXT NOT NULL,
  uploaded_by UUID REFERENCES users(id),
  downloads INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- inverted_index (custom keyword search)
CREATE TABLE inverted_index (
  id BIGSERIAL PRIMARY KEY,
  term TEXT NOT NULL,
  paper_id UUID NOT NULL REFERENCES papers(id) ON DELETE CASCADE,
  frequency INT NOT NULL,
  positions INT[] NOT NULL
);
CREATE INDEX idx_inverted_index_term ON inverted_index(term);
CREATE INDEX idx_inverted_index_paper ON inverted_index(paper_id);

-- search_logs
CREATE TABLE search_logs (
  id BIGSERIAL PRIMARY KEY,
  keyword TEXT NOT NULL,            -- "DOWNLOAD: <title>" for downloads
  results_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- templates (one active template at a time)
CREATE TABLE templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_url TEXT NOT NULL,
  uploaded_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- student_drafts (student work-in-progress)
CREATE TABLE student_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT,                   -- 'PDF' or 'DOCX'
  created_at TIMESTAMPTZ DEFAULT now()
);

-- draft_comments
CREATE TABLE draft_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  draft_id UUID NOT NULL REFERENCES student_drafts(id) ON DELETE CASCADE,
  instructor_id UUID NOT NULL REFERENCES users(id),
  comment TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- student_submissions (AI Checker results)
CREATE TABLE student_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  template_id UUID REFERENCES templates(id),
  file_url TEXT NOT NULL,
  title TEXT NOT NULL,
  score INT,
  feedback TEXT,
  status TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

Seed at least one admin user manually (bcrypt hash the password) and a few class rows so students can pick a class.

### Supabase Storage

Create a public bucket named `iris-files`. The backend writes into folders `papers/`, `drafts/`, `student_drafts/`, and `templates/`.

---

## 3. Folder Structure

```
IRIS-PROJECT/
├── backend/
│   ├── main.py                    # FastAPI app, CORS, router registration
│   ├── database.py                # SQLAlchemy engine + session factory
│   ├── requirements.txt
│   ├── .env                       # secrets (not committed)
│   ├── routes/
│   │   ├── auth.py                # /auth/login, /auth/register
│   │   ├── papers.py              # /papers/* — repository CRUD + indexing
│   │   ├── search.py              # /search/  — keyword search
│   │   ├── templates.py           # /templates/* — research template upload
│   │   ├── drafts.py              # /drafts/* — student drafts + comments
│   │   ├── classes.py             # /classes/* — class assignments
│   │   ├── users.py               # /users/list, /users/delete/{id}
│   │   ├── analytics.py           # /analytics/* — admin dashboard data
│   │   ├── ai.py                  # /ai/submit-draft (AI Checker)
│   │   └── rag.py                 # /rag/ask (AI Guidance)
│   ├── services/
│   │   ├── ai_checker.py          # Groq prompt + score parsing
│   │   ├── inverted_index.py      # tokenize, build_index, search_index
│   │   └── storage.py             # Supabase upload/download helpers
│   └── uploads/                   # local fallback (mounted at /uploads)
│
├── frontend/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── vercel.json
│   ├── public/
│   └── src/
│       ├── main.jsx               # entry point
│       ├── App.jsx                # routes
│       ├── index.css / App.css
│       ├── assets/                # logos, hero image
│       ├── components/
│       │   ├── PaperView.jsx      # paper detail modal
│       │   └── ProtectedRoute.jsx # role + token guard
│       ├── pages/
│       │   ├── Login.jsx
│       │   ├── AdminDashboard.jsx
│       │   ├── InstructorDashboard.jsx
│       │   ├── SearchPapers.jsx       # student landing
│       │   ├── BrowseRepository.jsx
│       │   ├── ManagePapers.jsx
│       │   ├── ManageUsers.jsx
│       │   ├── ManageClasses.jsx
│       │   ├── Analytics.jsx
│       │   ├── MyUploads.jsx          # instructor papers
│       │   ├── MyDrafts.jsx           # student drafts
│       │   ├── StudentDrafts.jsx      # instructor/admin review
│       │   ├── UploadTemplate.jsx
│       │   ├── TermsAndConditions.jsx
│       │   └── LegalPolicy.jsx        # privacy policy modal
│       └── css/                       # one .css file per page
│
└── docs/
    ├── USER_MANUAL.md
    └── TECHNICAL_MANUAL.md
```

---

## 4. Database Structure

### Entity relationships

```
users (1) ─── (M) papers          via uploaded_by
users (1) ─── (M) student_drafts  via student_id
users (1) ─── (M) draft_comments  via instructor_id
users (1) ─── (1) classes         via classes.instructor_id
users.class_name ─── classes.name (loose link, by class name string)

papers (1) ─── (M) inverted_index via paper_id
templates (1) ─── (M) student_submissions via template_id
student_drafts (1) ─── (M) draft_comments via draft_id
```

### Important fields

- `users.role` is one of `admin`, `instructor`, `student`. The whole authorization model depends on this value.
- `users.class_name` connects a student to a class by **string match** to `classes.name`.
- `papers.category` is the SHS strand (STEM, HUMSS, ABM, GAS). It is also called *strand* in the UI.
- `inverted_index.positions` is a Postgres `INT[]` of token positions, kept for future phrase-search support.
- `search_logs.keyword` carries the prefix `DOWNLOAD: ` for download events so analytics can split queries from downloads.
- `student_submissions.score` is the integer 0-100 returned by the AI Checker.

### Indexing strategy

The system uses a **custom inverted index** instead of Postgres FTS. When a paper is uploaded:

1. PyMuPDF extracts the full text from the PDF.
2. The text is lowercased and tokenized with the regex `[a-z]+`.
3. Stop words and tokens shorter than 3 characters are dropped.
4. Each remaining term gets one `inverted_index` row per paper, with frequency and positions.
5. Indexing runs as a FastAPI **background task** so the upload response is fast.

Search aggregates per-term frequencies across the query tokens and returns papers ranked by total frequency. The same index powers the RAG paper retrieval.

---

## 5. API Endpoints

All endpoints return JSON. Endpoints other than `/auth/login`, `/auth/register`, and `/` require a JWT in the `Authorization: Bearer <token>` header.

Base URL (production): `https://iris-backend-7717.onrender.com`

### Auth (`/auth`)

| Method | Path | Body | Description |
|--------|------|------|-------------|
| POST | `/register` | `{email, password, full_name, role}` | Create a user. Email must be unique. |
| POST | `/login` | `{email, password}` | Returns `{token, role, full_name}`. |

### Papers (`/papers`)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/upload` | Multipart upload (title, authors, abstract, category, methodology, year, file). Triggers background indexing. |
| GET | `/list` | All papers, newest first. |
| GET | `/my-papers` | Papers uploaded by the current user. |
| POST | `/reindex-all` | Rebuild the inverted index for every paper (background task). |
| DELETE | `/delete/{paper_id}` | Remove paper and its index rows. |
| GET | `/download/{paper_id}` | Increments download counter and returns `{download_url}`. |

### Search (`/search`)

| Method | Path | Query | Description |
|--------|------|-------|-------------|
| GET | `/` | `keyword`, `category?`, `year?`, `methodology?` | Returns ranked results. Logs the query. |

### Templates (`/templates`)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/upload` | Upload or replace the active template. Only the original uploader can replace it. |
| GET | `/current` | Returns the current template plus an `is_owner` flag. |

### Drafts (`/drafts`)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/upload` | Student uploads a draft (PDF/DOCX). Requires `users.class_name` set. |
| GET | `/my-drafts` | Current student's drafts with comments. |
| DELETE | `/delete/{draft_id}` | Owner-only. |
| GET | `/all-students` | Instructor sees only students in their assigned class; admin sees all. |
| GET | `/student/{student_id}` | Drafts for a specific student. |
| POST | `/comment/{draft_id}` | Instructor adds a comment. Class match enforced. |
| DELETE | `/comment/{comment_id}` | Owner of the comment only. |

### Classes (`/classes`)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/list` | All classes plus instructor info. |
| POST | `/assign` | Admin sets `instructor_id` on a class. |
| POST | `/unassign` | Admin clears the instructor. |
| POST | `/select` | Student sets their `class_name`. |
| GET | `/my-class` | Current student's class and instructor name. |

### Users (`/users`)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/list` | All users. |
| DELETE | `/delete/{user_id}` | Removes a non-admin user. |

### Analytics (`/analytics`)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/summary` | Counts of users, papers, searches, downloads. |
| GET | `/top-searches` | Top 10 search keywords (excludes downloads). |
| GET | `/top-downloads` | Top 5 most-downloaded papers. |
| GET | `/category-breakdown` | Papers per strand. |

### AI (`/ai`)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/submit-draft` | Multipart (title, file). Compares the draft to the active template via Groq and returns `{title, score, feedback}`. |

### RAG (`/rag`)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/ask` | Body `{question}`. Returns `{answer, sources[]}`. Refuses requests that look like "write me a paper". |

### Misc

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Health check. |
| GET | `/test-db` | Verifies database connectivity. |

---

## 6. Authentication and Security

### Authentication

- **Login** issues an HS256 JWT signed with `SECRET_KEY`. Payload: `{sub: <user_id>, role: <role>, exp}`.
- **Token lifetime:** 24 hours (`auth.py` → `create_token`).
- The frontend stores the token, role, and full name in `localStorage` on login.
- Every authenticated request adds `Authorization: Bearer <token>`.
- `ProtectedRoute` (frontend) verifies the token client-side, decodes `exp`, and forces logout on expiry. It also clears storage if the user navigates back via the browser history.

### Password handling

- Stored as bcrypt hashes (`bcrypt==4.0.1`). Never log or echo plain passwords.
- `verify_password` uses constant-time comparison via `bcrypt.checkpw`.

### Roles and authorization

- Endpoints that should be admin-only check `user["role"] == "admin"` before mutating data (see `classes.py`).
- Comment authorship is enforced server-side: `drafts.py` confirms the instructor's class matches the student's `class_name` before allowing a comment.
- Templates can only be replaced by the original uploader.

### Input validation

- `python-multipart` plus FastAPI dependency injection validates form fields.
- File extensions are checked (`.pdf` for papers/templates, `.pdf/.docx/.doc` for drafts).
- File names are sanitized: `re.sub(r"[^a-zA-Z0-9._-]", "_", filename)` prevents path tricks.
- File contents are uploaded as raw bytes through the Supabase SDK; no shell execution.

### Hardening recommendations

- Set a strong, random `SECRET_KEY` in production. The default `"iris-secret"` is for local development only.
- Restrict `CORSMiddleware.allow_origins` to your real domains (already configured: Vercel app + localhost dev).
- Rotate the Groq and Supabase keys regularly; never commit `.env`.
- Add rate limiting (e.g., `slowapi`) on `/auth/login`, `/ai/submit-draft`, `/rag/ask`.
- Replace remaining raw SQL with parameterized statements only — current code uses `text()` with bound params, but any new code should follow the same pattern.

---

## 7. Deployment Guide

### Backend on Render

1. Push the repo to GitHub.
2. In Render, create a new **Web Service**.
3. **Root directory:** `backend`
4. **Build command:** `pip install -r requirements.txt`
5. **Start command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
6. **Environment variables (see below).**
7. Deploy. Render assigns a domain such as `https://iris-backend-7717.onrender.com`.

### Frontend on Vercel

1. Connect the GitHub repo to Vercel.
2. Set the project **Root Directory** to `frontend`.
3. Vercel auto-detects Vite. Build: `npm run build`. Output: `dist`.
4. Add the backend URL to your code if you refactor it to use an env variable (`VITE_API_BASE`), then set that variable in Vercel.
5. Deploy. Production URL: `https://iris-project-lemon.vercel.app`.

### Database and storage on Supabase

1. Create a new Supabase project.
2. Run the SQL from section 2 in the SQL editor.
3. Storage → New bucket → `iris-files` → public.
4. Copy `Project URL`, `service_role` key, and the Postgres connection string for use in `.env`.

### Environment variables (`backend/.env`)

```
DATABASE_URL=postgresql://<user>:<password>@<host>:5432/<db>
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_KEY=<service-role-key>
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SECRET_KEY=<long-random-string>
```

### CORS

Edit `main.py` if your frontend domain changes:

```python
allow_origins=[
    "https://iris-project-lemon.vercel.app",
    "http://localhost:5173",
]
```

### Frontend → backend URL

Currently hardcoded inside each page (e.g., `https://iris-backend-7717.onrender.com/...`). For real deployments, refactor to a single constant:

```js
// frontend/src/api/index.js
export const API_BASE = import.meta.env.VITE_API_BASE
  || 'https://iris-backend-7717.onrender.com'
```

Then set `VITE_API_BASE` in Vercel.

---

## 8. Maintenance and Troubleshooting

### Common issues

| Symptom | Likely cause | Fix |
|---|---|---|
| `ERR_BLOCKED_BY_CLIENT` for `LegalPolicy.jsx` (or `PrivacyPolicy.jsx` if reverted) | Ad blocker filter | Already mitigated by renaming `PrivacyPolicy.jsx` → `LegalPolicy.jsx`. If reintroduced, rename again. |
| Frontend renders blank with no console error | Token in `localStorage` is malformed | Clear site data and log in again. |
| Login returns `Invalid email or password` for valid credentials | Backend cannot reach Postgres | Hit `/test-db`; check `DATABASE_URL` and Supabase connection limits. |
| Search returns no results for a brand-new paper | Indexing background task hasn't finished or failed | Call `POST /papers/reindex-all` (admin) and check Render logs for `PDF extraction error` or `Index build error`. |
| AI Checker returns "AI evaluation failed" | Bad `GROQ_API_KEY`, rate limit, or model deprecated | Verify the key, check Groq dashboard, update the model name in `services/ai_checker.py` and `routes/rag.py` if Groq retires `llama-3.3-70b-versatile`. |
| `submit-draft` says "No template has been uploaded" | `templates` table empty | Have an instructor upload one via `/templates/upload`. |
| File upload returns 500 from Supabase | Bucket missing or wrong permissions | Confirm bucket name `iris-files` and that the service-role key is used. |
| Render service is sleeping / cold start | Free tier idles after inactivity | First request takes 30-60 seconds. Consider a paid tier or a periodic ping. |
| `psycopg2` connection timeouts under load | Supabase pool limits | Lower `pool_pre_ping` interval is already set; consider PgBouncer or increasing pool size in `database.py`. |

### Logs

- Render dashboard → service → Logs (real-time stdout/stderr).
- Vercel dashboard → project → Deployments → Runtime logs.
- Supabase dashboard → Database → Logs.
- Inverted-index errors print to stdout via `print(...)`. Replace with the `logging` module in production for proper levels and structured logs.

### Recurring maintenance

- **Quarterly:** rotate `SECRET_KEY`, Groq, and Supabase service-role keys.
- **After model updates:** confirm Groq still hosts `llama-3.3-70b-versatile`; otherwise pick the current Llama 3.x equivalent.
- **After schema changes:** mirror table changes into both the SQL definitions in section 2 and any new migrations.
- **Before each release:** run `npm run lint` and a manual smoke test of login → search → upload draft → AI Checker.

### Backups

- Enable Supabase scheduled backups for the database.
- Storage objects in `iris-files` are essentially the source of truth for PDFs; mirror critical buckets to a secondary store if needed for compliance.

---

*End of Technical Manual.*
