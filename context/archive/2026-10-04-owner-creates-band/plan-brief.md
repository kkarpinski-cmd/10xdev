# Owner creates band — Plan Brief

> Full plan: `context/changes/owner-creates-band/plan.md`

## What & Why

A signed-in user needs a band they own before anyone can add songs or vote. This slice lets them create that band and records them as its owner in the same step, which is the membership boundary later slices rely on.

## Starting Point

Email and password sign-in already works. `/dashboard` is a protected placeholder, and sign-in returns to `/`. The database has no domain tables. The server uses the Supabase anon key, so RLS has to allow the create.

## Desired End State

Anna creates "Night Shift" and sees that name with the role Owner. She also creates "Sunday Jam", and a second band named "Night Shift". The dashboard lists all three, earliest first, each with Owner, a creation time to the second, and the first 8 characters of the band id. Bob creates his own "Night Shift"; Anna does not see it.

## Key Decisions Made

| Decision | Choice | Why (1 sentence) |
| --- | --- | --- |
| Bands per user | Many: "Sunday Jam" after "Night Shift" both exist, and Anna owns each | A musician can own more than one lineup, so later slices need a list rather than a single band |
| Name uniqueness | Names may repeat, including a second "Night Shift" from the same person and Bob's separate "Night Shift" | The band id is the identity; public search is out of scope, and a taken-name error would reveal someone else's band |
| Telling same-name rows apart | Each list row shows `bands.created_at` to the second and the first 8 characters of the band id. Order is `created_at`, then `id` | Two "Night Shift" labels with no time would look like one band, and two creates in the same second still need a visible difference |
| Fields | Name only, trimmed, 1–80 characters | FR-002 adds no other band fields |
| Creator's role | Sole member with role `owner`, written in the same transaction as the band | The pool and votes are visible only to members, so the owner must already be a member |
| Where create lives | Form on `/dashboard`; sign-in still returns to `/` | The top bar already opens the dashboard, and smoke asserts the sign-in redirect |
| After a successful save | Redirect to `/bands/[id]`, showing the name and Owner | That page is the proof the new band has an owner |

## Scope

**In scope:**

- Tables `bands` and `band_members`, RLS, and `create_band`
- Dashboard list and create form
- Band page with the Owner role
- Smoke coverage for two creates that share a name

**Out of scope:**

- Invite join, song pool, setlist size, voting, and the rehearsal setlist
- Rename, delete, and leave
- Unique names, extra band fields, and a new sign-in redirect

## Architecture / Approach

`POST /api/bands` calls `create_band`, which inserts the band and the owner membership together. Table policies deny direct writes. The caller can select a band when their own membership row exists, and can select only their own membership rows. The dashboard lists the caller's bands and keeps the form. Dates use `Intl.DateTimeFormat` with seconds and no new dependency.

## Phases at a Glance

| Phase | What it delivers | Key risk |
| --- | --- | --- |
| 1. Schema and create_band | Tables, RLS, and the function that writes the owner with the band | A `security invoker` function would fail against the deny policies |
| 2. Create a band | Form, API, and `/bands/[id]` showing Owner | `/api/bands` sits outside the `/bands` auth prefix and must check the session itself |
| 3. Many bands on the dashboard | List plus smoke for a repeated name | The hosted database stays unchanged until a human applies the migration |

**Prerequisites:** Working email/password auth, local Supabase CLI for `npx supabase db reset`, an empty `supabase/seed.sql` so that reset can load the path in `config.toml`, and human approval before the migration runs on the hosted project.
**Estimated effort:** About 2–3 sessions across 3 phases.

## Open Risks & Assumptions

- Create on https://jam-set.k-karpinski.workers.dev/ fails until someone applies the migration to the hosted Supabase project. The worker rollback does not undo that migration; the change is additive, so the current app keeps working.
- Local smoke assumes the existing sign-in step still gets a session. That is what CI already requires for the auth smoke test.
- At most one owner per band is a schema invariant. This slice never inserts a second owner.
- `band_members` SELECT returns only the caller's row. A later slice that lists other members needs a security definer helper.

## Success Criteria (Summary)

- Anna owns both "Night Shift" and "Sunday Jam", and a second band also named "Night Shift".
- The dashboard shows those rows with Owner, a creation time to the second, and the first 8 characters of each band id, earliest first.
- Bob's "Night Shift" saves, and it stays invisible to Anna.
