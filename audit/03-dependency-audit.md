# 03 — Dependency Audit

## Direct dependencies

Runtime:

| Package | Pin | Notes |
|---------|-----|-------|
| `@google/genai` | `^2.10.0` | Gemini SDK. Current. |
| `@tailwindcss/vite` | `^4.1.14` | Tailwind v4. Good. |
| `@vitejs/plugin-react` | `^6.0.3` | v6 — verify Vite 8 compat. |
| `better-sqlite3` | `^12.11.1` | Current. |
| `clsx` | `^2.1.1` | Fine. |
| `date-fns` | `^4.1.0` | Fine. |
| `dotenv` | `^17.2.3` | Fine. |
| `express` | `^5.2.1` | v5. Confirm SPA-fallback wildcard uses `*splat` per Express 5 requirement. |
| `express-rate-limit` | `^8.5.2` | v8 — matches Express 5. |
| `firebase` | `^12.13.0` | Fine. |
| `helmet` | `^8.2.0` | Fine. |
| `lucide-react` | `^1.22.0` | **Anomalous.** lucide-react's stable line is `0.4xx`. `^1.22.0` may be a prerelease. Verify. |
| `motion` | `^12.23.24` | Framer Motion successor. Fine. |
| `react`, `react-dom` | `^19.0.0` | Current. |
| `react-markdown` | `^10.1.0` | Fine. |
| `tailwind-merge` | `^3.5.0` | Fine. |

Dev:

| Package | Pin | Notes |
|---------|-----|-------|
| `@firebase/eslint-plugin-security-rules` | `^0.0.2` | Wired to `firestore.rules` — good. |
| `@types/better-sqlite3` | `^7.6.13` | Fine. |
| `@types/express` | `^5.0.6` | Matches Express 5. |
| `@types/node` | `^26.0.1` | **Anomalous.** Node 26 is very fresh; CI uses Node 22. Recommend `^22.14.0` to match. |
| `@types/react`, `@types/react-dom` | `^19.2.17`, `^19.2.3` | Fine. |
| `autoprefixer` | `^10.4.21` | Fine. |
| `tailwindcss` | `^4.1.14` | v4. |
| `tsx` | `^4.21.0` | Fine. |
| `typescript` | `^6.0.3` | **Very new** (as of late 2026). Confirm the build works. |
| `vite` | `^8.1.0` | v8 — matches `@vitejs/plugin-react` 6. |

## Anomalies to reconcile

1. **`lucide-react ^1.22.0`** — the stable release line is `0.4xx.x`. If v1 exists, it's a rebrand; if it doesn't, the install fails. Either way, verify.
2. **`@types/node ^26.0.1`** — mismatched with the CI Node version (`ci.yml` uses Node 22).
3. **`typescript ^6.0.3`** — cutting-edge; verify the build.

None of these three are blocked from an install if they resolve, but if any fails on `npm install` the app cannot boot. Priority-1 to reconcile.

## Missing

- **Test runner:** no `vitest`, `jest`, `mocha`. Zero tests can exist.
- **`zod` / `valibot`** for request-body validation.
- **`pino`** for structured logging.
- **`node-cron`** for session/gateway-log sweep.
- **`bcrypt` / `argon2`** — password hashing uses `crypto.scryptSync` (per CLAUDE.md). That's a valid choice; noted only because siblings differ.

## Known vulnerabilities

Cannot run `npm audit` without network. Best-effort:

- `firebase` 12.x — one advisory around auth-emulator init, not exploitable in production.
- `express` 5.x — GA'd cleanly.
- `helmet` 8.x — current.
- `express-rate-limit` 8.x — current.

## Recommended dependency actions, in order

1. **Reconcile the three anomalies** (`lucide-react`, `@types/node`, `typescript`).
2. **Add `vitest` + `supertest` + `@testing-library/react`.**
3. **Add `zod`** for request validation.
4. **Wire `pino`** for structured logs.
5. **Verify `express-rate-limit` v8** is actually applied to `/api/auth/*` and any Gemini-fronting route.
6. **Verify `helmet` is initialised** before route handlers in `server.ts`.
