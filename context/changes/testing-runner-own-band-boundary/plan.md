# Own-band boundary tests Implementation Plan

## Overview

Boot Vitest and prove, on local Supabase, that one signed-in user does not receive another user's band and cannot store an owner row or a band name the server rejects. The last phase records that pattern in the test-plan cookbook.

## Current State Analysis

JamSet has email/password auth, band create, and a dashboard list. `listMyBands` selects `band_members` with no `user_id` filter in application code (`src/lib/services/bands.ts:129-131`). Membership is the RLS predicate `user_id = auth.uid()` (`supabase/migrations/20261007220000_create_bands.sql:29-32`). `getMyBand` returns null when that select returns no row, and `/bands/[id]` maps null to HTTP 404 (`src/pages/bands/[id].astro:14-16`).

`POST /api/bands` reads only `name` (`src/pages/api/bands.ts:6-8`). `create_band` inserts the caller as `owner` (`supabase/migrations/20261007220000_create_bands.sql:104-109`). Direct writes are false RLS policies (`supabase/migrations/20261007220000_create_bands.sql:46-76`). A trimmed name outside 1–80 characters raises `Band name must be 1–80 characters` (`supabase/migrations/20261007220000_create_bands.sql:97-102`). The handler redirects that thrown message to `/dashboard?error=` (`src/pages/api/bands.ts:25-28`). The React form blocks submit on the same length (`src/components/bands/CreateBandForm.tsx:16-29`).

There is no Vitest config. `scripts/smoke.mjs` uses one email and one cookie jar (`scripts/smoke.mjs:5-7`) and does not open another user's band or post a rejected name. The CI `smoke` job starts local Supabase (`.github/workflows/ci.yml:39-47`). Local auth has `enable_confirmations = false` (`supabase/config.toml:208-209`). Pool, voting-round, setlist, and song writes are absent from the inspected `src` and `supabase` trees (`context/changes/testing-runner-own-band-boundary/research.md`).

## Desired End State

`npm test` fails if user B receives user A's band id, if B's direct insert or update leaves B able to read that band or changes A's visible role, or if an empty, whitespace-only, or 81-character name is stored. It passes for a 1-character name and an 80-character name. `npm run test:http`, against a preview pointed at the same local stack, fails unless B's GET of A's band id is 404 and B's POST of an 81-character name redirects to `/dashboard?error=` with the raise sentence. `context/foundation/test-plan.md` §6 names these patterns.

### Key Discoveries:

