# Test Plan

> Phased test rollout for this project. Strategy is frozen at the top
> (§1–§5); cookbook patterns at the bottom (§6) fill in as phases ship.
> Read before writing any new test.
>
> Refresh: re-run `/10x-test-plan --refresh` when stale (see §8).
>
> Last updated: 2026-10-18

## 1. Strategy

Tests follow three non-negotiable principles for this project:

1. **Cost × signal.** The cheapest test that gives a real signal for the
   risk wins. Do not promote to e2e because e2e "feels safer." Do not put a
   vision model on top of a deterministic visual diff that already catches
   the regression.
2. **User concerns are first-class evidence.** Risks anchored in "<the
   team is worried about X, and the failure would surface somewhere in
   <area>>" carry the same weight as PRD lines or hot-spot data.
3. **Risks are scenarios, not code locations.** This plan documents *what
   could fail* and *why we believe it's likely* — drawn from documents,
   interview, and codebase *signal* (churn, structure, test base). It does
   NOT claim to know which line owns the failure. That knowledge is
   produced by `/10x-research` during each rollout phase. If the plan and
   research disagree about where the failure lives, research is the
   ground truth.

Hot-spot scope used for likelihood weighting: `src`, `supabase`. Scan skipped: 2 commits in the last 30 days, under the 5-commit floor. Likelihood uses the roadmap and the Phase 2 interview only.

Every test asserts a JamSet rule against an internal fixture. Hosted Supabase is out of budget (interview Q5).

## 2. Risk Map

