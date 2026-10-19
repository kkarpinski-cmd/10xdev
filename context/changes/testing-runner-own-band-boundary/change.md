---
change_id: testing-runner-own-band-boundary
title: Prove own-band visibility and rejected owner writes
status: implementing
created: 2026-10-18
updated: 2026-10-19
archived_at: null
---

## Notes

Open a change folder for rollout Phase 1 of context/foundation/test-plan.md: "Runner and own-band boundary".
Risks covered: #2 A signed-in user sees a band, pool, round, or setlist they do not belong to; #3 A signed-in user becomes owner of a band they did not create, or stores a band or song the server must reject. Test types planned: unit + integration.
Risk response intent: #2 prove user A cannot read user B's band list, pool, round, or setlist, including by guessing an id. #3 prove a request to become owner of someone else's band is rejected, and a band or song outside the server rule is not stored.
After creating the folder, follow the downstream continuation rule.
