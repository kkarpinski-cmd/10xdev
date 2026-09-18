# Repository Guidelines

JamSet helps small music bands coordinate song pools and voting rounds before rehearsals. Stack: Astro 7 SSR, React 19 islands, Tailwind 4, Supabase auth, Cloudflare Workers. Read @context/foundation/prd.md before feature work.

## Agent Rules

- Never commit secrets — `SUPABASE_URL` and `SUPABASE_KEY` belong in `.env` / `.dev.vars` only (see @.env.example; both are gitignored).
- Add new authenticated routes to `PROTECTED_ROUTES` in @src/middleware.ts.
- Use Astro pages in `src/pages/`; add React islands only for interactivity — no Next.js `"use client"` directives.
- Merge Tailwind classes with `cn()` from @src/lib/utils.ts; do not concatenate class strings manually.
- New Supabase tables need migrations in `supabase/migrations/` (`YYYYMMDDHHmmss_description.sql`) with RLS and granular per-operation policies.
- Put shared types in `src/types.ts`; helpers in `src/lib/` (or `src/lib/services/`).

Run `npm run dev` for local development, `npm run lint` before commits, and `npm run build` to verify production output.

## Project Layout

- `src/pages/` — routes; API handlers in `src/pages/api/` (export uppercase `GET`/`POST`, follow @src/pages/api/auth/signin.ts).
- `src/components/` — Astro and React UI; shadcn/ui primitives in `src/components/ui/` (`npx shadcn@latest add [name]`).
- `src/lib/supabase.ts` — SSR Supabase client; server env schema in @astro.config.mjs (`output: "server"`).
- `context/foundation/` — PRD, tech-stack, shape notes.
- `scripts/smoke.mjs` — dependency-free auth-flow smoke test.

## Commands

`npm run preview` serves the production build. `npm run lint:fix` and `npm run format` apply ESLint (@eslint.config.js) and Prettier. After dependency upgrades, run `BASE_URL=http://localhost:4321 npm run smoke` against a server with Supabase reachable.

Pre-commit (@.husky/pre-commit) runs lint-staged: ESLint on `*.{ts,tsx,astro}`, Prettier on `*.{json,css,md}`.

## Style

TypeScript strict via @tsconfig.json; path alias `@/*` → `./src/*`. Match neighbors: PascalCase components, kebab-case route files.

## Testing

No unit or e2e suite yet — only `npm run smoke`. Add application tests as JamSet features grow. CI smoke job in @.github/workflows/ci.yml builds, previews, and runs smoke on `master`.

## Commits & PRs

Target branch: `master`. PRs must pass CI: `npm run lint`, `npx astro check`, `npm run build` (needs `SUPABASE_URL`/`SUPABASE_KEY` secrets), plus the smoke job. Use short imperative commit messages (see recent `git log`). Node.js v22.14.0 per @.nvmrc.
