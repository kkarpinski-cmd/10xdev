---
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
---

## Why this stack

JamSet to web-app dla małych zespołów muzycznych z auth, bazą danych i powiadomieniami in-app — bez płatności, realtime ani jobów w tle. Solo developer z 7-tygodniowym harmonogramem after-hours potrzebuje sprawdzonego, agent-friendly startera z auth i DB out of the box. 10x Astro Starter (Astro + React + TypeScript + Supabase + Cloudflare) to rekomendowany domyślny wybór dla web-app w JS; przechodzi wszystkie cztery bramki jakości agent-friendly, a bootstrapper confidence to first-class. Deploy na Cloudflare Pages, CI przez GitHub Actions z auto-deploy po merge — zgodnie z domyślnymi ustawieniami startera.
