# 08 — Fixed Project Structure

Target layout — same shape as [NewHorizonV2 audit #08](/audit/08-fixed-project-structure.md) with three additional service slices for the API Gateway, Firebase auth path, and Gemini integration.

```
remix-the-yard/
│
├── README.md                          ← synced with package.json (A5)
├── CLAUDE.md                          ← existing
├── SECURITY.md                        ← existing
├── GATEWAY.md                         ← existing
├── LICENSE                            ← added
├── CHANGELOG.md                       ← added
│
├── .gitignore                         ← POSIX paths (fixed this pass); adds agent-reports/*.json (A7)
├── .env.example                       ← existing
├── .editorconfig                      ← added
├── .eslintrc.js                       ← existing
├── .prettierrc                        ← optional
│
├── package.json                       ← scripts: dev, start, build, test, lint (ESLint), typecheck
├── package-lock.json                  ← existing
├── tsconfig.json
├── vite.config.ts
│
├── firebase-blueprint.json            ← existing (AI Studio config)
├── firebase-applet-config.json        ← existing (AI Studio config)
├── firestore.rules                    ← existing, unchanged
│
├── index.html                         ← Vite entry
│
├── server.ts                          ← thin bootstrap
│
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── AuthContext.tsx
│   ├── types.ts
│   ├── constants.ts
│   │
│   ├── backend/
│   │   ├── db.ts
│   │   ├── migrations/                ← versioned (E1)
│   │   │   ├── index.ts
│   │   │   ├── 0001_initial.ts
│   │   │   └── ...
│   │   ├── middleware/
│   │   │   ├── requireAuth.ts
│   │   │   ├── requireRole.ts
│   │   │   ├── validateBody.ts        ← zod
│   │   │   └── rateLimit.ts           ← express-rate-limit config
│   │   ├── services/
│   │   │   ├── auth.ts
│   │   │   ├── users.ts
│   │   │   ├── kites.ts
│   │   │   ├── forum.ts
│   │   │   ├── opportunities.ts
│   │   │   ├── mentorship.ts
│   │   │   ├── cases.ts
│   │   │   ├── vault.ts
│   │   │   ├── notifications.ts
│   │   │   ├── moderation.ts
│   │   │   ├── gateway.ts             ← API keys + logs + prune (D3)
│   │   │   ├── firebase.ts            ← Firebase Admin SDK (optional)
│   │   │   └── gemini.ts              ← @google/genai wrapper + prompts
│   │   ├── routes/
│   │   │   ├── auth.ts
│   │   │   ├── users.ts
│   │   │   ├── kites.ts / forum.ts / ...
│   │   │   ├── gateway.ts             ← /gateway/* HTTP surface
│   │   │   └── gateway-admin.ts       ← /gateway HTML admin console
│   │   └── schemas/
│   │       ├── auth.ts
│   │       └── ...
│   │
│   ├── components/
│   │   ├── Auth.tsx
│   │   ├── AdminDashboard.tsx
│   │   ├── ApiGateway.tsx
│   │   ├── CaseTracker.tsx
│   │   ├── ConfirmationDialog.tsx
│   │   ├── Forum.tsx
│   │   ├── GlobalSearch.tsx
│   │   ├── HelpCenter.tsx
│   │   ├── Kites.tsx
│   │   ├── Mentorship.tsx
│   │   ├── Opportunities.tsx
│   │   ├── Profile.tsx
│   │   ├── Resources.tsx
│   │   ├── SOSButton.tsx
│   │   ├── TheYard.tsx
│   │   ├── Tools.tsx
│   │   ├── Vault.tsx
│   │   └── WorkspaceHub.tsx
│   │
│   ├── services/                      ← frontend-side API clients
│   │   ├── firebase.ts
│   │   ├── geminiService.ts
│   │   └── googleWorkspace.ts
│   │
│   └── utils/
│       └── searchUtils.ts
│
├── data/                              ← gitignored (SQLite)
├── backups/                           ← gitignored (E2)
├── agent-reports/                     ← gitignored .json (A7)
│   └── .gitkeep
│
├── tests/                             ← added (Phase B)
│   ├── auth.test.ts
│   ├── gateway.test.ts                ← B1 (this repo-specific)
│   ├── kites.test.ts
│   └── ...
│
├── docs/
│   ├── runbook.md
│   ├── deploy.md
│   ├── meta-agents.md
│   └── loadtest.md                    ← locust wiring
│
├── locustfile.py                      ← existing
│
├── buildagent/ depagent/ pragent/ scanner/  ← existing
├── playground/                        ← existing
│
├── ops/                               ← added (F)
│   ├── Dockerfile
│   ├── .dockerignore
│   └── fly.toml
│
└── .github/
    ├── workflows/
    │   ├── ci.yml                     ← existing
    │   ├── codeql.yml                 ← existing
    │   ├── codacy.yml                 ← existing
    │   ├── devskim.yml                ← existing
    │   ├── eslint.yml                 ← existing (real ESLint pipeline)
    │   ├── dependency-check.yml       ← existing
    │   ├── build-production.yml       ← existing
    │   ├── pr-agent.yml               ← existing
    │   ├── security-scan.yml          ← existing
    │   └── loadtest.yml               ← added (G1)
    ├── dependabot.yml                 ← existing
    └── instructions/
        └── codacy.instructions.md     ← existing (gitignored)
```

## Explicit call-outs

- **`apisec-scan.yml` and `neuralegion.yml`** do not appear — deleted this pass.
- **`server.ts`** shrinks from 1,238 LOC to ~50 LOC.
- **`agent-reports/*.json`** no longer tracked.
- **The API Gateway keeps its top-level `GATEWAY.md`.** It's a genuine differentiator.
- **`firestore.rules`, `firebase-blueprint.json`, `firebase-applet-config.json`** stay at the root.

## Sibling parity

Once this lands the repo will be the "consumer-branded" companion of NewHorizonV2:
- Same backend architecture (Express + better-sqlite3 + the same meta-tooling).
- Plus API gateway, Firebase, Gemini.
