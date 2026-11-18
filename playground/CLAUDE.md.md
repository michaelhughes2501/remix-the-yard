# CLAUDE.md — Michael Hughes / FeloniousApps

Apply everything below to every file, component, and script created in this project.

## Standing Instructions

- Restore paused Supabase projects (`Supabase:restore_project`) before running migrations. This is the first step each session.
- Work on the FeloniousApps suite one project at a time. New Horizon is the pattern-setting repo for the phased audit.
- In audits, rank every issue by impact and priority, provide exact fixes, and finish with a concise launch checklist that confirms the site is fast, flawless, ultra-polished, and fully production-ready.
- Before making changes, inspect the existing work. Test every update, fix errors, and preserve all working features throughout development.
- Motion design: prioritize performance, consistency, and storytelling. Never add unnecessary visual effects.
- Code must work well with any IDE, especially VS Code.
- Start every newly created source file with a one-line header comment in this format: `FeloniousApps · <project name> · Created YYYY-MM-DD`. Use the file type's own comment syntax (`//` or `/** */` for .ts/.tsx/.js/.jsx/.css, `#` for .py/.sh, `--` for .sql, `<!-- -->` for .html). Skip formats that cannot hold comments (.json, lockfiles) and do not add or change headers in existing files unless asked.

## Dated Events, Projects & Plans

### Current focus (Oct 2026)
- Final launch audit and agency-grade polish of the FeloniousApps website. Saved prompts: Final Smoothness & Launch Audit, Make It Feel Agency-Built, Build It With Claude, Engineer Ultra-Smooth Motion, Create the Signature Hero, Design the Complete Experience, Create the High-End Creative Direction.
- Panther vehicle-arbitrage platform plan (Sep 2026): an enterprise-grade web app that finds every Mercury Grand Marquis / Ford Crown Victoria in a given ZIP code with condition, price, and year, plus an AI agent that calls and messages sellers about price and specifics and returns calls and answers messages. The full workflow, prompt, and skill spec for the agent were requested.

### FeloniousApps suite maintenance and audit (as of Aug 2026)
- Multi-repo maintenance pass across the suite. Phase A covers dependency audit, structure cleanup, security hardening, and DB schema review. Tracker files: phase-a-plan.md, phase-a-progress.md. ImpactConnect was next, with an unresolved dirty-tree decision pending. 225 hours logged on the suite.
- Second Chance Connect upgraded from a Hono/tRPC/MySQL/React 19 stack to the build standard (SQLite via libsql, JWT auth, AI companion, dark theme, security hardening), delivered as SecondChanceConnect_Maintained.zip.
- Seven project zips queued for one-at-a-time maintenance: conjigul-main, Fifth_felony, ImpactConnect-main, Last_stop, new-horizon-platform, NewHorizonV2-Upgraded, remix_-the-yard.
- ReentryApp-main: JWT hardcoding fix, better-sqlite3 bump, live admin token caught and gitignored, gateway/CI work committed as 039a0fd.
- NewHorizonV2 verified as a strict superset of NewHorizonWeb (tsc clean, git initialized at 0bb5397, 72 tracked files). UI component library created across six apps.
- New Horizon / mmati-funding-engine bug review. Critical issues: shipped .venv, a seeding race condition, hardcoded debug/secret key settings, missing controller files. A full review awaits the complete app/ directory.
- New Horizon messaging platform: PostgreSQL schema, dark-glass React prototype, and five hooks (useAuth, useInbox, useThread, usePresence, useDiscover), partially wired to Supabase.
- All three Supabase projects were found paused due to free-tier inactivity.

### Other recent work
- Reentry Companion: React + Supabase + Anthropic API app with five modules (AI companion chatbot, resource finder, goals/task organizer, forms helper, daily wellness check-in), Supabase auth, per-user data persistence, and a seeded Colorado resource directory.
- Oakwood University alumni platform (React/Vite + FastAPI + SQLite).
- Reentry-focused social/community app brainstorm with 25 feature concepts.
- Resolved an early Windows TLS/SSL issue caused by AVG antivirus intercepting HTTPS traffic.
