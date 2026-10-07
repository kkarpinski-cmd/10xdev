# Owner creates band Implementation Plan

## Overview

A signed-in user can create as many bands as they want and becomes the owner of each one. Band names may repeat, including two bands owned by the same person. The dashboard lists that person's bands, and a successful create opens the new band's page.

## Current State Analysis

JamSet authenticates with email and password. The only protected page is `/dashboard`, a placeholder that shows the user's email. Sign-in success redirects to `/`, and the smoke test asserts that location. There are no domain tables, no `src/types.ts`, and no band UI. The Supabase client is server-only and uses the anon key, so every read and write has to pass RLS as the signed-in user.

### Key Discoveries:

- `PROTECTED_ROUTES` is `["/dashboard"]` and matches by path prefix (`src/middleware.ts:4`, `src/middleware.ts:18`). `/api/bands` does not fall under a `/bands` prefix, so the API must check the session itself.
- Sign-in redirects to `/` (`src/pages/api/auth/signin.ts:19`). Smoke expects that location (`scripts/smoke.mjs:51`).
- Auth forms POST to an API route and return errors on `?error=` (`src/pages/api/auth/signin.ts:15`). `FormField` requires an `icon` prop (`src/components/auth/FormField.tsx:18`).
- README still says the app uses only `auth.users` (`README.md:115`).
- A human approves every migration on the hosted Supabase project (`context/foundation/infrastructure.md`). Local `supabase start` in CI applies files from `supabase/migrations/` on its own (`.github/workflows/ci.yml`).

## Desired End State

Anna signs in, opens Dashboard, and creates "Night Shift". She lands on that band's page, which shows the name and the role Owner. She creates "Sunday Jam" and is owner of that band too. She creates a second band also named "Night Shift"; the save succeeds. The dashboard lists all three, earliest first, each with Owner, a creation time that includes seconds, and the first 8 characters of the band id. Bob creates his own "Night Shift"; the save succeeds, and Anna's dashboard does not show Bob's band.

### Key Discoveries:

- Membership is created with the band. Later slices show the pool and votes only to members (roadmap S-01 risk; PRD privacy guardrail).
- The band's identity is its id. The name is a label. Public band search is a non-goal (PRD).
- Two rows that share a name are distinguishable on the list by `bands.created_at` to the second plus the first 8 characters of `bands.id`. Equal timestamps order by `id`.

## What We're NOT Doing

- Joining by invite link (S-02), adding songs (S-03), or setting the setlist size (S-04).
- Voting rounds, in-app notifications, and the rehearsal setlist.
- Renaming, deleting, or leaving a band.
- Listing anyone else's membership row. `band_members` SELECT returns only the caller's own row until a later slice adds a helper.
- A uniqueness rule on the name, global or per user.
- Changing the sign-in success redirect away from `/`.
- Extra band fields (description, genre, image).
- A service-role Supabase client.
- A new date-formatting dependency.
- A public directory of bands.
- A limit of one band per user.

## Implementation Approach

`create_band(band_name text)` is a `security definer` Postgres function. It trims the name, rejects an empty result and any name longer than 80 characters, inserts `bands`, and inserts a `band_members` row with role `owner` for `auth.uid()` in the same transaction. `bands` SELECT is allowed when the caller's own `band_members` row exists for that band. `band_members` SELECT is `user_id = auth.uid()` only, so the policy does not subquery itself. Direct `insert`, `update`, and `delete` on both tables are denied, so a client cannot create an ownerless band or attach itself as owner of someone else's band.

The dashboard keeps the create form and lists the caller's bands. The API is `POST /api/bands`. Success redirects to `/bands/[id]`. Dates are formatted with `Intl.DateTimeFormat` including seconds, and each list row also shows the first 8 characters of the band id, so two "Night Shift" rows created in the same second stay distinct. No new npm dependency.

## Critical Implementation Details

