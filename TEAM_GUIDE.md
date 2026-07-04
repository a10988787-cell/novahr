# 🚀 NovaHR — Complete Developer Onboarding & Build Guide

> **Read this before touching any code.**  
> This single file replaces all 9 original docs. It tells you exactly: what we're building, who owns what, and how to ship it.

---

## 📌 The Vision (from `01_PROJECT_VISION.md`)

**The Problem:** Most HRMS projects digitize paperwork but don't help HR *act* on it. HR officers manually scan attendance sheets, guess who's about to quit, and chase documents by email.

**Our Insight:** An HRMS's real value is **decisions, not storage.** The system should tell HR *before* a problem exists.

**Elevator Pitch:**
> "HR software today tells you what already happened. NovaHR tells you what's about to. It's a complete HR system — onboarding, attendance, leave, payroll visibility — with an AI layer that catches burnout risk, attendance anomalies, and leave conflicts before they become HR fires to put out."

### The Innovation Stack (ordered by judge impact)

| Priority | Feature | What It Does |
|---|---|---|
| **P0** | **HR Copilot Chatbot** | Natural-language Q&A grounded in real DB + policy doc — not hardcoded FAQs |
| **P0** | **Smart Leave Conflict Detection** | Warns when too many teammates are off the same week |
| **P0** | **Attendance Anomaly Detection** | Flags irregular patterns (late-arrival streaks, geolocation mismatches) with **why** |
| **P1** | **Attrition Risk Score** | Transparent, explainable per-employee risk signal |
| **P1** | **Employee Wellness Index** | Aggregates overtime/leave-utilization/kudos into a self-awareness score shown to the employee first |
| **P1** | **Kudos / Recognition Wall** | Peer-to-peer recognition feed; feeds into wellness signals |
| **P2** | **Geofenced Check-In** | Check-in only registers within office geofence (solves buddy-punching) |
| **P2** | **Payslip PDF Download** | Auto-generated monthly payslip from salary + attendance data |

**Cut order if time runs short:** Org chart → Payroll PDF → Wellness scoring → OCR → Attrition risk → **never cut:** Auth + Attendance + Leave + Payroll view + HR Copilot.

---

## 👥 Team Roles & Ownership

| Role | Primary Tasks |
|---|---|
| **Member A — Ritik (Team Lead)** | Architecture · Auth module · Leave module · Copilot · Integration · Deployment |
| **Member B — Backend Dev** | Attendance (+ geofencing) · Employee profile · Payroll (+ PDF) · Audit logs |
| **Member C — Frontend / UI-UX** | Design system · All dashboard pages · Responsive pass · AI chat widget |
| **Member D — AI/Innovation Lead** | Wellness scoring job · Attrition risk scoring · Gemini Copilot tuning |

---

## ⚙️ Environment Setup (Everyone Does This First)

