# 03 — UI/UX Design System: NovaHR

Product type: SaaS / Productivity (internal enterprise tool) · Audience: HR officers + employees, desktop-first, mobile-responsive · Tone: **professional, calm, trustworthy** — not playful, not corporate-cold either.

---

## 1. Design Direction

**Style:** Clean minimalism with soft depth — subtle elevation (low-blur shadows), rounded-but-not-bubbly corners (8–12px), generous whitespace. No glassmorphism, no brutalism, no heavy gradients — HR data (salary, leave, personal docs) reads as sensitive, so the UI should feel calm and precise, not flashy.

**Anti-patterns to avoid:** decorative-only animation, emoji as icons, gray-on-gray low-contrast text, cramming the dashboard with every metric at once (progressive disclosure instead).

---

## 2. Color System (Light, Professional)

Primary palette — a desaturated indigo/teal core with a warm neutral base, so it reads "trustworthy fintech-adjacent" rather than "generic admin panel blue":

| Token | Hex | Usage |
|---|---|---|
| `--color-primary` | `#3B5BDB` | Primary CTAs, active nav state, links |
| `--color-primary-hover` | `#2F4BC0` | Hover/active state of primary |
| `--color-primary-subtle` | `#EEF1FD` | Selected row backgrounds, badge fills |
| `--color-accent` | `#0EA5A4` | Secondary accent — success-adjacent actions, highlights (teal, distinct from success-green) |
| `--color-surface` | `#FFFFFF` | Cards, modals, sheet backgrounds |
| `--color-background` | `#F7F8FB` | App canvas background |
| `--color-border` | `#E4E7EE` | Dividers, card borders, input borders |
| `--color-text-primary` | `#111827` | Headings, primary body text (contrast 15.8:1 on white) |
| `--color-text-secondary` | `#6B7280` | Meta text, helper text (contrast 4.6:1 on white — passes AA) |
| `--color-success` | `#15803D` | Approved states, positive deltas |
| `--color-warning` | `#B45309` | Pending, at-risk flags |
| `--color-danger` | `#B91C1C` | Rejected, destructive actions, anomaly flags |
| `--color-info` | `#1D4ED8` | Informational banners |

**Dark mode:** design token-driven, not inverted — use desaturated tonal surfaces (`#111827` → `#1A1F2B` for surface, not pure black), keep the same semantic roles, verify 4.5:1 contrast independently rather than assuming light-mode values transfer.

**Rule:** color is never the only signal — every status (approved/pending/rejected, anomaly flag) pairs a color with an icon and a text label.

---

## 3. Typography

| Role | Font | Weight | Size (desktop) |
|---|---|---|---|
| Display / page titles | **Sora** | 700 | 28–32px |
| Section headings | **Sora** | 600 | 20–22px |
| Body | **Inter** | 400 | 16px |
| Labels / meta | **Inter** | 500 | 13–14px |
| Numeric data (salary, counts) | **Inter** (tabular figures) | 500–600 | context-dependent |

- Line-height: 1.5 body, 1.25 headings.
- Line length: 65–75 characters max on long-form text (policy docs, chat responses).
- Use tabular/monospaced figures for salary and attendance-count columns so numbers don't jitter on update.
- Font pairing rationale: Sora (geometric, confident) for headings signals modern-product energy; Inter for body maximizes legibility at small sizes — a deliberate, explainable pairing beats defaulting to system fonts.

---

## 4. Spacing & Layout

- Base spacing unit: **8px** scale (8/16/24/32/48/64).
- Max content width: `1280px` (desktop), centered, with `24px` gutters below `768px`.
- Sidebar (Admin/HR): persistent left nav ≥1024px; collapses to a top bar + drawer below that — never mix sidebar + bottom nav at the same hierarchy level.
- Card grid: 12-column responsive grid; dashboard cards default to `min 280px` before wrapping.
- Breakpoints: `375 / 768 / 1024 / 1440`.

---

## 5. Components