- The function runs as its owner and bypasses RLS. It has to set `search_path = public` and refuse a null `auth.uid()` before writing. Recreating it later as `security invoker` would make the denied table policies reject the insert.
- `band_members` SELECT is `user_id = auth.uid()` only. An EXISTS against `band_members` from that same policy recurses. `bands` SELECT is the EXISTS, and it can see the caller's own membership row. Checks against these policies use the anon key and a user JWT. The postgres role bypasses RLS, so it is not a witness.
- Grant `execute` on `create_band(text)` to `authenticated` only.
- `PROTECTED_ROUTES` prefix `/bands` covers `/bands` and `/bands/[id]`. It does not cover `/api/bands`.
- Persist `btrim(name)` and measure length with `char_length`, so a Polish name counts characters.
- Keep the existing smoke assertion that sign-in returns `/`.

## Phase 1: Schema and create_band

### Overview

Add the band and membership tables, the one-owner-per-band invariant, and `create_band`. After this phase the database can record an owner, and the app still has no band screen.

### Changes Required:

#### 1. Migration

**File**: `supabase/migrations/<YYYYMMDDHHmmss>_create_bands.sql`

**Intent**: Store each band and the membership that makes its creator the owner. Later slices add members, songs, and rounds against these ids.

**Contract**:

- `public.bands`: `id uuid` primary key default `gen_random_uuid()`, `name text not null`, `created_at timestamptz not null` default `now()`. Check that `name = btrim(name)` and `char_length(name)` is between 1 and 80.
- `public.band_members`: `band_id` references `bands.id`, `user_id` references `auth.users.id`, `role text not null` limited to `owner` and `member`, `created_at timestamptz not null` default `now()`. Primary key `(band_id, user_id)`. Partial unique index on `band_id` where `role = 'owner'`, so a band has at most one owner. A user may own many bands; there is no unique constraint on `user_id` or on `name`.
- RLS enabled on both tables. `band_members` SELECT uses `user_id = auth.uid()` and does not subquery `band_members`. `bands` SELECT uses EXISTS on `band_members` for `auth.uid()` and that `band_id`. `insert`, `update`, and `delete` policies use a false check on both tables. Checks 1.2–1.5 run with the anon key and a user JWT.
- `public.create_band(band_name text) returns uuid`, `security definer`, `search_path = public`. It requires `auth.uid()`, trims `band_name`, raises `Band name must be 1–80 characters` when the trimmed length is outside 1–80, inserts the band and the caller as `owner`, and returns the new band id. `execute` granted to `authenticated` only.

#### 2. Starter docs

**File**: `README.md`

**Intent**: The auth-only sentence would send the next change looking for tables that this migration creates.

**Contract**: Replace the sentence at `README.md:115` so it states that domain tables and RLS live in `supabase/migrations/` and that sign-in still uses `auth.users`.

#### 3. Seed path

**File**: `supabase/seed.sql`

**Intent**: `config.toml` already runs `./seed.sql` after migrations on `db reset`. The file was missing, so criterion 1.1 can fail after a valid `*_create_bands.sql`.

**Contract**: The file exists and contains no statements. A SQL comment is enough. It inserts no bands and no users.

### Success Criteria:

#### Automated Verification:

- `npx supabase db reset` exits 0 and applies `*_create_bands.sql`

#### Manual Verification:

- An authenticated direct insert into `bands` or `band_members` is rejected
- `create_band('Night Shift')` inserts one `bands` row and one `band_members` row with role `owner` for the caller
- A second user selecting that band gets zero rows
- The creating user, authenticated with their JWT, selects that band and their `band_members` row with role `owner`

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation from the human that the manual testing was successful before proceeding to the next phase.

---

## Phase 2: Create a band

### Overview

A signed-in user submits a name and lands on a page that shows that band and the role Owner. Invalid names create nothing.

### Changes Required:

#### 1. Types and server helpers

**File**: `src/types.ts`

**Intent**: Give the API, the dashboard, and the band page one shape for a band and a role.

**Contract**: Export `BandRole` as `"owner" | "member"` and a band shape with `id`, `name`, and `createdAt` (`bands.created_at` as an ISO string).

**File**: `src/lib/services/bands.ts`

**Intent**: Keep the RPC and the member-scoped read next to each other so pages do not embed query details.

**Contract**: `createBand` calls `rpc("create_band", { band_name })` and returns the uuid. `getMyBand` returns the caller's band plus their `role`, or null when the row is hidden. Both take the server Supabase client from `createClient`.

