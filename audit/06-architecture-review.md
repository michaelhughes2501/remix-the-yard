# 06 — Architecture Review

## Current architecture

```
Browser
   ↓ (Vite dev / built dist/)
tsx server.ts (1,238 LOC)
   ├── helmet
   ├── express.json / express.urlencoded
   ├── express-rate-limit
   ├── (all the same subsystems as NewHorizonV2 — auth, sessions,
   │    users, kites, forum, opportunities, mentorship, cases,
   │    vault, tools, resources, notifications, moderation)
   ├── API Gateway (SQLite api_keys + api_request_logs)
   ├── /gateway admin console (HTML)
   ├── Firebase auth path (optional)
   ├── Gemini AI (@google/genai)
   └── better-sqlite3 → data/app.db
```

Same shape as NewHorizonV2, plus:

- **A gateway subsystem** (API keys, per-key rate limits, request logs, admin console).
- **Firebase auth as an optional path.**
- **Gemini AI integration.**

That's ~200 more LOC's worth of concerns baked into the same single-file backend, which is why `server.ts` is 1,238 lines vs NewHorizonV2's 1,047.

## The refactor is the same as NewHorizonV2's

See [NewHorizonV2 audit #06](/audit/06-architecture-review.md) for the recommended layering. The target tree here adds two additional service concerns:

```
src/backend/
├── services/
│   ├── auth.ts
│   ├── users.ts
│   ├── kites.ts / forum.ts / opportunities.ts / mentorship.ts /
│   │    cases.ts / vault.ts / notifications.ts / moderation.ts
│   ├── gateway.ts         ← NEW: API keys, per-key limits, log writes
│   ├── firebase.ts        ← NEW: Firebase Admin SDK wrapper
│   └── gemini.ts          ← NEW: @google/genai client + prompt library
├── routes/
│   ├── (per-resource, same as NewHorizonV2)
│   ├── gateway.ts         ← NEW: /gateway/* HTTP surface
│   └── gateway-admin.ts   ← NEW: /gateway (HTML admin console)
```

## API Gateway — worth calling out

The gateway (per `GATEWAY.md`) has three real properties that make it well-designed:

1. **Zero new deps.** Uses only what the app already ships. That means one fewer supply-chain surface.
2. **Persistent audit trail.** Every request through the gateway lands in `api_request_logs` — this is what actual API-management platforms charge for.
3. **In-app admin console.** Reachable at `/gateway` behind a token. Standard cloud-native pattern (like Traefik's dashboard).

The three things to add:
1. **Log pruning** (see [02-bug-hunt.md#l2](./02-bug-hunt.md)).
2. **Production-safe admin-token behaviour** (see [04-security-review.md#c2](./04-security-review.md)).
3. **A tests directory** dedicated to the gateway — its behaviour is exactly the kind of thing where regressions are painful and hard to debug.

## Firebase auth as optional

`AuthContext.tsx` (per README) is Firebase + custom session tokens. The optional path is documented; the fallback to custom-only is documented. This is the right shape.

## Frontend

18 components including notable additions vs NewHorizonV2:
- `ApiGateway.tsx` — admin UI for the gateway console.
- `GlobalSearch.tsx` — universal search bar.
- `SOSButton.tsx` — crisis / SOS button (mental-health emergency).
- `WorkspaceHub.tsx` — additional workspace tab.
- `ConfirmationDialog.tsx` — shared UI primitive.

At this count the folder-per-feature split (see NewHorizonV2 audit) applies here too.

## Cross-cutting

- **Config:** `dotenv`.
- **Logging:** `console.*`. Not shipped anywhere.
- **Testing:** absent.

## Verdict

Same recommendations as NewHorizonV2. Splitting `server.ts` is the biggest single lift; adding tests is the second; wiring the gateway with real sweep + prod-safe admin behaviour is the third.