The top failure scenarios this project must protect against, ordered by
risk = impact × likelihood. Risks are failure scenarios in user / business
terms, not test names. The Source column cites the *evidence that surfaced
this risk* — never a specific file as "where the failure lives" (that is
research's job, see §1 principle #3).

All seven rows are High × Medium. High impact: the band sees the wrong songs or someone else's data. Medium likelihood: the scoped history is too thin to call the area weekly, and interview Q2 was skipped. Ties break toward the interview, then toward behavior that already ships, then toward the rest of milestone M-1.

| # | Risk (failure scenario) | Impact | Likelihood | Source (evidence — not anchor) |
|---|-------------------------|--------|------------|--------------------------------|
| 1 | The dashboard mixes songs from the previous voting round into the current round, or shows none of the current round's songs | High | Medium | interview Q1; PRD US-01, FR-005, FR-012; roadmap S-05–S-07 |
| 2 | A signed-in user sees a band, pool, round, or setlist they do not belong to | High | Medium | PRD privacy guardrail; archive `owner-creates-band` plan; roadmap S-01 done, S-03/S-05/S-07 proposed |
| 3 | A signed-in user becomes owner of a band they did not create, or stores a band or song the server must reject | High | Medium | archive `owner-creates-band` plan; PRD FR-002, FR-004 |
| 4 | A setlist appears before every member has voted, or songs left off the setlist disappear from the pool | High | Medium | PRD US-01, FR-008, FR-010; roadmap S-07 |
| 5 | Someone other than the owner starts a round, or a member rates the same song twice in that round | High | Medium | PRD fairness guardrail; FR-005, FR-007; roadmap S-05, S-06 |
| 6 | A pool of 10 or more does not yield 10 songs, a pool under 10 does not yield every song, or the setlist length is not the owner's N | High | Medium | PRD US-01, FR-005, FR-008, FR-011; roadmap S-04, S-05, S-07 |
| 7 | An invite admits someone without that band's invite, or joins them to a different band | High | Medium | PRD FR-003; roadmap S-02; PRD non-goal: no public band search |

Secret leakage into logs or the client bundle is High impact and Low likelihood, with no reported incident. It stays an `AGENTS.md` rule, not a test phase.

### Risk Response Guidance

| Risk | What would prove protection | Must challenge | Context `/10x-research` must ground | Likely cheapest layer | Anti-pattern to avoid |
|------|-----------------------------|----------------|--------------------------------------|-----------------------|-----------------------|
| #1 | The member's view lists only the current round's songs when an earlier round has songs of its own, and an empty current round is not presented as "no songs exist" | A loaded dashboard means the round is current | What a round is, which songs belong to it, what a member may see | Integration of the view on a two-round fixture | Oracle copied from the implementation; a mock that is the assertion; e2e against hosted Supabase |
| #2 | User A cannot read user B's band list, pool, round, or setlist, including by guessing an id | A valid session makes every band visible | How membership is decided, and what an outsider receives | Integration at the read boundary, two users, a fixture | Owner happy path only; a membership mock that is always true |
| #3 | A request to become owner of someone else's band is rejected, and a band or song outside the server rule is not stored | A hidden form is enough | Where the server refuses the write, and with what result | Integration at the write boundary | A UI-only assertion; a test of the database vendor |
| #4 | No setlist exists until every member of the round has voted; songs outside the top N stay in the pool | The owner's vote closes the round | Who counts as "everyone"; what "stays in the pool" means | Unit or integration of the close rule | Averaging with the same function the production code uses |
| #5 | A non-owner's start, and a second rating of the same song in the same round, are both rejected | A hidden button protects the server | Where the owner check and the single-vote rule live | Integration at the write boundary | Asserting the vendor's uniqueness behavior |
| #6 | A pool of 10 or more yields a round of 10; a smaller pool yields every song; setlist length equals the band's N | Any draw size is acceptable | Where N comes from. Roadmap S-07 leaves ties open — do not invent a tie-break | Unit of the rule on a fixture | Asserting one random draw without a fixed seed |
| #7 | A person without that band's invite does not become a member; a valid invite joins that band | Any signed-in user can join by opening a band URL | What an invite is, and which band it joins | Integration of the join rule | An e2e test of the mail provider |

## 3. Phased Rollout

Each row is a discrete rollout phase that will open its own change folder
via `/10x-new`. Status moves left-to-right through the values below; the
orchestrator updates Status as artifacts appear on disk.

| # | Phase name | Goal (one line) | Risks covered | Test types | Status | Change folder |
|---|------------|-----------------|---------------|------------|--------|---------------|
| 1 | Runner and own-band boundary | Boot the runner and prove a signed-in user sees only their bands and cannot self-assign owner or store a rejected entry, on an internal fixture | #2, #3 | unit + integration | change opened | context/changes/testing-runner-own-band-boundary/ |
| 2 | Current-round view | Prove Risk #1. This phase does not build the round. If research finds no round view, it returns a correction | #1 | integration | not started | — |
| 3 | Vote and setlist rules | Prove a single vote, owner-only start, setlist only after every member voted, draw size, top N, and leftovers staying in the pool | #4, #5, #6 | unit + integration | not started | — |
| 4 | Invite boundary | Prove an invite joins only the invited band | #7 | integration | not started | — |
| 5 | CI floor | Run the new tests in CI beside lint, typecheck, build, and the existing auth-redirect smoke | cross-cutting | gates | not started | — |

Phase 1 is first because it is the shipped surface (roadmap S-01) and it pays for the runner. Phase 2 is the interview's top fear; the archived product has bands on the dashboard, and rounds are still proposed (S-05–S-07). No browser phase: interview Q5 dropped visual snapshots, and a browser run does not catch a mixed song list more cheaply than an assertion on the view's data.

## 4. Stack

The classic test base for this project. AI-native tools (if any) carry a
`checked:` date so future readers can see which lines need re-verification.
Recommendations in this section must be grounded in local manifests/configs
plus the MCP/tools actually exposed in the current session. If a useful docs
or search MCP such as Context7 or Exa.ai is not available, say that instead
of assuming access.

Test-base profile: `none`. No Vitest, Jest, or Playwright config, and no application test files. `scripts/smoke.mjs` checks the sign-in redirect. CI runs that smoke on `master`.

| Layer | Tool | Version | Notes |
|-------|------|---------|-------|
| unit + integration | none yet — Vitest via Astro `getViteConfig()` | — | Phase 1 boots the runner. `@cloudflare/vitest-plugin` (successor of `@cloudflare/vitest-pool-workers`) only if research shows the failure needs the Workers runtime. checked: 2026-10-18 |
| API mocking | none yet | — | Internal fixtures. Do not assert hosted Supabase. See §3 Phase 1 |
| e2e | none | — | No rollout phase |
| accessibility | none | — | No rollout phase |
| AI-native | none — checked: 2026-10-18 | n/a | Not used. Interview Q5 excluded visual snapshots |

**Stack grounding tools (current session):**
- Docs: none — Context7 is not available in the current session. Official Astro testing guide and Cloudflare Workers Vitest docs were opened via web search instead; checked: 2026-10-18
- Search: Cursor web search — Exa.ai is not available in the current session. Used to find the Astro and Cloudflare pages above; checked: 2026-10-18
- Runtime/browser: Playwright MCP and Cursor browser — available, not used. A browser pass is a worse cost × signal fit than a fixture assertion for §2; checked: 2026-10-18
- Provider/platform: none — GitHub, Cloudflare, and Supabase MCP are not available in the current session. Linear is present and is not a test gate; checked: 2026-10-18

## 5. Quality Gates

The full set of gates that must pass before a change reaches production.
"Required for §3 Phase <N>" means the gate is enforced once that rollout
phase lands; before that, the gate is `planned`.

| Gate | Where | Required? | Catches |
|------|-------|-----------|---------|
| lint + typecheck | local + CI | required | syntactic / type drift |
| auth-redirect smoke | CI on `master` | required | sign-in redirect regression |
| unit + integration | local + CI | required after §3 Phase 1; CI wiring lands in §3 Phase 5 | logic regressions on §2 |

## 6. Cookbook Patterns

How to add new tests in this project. Each sub-section is filled in once
the relevant rollout phase ships; before that, the sub-section reads
"TBD — see §3 Phase <N>."

### 6.1 Adding a unit test

- TBD — see §3 Phase 3 for the draw-size and top-N rule, and §3 Phase 1 if a rejected write is a pure rule.

### 6.2 Adding an integration test

- TBD — see §3 Phase 1 for the other-band read denial and the rejected owner write.

### 6.3 Adding an e2e test

- Not in this rollout. Interview Q5 and cost × signal left the browser layer out.

### 6.4 Adding a test for a new API endpoint

- TBD — see §3 Phase 1 for the write-boundary refusal (self-assigned owner, rejected band or song).

### 6.5 Adding a test for a new content-build rule

- Not applicable. JamSet has no content-build pipeline.

### 6.6 Per-rollout-phase notes

- TBD — each phase appends a short note here when it lands.

## 7. What We Deliberately Don't Test

Exclusions agreed during the rollout (Phase 2 interview, Q5). Future
contributors should respect these unless the underlying assumption changes.

- **Dashboard state kitchen sink under `/dev`** — small blast radius, trusted eyes only. Re-evaluate if that page becomes a member-facing flow. (Source: Phase 2 interview Q5.)
- **Generated Wrangler types** — the generator is the check. Re-evaluate if those types are hand-edited. (Source: Phase 2 interview Q5.)
- **Visual snapshots of sign-in and sign-up** — they break when the page chrome changes and catch no product rule. Re-evaluate if a visual regression has a product cost. (Source: Phase 2 interview Q5.)
- **External providers, including Supabase** — assert JamSet rules on internal fixtures. Re-evaluate if a JamSet rule can only be observed through the provider. (Source: Phase 2 interview Q5.)

## 8. Freshness Ledger

- Strategy (§1–§5) last reviewed: 2026-10-18
- Stack versions last verified: 2026-10-18
- AI-native tool references last verified: 2026-10-18

Refresh (`/10x-test-plan --refresh`) when:

- a new top-3 risk surfaces from the roadmap or archive,
- a recommended tool's `checked:` date is older than three months,
- the project's tech stack changes (new framework, new test runner),
- §7 negative-space no longer matches what the team believes.
