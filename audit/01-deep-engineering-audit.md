# 01 — Deep Engineering Audit

## Snapshot

| Dimension | State |
|-----------|-------|
| Frontend | React 19 + TypeScript + Tailwind v4 |
| Backend | Express 5.2.1 + `better-sqlite3` 12.11 (single-file: `server.ts`, **1,238 LOC**) |
| AI | `@google/genai` (Gemini) |
| Auth | Custom UUID session tokens in SQLite + `AuthContext.tsx` (per CLAUDE.md, token in `localStorage`) |
| Firebase | Optional — used for auth in one path; `firestore.rules` present and well-structured |
| Rate limiting | `express-rate-limit` **installed** |
| Security middleware | `helmet` `^8.2.0` installed |
| Additional built-in | An **API Gateway** with an in-app admin console at `/gateway` (see `GATEWAY.md`) |
| Tests | **None** |
| Lint | `.eslintrc.js` present + `eslint.yml` workflow → real linting |
| CI | 9 workflows — one working ESLint, one CodeQL, one Codacy, one DevSkim, plus custom scanner/build-production/dep-check/pr-agent, and two broken third-party templates (apisec, neuralegion — both deleted this pass) |
| Meta-tooling | Same Python packages as NewHorizonV2: `buildagent/`, `depagent/`, `pragent/`, `scanner/` |
| Load testing | `locustfile.py` present (Python Locust) — an actual load-test scaffold |
| Docs | `README.md`, `CLAUDE.md`, `SECURITY.md`, `GATEWAY.md`, `firebase-blueprint.json`, `firebase-applet-config.json` |

## What works well

- **`express-rate-limit` is installed** and (per CLAUDE.md convention) used with `requireAuth` middleware. That's ahead of every other Express backend in the sweep.
- **`GATEWAY.md`** documents a real feature: a scoped, rate-limited, logged API gateway built into `server.ts`, with an in-app admin console mounted at `/gateway`. Keys and request logs live in SQLite (`api_keys`, `api_request_logs`) — zero new deps. That's a thoughtful bit of engineering.
- **`firestore.rules` is thoughtful.** Uses a global deny-first rule (`allow read, write: if false`), then explicit allow paths with helpers (`isSignedIn`, `isEmailVerified`, `isOwner`, `isValidId`). This is the shape of a real, security-minded Firebase project — not the "test mode" defaults you usually see in scaffolds.
- **Real ESLint config**, backed by an actual `eslint.yml` workflow.
- **`locustfile.py`** — actual load-testing scaffold. Rare.
- **`GATEWAY_ADMIN_TOKEN` env var overrides** the auto-generated one — deployable pattern.
- **Session lifecycle bug fixes appear to be inherited** from the NewHorizonV2 lineage: `foreign_keys = ON`, `journal_mode = WAL`, CASCADE deletes.

## Concrete gaps

### G1 — `server.ts` is 1,238 LOC — bigger than NewHorizonV2's
Same class of problem as [NewHorizonV2 audit #01](/audit/01-deep-engineering-audit.md). Splitting is the biggest single lift.

### G2 — Two broken 3rd-party security workflows
`apisec-scan.yml` and `neuralegion.yml` are both unmodified upstream templates:
- `apisec-scan.yml` — targets a demo project `VAmPI`, needs `apisec_username`/`apisec_password` secrets.
- `neuralegion.yml` — targets `https://brokencrystals.com` (a practice site), needs `NEURALEGION_TOKEN`, and specifies `runs-on: ubuntu-18.04` (retired GitHub runner — the job would fail at the scheduler).

**Both deleted in this pass.**

### G3 — `lint` script does not lint
Same anti-pattern as other repos in the org — `"lint": "tsc --noEmit"`. But this repo has `.eslintrc.js` AND an `eslint.yml` workflow that runs real ESLint on push/PR. So the linting *happens*, just not via `npm run lint`. Rename the local script to `typecheck` and add a real `lint` that calls the same ESLint.

### G4 — `@types/node` is pinned to `^26.0.1`
Node 26 does not yet exist in a widely-installed form. If npm resolves this via prerelease tags, fine; if it fails, the whole install fails. Recommend pinning to `^22.14.0` (or whatever matches CI's Node version — `ci.yml` uses Node 22).

### G5 — `typescript` at `^6.0.3`
TypeScript 6 is very new (as of late 2026). Confirm CI is happy with this and that no dependency's `.d.ts` breaks. Not a bug — a "watch this" flag.

### G6 — `express` v5 — matches the CLAUDE.md fix note in NewHorizonV2 that Express 5's `*` wildcard change broke prod
NewHorizonV2 stayed on Express 4 for this reason. This repo is on Express 5. If wildcard routes are used (they are — `server.ts` at 1,238 LOC almost certainly has an SPA fallback), verify they use the named-wildcard syntax (`*splat`).

### G7 — `README.md` refers to Express 4 and Vite 6
The README says "Express 4" but `package.json` has `express ^5.2.1`; the tech-stack table says Vite 6 but `package.json` has `vite ^8.1.0`. Stale docs.

### G8 — `metadata.json` and `firebase-blueprint.json` are checked into git
These are AI Studio artefacts — historical curiosity, no runtime effect. Not a bug; noted so nothing depends on them staying up to date.

### G9 — `.env.example` still contains the AI Studio comment "AI Studio automatically injects this at runtime"
Fine for a repo that ships as an AI Studio applet; misleading when deployed elsewhere. Clarify.

### G10 — `agent-reports/*.json` committed
Same smell as NewHorizonV2 — outputs under version control drift with every push.

## Verdict

Structurally the strongest app in the sweep: rate limiting installed, real ESLint pipeline, thoughtful Firebase rules, a bespoke API gateway. The gap list is the same shape as NewHorizonV2's: split `server.ts`, add tests, real migrations, real deploy story, plus the odd version pins in `package.json`.