### Buttons
- Primary: filled `--color-primary`, 8px radius, 44px min height (touch target).
- Secondary: outlined, same radius, `--color-border`.
- Destructive: filled `--color-danger`, always paired with a confirmation dialog for delete/reject-with-comment actions.
- Loading state: spinner replaces label, button stays same width (no layout shift).

### Cards
- `--color-surface` background, `1px solid --color-border`, `12px` radius, shadow: `0 1px 2px rgba(16,24,40,0.06), 0 1px 3px rgba(16,24,40,0.08)` — one consistent elevation tier, no random shadow values across the app.

### Forms
- Visible labels always (never placeholder-only).
- Inline validation on blur, not on keystroke.
- Errors render directly below the field, in `--color-danger`, with a specific fix instruction (e.g., "Password needs 1 number" not "Invalid password").
- Required fields marked with `*` plus `aria-required`.

### Status Badges
- Pill-shaped, `--color-*-subtle` background + `--color-*` text + a small icon (check/clock/x) — color + icon + text, always all three.

### Tables (Employee list, attendance, leave history)
- Sticky header on scroll.
- Sortable columns with `aria-sort`.
- Row hover state (`--color-primary-subtle` at low opacity) + clear focus ring for keyboard nav.
- Empty state: icon + one-line message + a clear next action, never a bare blank table.

### Charts (wellness index, attrition signals, org analytics)
- Chart type mapped to data: trend → line, comparison → bar, proportion → donut (max 5 segments, else switch to bar).
- Every chart has a visible legend and a text/table fallback for accessibility.
- Tooltips on hover (desktop) / tap (mobile) showing exact values, not just gridlines.
- Colorblind-safe palette pairs; never rely on red/green alone for the anomaly/risk charts — pair with icon or explicit label.

### AI Copilot Chat Widget
- Floating action button, bottom-right, 56px circular, opens a slide-up panel (mobile) / docked side panel (desktop).
- Every AI response that references personal data cites which record it pulled ("From your leave balance as of today") — builds trust rather than presenting answers as unexplained magic.

---

## 6. Motion

- Micro-interactions: 150–300ms, ease-out on enter / ease-in on exit.
- Modals/sheets animate from their trigger source (scale+fade), never just appear.
- List/table row entrance: staggered 30–40ms per row, capped at first 10 rows (avoid slow cascading reveals on long lists).
- Respect `prefers-reduced-motion` globally — this is a real accessibility requirement, not optional polish.
- No animation on width/height — transform/opacity only, to avoid layout thrash.

---

## 7. Accessibility Checklist (run before every major PR merge)

- [ ] All text ≥4.5:1 contrast (large text ≥3:1)
- [ ] Every icon-only button has an `aria-label`
- [ ] Full keyboard tab order matches visual order
- [ ] Forms: label + for-attribute, errors linked via `aria-describedby`
- [ ] Color never the sole carrier of meaning
- [ ] Focus rings visible on every interactive element (never `outline: none` without a replacement)
- [ ] Tested at 375px width and with browser zoom at 200%

---

## 8. Suggested Tool Workflow

Given the tool list you mentioned, a lean path for a 4-person team on a deadline:
1. **Figma** — single source of truth for the design system (color/type styles as Figma variables, component library). Skip Sketch/Adobe XD/Axure/Proto.io/Principle in parallel — pick one tool for the actual UI kit to avoid sync overhead; use the others only for quick individual mockup exploration if truly needed.
2. **Mobbin / PageFlows / Pttrns / Lapa Ninja / Awwwards / Godly** — reference-only, for 20–30 minutes of pattern research before building each major screen (dashboard, approval flow, chat widget), not for pixel-copying.
3. **Dribbble / Behance** — mood-board inspiration for the chat widget and analytics cards specifically; these are the two screens most likely to look "templated" if not deliberately styled.
4. **Zeplin** — only worth adding if your frontend dev isn't also your designer; otherwise Figma dev-mode inspection is enough and cuts one tool from the stack.

Don't try to touch all sixteen tools — for a hackathon timeline, tool sprawl costs more hours than it saves. Figma + one or two reference sites is enough to hit a professional bar.
