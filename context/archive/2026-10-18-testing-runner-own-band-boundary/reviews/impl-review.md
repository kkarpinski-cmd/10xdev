<!-- IMPL-REVIEW-REPORT -->
# Implementation Review: Own-band boundary tests

- **Plan**: context/changes/testing-runner-own-band-boundary/plan.md
- **Scope**: Full plan
- **Reviewed phases**: 1, 2, 3, 4, 5
- **Date**: 2026-10-19
- **Verdict**: APPROVED (warnings F1–F3 fixed in triage)
- **Findings**: 0 critical, 0 open warnings, 4 observations

## Verdicts

| Dimension | Verdict |
|-----------|---------|
| Plan Adherence | PASS |
| Scope Discipline | PASS |
| Safety & Quality | WARNING |
| Architecture | PASS |
| Pattern Consistency | WARNING |
| Success Criteria | PASS |

## Findings

### F1 — Teardown helper lacks local Supabase guard

- **Severity**: ⚠️ WARNING
- **Impact**: 🔬 HIGH — architectural stakes; think carefully before deciding
- **Dimension**: Safety & Quality
- **Location**: test/helpers/remove-created-rows.ts:73-80
- **Detail**: `serviceRoleClient()` uses `SUPABASE_URL` without checking localhost. `test/band-http.test.ts` blocks hosted URLs before admin listing; data tests call the helper directly. A mis-set `.env` could run destructive deletes against a non-local project. Plan anti-pattern: “pointing teardown at a hosted project.”
- **Fix A ⭐ Recommended**: Add the same hostname guard as `localSupabaseUrl()` in `band-http.test.ts` inside `remove-created-rows.ts` (or a shared `test/helpers/local-supabase-url.ts`) before creating the service-role client.
  - Strength: One choke point protects all data and HTTP teardown paths.
  - Tradeoff: Tests fail fast if someone intentionally points at hosted Supabase.
  - Confidence: HIGH — mirror of existing HTTP test guard.
  - Blind spot: None significant.
- **Fix B**: Guard only in each test file’s `afterEach` before calling the helper.
  - Strength: Keeps helper generic.
  - Tradeoff: Easy to forget on the next test file.
  - Confidence: MEDIUM — duplication risk.
  - Blind spot: Future tests may skip the guard.
- **Decision**: FIXED via Fix A (`test/helpers/local-supabase-url.ts`)

### F2 — Service-role env not documented in onboarding files

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Pattern Consistency
- **Location**: .env.example:1-2, AGENTS.md:7
- **Detail**: Data and HTTP teardown require `SUPABASE_SERVICE_ROLE_KEY`. Cookbook §6 and README mention it; `.env.example` and AGENTS.md still list only `SUPABASE_URL` / `SUPABASE_KEY`.
- **Fix**: Add `SUPABASE_SERVICE_ROLE_KEY` to `.env.example` (placeholder) and one line in AGENTS.md that it is for local test teardown only, not for app runtime.
- **Decision**: FIXED

### F3 — test-plan §4 still describes “no Vitest”

- **Severity**: ⚠️ WARNING
- **Impact**: 🔎 MEDIUM — real tradeoff; pause to reason through it
- **Dimension**: Scope Discipline
- **Location**: context/foundation/test-plan.md:93
- **Detail**: §4 Stack says no Vitest config while §6 documents `npm test`. Phase 4 contract forbade editing §1–§5, so §4 is stale relative to shipped work.
- **Fix A ⭐ Recommended**: Leave §4 until `/10x-test-plan --refresh` or rollout Phase 5 (CI floor) updates the frozen strategy.
  - Strength: Honors “do not edit §1–§5” from this change.
  - Tradeoff: New readers see contradictory §4 vs §6 until refresh.
  - Confidence: HIGH — matches plan boundary.
  - Blind spot: Contributors may read §4 first and skip §6.
- **Fix B**: Patch §4 Stack row now in a small follow-up change outside this archive.
  - Strength: Single source of truth.
  - Tradeoff: Violates the original phase-4 scope rule retroactively.
  - Confidence: MED — needs explicit user approval.
  - Blind spot: May conflict with test-plan ownership process.
- **Decision**: FIXED via §4 Stack update (2026-10-19)

### F4 — Vitest config exceeds plan snippet

- **Severity**: 💡 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Adherence
- **Location**: vitest.config.ts:12-64
- **Detail**: Plan showed minimal `getViteConfig`. Implementation adds Cloudflare plugin stripping (Workers runner `module is not defined`) and `loadEnv` so `.env` supplies `SUPABASE_*`. Intent preserved; not documented in plan body.
- **Fix**: Optional addendum line in plan References or test-plan §6.6 noting runner workaround.
- **Decision**: PENDING

### F5 — Helpers and HTTP config not named in plan phases

- **Severity**: 💡 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Scope Discipline
- **Location**: test/helpers/sign-in.ts, test/helpers/remove-created-rows.ts, vitest.http.config.ts
- **Detail**: Shared sign-in/teardown and separate HTTP Vitest config are sensible extras; behavior matches plan contracts.
- **Fix**: None required; optional plan addendum for discoverability.
- **Decision**: PENDING

### F6 — CI still omits `npm test`

- **Severity**: 💡 OBSERVATION
- **Impact**: 🔎 MEDIUM — real tradeoff; pause to reason through it
- **Dimension**: Success Criteria
- **Location**: .github/workflows/ci.yml
- **Detail**: Matches plan “What We're NOT Doing” (Vitest CI is test-plan Phase 5). Suite can regress on `master` until that lands.
- **Fix**: Track via test-plan rollout Phase 5; no action in this change.
- **Decision**: PENDING

### F7 — Occasional `JWT issued at future` flake

- **Severity**: 💡 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Safety & Quality
- **Location**: src/lib/services/bands.ts:77 (via createBand RPC)
- **Detail**: Local clock skew vs Postgres can fail `npm test` intermittently; retries pass. Not introduced by wrong assertions.
- **Fix**: Document in test-plan §6.6 or retry wrapper only if flakes become frequent.
- **Decision**: PENDING

## Automated gates (review run)

- `npm run lint` — pass
- `npm test` — pass (2 files, 3 tests)
- `BASE_URL=http://localhost:4322 npm run test:http` — pass (preview on 4322)
