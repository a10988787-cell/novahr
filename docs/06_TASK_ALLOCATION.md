# 06 — Task Allocation: 4-Person Team

Roles below are suggestions based on typical hackathon skill spread — adjust names/assignments to your actual team's strengths. Ritik (team lead) is placed across architecture + integration since that's usually where a lead's full-stack breadth matters most.

## Role Split

| Member | Primary Role | Owns |
|---|---|---|
| **A — Ritik (Team Lead)** | Full-Stack + Integration Lead | Architecture (`05`), auth module, leave module, API contract ownership, demo script, final integration |
| **B** | Backend Lead | Employee/profile module, attendance module, payroll module, database schema + audit logs |
| **C** | Frontend / UI-UX Lead | Design system (`03`) execution in Tailwind, all dashboard screens, responsive/accessibility pass |
| **D** | AI/Innovation Lead | HR Copilot chat service, attendance anomaly + attrition risk + wellness scoring, OCR pipeline |

> If your actual team's strengths differ (e.g., two strong frontend devs, one backend), swap B/C responsibilities — the split matters less than each person owning a **vertical slice** end-to-end rather than "everyone touches everything."

## Sprint Plan (example: 5-day build window — compress proportionally if shorter)

### Day 0 — Kickoff (half day)
- All: finalize scope from `02`, confirm stack from `05`, set up monorepo + GitHub (see `08`).
- A: create API contract skeleton (`04`) in repo as living doc; set up shared TS types package.
- C: import design tokens from `03` into Tailwind config; build base component library (button, card, input, badge, table shell).

### Day 1 — Foundations
- A: auth module (signup/login/JWT/refresh) end-to-end.
- B: DB schema migration; employee CRUD API.
- C: auth screens (login/signup/forgot-password) + app shell (nav, layout).
- D: set up AI-service skeleton (FastAPI), Anthropic API wiring, basic echo endpoint.

### Day 2 — Core Modules I
- A: leave request + approval API and screens.
- B: attendance check-in/out API + admin attendance view.
- C: employee dashboard + profile view/edit screens.
- D: attendance anomaly heuristic (first pass) + review queue API.

### Day 3 — Core Modules II
- A: payroll view (employee read-only) + admin payroll edit; wire audit logging across all mutating endpoints.
- B: leave balance logic, conflict-detection endpoint, admin employee list with filters.
- C: admin dashboard, leave approval UI, anomaly review UI, responsive pass on all screens built so far.
- D: HR Copilot tool-calling (leave balance, attendance summary, policy doc search) + chat widget backend contract finalized with C.

### Day 4 — Innovation Layer + Polish
- A: kudos module, notifications, integration testing across modules, fix cross-module bugs.
- B: payroll anomaly flags, payslip PDF generation, document upload + storage.
- C: chat widget frontend, wellness/attrition dashboard cards + charts, accessibility checklist pass (`03` §7).
- D: wellness index + attrition risk scoring jobs, OCR document auto-fill, explainability drawer UI content (working with C).

### Day 5 — Freeze, Demo Prep, Submission
- Morning: feature freeze by 12:00 — no new features, bug-fix only from here.
- Afternoon: seed realistic demo data (see note below), rehearse demo flow against `07_DEMO_VIDEO_SCRIPT.md`, record video.
- Evening: final README polish, deploy, submit, double-check each member's public repo + evaluator collaborator access (`08`).

## Seed Data Note

Build a seed script early (Day 1–2) that populates ~15–20 realistic employees, 60+ days of attendance history, a mix of leave requests in all statuses, and at least 2–3 deliberately-planted attendance anomalies and 1–2 high-attrition-risk profiles. **Do this well before Day 5** — a live demo on empty or obviously-fake data undercuts every feature you built, and you cannot generate believable historical patterns the night before.

## Daily Sync Ritual

15-minute stand-up each morning: what shipped yesterday, what's today, what's blocked. Use GitHub Issues (see `08`) as the single source of truth for status, not a separate spreadsheet — one less thing to keep in sync.

## Risk/Buffer Planning

- Cut order if time runs short: Org chart/skill matrix → Payroll PDF/anomaly → Wellness index → OCR → Attrition risk → **never cut**: baseline auth/attendance/leave/payroll-view and the HR Copilot (it's your strongest differentiator and demos well even as an MVP with 2–3 working intents).
- Keep the AI-service as a genuinely separate deployable so a bug there never blocks core CRUD demo readiness.
