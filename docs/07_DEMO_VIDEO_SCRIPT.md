# 07 — Demo Video Script & Production Guide

## Why This Matters As Much As The Code

In most hackathon rubrics, the demo video is the *first* thing evaluators see and often the only thing they watch closely before diving into code. A confused, screen-recorded feature tour loses to a tight, narrated story — even for a technically weaker project. Budget real time for this, not a last-hour afterthought.

## Target Length

**2:30–3:30 minutes.** Most hackathon judges skim; anything past 4 minutes loses attention. If your platform has a hard cap, hit 90% of it — don't pad, don't rush the ending.

## Structure

| Time | Section | Content |
|---|---|---|
| 0:00–0:20 | **Hook + Problem** | One line on the real pain (HR reacting instead of anticipating), stated plainly, no jargon |
| 0:20–0:35 | **One-line solution** | The elevator pitch from `01_PROJECT_VISION.md` |
| 0:35–2:20 | **Live feature walkthrough** | See shot list below — baseline flow first, then the 2–3 standout AI/innovation features |
| 2:20–2:50 | **Tech/architecture flash** | 10–15 seconds on stack + architecture diagram from `05` — signals engineering depth without narrating every line |
| 2:50–3:15 | **Team + close** | Quick team card, one closing line reinforcing the pitch |
| 3:15–3:30 | **Buffer/CTA** | Repo link, "thank you" |

## Shot List (Live Walkthrough)

1. **Login → Employee Dashboard** (5s) — show the clean UI, leave balance widget, wellness card.
2. **Apply for leave** (15s) — trigger the smart conflict-detection warning live ("3 teammates already off that week") — this is your best "wait, that's smart" moment, put it early in the walkthrough.
3. **Switch to Admin view** (5s) — pending approvals queue with SLA aging visible.
4. **Approve the leave** (5s) — show instant status update + notification.
5. **Attendance anomaly review** (15s) — open the flagged-anomaly panel, click one, show the explainability reasoning ("flagged: 5 late check-ins in 7 days vs. baseline").
6. **Attrition risk shortlist** (15s) — open the explainability drawer for one at-risk profile, narrate that it's transparent, not a black box.
7. **HR Copilot chat — the centerpiece** (30–40s) — type a real question live ("How many sick leaves do I have left?"), let the answer stream in with its source citation, then ask an admin-side question ("Who has pending leave requests older than 3 days?"). This should feel unscripted-but-rehearsed — practice the exact phrasing 5+ times so it never stumbles on camera.
8. **Payroll view** (5s) — read-only employee view, quick payslip download.
9. **Kudos wall / wellness index** (10s) — light, human moment before the tech-stack beat.

## Script Draft (fill in your team name / stack specifics)

> "HR software today tells you what already happened — who was absent, who's owed leave. It rarely tells you what's *about* to go wrong. That's the gap we built NovaHR to close.
>
> [cut to app] This is the employee dashboard — clean, and it already knows things: leave balance, a wellness snapshot, and an AI assistant one tap away.
>
> Watch what happens when I apply for leave during a busy sprint week — [conflict warning appears] — it flags the overlap before I even submit, so approvers aren't caught off guard.
>
> On the HR side, approvals are queued with aging so nothing sits ignored. And this — [anomaly panel] — is attendance pattern detection: not a black box, every flag shows exactly why it fired.
>
> Same for attrition risk — [explainability drawer] — transparent factors, not a mystery score.
>
> But the feature we're proudest of is this. [open copilot] Ask it anything. 'How many sick leaves do I have left?' — grounded in real data, cited, not guessed. Same assistant, admin side: 'who has pending approvals older than three days?'
>
> Under the hood: [flash architecture diagram] Next.js, [your backend choice], PostgreSQL, and Claude powering the assistant — built by four of us in [X days].
>
> HR software that reacts is table stakes. NovaHR anticipates. Thanks for watching."

## Production Notes

- **Record screen at 1080p minimum**, cursor highlighting on, no visible personal browser tabs/bookmarks bar.
- **Voiceover over screen capture** beats talking-head-plus-screen for this length — cleaner, easier to re-record a flubbed line without reshooting video.
- **Seed data matters here more than anywhere else** — use realistic names/numbers, not "Test User 1" and "asdf@asdf.com."
- Do a **full dry run the day before submission**, not the same night — you will find at least one bug or awkward transition, and you need buffer time to fix or re-cut.
- Background music: instrumental, low volume, under voiceover — never louder than the narration.
- Caption/subtitle the video if the platform allows — some judges skim with sound off.
