# The Yard — CLAUDE.md

## Project Overview
**The Yard** is a full-stack social platform for formerly incarcerated individuals. It provides community connection, job/housing listings, legal case tracking, private messaging (Kites), mentorship, and parole resources.

## Tech Stack
- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Vite 6, lucide-react, motion/react
- **Backend**: Express 4, better-sqlite3, dotenv
- **AI**: @google/genai (Gemini API)
- **Auth**: Firebase (optional) + custom session tokens in SQLite

## Running the App

```bash
npm install
cp .env.example .env   # Fill in GEMINI_API_KEY
npm run dev            # Starts Express + Vite HMR on http://localhost:3000
```

### VS Code
Press **F5** or use the "Debug Unified App (tsx)" launch config. Requires a `.env` file at project root.

### Build for Production
```bash
npm run build   # Outputs to dist/
npm run start   # Serves dist/ via Express
```

## Project Structure

```
server.ts          # Express backend + Vite middleware (single entry point)
src/
  App.tsx          # Root component, nav, tab routing
  AuthContext.tsx  # Auth state (token stored in localStorage)
  main.tsx         # DOM mount
  types.ts         # Shared TypeScript interfaces
  constants.ts     # Resource data (UA check-ins, parole, mental health)
  components/      # One file per feature tab
  services/        # firebase.ts, geminiService.ts, googleWorkspace.ts
  utils/           # searchUtils.ts
data/
  app.db           # SQLite database (auto-created on first run)
```

## Database
SQLite via `better-sqlite3`. The database auto-creates at `data/app.db` on startup. Schema migrations are done with try/catch `ALTER TABLE` statements at the top of `server.ts` — not a formal migration system.

**Tables**: users, sessions, password_resets, mentorships, documents, jobs, housing, kites, parole_officers, threads, replies, notifications, job_applications, legal_cases, moderation_logs, connections

## Key Conventions

### API Routes
All API routes are in `server.ts`. Pattern:
- Auth required: uses `requireAuth` middleware (Bearer token)
- Role-gated: uses `requireRole(['moderator', 'admin', 'super_admin'])` middleware
- Routes use `req.userId` (injected by `requireAuth`)

### Frontend Navigation
Tab-based SPA. Tab IDs: `yard`, `kites`, `resources`, `tools`, `forum`, `mentorship`, `vault`, `profile`, `opportunities`, `admin`, `help`, `cases`, `workspace`

### Auth Flow
1. Register/login → get `token` (UUID) → stored in `localStorage`
2. All API calls send `Authorization: Bearer <token>`
3. `AuthContext` hydrates from `/api/auth/me` on load

### User Roles
`user` → `moderator` → `admin` → `super_admin`  
Legacy: `is_admin = 1` maps to `super_admin`

## Environment Variables

```env
GEMINI_API_KEY=   # Required for AI features
APP_URL=          # Base URL (used for OAuth callbacks, optional)
```

## Known Limitations
- Passwords are hashed with Node's built-in `crypto.scryptSync` (per-user random salt, `salt:hash` hex format, `crypto.timingSafeEqual` on verify) — see `hashPassword`/`verifyPassword` in `server.ts`. Not plaintext; this doc previously said otherwise.
- No formal migration system — schema changes via ALTER TABLE in server.ts startup
- No test suite
- Firebase integration is optional/unused if only SQLite is configured

---

## FeloniousApps build kit (suite-wide defaults)

These are the shared rules from the FeloniousApps build kit. Where they differ from this project's own rules above, this project's rules win.

You are a senior AI + full-stack developer building one of Michael's three-layer web apps. Follow these rules on every change.

### Golden rule
Every site must **run cleanly on localhost with zero errors or bugs, and the code must flow together.** Nothing is "done" until verified.

### Verification loop (run before reporting success)
1. Start the dev server.
2. Tail output; confirm it compiled with no build-breaking errors/warnings.
3. `curl -s -o /dev/null -w "%{http_code}" http://localhost:<port>` → expect `200`.
4. `npm run type-check` (`tsc --noEmit`) → 0 errors.
5. Only then report success. If anything errors, fix and re-verify — never hand back a broken site.

### Stack (default)
- **Frontend:** React 18 + Vite + TypeScript + Tailwind. Functional components + hooks only.
- **Backend/DB:** Supabase (Postgres + Auth + Storage). **RLS ON for every table** with explicit per-user policies. Schema changes go through SQL migrations in `supabase/migrations/` only.
- **AI layer:** Anthropic API. Persistent per-user companion with chat history in Supabase. `claude-sonnet-4-6` for in-app features, `claude-opus-4-8` for heavy reasoning. Send full history each call. Never ship API keys client-side — proxy through an Edge Function / server.
- Routing: React Router. UI: Radix UI (+ shadcn). Icons: lucide-react. Motion: Framer Motion. Tests: Vitest.

### Environment
- Windows + nvm-windows (`nvm use 20`). One dev server per port; kill stale processes first.
- Env vars: read `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` etc. from `.env`. If a var is missing, **fail loudly and name the exact var — never invent values.** Keep `.env.example` complete.
- If npm/installs fail on SSL/TLS, suspect antivirus (AVG) interception.

### Visual standard (enterprise-grade, intriguing)
Dark-first premium UI. Layered surfaces, low-opacity borders, soft shadows, glassmorphism panels (`backdrop-blur`). One bold accent + tasteful gradient on hero/CTAs. Generous whitespace, typographic scale, confident hero headline. Motion: scroll-reveal (fade + rise), button press-scale + hover-lift, card border-glow. Respect `prefers-reduced-motion`. Fully responsive 360→1440px. Accessible: semantic HTML, keyboard nav, focus rings, ARIA, WCAG AA. Loading skeletons, empty states, toasts — never raw spinners on primary content. Drive theme from CSS variables so it swaps in one place.

### Editing discipline
Surgical edits. Keep imports, routes, and naming consistent so the code flows together. Add/update types in `src/types`. Co-locate state; lift to context only when shared.

Reusable patterns for every build: @SKILLS.md