### Prerequisites
- Node.js 20+, pnpm 10+
- A free [Neon.tech](https://neon.tech) or [Supabase](https://supabase.com) PostgreSQL database

### Steps

```bash
# 1. Clone
git clone https://github.com/ritikkalal07/novahr.git
cd novahr

# 2. Install all workspace dependencies
pnpm install

# 3. Create your .env
cp .env.example .env
```

### Fill in `.env`

| Key | Where to Get | Notes |
|---|---|---|
| `DATABASE_URL` | [neon.tech](https://neon.tech) → New Project → Connection string | Required |
| `JWT_ACCESS_SECRET` | `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"` | Required |
| `JWT_REFRESH_SECRET` | Same command, different output | Required |
| `GEMINI_API_KEY` | [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey) | Free. Without it, copilot falls back to offline rule-based mode |
| `RESEND_API_KEY` | [resend.com](https://resend.com) → Free (3000 emails/month) | Without it, emails print to console |

```bash
# 4. Push DB schema + seed demo data
pnpm --filter @novahr/api prisma:migrate
pnpm db:seed

# 5. Run locally
pnpm dev:api   # API at http://localhost:8000
pnpm dev:web   # Frontend at http://localhost:3000
```

---

## 🗄️ Database Schema (Already Built)

File: `apps/api/prisma/schema.prisma` — **16 tables**, do not modify without consulting Member A.

| Table | Purpose |
|---|---|
| `Employee` | Core user — roles: ADMIN, HR, MANAGER, EMPLOYEE |
| `Department` | Org departments |
| `Session` | JWT refresh token store (7-day sessions) |
| `EmailToken` | Verification & password-reset tokens |
| `Attendance` | Daily check-in/out, geofence flag, anomaly flag |
| `LeaveRequest` | Leave applications with full status workflow |
| `LeaveBalance` | Per-employee, per-type, per-year allocation |
| `Payroll` | Salary + allowances + deductions per month |
| `Document` | HR document uploads |
| `Skill` | Employee skill tags (feeds skill matrix) |
| `Kudos` | Peer recognition |
| `Notification` | In-app notification inbox |
| `AuditLog` | Immutable audit trail of every mutation |
| `WellnessScore` | Computed burnout/wellness index |
| `CopilotSession` | Gemini AI chat sessions |
| `CopilotMessage` | AI chat message history with sources |

---

## 🔌 Complete API Reference (All Routes Already Built)

Base URL: `http://localhost:8000/api/v1`  
All protected routes require: `Authorization: Bearer <accessToken>`

### Auth (`/auth`)
| Method | Route | Role | Description |
|---|---|---|---|
| POST | `/auth/signup` | Public | Register with employeeCode, name, email, password, role |
| POST | `/auth/verify-email` | Public | Verify email with token |
| POST | `/auth/login` | Public | Returns `accessToken` + httpOnly refresh cookie |
| POST | `/auth/refresh` | Public | Rotates access token from refresh cookie |
| POST | `/auth/forgot-password` | Public | Sends reset email |
| POST | `/auth/reset-password` | Public | Updates password, revokes all sessions |
| POST | `/auth/logout` | Auth | Revokes current session |
| GET | `/auth/sessions` | Auth | List active sessions |
| DELETE | `/auth/sessions/:id` | Auth | Revoke a specific session |

### Employee (`/employees`)
| Method | Route | Role | Description |
|---|---|---|---|
| GET | `/employees/me` | Auth | Own profile with department + manager |
| PATCH | `/employees/me` | Auth | Update phone, address, photoUrl |
| GET | `/employees` | Admin/HR | List with search + dept filter + pagination |
| GET | `/employees/:id` | Admin/HR | Full profile with skills |
| PUT | `/employees/:id` | Admin/HR | Full edit (name, role, dept, manager, status) |

### Attendance (`/attendance`)
| Method | Route | Role | Description |
|---|---|---|---|
| POST | `/attendance/check-in` | Auth | Check in (blocks double check-in) |
| POST | `/attendance/check-out` | Auth | Check out (auto half-day if < 4 hrs worked) |
| GET | `/attendance/me` | Auth | Own history with `?from=&to=` date range |
| GET | `/attendance` | Admin/HR/Manager | Team/org attendance, `?employeeId=&from=&to=` |
| GET | `/attendance/anomalies` | Admin/HR | Unreviewed anomaly queue |
| PATCH | `/attendance/anomalies/:id` | Admin/HR | Mark anomaly reviewed |

### Leave (`/leave`)
| Method | Route | Role | Description |
|---|---|---|---|
| GET | `/leave/balance/me` | Auth | Own leave balances (allotted/used/remaining) |
| POST | `/leave/requests` | Auth | Apply (checks balance, overlap, conflict %) |
| GET | `/leave/requests/me` | Auth | Own leave history, paginated |
| GET | `/leave/requests` | Admin/HR/Manager | All requests, `?status=&teamId=` |
| PATCH | `/leave/requests/:id/approve` | Admin/HR/Manager | Approve + decrement balance + notify |
| PATCH | `/leave/requests/:id/reject` | Admin/HR/Manager | Reject + notify |
| GET | `/leave/conflicts` | Auth | Smart conflict check `?startDate=&endDate=` |

### Payroll (`/payroll`)
| Method | Route | Role | Description |
|---|---|---|---|
| GET | `/payroll/me` | Auth | Own payslips (last 12 months) |
| GET | `/payroll` | Admin/HR | All payroll `?employeeId=` |
| PUT | `/payroll/:employeeId` | Admin | Upsert salary + allowances + deductions |

### Wellness (`/wellness`)
| Method | Route | Role | Description |
|---|---|---|---|
| GET | `/wellness/me` | Auth | Own wellness score + factors |
| GET | `/wellness/team-summary` | Admin/HR/Manager | ⚠️ **Stub — Member D implements** |
| GET | `/wellness/risk/attrition` | Admin/HR | ⚠️ **Stub — Member D implements** |

### Kudos (`/kudos`)
| Method | Route | Role | Description |
|---|---|---|---|
| POST | `/kudos` | Auth | Give recognition (blocks self-kudos, sends notification) |
| GET | `/kudos/feed` | Auth | Org-wide feed, paginated |

### Notifications (`/notifications`)
| Method | Route | Role | Description |
|---|---|---|---|
| GET | `/notifications` | Auth | Inbox with `unreadCount`, paginated |
| PATCH | `/notifications/:id/read` | Auth | Mark as read |

### AI Copilot (`/copilot`)
| Method | Route | Role | Description |
|---|---|---|---|
| POST | `/copilot/chat` | Auth | Chat with Gemini + DB function calling |
| GET | `/copilot/history` | Auth | Session message history `?sessionId=` |

---

## 🏗️ Member B — Backend Developer Tasks

**Your files:** `apps/api/src/routes/attendance.routes.ts`, `employee.routes.ts`, `payroll.routes.ts`

All stubs are complete and compiling. Your tasks extend them.

### Task B1 — Geofencing on Check-In (P2)
Extend `POST /attendance/check-in` to accept optional `{ lat, lng }` body params:

```typescript
// Add these env vars to .env.example:
// OFFICE_LAT=28.6139
// OFFICE_LNG=77.2090
// GEOFENCE_RADIUS_KM=0.5

function getDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

// In check-in route, after parsing body:
if (lat && lng) {
  const officeLat = parseFloat(process.env.OFFICE_LAT || '0');
  const officeLng = parseFloat(process.env.OFFICE_LNG || '0');
  const radius = parseFloat(process.env.GEOFENCE_RADIUS_KM || '0.5');
  const dist = getDistanceKm(lat, lng, officeLat, officeLng);
  if (dist > radius) {
    // Set anomalyFlag + anomalyReason in the upsert
    // geoFlag: true, anomalyFlag: true, anomalyReason: `Geolocation mismatch: ${dist.toFixed(2)}km from office`
  }
}
```

### Task B2 — Payslip PDF Download (P2)
Add a new endpoint `GET /payroll/me/download?month=YYYY-MM`:

```bash
# Install in apps/api:
pnpm --filter @novahr/api add pdf-lib
```

```typescript
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

payrollRouter.get('/me/download', async (req, res, next) => {
  const month = req.query.month as string; // e.g. "2026-06"
  const payroll = await prisma.payroll.findFirst({
    where: { employeeId: req.user!.userId, effectiveMonth: month },
    include: { employee: { select: { name: true, employeeCode: true } } },
  });
  if (!payroll) throw new AppError(404, 'NOT_FOUND', 'No payroll record for this month.');

  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]); // A4
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const emp = (payroll as any).employee;

  page.drawText('NovaHR — Payslip', { x: 50, y: 780, size: 20, font, color: rgb(0.23, 0.36, 0.86) });
  page.drawText(`Employee: ${emp.name} (${emp.employeeCode})`, { x: 50, y: 740, size: 12, font });
  page.drawText(`Month: ${month}`, { x: 50, y: 720, size: 12, font });
  page.drawText(`Base Salary: ₹${Number(payroll.baseSalary).toLocaleString()}`, { x: 50, y: 680, size: 14, font });

  const allowances = payroll.allowancesJson as Record<string, number>;
  let y = 640;
  for (const [key, val] of Object.entries(allowances)) {
    page.drawText(`+ ${key}: ₹${val}`, { x: 70, y, size: 11, font, color: rgb(0.08, 0.5, 0.24) });
    y -= 20;
  }

  const deductions = payroll.deductionsJson as Record<string, number>;
  for (const [key, val] of Object.entries(deductions)) {
    page.drawText(`- ${key}: ₹${val}`, { x: 70, y, size: 11, font, color: rgb(0.73, 0.11, 0.11) });
    y -= 20;
  }

  const totalAllowances = Object.values(allowances).reduce((a, b) => a + b, 0);
  const totalDeductions = Object.values(deductions).reduce((a, b) => a + b, 0);
  const netPay = Number(payroll.baseSalary) + totalAllowances - totalDeductions;
  page.drawText(`Net Pay: ₹${netPay.toLocaleString()}`, { x: 50, y: y - 20, size: 16, font, color: rgb(0.23, 0.36, 0.86) });

  const pdfBytes = await pdfDoc.save();
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="payslip-${month}.pdf"`);
  res.send(Buffer.from(pdfBytes));
});
```

### Task B3 — Audit Log Integration
The `auditLog` middleware is already wired on `leave.routes.ts`. For attendance + payroll:

```typescript
// In attendance.routes.ts — wrap check-in with audit:
attendanceRouter.post('/check-in', auditLog('CHECK_IN', 'attendance'), async (req, res, next) => { ... });

