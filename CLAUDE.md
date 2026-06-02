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
- Passwords stored in plaintext — acceptable for prototype, must hash (bcrypt) before production
- No formal migration system — schema changes via ALTER TABLE in server.ts startup
- No test suite
- Firebase integration is optional/unused if only SQLite is configured
