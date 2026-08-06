# 07 — Refactor Plan

Same shape as NewHorizonV2's plan. Focus on what's specific to this repo.

## Ground rules

- `npm run build` must succeed on every PR.
- `npm start` must launch the server on port 3000.
- Do not remove or weaken the API Gateway.
- Do not touch `firestore.rules` without paired `@firebase/eslint-plugin-security-rules` checks.

## Phase A — Correctness + hygiene

### A1. (Done) Delete `apisec-scan.yml`, `neuralegion.yml`
Done in this pass.

### A2. (Done) Fix `.gitignore` Windows separator
Done in this pass.

### A3. Reconcile three version anomalies
- `@types/node ^26.0.1` → `^22.14.0` (or align with CI).
- `typescript ^6.0.3` → verify build passes; consider `^5.9.x` if TS 6 causes issues.
- `lucide-react ^1.22.0` → verify version exists on the npm registry; if not, `^0.463.0` (latest stable at time of writing).
- Effort: 30 min.

### A4. Rename `lint` → `typecheck`; add real `lint`
- Effort: 15 min.

### A5. Sync `README.md` with actual `package.json`
- Effort: 15 min. Express 4 → 5. Vite 6 → 8.

### A6. Add `README.md` note on Firebase optionality
- Effort: 10 min.

### A7. Untrack `agent-reports/*.json`
- Effort: 15 min.

### A8. Verify `npm run dev` still works after A3
- Effort: 15 min.

## Phase B — Test bar

Same as NewHorizonV2. Plus:

### B1. Add tests for the API Gateway
- Effort: 3 hrs.
- Cover key creation, per-key rate limits, log write/read, admin console token gate.

## Phase C — Split `server.ts`

Same as NewHorizonV2, with the additional slices for `gateway.ts`, `firebase.ts`, `gemini.ts` (see [06-architecture-review.md](./06-architecture-review.md)).

## Phase D — Security hardening

### D1. Migrate `nh_token` from `localStorage` to `httpOnly` cookie
Same as NewHorizonV2 D2.

### D2. Refuse to auto-print gateway admin token in production
- Effort: 15 min. Check `NODE_ENV !== 'production'` before the console line; require `GATEWAY_ADMIN_TOKEN` env if prod.

### D3. Add periodic `api_request_logs` prune
- Effort: 45 min. `setInterval`, keep last 7 days by default.

### D4. Verify `express-rate-limit` wraps `/api/auth/*`, `/api/gemini/*`, `/gateway/*`
- Effort: 30 min (code read + wire missing).

### D5. Wire Sentry
- Effort: 30 min.

## Phase E — Migrations + backup

Same as NewHorizonV2.

## Phase F — Deploy

Same as NewHorizonV2.

### F1. `Dockerfile` + `.dockerignore`
### F2. Pick target + commit config
### F3. Managed volume for SQLite

## Phase G — Load testing

### G1. Wire `locustfile.py` to a manual-dispatch CI workflow
- Effort: 30 min.

### G2. Baseline the API Gateway under 100/500/1000 QPS
- Effort: 2 hrs.

## Effort estimate

| Phase | Steps | Effort |
|-------|-------|--------|
| A | 8 | ~2 hrs |
| B | 1 (+ NHV2's 4) | ~13 hrs |
| C | (same as NHV2, plus 3 slices) | ~15 hrs |
| D | 5 | ~3 hrs |
| E | (same as NHV2) | ~5 hrs |
| F | 3 | ~3 hrs |
| G | 2 | ~2.5 hrs |
| **Total** | **~30 PRs** | **~43 hrs** |

## Explicit non-goals

- **Migrate to Supabase.** Same policy as NewHorizonV2 (`STACK_NOTE.md` isn't in this repo but the family policy holds).
- **Remove the API Gateway.** It is a differentiator — do not simplify away.
- **Remove Firebase.** Optional and documented; leave alone unless a specific reason emerges.
- **Rewrite the frontend in Next.js.**
