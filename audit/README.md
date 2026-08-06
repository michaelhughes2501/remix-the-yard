# Engineering Audit — remix-the-yard

Branch: `claude/engineering-audit-refactor-j2mphk`
Scope: Phase 1 — reports + safe fixes only. Refactor execution deferred.

## Context

**The Yard** is a full-stack social platform for formerly incarcerated individuals — the branded consumer face of the same architecture that NewHorizonV2 uses under the "New Horizon" name. React 19 + TypeScript + Tailwind v4 + Express 5 + `better-sqlite3`. Feature-complete: Auth, Yard, Kites (DMs), Forum, Case Tracker, Mentorship, Opportunities, Vault, Resources, Tools, Global Search, SOS button, API Gateway console, Workspace Hub. Server is 1,238 LOC in a single `server.ts` (bigger than NewHorizonV2's 1,047).

Uses `@google/genai` (Gemini), Firebase (`firestore.rules` is thoughtfully written), and a lightweight in-app API gateway (`GATEWAY.md`).

## Reports

| # | File | Focus |
|---|------|-------|
| 1 | [01-deep-engineering-audit.md](./01-deep-engineering-audit.md) | Snapshot |
| 2 | [02-bug-hunt.md](./02-bug-hunt.md) | Concrete defects |
| 3 | [03-dependency-audit.md](./03-dependency-audit.md) | Deps + version anomalies |
| 4 | [04-security-review.md](./04-security-review.md) | Auth, gateway, Firebase rules, headers |
| 5 | [05-production-readiness.md](./05-production-readiness.md) | Deploy, backup, migrations |
| 6 | [06-architecture-review.md](./06-architecture-review.md) | Splitting server.ts, gateway wiring |
| 7 | [07-refactor-plan.md](./07-refactor-plan.md) | Ordered PRs |
| 8 | [08-fixed-project-structure.md](./08-fixed-project-structure.md) | Target tree |

## Safe fixes applied in this pass

- **`.gitignore`** — replaced `.github\instructions\codacy.instructions.md` (Windows separator, no-op on POSIX / CI) with a POSIX path.
- **`.github/workflows/apisec-scan.yml`** — deleted. Unmodified upstream template: targets `apisec-project: "VAmPI"` (a demo API), requires `secrets.apisec_username` + `secrets.apisec_password` that are not configured. Runs on every push/PR and fails.
- **`.github/workflows/neuralegion.yml`** — deleted. Unmodified upstream template: targets `https://brokencrystals.com` (a public deliberately-vulnerable practice site — a fine demo target, not a real app URL), requires `NEURALEGION_TOKEN` that is not configured, and specifies `runs-on: ubuntu-18.04` which GitHub retired years ago (jobs on that runner fail at the scheduler level).

The other 6 workflows were kept — `ci.yml`, `codacy.yml`, `devskim.yml`, `eslint.yml`, `dependency-check.yml`, `security-scan.yml`, `pr-agent.yml`, `build-production.yml` — plus the meta-agent config files (`buildagent.yml`, `depagent.yml`, `pragent.yml`).

Nothing under `src/`, `server.ts`, `buildagent/`, `depagent/`, `pragent/`, or `scanner/` was modified.