- A stub of `listMyBands` still passes if the SELECT policies are removed (`research.md` Risk #2).
- The browser `validate` function is not the server rule (`src/components/bands/CreateBandForm.tsx:16-29`).
- `create_band` is `security definer`, so a test that only calls it cannot see a regression of the false write policies (`supabase/migrations/20261007220000_create_bands.sql:78-82`).
- The Workers Vitest plugin is not required. The smoke job's local Supabase is the process these tests use (`research.md` Summary).

## What We're NOT Doing

- A CI job for Vitest. Test-plan phase 5 wires that gate.
- Song, pool, voting-round, or setlist tests. Those objects are not in the inspected trees.
- A test of the React form, `preventDefault`, or a visual snapshot.
- `@cloudflare/vitest-plugin`.
- Hosted Supabase, a service-role client, or a non-UUID band id.
- Edits to test-plan §1–§5. §3 status stays with `/10x-test-plan`.
- A `member` role. The product path that creates one is a later slice.
- Rewriting `listMyBands` or `createClient` so they accept a mock.

## Implementation Approach

Vitest is configured with Astro `getViteConfig()`. Data tests sign up two users with `@supabase/supabase-js` against `SUPABASE_URL` and `SUPABASE_KEY` (the anon key) and call `listMyBands`, `getMyBand`, and `createBand`. `npm test` does not start Supabase and does not run the HTTP file. `npm run test:http` performs the cookie requests, in the shape of `scripts/smoke.mjs`, against `BASE_URL`. The oracle for a refused write is visible state: B cannot read A's band, and A's visible role stays `owner`. The oracle for a refused name is a thrown message that contains `Band name must be 1–80 characters`, plus no new id.

## Critical Implementation Details

- Use the authenticated user JWT. A service-role client bypasses the policies this suite exists to catch, and `create_band` is revoked from `service_role`.
- `npm test` excludes `test/band-http.test.ts`. `npm run test:http` runs that file with the exclude overridden. A plain `vitest run test/band-http.test.ts` still honors the config exclude unless the script overrides it.
- Create A's band before B reads it. Give B a band of their own before asserting absence, so an empty list cannot satisfy the read test. Assert on band id.
- The name cases must call `createBand` or `create_band`, not the React `validate` function.

## Phase 1: Runner and own-band read

### Overview

Add the runner and the read proof. User B's list and id lookup do not contain user A's band.

### Changes Required:

#### 1. Runner

**File**: `package.json`, `vitest.config.ts`

**Intent**: `npm test` runs the data tests with the project's Astro Vite settings, so `@/` imports resolve. The HTTP file stays out of this script.

**Contract**: `vitest` is a devDependency. `npm test` is Vitest in run mode. `vitest.config.ts` uses `getViteConfig` from `astro/config`. Its `test.include` is `test/**/*.test.ts` and its `test.exclude` includes `test/band-http.test.ts`. No Workers plugin.

```ts
import { getViteConfig } from "astro/config";

export default getViteConfig({
  test: {
    include: ["test/**/*.test.ts"],
    exclude: ["test/band-http.test.ts"],
  },
});
```

#### 2. Read test

**File**: `test/own-band-read.test.ts`

**Intent**: Prove the SELECT policies with two real sessions. A removed policy or a client that bypasses RLS fails this file.

**Contract**:

- Behavior asserted: after both users have a band, B's `listMyBands` and B's `getMyBand(A's id)` do not return A's id. A's `getMyBand` still returns A's id.
- Regression caught: `band_members_select_own` or `bands_select_member` no longer limits the session.
- Research source: `research.md` Risk #2 and Code References for `src/lib/services/bands.ts:128-131` and `supabase/migrations/20261007220000_create_bands.sql:29-44`.
- Edge: B's list is non-empty. Absence is by id, not by an empty array.
- Anti-pattern avoided: a stub of `listMyBands`, and a single-user happy path like `scripts/smoke.mjs`.

Each run uses fresh emails. Sign-up then sign-in uses the local anon key. Pass the signed-in client into the existing service functions. Do not change those functions to take a mock. If the `ServerSupabase` type blocks the call, cast at the test call site the way `databaseClient` already casts.

### Success Criteria:

#### Automated Verification:

- `npm test` exits 0 against local Supabase and fails if user B's list or id lookup returns user A's band id
- `npm run lint` exits 0

#### Manual Verification:

- Local Supabase is running with this migration, and `SUPABASE_URL` / `SUPABASE_KEY` are that stack's API URL and anon key, before `npm test`

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation from the human that the manual testing was successful before proceeding to the next phase.

---

## Phase 2: Rejected owner write and rejected name

### Overview

Prove a direct owner write does not stick, and prove the server name bounds, including the edges on each side of 1 and 80.

### Changes Required:

#### 1. Write and name test

**File**: `test/rejected-band-write.test.ts`

**Intent**: Hit the false write policies with B's session, and hit `create_band`'s length check without the browser form.

**Contract**:

- Behavior asserted: B inserts `band_members` with B's own user id, A's band id, and role `owner`, then updates that band's membership toward `owner`. Afterwards A's visible role is still `owner` and B's `getMyBand(A's id)` is null. `createBand("")`, `createBand("   ")` (three spaces), and `createBand` of 81 `a` characters throw an `Error` whose message contains `Band name must be 1–80 characters` and add no band id. `createBand("A")` and `createBand` of 80 `b` characters return ids that the caller can read.
- Regression caught: a false write policy becomes permissive, or `create_band` stops raising for a trimmed length outside 1–80.
- Research source: `research.md` Risk #3, `supabase/migrations/20261007220000_create_bands.sql:46-76` and `:97-102`, `src/lib/services/bands.ts:74-78`.
- Edge: three spaces trim to empty. Length 1 and length 80 are accepted. Length 81 is rejected. The insert uses B's real user id so a foreign-key miss is not the proof.
- Anti-pattern avoided: asserting `preventDefault`, asserting a SQLSTATE, and calling only `create_band` for the owner-write case.

The visible-state check is the oracle if the insert fails on privilege before the policy. Do not require a specific Postgres error code.

### Success Criteria:

#### Automated Verification:

- `npm test` exits 0 and fails if B's insert or update lets B read A's band or changes A's visible role away from owner
- `npm test` exits 0 and fails unless empty, three-space, and 81-`a` names throw a message containing `Band name must be 1–80 characters`, while `A` and an 80-`b` name return ids
- `npm run lint` exits 0

#### Manual Verification:

- Re-run `npm test` with the same local Supabase as Phase 1 and confirm both new cases ran, not only the Phase 1 file

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation from the human that the manual testing was successful before proceeding to the next phase.

---

## Phase 3: HTTP mapping

### Overview

Prove the page and the POST handler, with cookies, against preview. This is the mapping from a null load to 404 and from the raised name to `/dashboard?error=`.

### Changes Required:

#### 1. HTTP script and test

**File**: `package.json`, `test/band-http.test.ts`

**Intent**: `npm run test:http` sends the same kind of cookie requests as `scripts/smoke.mjs` to `BASE_URL`. It does not replace the data suite and it does not drive the React form.

**Contract**:

- Behavior asserted: user A creates a band through `POST /api/bands`. User B's `GET /bands/{that id}` is status 404. User B's `POST /api/bands` with 81 `a` characters is status 302 and the `location` header path is `/dashboard` with an `error` query value that contains `Band name must be 1–80 characters`.
- Regression caught: the band page renders another user's band, or the POST handler stores a rejected name and redirects to `/bands/{id}`.
- Research source: `research.md` corrections, `src/pages/bands/[id].astro:14-16`, `src/pages/api/bands.ts:22-28`.
- Edge: two cookie jars. Anonymous coverage stays in `scripts/smoke.mjs` and is not duplicated here.
- Anti-pattern avoided: a browser snapshot, and folding these requests into `scripts/smoke.mjs`.

`npm run test:http` runs Vitest on `test/band-http.test.ts` only, with the Phase 1 exclude overridden. `BASE_URL` defaults to `http://localhost:4321` when unset. The preview process must already be running on the same local Supabase.