// In payroll.routes.ts — wrap PUT with audit:
payrollRouter.put('/:employeeId', authorize('ADMIN'), auditLog('UPDATE', 'payroll'), async (req, res, next) => { ... });
```

---

## 🎨 Member C — Frontend Developer Tasks

**Your directory:** `apps/web/src/`

### Design System Setup

1. Add to `tailwind.config.ts`:
```typescript
theme: {
  extend: {
    colors: {
      primary: { DEFAULT: '#3B5BDB', hover: '#2F4BC0', subtle: '#EEF1FD' },
      accent: '#0EA5A4',
      surface: '#FFFFFF',
      background: '#F7F8FB',
      border: '#E4E7EE',
      success: '#15803D',
      warning: '#B45309',
      danger: '#B91C1C',
    },
    fontFamily: {
      heading: ['Sora', 'sans-serif'],
      body: ['Inter', 'sans-serif'],
    },
    borderRadius: { card: '12px', btn: '8px' },
    boxShadow: {
      card: '0 1px 2px rgba(16,24,40,0.06), 0 1px 3px rgba(16,24,40,0.08)',
    },
  },
}
```

2. In `apps/web/src/app/layout.tsx`, import fonts:
```typescript
import { Sora, Inter } from 'next/font/google';
const sora = Sora({ subsets: ['latin'], variable: '--font-sora' });
const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
```

### API Client
Create `apps/web/src/lib/api.ts`:
```typescript
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
  const res = await fetch(`${API_BASE}/api/v1${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  });
  if (res.status === 401) {
    // Try token refresh
    const refreshRes = await fetch(`${API_BASE}/api/v1/auth/refresh`, { method: 'POST', credentials: 'include' });
    if (refreshRes.ok) {
      const { accessToken } = await refreshRes.json();
      localStorage.setItem('accessToken', accessToken);
      return apiFetch(path, options); // retry once
    }
    localStorage.removeItem('accessToken');
    window.location.href = '/login';
  }
  if (!res.ok) throw await res.json();
  return res.json() as Promise<T>;
}
```

### Pages to Build

| Route | Page | Key API Calls | Priority |
|---|---|---|---|
| `/login` | Login form | `POST /auth/login` | P0 |
| `/signup` | Signup form | `POST /auth/signup` | P0 |
| `/dashboard` | Overview: leave widget, wellness card, notifications | `GET /employees/me`, `GET /notifications`, `GET /leave/balance/me` | P0 |
| `/attendance` | Calendar + check-in/out button | `POST /attendance/check-in`, `POST /attendance/check-out`, `GET /attendance/me` | P0 |
| `/leave` | Apply form + conflict warning + history | `POST /leave/requests`, `GET /leave/balance/me`, `GET /leave/conflicts`, `GET /leave/requests/me` | P0 |
| `/leave/admin` | Approve/reject queue (Admin/Manager) | `GET /leave/requests`, `PATCH /leave/requests/:id/approve`, `PATCH /leave/requests/:id/reject` | P0 |
| `/payroll` | Payslip viewer + PDF download | `GET /payroll/me` | P1 |
| `/kudos` | Recognition wall + give-kudos form | `GET /kudos/feed`, `POST /kudos` | P1 |
| `/copilot` | AI chat interface | `POST /copilot/chat`, `GET /copilot/history` | P0 |
| `/profile` | Edit profile picture / phone / address | `GET /employees/me`, `PATCH /employees/me` | P1 |
| `/admin/attendance` | Anomaly queue with review action | `GET /attendance/anomalies`, `PATCH /attendance/anomalies/:id` | P1 |
| `/admin/employees` | Employee directory with search | `GET /employees` | P1 |
| `/admin/wellness` | Team wellness + attrition risk | `GET /wellness/team-summary`, `GET /wellness/risk/attrition` | P1 |

### Key UI Components

| Component | Description | Design Rule |
|---|---|---|
| `<Sidebar />` | Persistent left nav ≥1024px, drawer below | Role-based menu items (employee vs admin) |
| `<NotificationBell />` | Bell icon + unread badge | Poll `GET /notifications` every 30s or use localStorage |
| `<LeaveBalanceDonut />` | Donut chart: used/remaining per type | Use recharts (already in Next.js ecosystem) |
| `<AttendanceCalendar />` | Heatmap-style month grid | Color: present=success, absent=danger, half-day=warning |
| `<LeaveConflictWarning />` | Inline warning in leave form | Show when `/leave/conflicts` `conflictPercentage >= 30` |
| `<CopilotChat />` | Floating chat panel | Use `sessionId = uuid()` stored in sessionStorage |
| `<KudosFeed />` | Card wall with avatars | Newest first, paginated load-more |
| `<WellnessCard />` | Score ring + factor list | Score color: >70=success, 40-70=warning, <40=danger |

### Accessibility Rules (from Design System)
- ✅ All text ≥4.5:1 contrast
- ✅ Every icon-only button has `aria-label`
- ✅ Status badges always show: color + icon + text (never color alone)
- ✅ Forms: visible label, inline error below field with `aria-describedby`
- ✅ Loading skeletons on every async view — no blank screens

---

## 🤖 Member D — AI/Innovation Lead Tasks

**Your files:** Create `apps/api/src/jobs/`, extend `apps/api/src/routes/wellness.routes.ts`

### Task D1 — Wellness Scoring Job
Create `apps/api/src/jobs/computeWellness.ts`:

```typescript
import { prisma } from '../lib/prisma.js';

export async function computeWellnessScores(): Promise<void> {
  const employees = await prisma.employee.findMany({ where: { status: 'active' } });
  const year = new Date().getFullYear();
  const last30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  for (const emp of employees) {
    // Factor 1: Late/anomalous check-ins in last 30 days (max -30 pts)
    const lateCount = await prisma.attendance.count({
      where: { employeeId: emp.id, date: { gte: last30Days }, anomalyFlag: true },
    });

    // Factor 2: Paid leave utilization % (high = stress risk; max -20 pts)
    const paidBalance = await prisma.leaveBalance.findFirst({
      where: { employeeId: emp.id, leaveType: 'PAID', year },
    });
    const leaveUtil = paidBalance ? (paidBalance.used / Math.max(paidBalance.allotted, 1)) * 100 : 0;

    // Factor 3: Days since last kudos received (no recognition = disengagement; max -20 pts)
    const lastKudos = await prisma.kudos.findFirst({
      where: { toEmployeeId: emp.id },
      orderBy: { createdAt: 'desc' },
    });
    const daysSinceKudos = lastKudos
      ? Math.floor((Date.now() - lastKudos.createdAt.getTime()) / 86400000)
      : 60;

    // Score: 100 = excellent wellness, 0 = severe burnout
    let score = 100;
    score -= Math.min(lateCount * 5, 30);
    score -= Math.min((leaveUtil / 100) * 20, 20);
    score -= Math.min((daysSinceKudos / 60) * 20, 20);
    score = Math.max(0, Math.min(100, Math.round(score)));

    await prisma.wellnessScore.create({
      data: {
        employeeId: emp.id,
        score,
        factorsJson: {
          anomalousAttendanceLast30Days: lateCount,
          paidLeaveUtilizationPct: Math.round(leaveUtil),
          daysSinceLastKudos: daysSinceKudos,
        },
      },
    });
  }

  console.log(`✅ Wellness scores computed for ${employees.length} employees.`);
}

// Allow direct execution: npx tsx src/jobs/computeWellness.ts
if (process.argv[1].includes('computeWellness')) {
  computeWellnessScores().then(() => process.exit(0)).catch(console.error);
}
```

Then add a script to `apps/api/package.json`:
```json
"wellness:compute": "tsx src/jobs/computeWellness.ts"
```

Then in `wellness.routes.ts`, replace the team-summary stub:
```typescript
// GET /wellness/team-summary
const scores = await prisma.wellnessScore.findMany({
  include: { employee: { select: { name: true, role: true, departmentId: true } } },
  orderBy: { score: 'asc' },  // lowest scores first = most at-risk
  distinct: ['employeeId'],    // latest score per employee
});

res.json({
  averageScore: Math.round(scores.reduce((a, b) => a + Number(b.score), 0) / scores.length),
  atRiskCount: scores.filter(s => Number(s.score) < 50).length,
  data: scores.map(s => ({
    employeeId: s.employeeId,
    employeeName: (s as any).employee.name,
    score: Number(s.score),
    factors: s.factorsJson,
    riskLevel: Number(s.score) < 50 ? 'HIGH' : Number(s.score) < 70 ? 'MEDIUM' : 'LOW',
  })),
});
```

### Task D2 — Attrition Risk Scoring with Gemini
Replace the `/risk/attrition` stub:

```typescript
import { GoogleGenerativeAI } from '@google/generative-ai';

// GET /wellness/risk/attrition
const atRiskScores = await prisma.wellnessScore.findMany({
  where: { score: { lt: 50 } },
  include: { employee: { select: { name: true } } },
  orderBy: { score: 'asc' },
  distinct: ['employeeId'],
});

const apiKey = process.env.GEMINI_API_KEY;
const results = [];

for (const s of atRiskScores) {
  const factors = s.factorsJson as any;
  let insight = 'Review attendance and engagement patterns.';

  if (apiKey) {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent(
      `Employee has: ${factors.anomalousAttendanceLast30Days} attendance anomalies last 30 days, ` +
      `${factors.paidLeaveUtilizationPct}% paid leave utilized, ` +
      `${factors.daysSinceLastKudos} days since last recognition. ` +
      `Wellness score: ${Number(s.score)}/100. ` +
      `Write a single actionable at-risk insight in under 20 words. Be specific, not generic.`
    );
    insight = result.response.text().trim();
  }

  results.push({
    employeeId: s.employeeId,
    employeeName: (s as any).employee.name,
    score: Number(s.score),
    factors: s.factorsJson,
    insight,
  });
}

res.json({ data: results, total: results.length });
```

### Task D3 — Add Wellness Tool to Copilot
In `copilot.routes.ts`, add a new function declaration `getWellnessScore`:

```typescript
{
  name: 'getWellnessScore',
  description: 'Get the employee wellness score and contributing factors.',
  parameters: { type: SchemaType.OBJECT, properties: {} },
}
```

And in `executeTool`:
```typescript
if (name === 'getWellnessScore') {
  const score = await prisma.wellnessScore.findFirst({
    where: { employeeId: userId },
    orderBy: { computedAt: 'desc' },
  });
  return score
    ? { score: Number(score.score), factors: score.factorsJson, computedAt: score.computedAt }
    : { score: null, message: 'Wellness score not yet computed.' };
}
```

---

## 🚀 Deployment (Member A Owns This)

### Step 1 — Neon Database
1. [neon.tech](https://neon.tech) → Create account → New Project (free tier)
2. Copy **Connection string** → set as `DATABASE_URL` in `.env` and Vercel dashboard

### Step 2 — Deploy API
```bash
cd apps/api
npx vercel login
npx vercel --prod
# In Vercel dashboard → Project → Settings → Environment Variables:
# Set: DATABASE_URL, JWT_ACCESS_SECRET, JWT_REFRESH_SECRET, GEMINI_API_KEY, RESEND_API_KEY, NODE_ENV=production
```

### Step 3 — Run Migrations on Production
```bash
# From apps/api with REAL DATABASE_URL set
npx prisma migrate deploy
npx tsx prisma/seed.ts   # load demo data
```

### Step 4 — Deploy Frontend
```bash
cd apps/web
npx vercel --prod
# Set: NEXT_PUBLIC_API_URL = https://your-api-project.vercel.app
```

### Step 5 — Verify
```bash
# Health check
curl https://your-api-project.vercel.app/api/v1/health
# Should return: {"status":"ok","service":"novahr-api"}
```

---

## 👤 Demo Seed Accounts (After `pnpm db:seed`)

| Name | Email | Password | Role | Notes |
|---|---|---|---|---|
| Ritik Kalal | ritik@novahr.dev | Password@123 | Admin | Full access |
| Arjun Sharma | arjun@novahr.dev | Password@123 | Manager | Engineering team lead |
| Priya Patel | priya@novahr.dev | Password@123 | HR | HR officer |
| Rahul Verma | rahul@novahr.dev | Password@123 | Employee | ⚠️ Late-arrival streak, high attrition risk |
| Sneha Reddy | sneha@novahr.dev | Password@123 | Employee | ⚠️ Geolocation anomaly flagged |
| Rohan Mehra | rohan@novahr.dev | Password@123 | Employee | Pending leave request |

---

## 🎬 Demo Video Shot List (2:30–3:30 min)

Follow this order for maximum judge impact:

| Time | Shot | What to Show |
|---|---|---|
| 0:00–0:20 | **Hook** | "HR software tells you what happened. NovaHR tells you what's about to." |
| 0:20–0:40 | **Login → Employee Dashboard** | Clean UI, leave balance donut, wellness card, notification bell |
| 0:40–1:10 | **Apply Leave + Conflict Warning** | Apply during Rahul's leave period → watch conflict % alert appear live |
| 1:10–1:25 | **Admin Approval Queue** | SLA aging on pending requests, one-click approve |
| 1:25–1:45 | **Attendance Anomaly Queue** | Rahul's late-streak flagged — show the **why** (not a black box) |
| 1:45–2:05 | **Attrition Risk Dashboard** | Rahul in at-risk shortlist, Gemini-generated insight, explainability drawer |
| 2:05–2:45 | **HR Copilot — the centerpiece** | Employee: "How many sick leaves do I have?" → grounded answer with source. Admin: "Who has pending requests > 3 days?" |
| 2:45–3:00 | **Kudos Wall** | Give recognition → instant feed update |
| 3:00–3:15 | **Tech flash** | Architecture diagram (Next.js + Express + Neon + Gemini), 10 seconds |
| 3:15–3:30 | **Team + CTA** | Names, repo link, "Thanks" |

**Recording rules:**
- 1080p minimum, browser bookmarks bar hidden
- Voiceover over screen capture (not talking-head)
- Use seed data — no "Test User 1" or "asdf@asdf.com"
- Caption the video if platform allows

---

## ✅ Final Submission Checklist

Before submitting:

- [ ] All env vars set in Vercel dashboard (both api and web projects)
- [ ] `prisma migrate deploy` run on production DB
- [ ] Seed data loaded on production (`tsx prisma/seed.ts`)
- [ ] API health check returns 200: `https://your-api.vercel.app/api/v1/health`
- [ ] Frontend accessible publicly and login works
- [ ] Demo video recorded and uploaded (2:30–3:30 min)
- [ ] README updated with live demo URL + video link
- [ ] Evaluator added as GitHub collaborator (`docs/08_GITHUB_SETUP_GUIDE.md`)
- [ ] All team members' work is merged to `main`
- [ ] No `.env` file committed (only `.env.example`)

---

## 📁 Key Files Quick Reference

| File | What It Is |
|---|---|
| `apps/api/prisma/schema.prisma` | Database schema — 16 tables |
| `apps/api/prisma/seed.ts` | Demo data: 14 employees, 60 days attendance |
| `apps/api/src/server.ts` | API entry point — all routes mounted |
| `apps/api/src/middleware/auth.ts` | `authenticate` + `authorize` middleware |
| `apps/api/src/middleware/auditLog.ts` | Wraps mutating endpoints with audit trail |
| `apps/api/src/middleware/errorHandler.ts` | Consistent `ApiError` JSON format |
| `apps/api/src/routes/copilot.routes.ts` | Gemini AI + DB function calling |
| `apps/api/vercel.json` | Express serverless config for Vercel |
| `packages/shared-types/src/index.ts` | Shared TypeScript types across frontend/backend |
| `.env.example` | All env keys with free API links |
| `docs/` | Original hackathon documentation |
