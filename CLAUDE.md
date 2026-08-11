# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

Husky + lint-staged run ESLint (`--fix`) and Prettier on staged files on `git commit` (see `.husky/pre-commit`).

There is no test script/framework configured in this project (no `test` entry in `package.json`, no test runner installed). Don't assume Vitest/Jest exists.

Required env vars (`.env.local`, not committed): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. If unset, `hasEnvVars` (`lib/utils.ts`) goes false and the UI falls back to an "connect Supabase" tutorial state instead of the real auth/data UI.

## Architecture

This started as the standard Next.js + Supabase "with-supabase" starter kit (App Router) and has grown a real feature on top: `app/events/`, an event/gathering management app (모임 이벤트 관리 — event CRUD, announcements, participant approval, carpooling, cost settlement). The starter's auth/profile scaffolding (`app/auth/*`, `lib/supabase/*`, `proxy.ts`) is unchanged in shape. Source lives at the repo root — `app/`, `components/`, `lib/` are **not** under `src/`. See `docs/guides/project-structure.md` for the current route/component tree and the RHF+Zod form + Server Action + Supabase migration conventions used throughout `app/events/`.

### Supabase client boundary (three separate client factories)

Because of Next.js SSR/RSC, there are three separate places that construct a Supabase client, each with different cookie-handling requirements — don't consolidate them:

- `lib/supabase/client.ts` — browser client (`createBrowserClient`), for Client Components.
- `lib/supabase/server.ts` — server client (`createServerClient`) for Server Components/Actions, reads/writes cookies via `next/headers`. Must be constructed fresh per request/function call (not a module-level singleton) — see comment in the file re: Fluid compute.
- `lib/supabase/proxy.ts` — `updateSession()` used by the proxy (see below), reads/writes cookies via the `NextRequest`/`NextResponse` pair.

All three are generic over `Database` from `lib/supabase/database.types.ts`.

### `proxy.ts`, not `middleware.ts`

The root-level `proxy.ts` is this Next.js version's replacement for the old `middleware.ts` convention — it exports a `proxy()` function (not `middleware()`) and is picked up by the same route-matching mechanism. It delegates to `lib/supabase/proxy.ts#updateSession`, which:

- Refreshes the Supabase auth session on every matched request.
- Redirects unauthenticated users to `/auth/login` for any path except `/`, `/login*`, and `/auth*`.
- Must not run other logic between `createServerClient(...)` and `supabase.auth.getClaims()`, and must return the `supabaseResponse` object (with cookies copied over) unmodified in shape — see inline comments for why (session desync/random logouts).

### Database types

`lib/supabase/database.types.ts` is generated output (Supabase CLI / `mcp__supabase__generate_typescript_types`) and is committed to the repo — regenerate after schema changes with targeted `Edit` insertions rather than a full-file rewrite (a prior full rewrite introduced a type bug) or hand-editing (CI does not regenerate it, so a stale file only means stale types, not a broken build). `supabase/migrations/` mirrors the applied remote migration history 1:1 — after `apply_migration`, always confirm the exact assigned `version` via `list_migrations` before writing the matching local filename, rather than guessing a timestamp. To bootstrap the first admin in a new environment, run `supabase/bootstrap-admin.sql` (a one-time manual script, not a migration) with `service_role` via the Supabase dashboard SQL Editor or `mcp__supabase__execute_sql`.

### UI components

shadcn/ui is configured via `components.json`. Add new shadcn components with `npx shadcn@latest add <name>` rather than hand-rolling primitives.

The `ConnectSupabaseSteps`/`SignUpUserSteps` UI on `/` (shown/hidden based on `hasEnvVars`) is the starter kit's onboarding scaffolding — treat it as template boilerplate, not an app feature to build on. `app/instruments/page.tsx` is a minimal starter-kit example page (async Server Component, direct `supabase.from("instruments").select()`, no client-side data layer) — `app/events/[id]/page.tsx` is the real reference for this project's actual data-fetching shape (`Promise.all` of several queries in one Server Component, passed down as props to `"use client"` tab components).

## `docs/guides/`

`docs/guides/` (`project-structure.md`, `component-patterns.md`, `styling-guide.md`, `nextjs-15.md`) originated from an unrelated project template and has been edited to match this repo's actual state (real folder layout, real installed versions/scripts, corrective notes where the original claims didn't apply). Keep it in sync when tooling/scripts change — e.g. new `package.json` scripts, `.gitignore` changes, dependency swaps. `component-patterns.md`'s code samples (`UserCard`, `ProductPage`, `CartProvider`, etc.) are generic illustrative patterns, not references to files that exist in this repo.