### Success Criteria:

#### Automated Verification:

- `npm run test:http` exits 0 against preview and fails unless B's GET of A's band id is 404 and B's POST of an 81-`a` name redirects to `/dashboard?error=` containing `Band name must be 1–80 characters`
- `npm test` still exits 0 and does not require preview

#### Manual Verification:

- Start preview on the local stack, then run `npm run test:http`, and confirm the data suite was not the process that served those HTTP requests

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation from the human that the manual testing was successful before proceeding to the next phase.

---

## Phase 4: Cookbook

### Overview

Record how to add the next test of this kind. Leave the frozen strategy sections alone.

### Changes Required:

#### 1. Cookbook sections

**File**: `context/foundation/test-plan.md`

**Intent**: Replace the Phase 1 placeholders in §6 with the patterns this change shipped, so the next test does not invent a mock or a hosted project.

**Contract**:

- §6.1 names `test/rejected-band-write.test.ts` for the name-length rule, the command `npm test`, and the oracle `Band name must be 1–80 characters`.
- §6.2 names `test/own-band-read.test.ts`, states that the session is a real local Supabase user, and states that `listMyBands` is not mocked.
- §6.4 names `test/band-http.test.ts` and `npm run test:http` for a write-boundary refusal observed through `POST /api/bands`.
- §6.6 gains a short note that Phase 1 of this rollout needed local Supabase for the policies and a separate preview command for the HTTP mapping.
- §6.3 stays the existing "not in this rollout" line. §1–§5 are not edited.

