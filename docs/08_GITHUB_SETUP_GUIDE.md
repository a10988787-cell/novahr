# 08 — GitHub Setup Guide

## 1. Repo Requirements (per hackathon rules)

Each team member must:
1. Create their **own public GitHub repository**.
2. **Add the assigned evaluator as a collaborator** on that repo.

Read this literally against your actual hackathon rulebook — some formats want one shared team repo with all four as collaborators plus the evaluator; others explicitly want **four separate public repos**, one per member, each showing that member's contribution. Since your prompt says "each team member is required to create a public Git repository," treat it as the latter unless the rules say otherwise, and structure it like this:

### Recommended structure
- **One primary monorepo** (from `05_TECH_STACK_ARCHITECTURE.md` §5) where the actual product is built collaboratively — this is what you demo from and submit as the main project link.
- **Each member also maintains their own public repo** mirroring or containing their owned module (per `06_TASK_ALLOCATION.md`), with a clear README explaining their specific contribution and a link back to the primary repo. This satisfies "individual public repo" requirements without fragmenting the actual codebase into four disconnected, non-functional pieces.

## 2. Adding the Evaluator as Collaborator

For each repo (primary + all four individual):
1. Go to **Settings → Collaborators and teams**.
2. Click **Add people**.
3. Enter the evaluator's GitHub username or email (get this from your hackathon organizer/portal — it's usually listed against your team's assigned track/mentor).
4. Set permission level to **Read** (or whatever the rules specify — some want Write to verify commit history directly).
5. **Do this early, not at submission deadline** — invites can take time to accept, and evaluators may check access before the deadline.

## 3. Branching Strategy

```
main            ← always deployable, protected branch
├── dev         ← integration branch, merge target for all feature branches
    ├── feat/auth-module        (A)
    ├── feat/attendance-module  (B)
    ├── feat/dashboard-ui       (C)
    └── feat/ai-copilot         (D)
```

- Never commit directly to `main`. Merge `dev → main` only at end-of-day checkpoints once things are verified working.
- Feature branches named `feat/<module>`, `fix/<bug>`, `chore/<task>`.
- PR template: what changed, how to test, screenshot/GIF for any UI change.
- At least one teammate reviews every PR before merge, even in a 4-person team under time pressure — a 2-minute review catches integration breaks before they compound.

## 4. Commit Convention (keeps history readable for evaluators skimming commits)

```
feat: add leave conflict detection endpoint
fix: correct timezone bug in attendance check-in
docs: update API spec for payroll anomaly endpoint
chore: set up Tailwind design tokens
```

## 5. README Checklist (primary repo)

- [ ] One-line pitch + problem statement (from `01`)
- [ ] Feature list (baseline + innovative, tagged clearly)
- [ ] Tech stack badge row
- [ ] Architecture diagram (from `05`)
- [ ] Setup/run instructions (env vars, `npm install`, `npm run dev`, seed script)
- [ ] Screenshots or GIF of key screens
- [ ] Link to demo video
- [ ] Team members + individual repo links
- [ ] License (MIT is a safe default for a hackathon project)

## 6. Version-Control-Friendly Hosting

- Deploy frontend and backend from the **same repo/branch that evaluators can inspect** — don't deploy from a local zip or an unlinked branch.
- Use environment variables for all secrets (`.env`, never committed — confirm `.gitignore` includes it before your first commit, not after a secret leaks).
- Tag a release (`v1.0-hackathon-submission`) at the exact commit you demo from, so there's no ambiguity about "which version was judged" if you keep developing after submission.

## 7. Pre-Submission Checklist

- [ ] All four individual repos public, evaluator added, README complete
- [ ] Primary repo `main` branch is the exact demo version, tagged
- [ ] `.env.example` present so evaluators can see required config without your real secrets
- [ ] Deployed links (frontend + backend) working and reachable outside your local network
- [ ] Demo video linked in every repo's README