#### 2. Create endpoint

**File**: `src/pages/api/bands.ts`

**Intent**: Accept the form the way sign-in does, and run the write as the signed-in user.

**Contract**: Export `POST`. Read form field `name`. Missing Supabase config redirects to `/dashboard?error=Supabase is not configured`. A missing session redirects to `/auth/signin`. `createBand` success redirects to `/bands/<id>`. A validation or database error redirects to `/dashboard?error=` with the function message `Band name must be 1–80 characters` for a bad name.

#### 3. Dashboard form

**File**: `src/components/bands/CreateBandForm.tsx`

**Intent**: Validate before submit so a blank name never reaches the server, matching the auth islands.

**Contract**: `method="POST"` `action="/api/bands"`, `client:load` from the dashboard. Reuse `FormField` (with an icon), `ServerError`, and `SubmitButton`. Client validation trims `name` and blocks submit when the length is outside 1–80, with the same message as the function. English label `Band name`.

**File**: `src/pages/dashboard.astro`

**Intent**: Replace the placeholder card with the create form on the page the top bar already links to.

**Contract**: Keep the page protected. Pass `Astro.url.searchParams.get("error")` into the form. Heading and submit button in English (`Create a band`). Cosmic glass layout already used on this page.

#### 4. Band page

**File**: `src/pages/bands/[id].astro`

**Intent**: Show the creator that this band exists and that they are its owner.

**Contract**: `getMyBand` for the route id. Null result is HTTP 404 and the response body does not include the band name. A visible page shows the band name, the word `Owner` when `role` is `owner`, the creation time formatted with `Intl.DateTimeFormat` including seconds, and a link back to `/dashboard`.

**File**: `src/middleware.ts`

**Intent**: Keep anonymous visitors off the band page.

**Contract**: `PROTECTED_ROUTES` includes `"/dashboard"` and `"/bands"`.

### Success Criteria:

#### Automated Verification:

- `npm run lint` exits 0
- `npx astro check` exits 0
- `npm run build` exits 0 with `SUPABASE_URL` and `SUPABASE_KEY` set

#### Manual Verification:

- A signed-in user submits Night Shift and lands on a page showing that name and Owner
- Submitting a blank name, a whitespace-only name, or an 81-character name creates no band and shows an error on the dashboard
- Signed-out GET `/bands/<id>` and POST `/api/bands` redirect to `/auth/signin`

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation from the human that the manual testing was successful before proceeding to the next phase.

---

## Phase 3: Many bands on the dashboard

### Overview

The dashboard shows every band the caller belongs to. A second create, including another "Night Shift" from the same person, adds a separate row. Smoke covers the two creates.

### Changes Required:

#### 1. List query and dashboard

**File**: `src/lib/services/bands.ts`

**Intent**: Load the caller's bands in one member-scoped read.

**Contract**: `listMyBands` returns `{ id, name, createdAt, role }[]` ordered by `bands.created_at` ascending, then `bands.id` ascending. `createdAt` is the band's timestamp, not the membership timestamp.

**File**: `src/pages/dashboard.astro`

**Intent**: Let Anna see Night Shift, Sunday Jam, and a second Night Shift as three rows, and still create another band.

**Contract**: Render `listMyBands` above the form. Each row shows the name, `Owner` when `role` is `owner`, the creation time via `Intl.DateTimeFormat` with second precision, and the first 8 characters of the band id. The row links to `/bands/<id>`. When the list is empty, the page shows the create form and the sentence `You have no bands yet`.

#### 2. Smoke coverage

**File**: `scripts/smoke.mjs`

**Intent**: Lock the create path and the repeated name into the only automated app test.

**Contract**: Keep every existing step, including sign-in redirecting to `/`. With an empty cookie jar, `POST /api/bands` with a name redirects to `/auth/signin`. After the successful sign-in step, `POST /api/bands` with name `Night Shift` returns 302 to a `/bands/<id>` location, and GET of that location returns 200. A second POST with the same name returns 302 to a different `/bands/<id>` location, and GET of that location returns 200.

### Success Criteria:

#### Automated Verification:

