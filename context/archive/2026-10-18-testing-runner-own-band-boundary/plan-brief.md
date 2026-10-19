# Own-band boundary tests — Plan Brief

> Full plan: `context/changes/testing-runner-own-band-boundary/plan.md`
> Research: `context/changes/testing-runner-own-band-boundary/research.md`

## What & Why

A signed-in user must not receive another user's band, and must not store an owner row on a band they did not create or a name the server rejects. The list query does not filter by user. The policies and `create_band` do. This change boots Vitest and locks those rules on local Supabase.

## Starting Point

Bands and membership exist. Smoke covers one user creating two bands. There is no Vitest config, no second user in `scripts/smoke.mjs`, and no song, pool, round, or setlist code in the inspected trees. The CI smoke job already starts local Supabase.

## Desired End State

`npm test` fails when user B can read user A's band, when B's direct write changes that outcome, or when an empty, whitespace-only, or 81-character name is stored. Names of 1 and 80 characters still create a band. `npm run test:http` fails unless a cookie GET of the other band is 404 and a cookie POST of a rejected name returns to `/dashboard?error=` with the server sentence. The test-plan cookbook tells the next change to copy that pattern.

## Key Decisions Made

| Decision | Choice | Why (1 sentence) | Source |
| --- | --- | --- | --- |
| Runner | Vitest via `getViteConfig()`, no Workers plugin | The failing rules are SQL policies, and the plugin runs the Workers runtime | Research |
| Fixture | Local Supabase, two users, anon key | An in-memory stub of `listMyBands` stays green if the policies are removed | Research |
| Read assertion | B has a band, and A's id is absent | An empty list is a different dashboard state | Plan |
| Write assertion | A's visible role stays `owner` and B still cannot read the band | Privilege and the false policy both refuse the row; the SQLSTATE was not observed | Research |
| Name oracle | Thrown message contains `Band name must be 1–80 characters`; `A` and 80 `b`s succeed; `""`, three spaces, and 81 `a`s fail | That sentence is the exception in the migration | Research |
| HTTP | Separate `npm run test:http` | Data tests need Supabase only; the 404 and the redirect need preview | Plan |
| CI | Not in this change | Test-plan phase 5 wires the gate | Research |
| Form and missing product | No React test, no song, pool, round, or setlist | The form is not the server rule, and those objects are not in the tree | Research |
| Cookbook | Phase 4 edits §6 only | §1–§5 stay frozen | Plan |

## Scope

**In scope:**

- `vitest.config.ts`, `npm test`, `npm run test:http`
- `test/own-band-read.test.ts`, `test/rejected-band-write.test.ts`, `test/band-http.test.ts`
- Test-plan §6.1, §6.2, §6.4, and a §6.6 note

**Out of scope:**

- CI YAML, the Workers Vitest plugin, hosted Supabase, a service-role client
- Songs, pools, rounds, setlists, the React form, visual snapshots, non-UUID ids
- Test-plan §1–§5

## Architecture / Approach

Data tests sign in with `@supabase/supabase-js` and call the existing service functions. HTTP tests use two cookie jars against preview, the same way smoke does, and stay out of `npm test`.

## Phases at a Glance

| Phase | What it delivers | Key risk |
| --- | --- | --- |
| 1. Runner and own-band read | Vitest and the two-user read proof | A stub would miss the policy |
| 2. Rejected owner write and rejected name | Direct write plus the 1/80 bounds | `create_band` alone cannot see a policy regression |
| 3. HTTP mapping | 404 and `/dashboard?error=` through cookies | Preview is a second process |
| 4. Cookbook | §6 names the files and commands | A later test invents a mock |

**Prerequisites:** local Supabase with this migration; anon `SUPABASE_URL` and `SUPABASE_KEY`. Phase 3 also needs preview on port 4321.
**Estimated effort:** about one session across 4 phases.

## Open Risks & Assumptions

- The PostgREST client text for the name raise was not executed. The test expects that text to contain `Band name must be 1–80 characters`. A wrapper that drops the sentence fails the test and the assertion has to follow the observed message.
- A direct insert may fail on privilege before RLS. The proof is that B cannot read A's band and A's visible role stays `owner`.
- `enable_confirmations = false` in local config is what lets a test sign up and sign in immediately.

## Success Criteria (Summary)

- `npm test` goes red if B receives A's band, if B's direct write changes that, or if a name outside 1–80 after trim is stored.
- `npm run test:http` goes red if the other user's band page is not 404 or the rejected POST does not return to `/dashboard?error=` with the raise sentence.
- `context/foundation/test-plan.md` §6 points at these files and commands.
