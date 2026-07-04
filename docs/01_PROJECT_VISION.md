# 01 — Project Vision: NovaHR

## The Problem

Most college-built HRMS projects (and, honestly, a lot of shipped SME software) stop at digitizing paperwork: a login, a profile page, a leave form, an attendance table. They solve "where is the data" but not "what should I do about it." HR officers still manually scan attendance sheets for patterns, guess at who's about to quit, and chase down documents by email.

## The Insight

An HRMS's real value isn't storage — it's **decisions**. The system should tell HR *before* a problem exists: this employee's absenteeism is trending up, this team is running unpaid overtime, this new hire's onboarding documents are incomplete three days before their start date.

## Positioning Statement

> For small-to-mid-size teams without a dedicated People Ops function, NovaHR is an HRMS that doesn't just record workforce data — it reads it, flags what matters, and automates the busywork HR officers currently do by hand.

## Three Pillars

1. **Digitize** — everything in the original spec (auth, profiles, attendance, leave, payroll visibility, approvals), done cleanly and completely.
2. **Automate** — approvals, reminders, document verification, and shift/leave conflict checks that currently require a human to notice.
3. **Predict & Assist** — lightweight ML/heuristics and an AI assistant that surface risk (attrition, burnout, compliance gaps) before HR has to ask.

## Unique / Innovative Features (the "wow" layer)

These sit on top of the baseline spec — build baseline first, layer these in as time allows, prioritized top-to-bottom:

| Priority | Feature | What It Does | Judge Appeal |
|---|---|---|---|
| P0 | **HR Copilot Chatbot** | Employees ask "how many leaves do I have left?" or "what's the WFH policy?" in natural language; answers pull from live DB + a policy doc, not hardcoded FAQs. | Visibly "AI," easy to demo live. |
| P0 | **Smart Leave Conflict Detection** | Warns approver if too many team members are off the same week, or if a leave request overlaps a flagged high-priority sprint/project date. | Shows systems thinking, not just forms. |
| P0 | **Attendance Anomaly Detection** | Flags irregular check-in/out patterns (sudden late-arrival streaks, geolocation mismatches) for HR review instead of making HR eyeball a spreadsheet. | Concrete, demoable with seeded data. |
| P1 | **Attrition Risk Score** | A transparent, explainable score per employee (rising unpaid leave, falling attendance, no recent recognition/kudos) — presented as a signal, not a verdict. | High "innovation" score if framed responsibly (see note below). |
| P1 | **Employee Wellness Index** | Aggregates overtime hours, leave utilization, and streaks-without-a-break into a simple internal wellness signal shown to the employee themselves, not just HR — reframes HR tech as employee-serving, not just surveillance. | Differentiates from "surveillance-y" competitor demos. |
| P1 | **Kudos / Recognition Wall** | Peer-to-peer recognition feed on the dashboard; feeds into engagement signals. | Cheap to build, great for live demo energy. |
| P2 | **Geofenced / QR Check-In** | Check-in only registers within office geofence or via desk QR code — solves a real SME pain point (buddy punching). | Practical, relatable to any working judge. |
| P2 | **Document OCR for Onboarding** | Upload an ID/certificate photo; system auto-extracts name/DOB/number to pre-fill profile fields. | Visually impressive live demo. |
| P2 | **Org Chart & Skill Matrix** | Auto-generated org chart from reporting-manager field; searchable skills directory for internal mobility. | Shows scope beyond attendance/leave. |
| P3 | **Slack/Teams/WhatsApp Notification Bridge** | Leave approvals/rejections and reminders pushed to a chat channel, not just in-app. | Nice integration story, moderate effort. |

**Responsible-AI framing note:** for the attrition risk / wellness features, always present them as *decision-support signals with visible inputs* ("this score is built from X, Y, Z factors — click to see why"), never as a black-box verdict on a person. Judges in HR-tech categories increasingly probe on this; being upfront about explainability and avoiding anything that reads as covert surveillance is both the ethical choice and the stronger pitch.

## What We Will NOT Try to Build

Be explicit about scope-cutting in your pitch — it reads as maturity, not weakness:
- Full statutory payroll computation (PF/ESI/TDS engines) — out of scope; payroll stays **read-only visibility + admin edit**, as specified.
- Multi-tenant SaaS billing — this is a single-org internal tool for the hackathon.
- Native mobile apps — responsive web only, unless time allows a wrapped PWA.

## Elevator Pitch (30 seconds, for the demo video open)

"HR software today tells you what already happened. NovaHR tells you what's about to. It's a complete HR system — onboarding, attendance, leave, payroll visibility — with an AI layer that catches burnout risk, attendance anomalies, and leave conflicts before they become HR fires to put out. Built by four people in [X days], on [stack]."
