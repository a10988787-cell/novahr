# NovaHR 🚀

> **Next-Gen AI-Powered Human Resource Management System**  
> Built for Hackathon 2026 · Runs entirely on Vercel Free Plan · Zero-cost AI stack

[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org/)
[![Express](https://img.shields.io/badge/Express-5.x-green?logo=express)](https://expressjs.com/)
[![Prisma](https://img.shields.io/badge/Prisma-6.x-2D3748?logo=prisma)](https://www.prisma.io/)
[![Gemini AI](https://img.shields.io/badge/Gemini-1.5_Flash-orange?logo=google)](https://ai.google.dev/)
[![Vercel](https://img.shields.io/badge/Deployed_on-Vercel-black?logo=vercel)](https://vercel.com/)

---

## 🎯 What is NovaHR?

NovaHR is a full-stack HRMS (Human Resource Management System) that goes far beyond CRUD. It combines:

- **Smart Leave Management** with AI-powered conflict detection
- **Attendance Tracking** with automatic anomaly flagging
- **AI HR Copilot** powered by Google Gemini (free tier) — ask it anything about your leave, attendance, or company policies
- **Employee Wellness Index** — proactive burnout detection
- **Recognition Wall** (Kudos) — peer-to-peer appreciation
- **Real-time Notifications** — every action, every status change
- **Audit Trail** — every mutation logged for compliance

---

## 🛠️ Tech Stack

| Layer | Technology | Cost |
|---|---|---|
| Frontend | Next.js 15 (App Router, TypeScript, Tailwind CSS) | Free (Vercel) |
| Backend API | Express 5 + TypeScript + Prisma ORM | Free (Vercel Serverless) |
| Database | PostgreSQL on Neon.tech or Supabase | Free Tier |
| AI Copilot | Google Gemini 1.5 Flash API | Free Developer Tier |
| Email | Resend | Free (3000 emails/month) |
| Auth | JWT (Access 15m + Refresh 7d httpOnly cookie) | Free |
| Monorepo | pnpm workspaces + Turborepo | Free |

---

## 📁 Project Structure

```
novahr/
├── apps/
│   ├── web/              # Next.js Frontend (deployed to Vercel)
│   └── api/              # Express + Prisma API (deployed to Vercel Serverless)
│       ├── prisma/
│       │   ├── schema.prisma   # 16-table DB schema
│       │   └── seed.ts         # Realistic demo seed data
│       ├── src/
│       │   ├── routes/         # All API endpoints
│       │   ├── middleware/      # Auth, RBAC, Audit logging, Error handler
│       │   ├── validators/      # Zod validation schemas
│       │   └── server.ts
│       └── vercel.json
├── packages/
│   └── shared-types/     # Shared TypeScript types across apps
├── docs/                 # Hackathon documentation
└── README.md
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- pnpm 10+
- PostgreSQL database (Neon.tech or Supabase — free tier)

### 1. Clone and Install
```bash
git clone https://github.com/ritikkalal07/novahr.git
cd novahr
pnpm install
```

### 2. Configure Environment Variables
```bash
cp .env.example .env
```

Fill in your `.env`:
```env
DATABASE_URL=postgresql://...      # Neon or Supabase connection string
JWT_ACCESS_SECRET=your-secret-here
JWT_REFRESH_SECRET=another-secret-here
GEMINI_API_KEY=your-gemini-api-key  # Free from Google AI Studio
RESEND_API_KEY=your-resend-api-key  # Free from resend.com
```

### 3. Setup Database
```bash
# Run migrations
pnpm db:migrate

# Seed with demo data (14 employees, 60 days attendance, anomalies, kudos)
pnpm db:seed
```

### 4. Run Locally
```bash
# Run both frontend and API in parallel
pnpm dev

# Or individually:
pnpm dev:api   # Express API at http://localhost:8000
pnpm dev:web   # Next.js at http://localhost:3000
```

---

## 🌐 API Endpoints

| Module | Endpoints |
|---|---|
| **Auth** | `POST /auth/signup` · `POST /auth/login` · `POST /auth/refresh` · `POST /auth/forgot-password` |
| **Employee** | `GET /employees/me` · `GET /employees` · `PUT /employees/:id` |
| **Attendance** | `POST /attendance/check-in` · `POST /attendance/check-out` · `GET /attendance/me` · `GET /attendance/anomalies` |
| **Leave** | `POST /leave/requests` · `GET /leave/balance/me` · `PATCH /leave/requests/:id/approve` · `GET /leave/conflicts` |
| **Payroll** | `GET /payroll/me` · `GET /payroll` · `PUT /payroll/:employeeId` |
| **Wellness** | `GET /wellness/me` · `GET /wellness/team-summary` |
| **Kudos** | `POST /kudos` · `GET /kudos/feed` |
| **Copilot** | `POST /copilot/chat` · `GET /copilot/history` |
| **Notifications** | `GET /notifications` · `PATCH /notifications/:id/read` |

---

## 🤖 AI HR Copilot

The AI Copilot uses **Google Gemini 1.5 Flash** with **function calling** to:
1. Query your real-time leave balances from the database
2. Fetch your attendance summary (last 30 days)
3. Look up your recent leave request statuses
4. Search the embedded HR policy document

**Example questions:**
- *"How many sick leaves do I have left?"*
- *"Show my attendance for the last month"*
- *"What is the WFH policy?"*
- *"Was my leave request approved?"*

> **Offline Mode**: If `GEMINI_API_KEY` is not configured, the copilot automatically falls back to a rule-based mock mode — so demos always work!

---

## 🏗️ Deployment (Vercel Free Plan)

### Deploy API
```bash
cd apps/api
vercel --prod
```

### Deploy Frontend
```bash
cd apps/web
vercel --prod
```

Set all environment variables in your Vercel project dashboard.

---

## 👥 Team

| Member | Role | Modules |
|---|---|---|
| **Ritik Kalal** | Team Lead / Backend Architect | Auth, Leave, API Architecture, Deployment |
| Member B | Backend Developer | Attendance, Employee Profile, Payroll |
| Member C | Frontend Developer | UI/UX, All frontend pages |
| Member D | AI / Innovation | Wellness Scoring, Attrition Risk AI |

---

## 📄 License

MIT © NovaHR Team 2026
