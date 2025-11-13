# IndieConverters — Publisher Platform

Modern indie-publishing site built with Next.js 16 (App Router), TypeScript, TailwindCSS, and Supabase. The schema described in `Instructions.md` is already deployed through `supabase/migrations/0001_core.sql`, and this app ships with Supabase clients wired to the shared environment variables.

## Prerequisites

- Node.js 18+ (uses npm)
- Supabase CLI (`npm i -g supabase` is intentionally blocked; follow [docs](https://github.com/supabase/cli#install-the-cli))
- A Supabase project configured with the credentials stored in `.env`

## Setup

```bash
cp .env.local.example .env.local   # then paste your Supabase keys
npm install                         # already run, but reinstall after pulling changes
npm run dev                         # http://localhost:3000
```

Run the database migrations (after logging into the CLI) whenever the SQL changes:

```bash
supabase db push
```

## Environment variables

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Browser-safe Supabase URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Browser-safe anon key |
| `SUPABASE_URL` / `SUPABASE_ANON_KEY` | Server-side mirror (defaults to the public pair) |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only key for admin writes (never expose to the browser) |
| `SUPABASE_DB_PASSWORD`, `SUPABASE_ACCESS_TOKEN` | Used by the CLI for `supabase db push/pull` |

## Project structure

```
src/app              # App Router routes (home + /instructions)
src/lib/env          # Client + server env helpers (guards required vars)
src/lib/supabase     # Browser/server Supabase client factories
src/types            # Shared domain models
supabase/migrations  # SQL migrations applied via Supabase CLI
```

## Next steps

- Flesh out catalog, author, imprint, news, events, submissions, and newsletter routes using the new Supabase clients.
- Add API routes/actions that use `createServiceRoleSupabaseClient` for admin workflows.
- Implement JSON-LD, accessibility checks, and Tailwind-based component primitives per `Instructions.md`.
