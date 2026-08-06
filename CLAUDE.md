# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

Husky + lint-staged run ESLint (`--fix`) and Prettier on staged files on `git commit` (see `.husky/pre-commit`).

There is no test script/framework configured in this project (no `test` entry in `package.json`, no test runner installed). Don't assume Vitest/Jest exists.

Required env vars (`.env.local`, not committed): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. If unset, `hasEnvVars` (`lib/utils.ts`) goes false and the UI falls back to an "connect Supabase" tutorial state instead of the real auth/data UI.

## Architecture

This is the standard Next.js + Supabase "with-supabase" starter kit (App Router), largely unmodified from upstream except for `Database`-typed Supabase clients. Source lives at the repo root — `app/`, `components/`, `lib/` are **not** under `src/`.

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

`lib/supabase/database.types.ts` is generated output (Supabase CLI / `mcp__supabase__generate_typescript_types`) and is committed to the repo — regenerate and commit it after schema changes rather than hand-editing (CI does not regenerate it, so a stale file only means stale types, not a broken build). Currently defines `instruments` and `profiles` tables.

### UI components

shadcn/ui is configured via `components.json` (style: `new-york`, base color: `neutral`, RSC on). Path aliases (`tsconfig.json` + `components.json`): `@/components`, `@/components/ui`, `@/lib`. Add new shadcn components with `npx shadcn@latest add <name>` rather than hand-rolling primitives.

`components/tutorial/*` and the `ConnectSupabaseSteps`/`SignUpUserSteps` UI on `/` are the starter kit's onboarding scaffolding (shown/hidden based on `hasEnvVars`) — treat them as template boilerplate, not app features to build on.

`app/instruments/page.tsx` is the one non-boilerplate example page: an async Server Component wrapped in `Suspense`, fetching directly from Supabase (`supabase.from("instruments").select()`) with no client-side data layer.

## `docs/guides/`

`docs/guides/` (`project-structure.md`, `component-patterns.md`, `styling-guide.md`, `nextjs-15.md`) originated from an unrelated project template and has been edited to match this repo's actual state (real folder layout, real installed versions/scripts, corrective notes where the original claims didn't apply). Keep it in sync when tooling/scripts change — e.g. new `package.json` scripts, `.gitignore` changes, dependency swaps. `component-patterns.md`'s code samples (`UserCard`, `ProductPage`, `CartProvider`, etc.) are generic illustrative patterns, not references to files that exist in this repo.
