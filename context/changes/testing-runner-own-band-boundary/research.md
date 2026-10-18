---
date: 2026-10-18T22:32:03+02:00
researcher: unknown
git_commit: 315c22a27f33beed40c2cb71597fb16432f4f100
branch: test-implementation
repository: kkarpinski-cmd/10xdev
topic: "Phase 1 own-band read boundary and rejected owner writes"
tags: [research, codebase, bands, rls, auth]
status: complete
last_updated: 2026-10-18
last_updated_by: unknown
---

# Research: Phase 1 own-band read boundary and rejected owner writes

**Date**: 2026-10-18T22:32:03+02:00
**Researcher**: unknown
**Git Commit**: 315c22a27f33beed40c2cb71597fb16432f4f100
**Branch**: test-implementation
**Repository**: kkarpinski-cmd/10xdev

## Research Question

For rollout Phase 1 in `context/foundation/test-plan.md` (risks #2 and #3): where does a signed-in user get another person's band, pool, round, or setlist, and where does a signed-in user become owner of a band they did not create or store a band or song the server must reject? What is the cheapest test that can fail if those rules regress, given the existing smoke check?

## Summary

On this commit, the band list and the band page are the shipped read surface. `listMyBands` selects `band_members` with no `user_id` predicate in application code (`src/lib/services/bands.ts:129-131`). The membership predicate in this migration is `user_id = auth.uid()` on `band_members` SELECT and an EXISTS membership check on `bands` SELECT (`supabase/migrations/20261007220000_create_bands.sql:29-44`). When `getMyBand` returns null, `/bands/[id]` sets HTTP 404 and renders the text "Not found" (`src/pages/bands/[id].astro:14-16`, `src/pages/bands/[id].astro:50-52`). That null also happens when the id param or the Supabase client is missing (`src/pages/bands/[id].astro:9-12`).

A search of `src/**/*.{ts,tsx,astro}` for `song`, `setlist`, `voting`, `vote`, and `pool` returned no matches. A search of `supabase/**/*.{sql,toml}` for `song`, `setlist`, `voting`, `vote`, and `force row level` returned no matches. A search of that same `src` glob for `round` matched CSS fragments such as `rounded-lg` and `stroke-linecap="round"` (`src/components/Welcome.astro:55`), not a voting-round read. A search of that same `supabase` glob for `round` returned no matches. Pool, voting-round, setlist, and song writes are outside those matches, so those clauses of risks #2 and #3 have nothing to regress in this phase.

`POST /api/bands` reads the form field `name` and does not read a role (`src/pages/api/bands.ts:6-8`). `create_band` inserts the caller as `owner` of a new band (`supabase/migrations/20261007220000_create_bands.sql:104-109`). Write policies on `bands` and `band_members` use a false check (`supabase/migrations/20261007220000_create_bands.sql:46-76`). A name whose trimmed length is outside 1–80 raises `Band name must be 1–80 characters` (`supabase/migrations/20261007220000_create_bands.sql:97-102`). The handler redirects that thrown message to `/dashboard?error=` (`src/pages/api/bands.ts:25-28`). The form also blocks submit on the same length rule (`src/components/bands/CreateBandForm.tsx:16-29`).

`scripts/smoke.mjs` uses one generated email and one cookie jar (`scripts/smoke.mjs:5-7`). Its steps do not sign up a second user, do not request another user's band id, and do not post a name outside 1–80 (`scripts/smoke.mjs:41-81`). The CI `smoke` job starts local Supabase and points the app at that API URL and anon key (`.github/workflows/ci.yml:39-47`). No Vitest, Jest, or Playwright config is in the repository. The Workers Vitest plugin is not required to observe these SQL policies: the smoke job's local Supabase is enough for two authenticated clients. This pass did not execute a request.

## Detailed Findings

### Risk #2 — another person's band

`/dashboard` and `/bands` are the protected prefixes. A request with no user redirects to `/auth/signin` (`src/middleware.ts:4`, `src/middleware.ts:18-21`). `/api/bands` is not one of those prefixes. The POST handler itself redirects a missing user to `/auth/signin` (`src/pages/api/bands.ts:15-19`).

The dashboard calls `listMyBands` when the server client exists (`src/pages/dashboard.astro:11-14`). The query is:

```129:131:src/lib/services/bands.ts
  const { data, error } = await databaseClient(supabase)
    .from("band_members")
    .select("role, bands(id, name, created_at)");
```

Rows whose `role` is neither `owner` nor `member`, and rows whose `created_at` does not parse, are skipped in the loop (`src/lib/services/bands.ts:140-147`). An empty array renders "You have no bands yet" (`src/pages/dashboard.astro:30-31`).

`getMyBand` selects `bands` by id, then `band_members` for that id. It returns null when the band row is absent, when the membership row is absent, when the role is not `owner` or `member`, or when `created_at` does not parse (`src/lib/services/bands.ts:89-117`). The page maps that null, and a missing id or client, to status 404 (`src/pages/bands/[id].astro:9-16`).

The SELECT policies in this migration are:

```29:44:supabase/migrations/20261007220000_create_bands.sql
create policy band_members_select_own
  on public.band_members
  for select
  using (user_id = auth.uid());

create policy bands_select_member
  on public.bands
  for select
  using (
    exists (
      select 1
      from public.band_members
      where band_members.band_id = bands.id
        and band_members.user_id = auth.uid()
    )
  );
```

A unit test that stubs `listMyBands` to return a fixed array would still pass if these policies were removed. The list query has no application `user_id` filter to assert.

The test-plan sentence that an outsider guessing an id must not see the band is grounded for bands. The clauses about pool, round, and setlist are not grounded in `src/` or `supabase/` on this commit. Phase 1 should not add those tables in order to test them.

### Risk #3 — owner of someone else's band, and a rejected write

The create form posts `name` to `/api/bands` (`src/components/bands/CreateBandForm.tsx:33`). `validate` uses `name.trim().length` and calls `preventDefault` when the length is outside 1–80 (`src/components/bands/CreateBandForm.tsx:16-29`). That check is in the browser handler. The SQL check is `btrim` plus `char_length` (`supabase/migrations/20261007220000_create_bands.sql:95-102`).

`create_band` is `security definer` with `search_path = public` (`supabase/migrations/20261007220000_create_bands.sql:78-82`). A null `auth.uid()` raises `Not authenticated` (`supabase/migrations/20261007220000_create_bands.sql:91-93`). The function then inserts the band and one `band_members` row with role `owner` for `caller_id` (`supabase/migrations/20261007220000_create_bands.sql:104-109`). It takes no existing band id and no role argument. This migration revokes execute from `public`, `anon`, and `service_role`, and grants execute to `authenticated` (`supabase/migrations/20261007220000_create_bands.sql:115-118`).

The false write policies are `bands_insert_denied`, `bands_update_denied`, `bands_delete_denied`, `band_members_insert_denied`, `band_members_update_denied`, and `band_members_delete_denied` (`supabase/migrations/20261007220000_create_bands.sql:46-76`). RLS is enabled on both tables (`supabase/migrations/20261007220000_create_bands.sql:26-27`). This 118-line migration contains no `FORCE ROW LEVEL SECURITY` and no table `GRANT` or `REVOKE`. A role that bypasses RLS is outside those false checks. The partial unique index `band_members_one_owner_per_band` allows one `owner` row per `band_id` (`supabase/migrations/20261007220000_create_bands.sql:22-24`). `band_members_role_check` allows the text values `owner` and `member` (`supabase/migrations/20261007220000_create_bands.sql:19`).

A search of `src/**/*.{ts,tsx,astro}` for `.insert(`, `.update(`, `.delete(`, and `service_role` returned no matches. The service write found in `src/lib/services/bands.ts` is `rpc("create_band", { band_name })` (`src/lib/services/bands.ts:75-78`), which throws `new Error(error.message)` when the client returns an error.

`createBand`'s thrown message, when it is a non-empty `Error` message, is the dashboard query string (`src/pages/api/bands.ts:25-28`). `ServerError` receives that query value as `serverError` (`src/pages/dashboard.astro:8`, `src/pages/dashboard.astro:55`). The fallback string, when the thrown value is not a non-empty `Error`, is `BAND_NAME_ERROR` (`src/lib/services/bands.ts:5`, `src/pages/api/bands.ts:26`). This pass did not send a bad name, so the PostgREST `error.message` bytes for the raise were not observed.

There is no song table, song function, or song policy in the inspected `supabase` migration, seed, or `src` search above. A test that a rejected song is not stored would be asserting a rule this commit does not implement.

The challenge "a hidden form is enough" holds. The form can block a click, and the SQL raise plus the false write policies are the checks a request can still hit. Asserting `preventDefault` would not fail if `create_band` stopped raising or if the false policies were dropped.

### Existing checks and the cheapest layer

`package.json` scripts on this commit are `dev`, `build`, `preview`, `astro`, `lint`, `lint:fix`, `format`, and `smoke`. No `vitest.config.*`, `jest.config.*`, or `playwright.config.*` was found. Application `*.test.*` / `*.spec.*` files were not found outside `.cursor/skills`, which this pass excluded. `scripts/check-dashboard-tokens.mjs` is not a `package.json` script and is not a step in `.github/workflows/ci.yml`.

The `ci` job builds with `SUPABASE_URL` and `SUPABASE_KEY` from GitHub secrets (`.github/workflows/ci.yml:22-25`) and does not start a database. The `smoke` job runs `supabase start` with a fixed exclusion list, writes `API_URL` and `ANON_KEY` into `.env` and `.dev.vars`, builds, runs `npm run preview -- --port 4321`, then `BASE_URL=http://localhost:4321 npm run smoke` (`.github/workflows/ci.yml:39-53`). Local auth config sets `enable_confirmations = false` (`supabase/config.toml:208-209`). The smoke file's header says it targets a live server (`scripts/smoke.mjs:1-2`). Its steps assert anonymous dashboard and anonymous create redirects, one signup, wrong-password and correct sign-in, two creates named "Night Shift" as that same session, a signed-in dashboard 200, and sign-out (`scripts/smoke.mjs:41-81`).

Cost × signal for these two risks:

- Band isolation and a direct owner write are SQL policies. Two authenticated clients against the local Supabase from the smoke job can create a band as user A and read or insert as user B. That does not require `@cloudflare/vitest-plugin`.
- The 404 text and the `/dashboard?error=` redirect are HTTP mappings in Astro. Observing them needs the preview process the smoke job already starts. They do not add a second rule on top of the SQL for the data itself.
- An in-memory fixture of `listMyBands` does not load the policies. Hosted Supabase is still out of budget (`context/foundation/test-plan.md` §1 and §7). Local Supabase is the project's migration, not a test of the vendor.

### Corrections the plan should use

- Prove user A does not receive user B's band from `listMyBands` / the `bands` select by id, and that a null `getMyBand` is what the page maps to 404. Do not prove pool, round, or setlist behavior in this phase.
- Prove an authenticated direct insert or update of `bands` or `band_members` does not store an owner row for a band the caller did not create through `create_band`. `POST /api/bands` cannot express a role. Prove a `create_band` name outside 1–80 after `btrim` is rejected and the POST handler redirects to `/dashboard?error=`. Do not prove song rejection in this phase.
- Keep the challenge that the browser `validate` function is not the server rule.
- Drop the in-memory-fixture reading of "internal fixture". The fixture is local Supabase state for two users.
- Do not treat "do not test Supabase" as "do not execute this migration". The oracle is the policy and the `raise exception` text in `supabase/migrations/20261007220000_create_bands.sql`, run on local Supabase.

## Code References

- `src/middleware.ts:4` — protected prefixes `/dashboard` and `/bands`
- `src/middleware.ts:18-21` — anonymous protected routes redirect to `/auth/signin`
- `src/lib/services/bands.ts:74-78` — `create_band` RPC; errors become `Error(error.message)`
- `src/lib/services/bands.ts:86-126` — `getMyBand` null cases
- `src/lib/services/bands.ts:128-155` — `listMyBands` select and row skips
- `src/pages/dashboard.astro:8-14` — error query param and `listMyBands`
- `src/pages/dashboard.astro:30-31` — empty list copy
- `src/pages/bands/[id].astro:9-16` — 404 when `band` is null
- `src/pages/bands/[id].astro:50-52` — "Not found"
- `src/pages/api/bands.ts:6-28` — name field, auth redirect, success redirect, error redirect
- `src/components/bands/CreateBandForm.tsx:16-33` — browser length check and POST target
- `supabase/migrations/20261007220000_create_bands.sql:19-27` — role check, one-owner index, RLS enabled
- `supabase/migrations/20261007220000_create_bands.sql:29-76` — select policies and false write policies
- `supabase/migrations/20261007220000_create_bands.sql:78-118` — `create_band` and execute grants
- `scripts/smoke.mjs:5-7` — one email, one cookie jar
- `scripts/smoke.mjs:41-81` — smoke steps
- `.github/workflows/ci.yml:22-25` — hosted secrets on the `ci` job
- `.github/workflows/ci.yml:39-53` — local Supabase and smoke
- `supabase/config.toml:208-209` — `enable_confirmations = false`

## Architecture Insights

The application query trusts the session's database role for who can see a band. `create_band` is the write path that is allowed to insert, because it is `security definer`. Other writes are policies that fail their check. A test of the React form, or a mock that returns bands, sits on the wrong side of that split.

The page 404 is a mapping of a null load, not a dedicated "forbidden" response. A missing Supabase client on the band page takes the same branch as a hidden row (`src/pages/bands/[id].astro:9-16`).

## Historical Context (from prior changes)

`context/archive/2026-10-04-owner-creates-band/plan.md:46` says `create_band` is `security definer`, trims the name, rejects an empty result and a name longer than 80 characters, inserts the band and an `owner` membership for `auth.uid()`, selects `bands` when the caller's membership exists, selects `band_members` with `user_id = auth.uid()`, and denies direct insert, update, and delete. Supported by `supabase/migrations/20261007220000_create_bands.sql:29-109`, with this exception: the migration enables RLS and does not contain `FORCE ROW LEVEL SECURITY` or a table grant, so the denial is the false policy for a role subject to RLS (`supabase/migrations/20261007220000_create_bands.sql:26-27`, `supabase/migrations/20261007220000_create_bands.sql:46-76`).

The same paragraph says the dashboard lists the caller's bands. Partial: the page calls `listMyBands` (`src/pages/dashboard.astro:11-14`), and that function's select has no `user_id` filter (`src/lib/services/bands.ts:129-131`). The caller filter in this migration is the SELECT policy (`supabase/migrations/20261007220000_create_bands.sql:29-32`).

`context/archive/2026-10-04-owner-creates-band/plan.md:77` says execute is granted to `authenticated` only, and quotes the raise text `Band name must be 1–80 characters`. Supported by the revoke of `public`, `anon`, and `service_role`, the grant to `authenticated`, and the raise (`supabase/migrations/20261007220000_create_bands.sql:97-118`). The archive's "only" is those statements in this migration; this pass did not query a live catalog for other execute grants.

`context/archive/2026-10-04-owner-creates-band/plan.md:70` says later slices add members, songs, and rounds. That matches the absence of those objects in the inspected `src` and `supabase` trees. It is a scope note, not a claim that the objects exist now.

## Related Research

`context/archive/2026-10-17-dashboard-design-contract/research.md` is the one `research.md` found under `context/`. Its topic is the dashboard token audit. It does not establish the membership or write rules above.

## Open Questions

- The PostgREST `error.message` for the name raise, and for a direct insert that hits a false policy, was not observed. The handler forwards a non-empty `Error` message (`src/pages/api/bands.ts:26-27`). A test can assert the row is absent and that the redirect query contains `Band name must be 1–80 characters` when that is the message the client surfaces. If the client wraps the raise, the assertion has to use the wrapped text.
- Table privileges for `authenticated` after `supabase start` are not declared in this migration. A direct insert may fail on privilege before RLS, or fail the policy. Either result stores no row. The assertion for risk #3 is that the owner row is absent, not a specific SQLSTATE, until a run records the error.
- A band id that is not a UUID was not requested. `getMyBand` throws when the band query returns `bandError` (`src/lib/services/bands.ts:95-97`), and the page does not catch that throw.
