# 02 — Bug Hunt

## Confirmed bugs

### B1 — `apisec-scan.yml` is an unmodified template that fails on every run
- **File:** `.github/workflows/apisec-scan.yml`
- **Symptom:** Targets `apisec-project: "VAmPI"` (a public demo API by APIsec, not this app), requires `secrets.apisec_username` + `apisec_password` that are not configured for this repo. Job fails at the secret-lookup step.
- **Fix:** Delete. **Applied in this pass.**

### B2 — `neuralegion.yml` targets a practice site + specifies a retired runner
- **File:** `.github/workflows/neuralegion.yml`
- **Symptom:** `crawler_urls: [ "https://brokencrystals.com" ]` — a deliberately-vulnerable practice site by BrightSec, not this app's URL. Requires `NEURALEGION_TOKEN` that is not configured. **And** `runs-on: ubuntu-18.04` — GitHub retired the 18.04 hosted runners in 2023; jobs on that runner fail at the scheduler level.
- **Fix:** Delete. **Applied in this pass.**

### B3 — `.gitignore` line 17 uses a Windows path separator
- **File:** `.gitignore` (line 17)
- **Symptom:** `.github\instructions\codacy.instructions.md` — same rule as sibling repos; no-op on POSIX.
- **Fix:** POSIX slash. **Applied in this pass.**

### B4 — `README.md` documents Express 4 and Vite 6, but `package.json` has Express 5 and Vite 8
- **File:** `README.md`
- **Symptom:** Prose walkthrough tells users about a stack that's a major version behind. Any dev following the README will run into surprises (Express 5's route-parameter parser changes, Vite 8's ecosystem defaults).
- **Fix:** Sync the README with `package.json`. Not applied — non-blocking doc drift; part of the refactor plan.

### B5 — `lint` script runs `tsc --noEmit`, not real ESLint
- **File:** `package.json` (line 12)
- **Symptom:** ESLint is configured (`.eslintrc.js` exists, `eslint.yml` runs in CI), but the local `npm run lint` runs a typecheck. Contributors think they've linted; they haven't.
- **Fix:** Add `typecheck` script; make `lint` call `eslint .`.

### B6 — `@types/node` pinned to `^26.0.1`
- **File:** `package.json` (line 37)
- **Symptom:** Node 26 is a very fresh major release. If `@types/node` 26.x isn't yet on the npm registry as a stable range, `npm install` fails or resolves to a prerelease. `ci.yml` uses Node 22, so any Node 26–only type would be inconsistent with the runtime.
- **Fix:** Pin to `^22.14.0`. Not applied — behavioural, needs a CI run to verify.

## Latent bugs

### L1 — `server.ts` at 1,238 LOC hides the code-quality state
Reading it top-to-bottom (~40 minutes) would be needed to find all the bugs it contains. Its size is itself a bug. Deferred.

### L2 — API Gateway logs sit in the same SQLite DB as user data
- **File:** implied by `GATEWAY.md`
- **Symptom:** `api_request_logs` grows unbounded. A busy gateway can silently balloon `data/app.db` and slow every query in the app. Recommend a periodic prune (or a separate `data/gateway.db`).

### L3 — `agent-reports/*.json` checked into git
Same smell as NewHorizonV2. Deferred to a `.gitignore` PR.

### L4 — `README.md` mentions `GEMINI_API_KEY` on line 25 but the app also uses Firebase (`firestore.rules`, `firebase` npm dep)
Firebase configuration values are missing from the README's setup section (they're in `.env.example` — VITE_FIREBASE_*). New devs may not realise Firebase is optional and try to configure it before running the app.
- **Fix:** Add a "Firebase is optional" note to the README setup. Not applied.

### L5 — `ci.yml` and other workflows have unpinned actions
`security-scan` (the in-tree custom scanner) reports 36 low-severity `actions-unpinned` findings and 3 medium `actions-permissions-missing`. All pre-existing. Not fixed here — a dedicated hardening PR.

### L6 — `metadata.json`, `firebase-blueprint.json`, `firebase-applet-config.json` — historical AI Studio artefacts
Not a bug; noted so they aren't treated as source of truth.

## Not-a-bug

- **The API Gateway itself** — well-designed. Zero-dep, SQLite-backed, admin console, GATEWAY_ADMIN_TOKEN override, rate-limited routes. Do not "simplify" this away.
- **`firestore.rules` deny-first pattern** — deliberately strict. Do not weaken.

## Nothing else surfaced from a partial read

The audit is honest about not having read all 1,238 lines of `server.ts` — the size and lack of tests mean any real bug hunt starts by splitting the file (see [06-architecture-review.md](./06-architecture-review.md)) and adding at least one test per resource. That is the first entry in the refactor plan.
