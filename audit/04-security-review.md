# 04 — Security Review

## Strengths

- **`helmet` 8.2** installed.
- **`express-rate-limit` 8.5** installed — ahead of every other Express backend in the sweep.
- **`firestore.rules`** starts with a global deny-first (`match /{document=**} { allow read, write: if false; }`) and requires explicit allow paths with helpers. That is the correct Firebase pattern; most projects ship "test mode" for months.
- **`@firebase/eslint-plugin-security-rules`** as a devDep — the ESLint plugin that catches insecure Firestore rules. Very few projects wire this.
- **Custom API Gateway** with:
  - Per-key rate limiting.
  - Persistent request logs (`api_request_logs`).
  - Admin console at `/gateway` protected by `GATEWAY_ADMIN_TOKEN`.
  - Auto-generated token printed on first boot; overridable via env.
- **`crypto.scryptSync` password hashing** with per-user salt + `timingSafeEqual` verify (per CLAUDE.md).
- **`db.pragma("foreign_keys = ON")` + WAL** — inherited from the NewHorizonV2 lineage.

## Concerns

### C1 — Token in `localStorage`
CLAUDE.md documents: "Register/login → get `token` (UUID) → stored in `localStorage`". Any XSS on any page exfiltrates the token. Migrate to `httpOnly` cookie. Same as NewHorizonV2 C1.

### C2 — API Gateway admin token exposure
`GATEWAY.md`: "On first start the server console prints a line like `[gateway] admin console at /gateway - admin token: <token>`". Fine for dev; in prod, that log line ships to whichever log aggregator the deploy uses (stdout → Vercel / Fly / CloudWatch logs). Anyone with log access has the admin token. Either:
- Print the token only when `NODE_ENV !== 'production'`, or
- Require `GATEWAY_ADMIN_TOKEN` to be set in production (refuse to boot otherwise).

### C3 — `api_request_logs` growth
Unbounded log table in SQLite. See [02-bug-hunt.md#l2](./02-bug-hunt.md). Sweep needed.

### C4 — Rate limiting scope
`express-rate-limit` is installed but the audit didn't confirm which routes it wraps (needs a code read). At minimum needs to apply to `/api/auth/*`, `/api/gemini/*` (or wherever `@google/genai` is called), and the gateway admin routes.

### C5 — Gemini key exposure
`.env.example`: `GEMINI_API_KEY=your-gemini-api-key`. Key lives server-side. Correct — no `VITE_` prefix, so it doesn't ship to the client bundle. However `VITE_FIREBASE_API_KEY` **does** ship to the client (that's how Firebase Auth works). This is standard practice; Firebase security is enforced by the (well-written) `firestore.rules`. The Firebase API key restrictions in the GCP console should also be set to lock down HTTP referrers.

### C6 — Firebase security rules for Storage / Realtime DB
Only `firestore.rules` is present. If Firebase Storage or Realtime Database are ever added, they need their own rules; a missing rules file defaults to permissive.

### C7 — Anonymous posting / moderation
Feature list suggests moderation (`moderation_logs` table per NewHorizonV2's schema — likely mirrored here). Anonymous posts should still persist `user_id` server-side for moderation. Not verified in this pass.

### C8 — CORS
Not visible in the dep list. If SPA and API are same-origin (Express serves the built `dist/`), no CORS needed. Verify in `server.ts`.

### C9 — Static analysis
- **CodeQL** — via `codeql.yml`.
- **Codacy** — via `codacy.yml`.
- **DevSkim** — Microsoft's regex-based scanner. Legit.
- **ESLint** — via `eslint.yml`.
- **In-tree `security-scan` (via `scanner/run.py`)** — the same custom YAML scanner as NewHorizonV2. Legit.
- **`apisec-scan.yml`** and **`neuralegion.yml`** — deleted this pass.

Coverage is generous. The three deleted third-party scanners were never wired to real projects.

## Dependency-level

- Dependabot present (`.github/dependabot.yml`).
- The `@firebase/eslint-plugin-security-rules` dev-dep is a real hardening.

## Summary of concrete security actions

1. **Migrate token from `localStorage` to `httpOnly` cookie.**
2. **Rotate the gateway admin token behaviour** — refuse to auto-print in production; require env override.
3. **Add a periodic sweep** for `api_request_logs`.
4. **Verify `express-rate-limit` wraps** `/api/auth/*`, `/api/gemini/*`, `/gateway/*`.
5. **Confirm `helmet` runs before every route handler.**
6. **Confirm CORS is same-origin only in production.**
7. **Confirm anonymous posts still persist `user_id` for moderation.**
