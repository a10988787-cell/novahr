# 04 — API Specification: NovaHR

Base URL (dev): `http://localhost:8000/api/v1`
Auth: JWT Bearer token (access token 15 min TTL, refresh token 7 days TTL, refresh via httpOnly cookie).

---

## 1. Auth

| Method | Endpoint | Description | Role |
|---|---|---|---|
| POST | `/auth/signup` | Register (employeeId, email, password, role) | Public |
| POST | `/auth/verify-email` | Verify via emailed token | Public |
| POST | `/auth/login` | Returns access + refresh token | Public |
| POST | `/auth/refresh` | Rotate access token | Authenticated |
| POST | `/auth/forgot-password` | Send reset token | Public |
| POST | `/auth/reset-password` | Reset with token | Public |
| POST | `/auth/logout` | Revoke refresh token | Authenticated |
| GET | `/auth/sessions` | List active sessions | Authenticated |
| DELETE | `/auth/sessions/:id` | Revoke a session | Authenticated |

## 2. Employees / Profile

| Method | Endpoint | Description | Role |
|---|---|---|---|
| GET | `/employees/me` | Own profile | Employee+ |
| PATCH | `/employees/me` | Edit limited fields (phone, address, photo) | Employee+ |
| GET | `/employees` | List all (paginated, filterable by dept/status) | Admin/HR |
| GET | `/employees/:id` | Full profile | Admin/HR, self |
| PUT | `/employees/:id` | Full edit | Admin/HR |
| POST | `/employees/bulk-import` | CSV bulk onboarding | Admin/HR |
| POST | `/employees/:id/documents` | Upload document (triggers OCR pipeline) | Employee (self), Admin/HR |
| GET | `/employees/:id/documents` | List documents | Owner, Admin/HR |
| GET | `/employees/:id/skills` | Get skill tags | Owner, Admin/HR, Manager |
| PUT | `/employees/me/skills` | Update own skill tags | Employee |

## 3. Attendance

| Method | Endpoint | Description | Role |
|---|---|---|---|
| POST | `/attendance/check-in` | Check in (optionally with geo/QR payload) | Employee+ |
| POST | `/attendance/check-out` | Check out | Employee+ |
| GET | `/attendance/me?from=&to=` | Own attendance range | Employee+ |
| GET | `/attendance?employeeId=&from=&to=` | Any employee's attendance | Admin/HR, Manager (own team) |
| GET | `/attendance/anomalies` | Flagged anomaly queue | Admin/HR |
| PATCH | `/attendance/anomalies/:id` | Mark reviewed/dismissed | Admin/HR |

## 4. Leave

| Method | Endpoint | Description | Role |
|---|---|---|---|
| GET | `/leave/balance/me` | Own leave balance by type | Employee+ |
| POST | `/leave/requests` | Apply for leave | Employee+ |
| GET | `/leave/requests/me` | Own leave history | Employee+ |
| GET | `/leave/requests?status=&teamId=` | All/team requests | Admin/HR, Manager |
| PATCH | `/leave/requests/:id/approve` | Approve (+comment) | Admin/HR, Manager |
| PATCH | `/leave/requests/:id/reject` | Reject (+comment) | Admin/HR, Manager |
| POST | `/leave/requests/:id/delegate` | Delegate approval authority | Manager, Admin/HR |
| GET | `/leave/conflicts?startDate=&endDate=&teamId=` | Pre-check conflicts before submit | Employee+ |

## 5. Payroll

| Method | Endpoint | Description | Role |
|---|---|---|---|
| GET | `/payroll/me` | Own salary structure (read-only) | Employee+ |
| GET | `/payroll/me/payslip/:month` | Download payslip PDF | Employee+ |
| GET | `/payroll?employeeId=` | Any employee's payroll | Admin |
| PUT | `/payroll/:employeeId` | Update salary structure | Admin |
| GET | `/payroll/anomalies` | Month-over-month change flags | Admin |

## 6. Wellness, Recognition & Analytics

| Method | Endpoint | Description | Role |
|---|---|---|---|
| GET | `/wellness/me` | Own wellness index + factor breakdown | Employee+ |
| GET | `/wellness/team-summary?teamId=` | Anonymized team-level aggregate | Admin/HR, Manager |
| GET | `/risk/attrition` | Attrition risk shortlist with explainability | Admin/HR |
| POST | `/kudos` | Give recognition to a colleague | Employee+ |
| GET | `/kudos/feed` | Org/team kudos feed | Employee+ |
| GET | `/analytics/overview` | Headcount, leave utilization, dept comparison | Admin/HR |

## 7. HR Copilot (AI Assistant)

| Method | Endpoint | Description | Role |
|---|---|---|---|
| POST | `/copilot/chat` | Send message, get grounded answer | Employee+ |
| GET | `/copilot/history` | Own chat history | Employee+ |

**`POST /copilot/chat` contract:**
```json
// Request
{
  "message": "How many sick leaves do I have left?",
  "sessionId": "uuid"
}

// Response
{
  "reply": "You have 4 sick leave days remaining out of 8 allotted this year.",
  "sources": [
    { "type": "db", "ref": "leave_balance", "employeeId": "EMP1042" }
  ],
  "sessionId": "uuid"
}
```
**Implementation pattern:** the backend, not the frontend, calls the LLM API — pass the user's message plus tool definitions for `getLeaveBalance`, `getAttendanceSummary`, `searchPolicyDoc`; the LLM chooses which internal tool to call, your backend executes it against the real DB, and the LLM composes the final grounded reply. Never let the model answer policy questions from its own general knowledge — always route through `searchPolicyDoc` against your actual uploaded HR policy document so answers can't drift from your org's real rules.

## 8. Notifications

| Method | Endpoint | Description | Role |
|---|---|---|---|
| GET | `/notifications` | Own notification list | Employee+ |
| PATCH | `/notifications/:id/read` | Mark read | Employee+ |
| POST | `/integrations/webhook` | Register outbound Slack/Teams/WhatsApp webhook | Admin |

---

## 9. Common Conventions

- Pagination: `?page=1&limit=20`, response includes `{ data, total, page, totalPages }`.
- Errors: consistent shape `{ "error": { "code": "LEAVE_CONFLICT", "message": "...", "details": {} } }`.
- All list endpoints support `?sort=` and `?filter[field]=` query params.
- All timestamps in ISO 8601, UTC, converted client-side to local display.
- Every mutating endpoint (`POST/PUT/PATCH/DELETE`) writes an audit log entry: `{ actorId, action, entity, entityId, before, after, timestamp }`.

## 10. External Integrations Worth Wiring for the Demo

- **Email:** any transactional provider (Resend, SendGrid, or SMTP via Nodemailer) for verification/reset/notification emails.
- **OCR:** Tesseract.js (client or server-side) for the document auto-fill feature — free, no external API key needed, good enough for a demo.
- **LLM:** Anthropic API for the HR Copilot — use tool-calling as described in §7.
- **Chat bridge (optional, P3):** a single incoming webhook URL (Slack or Discord) is the fastest integration to demo live — far less setup than full WhatsApp Business API for a hackathon timeline.
