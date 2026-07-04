# 02 — Functional Requirements: NovaHR

Legend: **[BASE]** = from original spec, must-have. **[NEW]** = innovative addition. **[P0/P1/P2]** = build priority within NEW features.

---

## 1. Authentication & Authorization

### 1.1 Sign Up **[BASE]**
- Register with Employee ID, Email, Password, Role (Employee/HR).
- Password policy: min 8 chars, 1 uppercase, 1 number, 1 special character; show live strength meter.
- Email verification required before first login (send via transactional email service).
- **[NEW][P1]** Bulk employee import via CSV for admins (onboarding multiple hires at once) instead of one-by-one sign-up.

### 1.2 Sign In **[BASE]**
- Email + password login.
- Clear, specific error messages (wrong password vs. unknown email vs. unverified email — don't leak which email exists, but do distinguish verified/unverified).
- Redirect to role-specific dashboard on success.
- **[NEW][P1]** "Remember this device" + session management page (view/revoke active sessions).
- **[NEW][P2]** Optional TOTP-based 2FA for Admin/HR accounts (payroll access = higher trust bar).

### 1.3 Password Recovery **[NEW][P0]**
- Not in original spec but essential for a "complete" system: forgot-password flow via email token, expiring in 15 minutes.

---

## 2. User Roles

| Role | Baseline Access | Additional NovaHR Access |
|---|---|---|
| **Admin/HR Officer** | Manage employees, approve leave/attendance, view payroll | Attrition risk dashboard, anomaly review queue, org chart editor, bulk actions |
| **Employee** | View profile, attendance, apply leave, view salary | Wellness index, kudos wall, HR copilot chat, skill profile |
| **[NEW] Manager** (mid-tier role) | Everything Employee has, plus: approve leave for direct reports, view team attendance | Team-level wellness/attrition signals (not org-wide) |

> Adding a **Manager** role beyond the binary Admin/Employee split in the original spec is itself a meaningful, low-effort scope expansion — most real orgs need it, and it's an easy line item to point to as "we thought about org hierarchy, not just two buckets."

---

## 3. Dashboard

### 3.1 Employee Dashboard **[BASE + NEW]**
- Quick-access cards: Profile, Attendance, Leave Requests, Logout **[BASE]**
- Recent activity/alerts feed **[BASE]**
- **[NEW][P0]** Leave balance widget with visual (donut chart: used/remaining by type)
- **[NEW][P1]** Personal wellness index card (see §7)
- **[NEW][P1]** Kudos received/given feed
- **[NEW][P0]** HR Copilot chat entry point (floating action button)

### 3.2 Admin/HR Dashboard **[BASE + NEW]**
- Employee list, attendance records, leave approvals **[BASE]**
- Switch between employees **[BASE]**
- **[NEW][P0]** Pending-approvals queue with SLA aging (e.g., "3 requests pending >48h")
- **[NEW][P1]** Attendance anomaly review panel
- **[NEW][P1]** Attrition risk shortlist (top N at-risk, with explainability drawer)
- **[NEW][P2]** Org-wide analytics: headcount trend, average leave utilization, department comparison charts

---

## 4. Employee Profile Management

### 4.1 View / Edit Profile **[BASE]**
- View: personal details, job details, salary structure, documents, profile picture.
- Edit: employees can edit limited fields (address, phone, photo); Admin edits all fields.
- **[NEW][P2]** Document OCR auto-fill: upload ID/certificate photo → OCR extracts name/DOB/ID number → pre-fills form for user confirmation (never auto-commits without confirmation).
- **[NEW][P1]** Skill tags + self-declared proficiency, feeding the org skill matrix (§9).
- **[NEW][P2]** Version history on profile edits (who changed what, when) for audit trail.

---

## 5. Attendance Management

### 5.1 Attendance Tracking **[BASE]**
- Daily/weekly views; check-in/check-out; statuses: Present, Absent, Half-day, Leave.
- **[NEW][P2]** Geofenced or QR-code-based check-in (office location or desk QR) to reduce buddy-punching / remote-check-in abuse.
- **[NEW][P1]** Auto half-day detection based on check-in/out time thresholds (configurable by admin).

### 5.2 Attendance View **[BASE]**
- Employees see only their own; Admin/HR sees all.

### 5.3 Attendance Anomaly Detection **[NEW][P0]**
- Rule/heuristic-based flags surfaced to HR review queue:
  - Sudden shift in punctuality pattern (e.g., 5+ late arrivals in 7 days after a stable history)
  - Repeated single-minute-before-threshold check-ins (possible gaming of the half-day rule)
  - Geolocation/IP mismatch from usual pattern (if geofencing enabled)
- Every flag must show **why** it fired (the specific rule/threshold), never an opaque "risk score" alone.

---

## 6. Leave & Time-Off Management

### 6.1 Apply for Leave — Employee **[BASE]**
- Leave type (Paid/Sick/Unpaid), calendar date-range picker, remarks, monthly calendar view with Present/Absent markers.
- Status: Pending / Approved / Rejected.
- **[NEW][P0]** Smart conflict detection at submission time: if requested dates overlap with (a) a threshold % of the same team already on leave, or (b) an admin-flagged blackout period, show a non-blocking warning to both employee and approver.
- **[NEW][P2]** Leave balance auto-decrement with carry-forward rules configurable per leave type.

### 6.2 Leave Approval — Admin/HR/Manager **[BASE + NEW]**
- View all requests, approve/reject, add comments; changes reflect immediately. **[BASE]**
- **[NEW][P1]** Delegate approval authority temporarily (e.g., manager on leave themselves delegates to a peer).
- **[NEW][P0]** In-app + push notification on status change; optional Slack/Teams/WhatsApp bridge (§10).

---

## 7. Payroll / Salary Management

### 7.1 Employee Payroll View **[BASE]**
- Read-only for employees.
- **[NEW][P2]** Downloadable payslip PDF per month, auto-generated from salary structure + attendance/leave deductions.

### 7.2 Admin Payroll Control **[BASE]**
- View all payroll, update salary structure, ensure accuracy.
- **[NEW][P2]** Payroll anomaly flag: highlight month-over-month salary changes above a configurable % threshold for admin double-check before disbursal sign-off (fraud/error catch, not a payroll engine).

### 7.3 Wellness Index **[NEW][P1]**
- Composite, transparent score per employee combining: overtime hours, leave utilization vs. entitlement, days since last day off, days since last recognition/kudos received.
- Shown to the **employee themselves** on their own dashboard first — framed as self-awareness tooling, with an aggregated/anonymized team view for HR (not individual surveillance data by default).

---

## 8. HR Copilot Chatbot **[NEW][P0]**

- Natural-language Q&A widget available to all roles.
- Employee-facing: "How many sick leaves do I have left?", "What's the WFH policy?", "When was my last leave approved?"
- Answers are grounded in two sources only: (a) live DB queries for personal data (leave balance, attendance), (b) a static HR policy document indexed for retrieval — no free-form hallucinated policy answers.
- Admin-facing: "Who has pending leave requests older than 3 days?", "Show attendance anomalies this week."
- Implementation note: this can be a thin retrieval-augmented layer over the Anthropic API (or any LLM API) with tool-calling into your own REST endpoints — see `04_API_SPECIFICATION.md` §7.

---

## 9. Org Chart & Skill Matrix **[NEW][P2]**

- Auto-generated org chart from each employee's `reportingManagerId` field.
- Searchable skill directory (from profile skill tags, §4) for internal mobility / "who knows X" queries.

---

## 10. Notifications **[NEW][P1]**

- In-app notification center (bell icon, unread badge).
- Email notifications for: leave status change, document expiry reminders, onboarding checklist reminders.
- Optional bridge to Slack/Teams/WhatsApp webhook for status-change pushes.

---

## 11. Non-Functional Requirements

| Category | Requirement |
|---|---|
| **Performance** | Dashboard loads < 2s on 4G; API p95 < 300ms for non-report endpoints |
| **Accessibility** | WCAG 2.1 AA — 4.5:1 text contrast, full keyboard nav, aria-labels on icon-only controls |
| **Security** | Passwords hashed (bcrypt/argon2), JWT with short-lived access + refresh tokens, role-based route guards on both frontend and backend, input validation on every write endpoint |
| **Data Privacy** | Salary and personal documents visible only to the owning employee and Admin/HR — never to Manager role by default |
| **Auditability** | All approval actions and profile edits logged with actor, timestamp, before/after diff |
| **Responsiveness** | Fully responsive 375px → 1440px+; no horizontal scroll at any breakpoint |
| **Availability** | Graceful error states and loading skeletons on every async view — no blank screens |

---

## 12. Explicit Out-of-Scope (state this in the pitch)

- Statutory payroll computation engines (PF/ESI/TDS/tax slabs)
- Native iOS/Android apps
- Multi-tenant/org billing
- Biometric hardware integration (fingerprint devices) — geofencing/QR only for demo feasibility