- `BASE_URL=http://localhost:4321 npm run smoke` passes, including two Night Shift creates that redirect to different `/bands/<id>` URLs

#### Manual Verification:

- The dashboard lists both Night Shift bands, earlier creation time first, id breaking a tie, each with Owner, a creation time that includes seconds, and the first 8 characters of the band id
- Bob's Night Shift does not appear on Anna's dashboard

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation from the human that the manual testing was successful before proceeding to the next phase.

---

## Testing Strategy

### Unit Tests:

- No new test runner. Name rules are enforced in `create_band` and covered by the manual invalid-name check.

### Integration Tests:

- Extend `scripts/smoke.mjs` as specified in Phase 3. Run it against `npm run preview` with local Supabase so the migration is applied. Existing auth steps stay in place.

### Manual Testing Steps:

1. Apply the migration locally with `npx supabase db reset`.
2. Sign in, create "Night Shift", and confirm the band page shows that name and Owner.
3. Submit a blank name, a whitespace-only name, and an 81-character name. Confirm no extra band appears.
4. Create "Sunday Jam", then a second "Night Shift". Confirm the dashboard shows three rows, each Night Shift row shows a time to the second and the first 8 characters of its id, and the earlier band is first.
5. From a second account, create "Night Shift". Confirm it is absent from the first account's dashboard and that opening the first account's band id in the second session returns 404.

## Performance Considerations

The dashboard loads one membership query per request. A hobby band owns a handful of bands, so this stays a single indexed read. Aggregate work for later slices stays in Postgres.

## Migration Notes

The migration only adds tables, an index, policies, and a function. `supabase/seed.sql` stays empty of statements so `npx supabase db reset` can load the path named in `config.toml`. The current worker never reads them, so a worker rollback leaves a compatible database. Local CI applies the file on `supabase start`. The hosted Supabase project used by https://jam-set.k-karpinski.workers.dev/ does not. A human applies this migration there before create works on that URL. Until then, the production form returns the database error on `/dashboard?error=`.

## References

- PRD FR-002 and the privacy guardrail: `context/foundation/prd.md`
- Slice S-01: `context/foundation/roadmap.md`
- Protected routes: `src/middleware.ts:4`
- Sign-in redirect and error pattern: `src/pages/api/auth/signin.ts:15`
- Smoke sign-in assertion: `scripts/smoke.mjs:51`
- Auth form island: `src/components/auth/SignInForm.tsx`
- Migration approval: `context/foundation/infrastructure.md`

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles. See `references/progress-format.md`.

### Phase 1: Schema and create_band

#### Automated

- [ ] 1.1 `npx supabase db reset` exits 0 and applies `*_create_bands.sql`

#### Manual

- [ ] 1.2 An authenticated direct insert into `bands` or `band_members` is rejected
- [ ] 1.3 `create_band('Night Shift')` inserts one `bands` row and one `band_members` row with role `owner` for the caller
- [ ] 1.4 A second user selecting that band gets zero rows
- [ ] 1.5 The creating user, authenticated with their JWT, selects that band and their `band_members` row with role `owner`

### Phase 2: Create a band

#### Automated

- [ ] 2.1 `npm run lint` exits 0
- [ ] 2.2 `npx astro check` exits 0
- [ ] 2.3 `npm run build` exits 0 with `SUPABASE_URL` and `SUPABASE_KEY` set

#### Manual

- [ ] 2.4 A signed-in user submits Night Shift and lands on a page showing that name and Owner
- [ ] 2.5 Submitting a blank name, a whitespace-only name, or an 81-character name creates no band and shows an error on the dashboard
- [ ] 2.6 Signed-out GET `/bands/<id>` and POST `/api/bands` redirect to `/auth/signin`

### Phase 3: Many bands on the dashboard

#### Automated

- [ ] 3.1 `BASE_URL=http://localhost:4321 npm run smoke` passes, including two Night Shift creates that redirect to different `/bands/<id>` URLs

#### Manual

- [ ] 3.2 The dashboard lists both Night Shift bands, earlier creation time first, id breaking a tie, each with Owner, a creation time that includes seconds, and the first 8 characters of the band id
- [ ] 3.3 Bob's Night Shift does not appear on Anna's dashboard
