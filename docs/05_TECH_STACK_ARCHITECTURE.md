# 05 — Tech Stack & Architecture: NovaHR

## 1. Recommended Stack

Chosen to match the team's existing strengths (MERN, Next.js, TypeScript, FastAPI, PostgreSQL) rather than adopting something unfamiliar under time pressure:

| Layer | Choice | Why |
|---|---|---|
| Frontend | **Next.js (App Router) + TypeScript + Tailwind CSS** | SSR for fast first paint on the dashboard, file-based routing speeds up a 4-person parallel build, Tailwind matches the design-token system in `03` directly |
| State/data fetching | **TanStack Query** | Caching + optimistic updates for approvals without hand-rolled state management |
| Backend (core CRUD) | **Node.js + Express** *or* **FastAPI (Python)** | Pick whichever two backend-capable teammates are strongest in — don't split the backend across both frameworks |
| Backend (AI Copilot + OCR) | **FastAPI (Python)** microservice | Python has the cleanest LLM SDK + Tesseract OCR bindings; keep this as a separate small service even if core backend is Node, so AI work doesn't block CRUD work |
| Database | **PostgreSQL** | Relational integrity matters for HR data (foreign keys: employee → manager → department → leave → payroll); avoid a document DB here despite MERN familiarity — it will fight you on the approval/audit relationships |
| Auth | **JWT (access + refresh) via `jsonwebtoken`/`python-jose`** | Standard, no extra infra needed for a hackathon timeline |
| File storage | **AWS S3** (or local disk + signed URLs for demo) | Matches existing AWS familiarity; document uploads and payslip PDFs |
| Deployment | **Vercel (frontend) + Render/Railway (backend) + Neon/Supabase (Postgres)** | All have generous free tiers and near-zero DevOps overhead — critical for a hackathon weekend |
| AI | **Anthropic API (Claude)** with tool-calling | For the HR Copilot; see `04_API_SPECIFICATION.md` §7 |

> If the hackathon explicitly requires building **inside Odoo** (Python/Odoo ORM/XML views), this entire stack section changes — confirm the rules first (see note in `00_README.md`).

## 2. High-Level Architecture

```
┌─────────────────────────────┐
│   Next.js Frontend (Vercel) │
│  - Employee/Admin dashboards│
│  - Design system from 03    │
└─────────────┬────────────────┘
              │ REST (JWT bearer)
┌─────────────▼────────────────┐        ┌────────────────────────┐
│  Core API (Node/Express or   │◄──────►│  PostgreSQL             │
│  FastAPI) — CRUD, auth,      │        │  (employees, attendance,│
│  attendance, leave, payroll  │        │   leave, payroll, audit)│
└─────────────┬────────────────┘        └────────────────────────┘
              │ internal call
┌─────────────▼────────────────┐        ┌────────────────────────┐
│  AI Service (FastAPI)         │◄──────►│  Anthropic API          │
│  - Copilot chat + tool-calling│        │  (Claude)               │
│  - OCR (Tesseract)            │        └────────────────────────┘
│  - Anomaly/risk scoring jobs  │
└────────────────────────────────┘
              │
┌─────────────▼────────────────┐
│  AWS S3 — documents, payslips │
└────────────────────────────────┘
```

## 3. Core Database Schema (simplified ERD)

```
employees (id, employee_code, name, email, password_hash, role, department_id,
           manager_id FK→employees.id, phone, address, photo_url,
           status, created_at)

departments (id, name)

attendance (id, employee_id FK, date, check_in_time, check_out_time,
            status ENUM[present,absent,half_day,leave], geo_flag BOOLEAN,
            anomaly_flag BOOLEAN, anomaly_reason TEXT)

leave_requests (id, employee_id FK, leave_type ENUM[paid,sick,unpaid],
                start_date, end_date, remarks, status ENUM[pending,approved,rejected],
                approver_id FK, approver_comment, created_at)

leave_balances (id, employee_id FK, leave_type, allotted, used, year)

payroll (id, employee_id FK, base_salary, allowances_json, deductions_json,
         effective_month, updated_by FK)

documents (id, employee_id FK, doc_type, file_url, ocr_extracted_json, verified_by FK)

skills (id, employee_id FK, skill_name, proficiency)

kudos (id, from_employee_id FK, to_employee_id FK, message, created_at)

wellness_scores (id, employee_id FK, score, factors_json, computed_at)

audit_logs (id, actor_id FK, action, entity, entity_id, before_json, after_json, timestamp)

copilot_sessions (id, employee_id FK, session_id, created_at)
copilot_messages (id, session_id FK, role, content, sources_json, created_at)
```

## 4. Anomaly / Risk Scoring — Keep It Simple and Explainable

For a hackathon timeline, **do not** reach for a trained ML model — a transparent rules/heuristics engine is faster to build, easier to demo, and more defensible when judges ask "how does this work":

- **Attendance anomaly:** rolling 7/30-day window comparison against the employee's own historical baseline (z-score or simple % deviation threshold), not a cross-employee model.
- **Attrition risk:** weighted sum of normalized signals (leave utilization trend, attendance decline, days since last kudos, overtime trend) with visible weights — expose the formula in the explainability drawer.
- **Wellness index:** same approach, inverted framing, shown to the employee first.

This is honestly a stronger answer in a judging Q&A than a black-box model trained on synthetic data in 48 hours — "we chose an explainable rules engine over a black-box model because HR decisions need to be auditable" is a good line to have ready.

## 5. Suggested Repo Structure (monorepo, since it's a 4-person team)

```
novahr/
├── apps/
│   ├── web/              # Next.js frontend
│   ├── api/               # Core CRUD backend
│   └── ai-service/       # FastAPI copilot + OCR + scoring
├── packages/
│   └── shared-types/    # Shared TS types / API contract types
├── docs/                 # This documentation set
└── README.md
```
Using a monorepo (npm/pnpm workspaces or Turborepo) avoids the coordination overhead of three separate repos with three separate CI setups during a short hackathon window — though if the hackathon rules require **one public repo per team member** (see `08_GITHUB_SETUP_GUIDE.md`), keep the monorepo as the working repo and have each member additionally push their assigned module to their own public repo for the mandatory review step.
