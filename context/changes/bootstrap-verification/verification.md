---
bootstrapped_at: 2026-09-18T11:51:00Z
starter_id: 10x-astro-starter
starter_name: "10x Astro Starter (Astro + Supabase + Cloudflare)"
project_name: jam-set
language_family: js
package_manager: npm
cwd_strategy: git-clone
bootstrapper_confidence: first-class
phase_3_status: ok
audit_command: "npm audit --json"
---

## Hand-off

```yaml
starter_id: 10x-astro-starter
package_manager: npm
project_name: jam-set
hints:
  language_family: js
  team_size: solo
  deployment_target: cloudflare-pages
  ci_provider: github-actions
  ci_default_flow: auto-deploy-on-merge
  bootstrapper_confidence: first-class
  path_taken: standard
  quality_override: false
  self_check_answers: null
  has_auth: true
  has_payments: false
  has_realtime: false
  has_ai: false
  has_background_jobs: false
```

JamSet to web-app dla małych zespołów muzycznych z auth, bazą danych i powiadomieniami in-app — bez płatności, realtime ani jobów w tle. Solo developer z 7-tygodniowym harmonogramem after-hours potrzebuje sprawdzonego, agent-friendly startera z auth i DB out of the box. 10x Astro Starter (Astro + React + TypeScript + Supabase + Cloudflare) to rekomendowany domyślny wybór dla web-app w JS; przechodzi wszystkie cztery bramki jakości agent-friendly, a bootstrapper confidence to first-class. Deploy na Cloudflare Pages, CI przez GitHub Actions z auto-deploy po merge — zgodnie z domyślnymi ustawieniami startera.

## Pre-scaffold verification

| Signal             | Value                                              | Severity | Notes                                      |
| ------------------ | -------------------------------------------------- | -------- | ------------------------------------------ |
| npm package        | not run                                            | —        | cmd_template uses git clone, not npm create |
| GitHub repo        | przeprogramowani/10x-astro-starter pushed 2026-09-12T21:16:08Z | fresh    | from card.docs_url via GitHub API (gh unavailable; used curl) |

## Scaffold log

**Resolved invocation**: `git clone https://github.com/przeprogramowani/10x-astro-starter .bootstrap-scaffold && cd .bootstrap-scaffold && npm install`

**Strategy**: git-clone

**Exit code**: 0

**Files moved**: 18 top-level items (src/, supabase/, public/, scripts/, config files, dotfiles)

**Conflicts (.scaffold siblings)**: package.json.scaffold, package-lock.json.scaffold, README.md.scaffold

**.gitignore handling**: append-merged

**.bootstrap-scaffold cleanup**: deleted

**Notes**: Cloned starter history removed before merge. `node_modules` was reinstalled from starter lockfile after directory-level conflict with course tooling dependencies. Review `.scaffold` siblings and promote `package.json.scaffold` / `package-lock.json.scaffold` when ready to run the app.

## Post-scaffold audit

**Tool**: npm audit --json

**Summary**: 0 CRITICAL, 0 HIGH, 20 MODERATE, 2 LOW

**Direct vs transitive**: 0 direct findings; all 22 findings are transitive (via jimp/file-type/diff chain in dev tooling)

#### CRITICAL findings

None.

#### HIGH findings

None.

#### MODERATE findings

- `file-type` — infinite loop in ASF parser (GHSA-5v7r-6r5c-r473), transitive via `@jimp/core`
- `@jimp/*` packages (19 entries) — transitive via `jimp` / `@opentui/core` dependency chain

#### LOW / INFO findings

- `diff` — DoS in parsePatch/applyPatch (GHSA-73rr-hh4g-fpgx), transitive
- `10x-cli` — low severity via `@opentui/core`, transitive

## Hints recorded but not acted on

| Hint                       | Value                              |
| -------------------------- | ---------------------------------- |
| bootstrapper_confidence    | first-class                        |
| quality_override           | false                              |
| path_taken                 | standard                           |
| self_check_answers         | null                               |
| team_size                  | solo                               |
| deployment_target          | cloudflare-pages                   |
| ci_provider                | github-actions                     |
| ci_default_flow            | auto-deploy-on-merge               |
| has_auth                   | true                               |
| has_payments               | false                              |
| has_realtime               | false                              |
| has_ai                     | false                              |
| has_background_jobs        | false                              |

## Next steps

Next: a future skill will set up agent context (CLAUDE.md, AGENTS.md). For now, your project is scaffolded and verified — happy hacking.

Useful manual steps in the meantime:
- `git init` (if you have not already) to start your own repo history.
- Review any `.scaffold` siblings the conflict policy created and decide which version of each file to keep — start with `package.json.scaffold` and `package-lock.json.scaffold` to activate the Astro starter manifest.
- Copy `.env.example` to `.env` and configure Supabase credentials.
- Address audit findings per your project's risk tolerance — the full breakdown is in this log.