### Success Criteria:

#### Automated Verification:

- `context/foundation/test-plan.md` §6.1, §6.2, §6.4, and §6.6 name `test/own-band-read.test.ts`, `test/rejected-band-write.test.ts`, `test/band-http.test.ts`, `npm test`, and `npm run test:http`

#### Manual Verification:

- Read §6 and confirm it matches the files and scripts from Phases 1–3, and that §1–§5 are unchanged

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation from the human that the manual testing was successful before proceeding to the next phase.

---

## Testing Strategy

### Unit Tests:

- The name bounds are asserted through `createBand` on a real session. There is no unit test that imports `CreateBandForm`.

### Integration Tests:

- Two users against local Supabase for the read and the direct write.
- Cookie HTTP against preview for the 404 and the error redirect.

### Manual Testing Steps:

1. `supabase start`, then point `SUPABASE_URL` and `SUPABASE_KEY` at that stack's API URL and anon key.
2. `npm test`.
3. `npm run preview`, then `npm run test:http`.

## Performance Considerations

The suite is a handful of auth and table calls against local Supabase. No load target.

## Migration Notes

No schema change. Tests create their own users and bands on each run. They do not edit `supabase/migrations/`.

## References

- Related research: `context/changes/testing-runner-own-band-boundary/research.md`
- Test plan: `context/foundation/test-plan.md` §2 risks #2 and #3, §3 Phase 1, §6
- Policies and `create_band`: `supabase/migrations/20261007220000_create_bands.sql:29-118`
- HTTP pattern to follow: `scripts/smoke.mjs:41-81`
- Local Supabase in CI: `.github/workflows/ci.yml:39-47`

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles. See `references/progress-format.md`.

### Phase 1: Runner and own-band read

#### Automated

- [x] 1.1 `npm test` exits 0 against local Supabase and fails if user B's list or id lookup returns user A's band id — a9955f2
- [x] 1.2 `npm run lint` exits 0 — a9955f2

#### Manual

- [x] 1.3 Local Supabase is running with this migration, and `SUPABASE_URL` / `SUPABASE_KEY` are that stack's API URL and anon key, before `npm test` — a9955f2

### Phase 2: Rejected owner write and rejected name

#### Automated

- [x] 2.1 `npm test` exits 0 and fails if B's insert or update lets B read A's band or changes A's visible role away from owner
- [x] 2.2 `npm test` exits 0 and fails unless empty, three-space, and 81-`a` names throw a message containing `Band name must be 1–80 characters`, while `A` and an 80-`b` name return ids
- [x] 2.3 `npm run lint` exits 0

#### Manual

- [x] 2.4 Re-run `npm test` with the same local Supabase as Phase 1 and confirm both new cases ran, not only the Phase 1 file

### Phase 3: HTTP mapping

#### Automated

- [ ] 3.1 `npm run test:http` exits 0 against preview and fails unless B's GET of A's band id is 404 and B's POST of an 81-`a` name redirects to `/dashboard?error=` containing `Band name must be 1–80 characters`
- [ ] 3.2 `npm test` still exits 0 and does not require preview

#### Manual

- [ ] 3.3 Start preview on the local stack, then run `npm run test:http`, and confirm the data suite was not the process that served those HTTP requests

### Phase 4: Cookbook

#### Automated

- [ ] 4.1 `context/foundation/test-plan.md` §6.1, §6.2, §6.4, and §6.6 name `test/own-band-read.test.ts`, `test/rejected-band-write.test.ts`, `test/band-http.test.ts`, `npm test`, and `npm run test:http`

#### Manual

- [ ] 4.2 Read §6 and confirm it matches the files and scripts from Phases 1–3, and that §1–§5 are unchanged
