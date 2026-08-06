# 05 — Production-Readiness Review

## Checklist

| # | Requirement | State |
|---|-------------|-------|
| 1 | Reproducible install | `package-lock.json` present. Ver anomalies (@types/node 26, typescript 6, lucide-react 1) need reconciliation. |
| 2 | Env config documented + enforced | `.env.example` exists. Firebase env vars documented. No boot-time enforcement. |
| 3 | Dependencies audited | Dependabot present. |
| 4 | Minimum test bar | **None.** |
| 5 | CI enforcing build | 9 workflows, 2 broken (deleted this pass). |
| 6 | Observability | None — `console.*` only. |
| 7 | Rate limiting | **Installed.** Coverage not verified. |
| 8 | Security headers | Present via `helmet`. |
| 9 | Backup / restore | SQLite single-file + Firebase (managed backup). Not documented. |
| 10 | Migrations | try/catch `ALTER TABLE` inferred from lineage — not verified. |
| 11 | Admin surface | `AdminDashboard.tsx` + `/gateway` — real. |
| 12 | Load testing | `locustfile.py` present. Real. |
| 13 | Runbook | Absent. |

## Deploy story

### What exists
- `README.md` speed-run instructions.
- `.vscode/launch.json` for F5 dev.
- `firebase-blueprint.json` + `firebase-applet-config.json` — AI Studio deploy hints.
- `GATEWAY.md` — production-ready doc for the gateway admin console.
- `locustfile.py` — pre-built Locust load-test scaffold.

### What's missing
- **`Dockerfile` + `.dockerignore`.**
- **Deploy target config** — `firebase-applet-config.json` suggests AI Studio Cloud Run deploy; commit an explicit `Dockerfile` for portability.
- **Managed persistence plan** — SQLite works on Fly volumes / Render disks; Cloud Run needs a volume mount or migration to Cloud SQL.

## Observability

- **Logging:** `console.*`. Not structured.
- **Errors:** no Sentry / equivalent.
- **Metrics:** none.
- **Gateway audit trail:** `api_request_logs` is structured but only visible via the admin console.
- **Uptime probe:** not wired.

Recommend `pino` + Sentry as the minimum.

## Data lifecycle

- **Backup:** SQLite `.backup()` API available. Not wired.
- **Firebase side:** managed automatic backups if configured; needs doc.
- **Delete-user:** with CASCADE FKs, hard delete cleans up user's rows; needs an actual endpoint.
- **GDPR:** the app stores mental-health and legal-case data — real regulatory surface.
- **`api_request_logs`:** unbounded growth risk.

## Reliability

- **`better-sqlite3` is synchronous** — every DB call blocks the event loop. See [NewHorizonV2 audit #05](/audit/05-production-readiness.md).
- **No graceful shutdown** documented.
- **Load-test coverage:** `locustfile.py` exists but not visibly wired to CI. Wire it as a nightly job or manual dispatch.

## Documentation

- `README.md`, `CLAUDE.md`, `SECURITY.md`, `GATEWAY.md` — all present.
- Docs need re-syncing (README claims Express 4 / Vite 6; deps say Express 5 / Vite 8).
- **Runbook** absent.

## Verdict

Structurally the most production-ready app in the sweep. Same short list as NewHorizonV2: split server.ts, add tests, real migrations, deploy config, structured logging, sweep the gateway log table. Plus reconcile the three version anomalies.
