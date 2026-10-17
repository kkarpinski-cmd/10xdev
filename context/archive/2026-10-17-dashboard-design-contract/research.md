---
date: 2026-10-17T20:46:29+02:00
researcher: unknown
git_commit: ce5358634a648ce0e231c866394b413c1eeeabe2
branch: main
repository: kkarpinski-cmd/10xdev
topic: "Design-system audit of /dashboard against the starter tokens"
tags: [research, codebase, dashboard, tokens, shadcn]
status: complete
last_updated: 2026-10-17
last_updated_by: unknown
---

# Research: Design-system audit of /dashboard against the starter tokens

**Date**: 2026-10-17T20:46:29+02:00
**Researcher**: unknown
**Git Commit**: ce5358634a648ce0e231c866394b413c1eeeabe2
**Branch**: main
**Repository**: kkarpinski-cmd/10xdev

## Research Question

For the one view `/dashboard` (`src/pages/dashboard.astro`), which design-system contract applies, and which 3–5 charges (missing tokens, missing shared component, accidental architecture) does a two-way audit support? Token source named on the change: `src/styles/global.css` (`:root`, `.dark`, `@theme inline`).

## Summary

On branch `main` at `ce5358634a648ce0e231c866394b413c1eeeabe2`, the contract variant is a starter token file the dashboard panel does not read. `src/styles/global.css:80-97` publishes role colors as `var(--role)` inside `@theme inline`. A grep of `src/pages/dashboard.astro` for semantic role utilities returned 0 matches. The same file has 12 palette-class hits on 7 lines under the 10x-ui scan. `src/components/ui` contains `button.tsx` and `LibBadge.astro`. `components.json` already points shadcn at that directory and at `global.css`.

The document body does read tokens: `global.css:122` applies `bg-background` and `text-foreground`, and `Layout.astro:2` imports that stylesheet. The change note at `context/changes/dashboard-design-contract/change.md:12` is supported for the dashboard panel’s own classes. It is not supported if read as “no token class is applied anywhere on this document.”

Logged-out requests to `/dashboard` redirect to `/auth/signin` (`src/middleware.ts:18-21`). An empty list renders the sentence `You have no bands yet` (`src/pages/dashboard.astro:28-29`). This pass did not open the page in a browser.

## Charges

### 1. Missing tokens — dashboard chrome

`src/pages/dashboard.astro:27`, `:29`, `:36`, `:39`, `:40`, `:43`, and `:49` use `white`, `blue-100`, `from-blue-200`, and `to-purple-200`. A signed-in member sees a glass panel and a blue-to-purple title, and changing `--primary`, `--card`, or `--muted` does not change those classes.

The 10x-ui scan on this file, run in this checkout, printed 7 lines and 12 palette classes: 3 on line 27, 1 on line 29, 3 on line 36, 1 on line 39, 1 on line 40, 1 on line 43, and 2 on line 49. `src/components/bands/CreateBandForm.tsx` printed 0 lines in that scan. Roles that should cover the panel are `bg-card`, `text-card-foreground`, `border-border`, and `text-muted-foreground`. A grep of `src/**/*.{astro,tsx,css}` for `bg-card`, `text-card-foreground`, and `text-muted-foreground` returned no matches.

### 2. Missing tokens — field focus and errors

`src/components/auth/FormField.tsx:6` sets `bg-white/10`, `text-white`, and `focus:outline-none`. Line 53 uses `focus:ring-purple-400` or `focus:ring-red-400`. Line 59 uses `text-red-300`. `src/components/auth/ServerError.tsx:11` uses `border-red-500/30`, `bg-red-900/30`, and `text-red-300`. On the create-band form, keyboard focus is a purple ring and errors are red palette classes, not `--ring` or `--destructive`.

The same scan printed 5 lines in `FormField.tsx` (9 palette classes) and 1 line in `ServerError.tsx` (3 palette classes). Both files still render a text message: the field error at `FormField.tsx:58-62`, the server message at `ServerError.tsx:10-14`. `SignInForm.tsx:3-6` and `SignUpForm.tsx:3-6` import both components, so a class change there also changes sign-in and sign-up.

### 3. Missing shared component — submit control painted over Button

`src/components/auth/SubmitButton.tsx:3` imports `Button`. Line 18 passes `bg-purple-600 text-white hover:bg-purple-500`. `Button` composes that string with `cn(buttonVariants({ variant, size, className }))` (`src/components/ui/button.tsx:47`). In a Node run on this checkout, `cn` from `src/lib/utils.ts:4-6` (tailwind-merge) dropped `bg-primary`, `text-primary-foreground`, and `hover:bg-primary/90` from the default variant at `button.tsx:12` when the line 18 string was merged in, and kept `focus-visible:ring-ring/50`, `focus-visible:ring-[3px]`, and `disabled:opacity-50` from the base classes that were included in that run. The member sees a purple button. Disabled opacity and the button focus ring still come from `button.tsx`.

A grep of `src` for `from "@/components/ui/button"` returned one match, at `SubmitButton.tsx:3`. `SignInForm.tsx:5` and `SignUpForm.tsx:5` import `SubmitButton`, so this override is also the sign-in and sign-up submit control. The scan printed 2 lines in `SubmitButton.tsx` (4 palette classes: 3 on line 18, `border-white` on line 22). `border-t-white` on line 22 does not match the scan’s `border-<color>` prefix.

### 4. Missing shared component — band row

`src/pages/dashboard.astro:34-36` is a hand-built `<a>` with its own border, fill, radius, and hover. A filename search under `src` for `*card*` returned no files. `src/components/ui` contains `button.tsx` and `LibBadge.astro`. The member gets a one-off row instead of a catalog card.

The row text is a separate, already specified behavior. The archived plan requires each row to show `Owner` when `role` is `owner`, a creation time that includes seconds, and the first 8 characters of the band id (`context/archive/2026-10-04-owner-creates-band/plan.md:208`). The current page does that at `dashboard.astro:15-22`, `:39`, and `:43`. This charge does not ask to remove those three fields.

### 5. Accidental architecture — the dashboard is the auth card

`src/pages/dashboard.astro:26-52` is a centered `max-w-sm` panel on `bg-cosmic`. The heading `Create a band` is rendered under the list in both the empty and non-empty branches (`dashboard.astro:28-52`). After login, the member’s bands sit inside the same narrow card as the create form, and the title still announces creation when bands exist.

`bg-cosmic` is defined at `src/styles/global.css:113-115` as a gradient of `#0a0e1a` and `#0f1529`. In a full read of that file, those are the hex values present. The utility does not reference a role variable. `html` at `src/layouts/Layout.astro:14` has no `class`, and a grep of `Layout.astro` for `class=` returned no matches, so the `.dark` values at `global.css:41-73` are not applied by this layout.

Logged-out entry is already a redirect, not a raw payload: `PROTECTED_ROUTES` includes `"/dashboard"` and a missing user redirects to `/auth/signin` (`src/middleware.ts:4`, `:18-21`).

### Deferred

- **Other screens that share the palette.** `bg-cosmic` is also used by `src/pages/auth/signin.astro`, `src/pages/auth/signup.astro`, `src/pages/auth/confirm-email.astro`, `src/pages/bands/[id].astro`, and `src/components/Welcome.astro` (search of `src` during the token pass). `LibBadge.astro` uses `blue` and `purple` palette classes and is not imported by the dashboard. Deferred because this change is one view.
- **Uncaught list failure.** `listMyBands` throws `new Error(error.message)` when the query returns an error (`src/lib/services/bands.ts:133-135`). `dashboard.astro:10-13` does not catch it. No `src/pages/500.astro`, `404.astro`, or `error.astro` was found by the view-tree filename search. The rendered result of that throw was not observed. Deferred because empty copy and `?error=` already exist, and the visual contract can proceed without deciding the list-failure page. The states phase can pull this back in.
- **A user-facing theme toggle.** `.dark` holds values and nothing in `Layout.astro` adds that class. Deferred because the change notes do not ask for a toggle. A kitchen sink can still add the class on a wrapper.

## Detailed Findings

### Token source

`:root` (`src/styles/global.css:5-39`) and `.dark` (`src/styles/global.css:41-73`) store `oklch` role values. `@theme inline` (`global.css:75-111`) maps `--color-*` through `var(--role)`, including `--color-primary` at line 86 and `--color-ring` at line 97. `@custom-variant dark (&:is(.dark *));` is `global.css:4`.

A grep of `src/**/*.{astro,tsx,css}` for `(bg|text|border)-(primary|primary-foreground|card|card-foreground|muted|muted-foreground|destructive|background|foreground)` hit `global.css:122` and `src/components/ui/button.tsx:8`, `:12`, `:14`, `:16`, and `:19`. It did not hit `dashboard.astro`. `button.tsx:14` still uses `text-white` on the destructive variant. `global.css:119` applies `border-border` and `outline-ring/50` on `*`.

`components.json:2-16` sets style `new-york`, `cssVariables: true`, CSS file `src/styles/global.css`, and alias `@/components/ui`.

### What /dashboard renders

The page reads `error` from the query string (`dashboard.astro:6`), loads bands when `createClient` returns a client (`dashboard.astro:10-13`), and mounts `CreateBandForm` with `client:load` (`dashboard.astro:52`). The form composes `FormField`, `ServerError`, and `SubmitButton` (`CreateBandForm.tsx:34-51`).

Field validation blocks submit when the trimmed name length is outside 1–80 and sets `BAND_NAME_ERROR` (`CreateBandForm.tsx:16-29`). The string is `Band name must be 1–80 characters` (`src/lib/services/bands.ts:5`). While `useFormStatus().pending` is true, `SubmitButton` sets `disabled` and shows `Creating band...` (`SubmitButton.tsx:12-23`, `CreateBandForm.tsx:49`). The band list is awaited before HTML is sent (`dashboard.astro:10-13`); this page has no list skeleton.

`POST /api/bands` redirects failures to `/dashboard?error=` (`src/pages/api/bands.ts:11-13` and `:25-27`, as read in the view-tree pass). Success redirects to `/bands/<id>`, not back to the dashboard.

### Agent rules and lint

`AGENTS.md:40-42` names `src/styles/global.css` as the token file, tells agents to check `src/components/ui` before adding a component, and to add a missing one from the shadcn registry. “Nowy kolor = nowy token, nigdy literał” forbids a new color as a literal. That section does not mention arbitrary spacing values or a kitchen sink. It does not tell agents to use one-off values. `AGENTS.md:10` requires `cn()` for Tailwind class merges.

`.cursor/rules/10x-course.mdc:1` and `:18` are the CLI overwrite markers. The UI section that should survive `get` is the one already in `AGENTS.md`, outside that file.

A grep of `eslint.config.js` for `tailwind`, `arbitrary`, `token`, and `shadcn` returned no matches. No kitchen-sink page, Storybook file, or `*.spec` / `*.test` file was found by the view-tree filename search of the repo.

## Code References

- `src/styles/global.css:80-97` — role colors published as `var(--role)`
- `src/styles/global.css:113-115` — `bg-cosmic` hex gradient
- `src/styles/global.css:117-124` — base `border-border`, `outline-ring/50`, `bg-background`, `text-foreground`
- `src/pages/dashboard.astro:26-52` — cosmic card, empty copy, band links, gradient heading, create form
- `src/components/auth/FormField.tsx:6` — input classes, including `focus:outline-none`
- `src/components/auth/FormField.tsx:53` — purple or red focus ring
- `src/components/auth/ServerError.tsx:11` — red palette error banner
- `src/components/auth/SubmitButton.tsx:18` — purple override of `Button`
- `src/components/ui/button.tsx:8` — `focus-visible:ring-ring/50` and `disabled:opacity-50`
- `src/components/ui/button.tsx:47` — `cn(buttonVariants(...))` merge point
- `src/middleware.ts:18-21` — logged-out redirect from protected routes
- `src/lib/services/bands.ts:133-135` — list query throws on `error`
- `components.json:6-16` — existing shadcn Tailwind and UI alias
- `AGENTS.md:40-42` — token and component rule

## Architecture Insights

The catalog and the token file already exist. In the two-file catalog `src/components/ui`, `button.tsx` is the file whose classes include semantic color utilities. The dashboard reaches that file through `CreateBandForm` → `SubmitButton`, which then replaces the default variant colors. `FormField` and `ServerError` are shared with the auth forms, so charges 2 and 3 are not dashboard-only files.

The archived band plan fixes the list contents and the reuse of those three form components. It does not fix the glass-card width, the gradient heading, or the palette classes.

`.dark` is a second value layer with no applicant in `Layout.astro`. `button.tsx` includes `dark:` utilities at lines 8, 14, 16, and 18. Those utilities need an ancestor with class `dark`, which this layout does not set.

## Historical Context (from prior changes)

- `context/changes/dashboard-design-contract/change.md:12` — “starter tokens are published, and this view does not read them.” **Supported** for the panel classes in `dashboard.astro` (0 semantic-role matches in the grep of that file; `@theme inline` uses `var(--role)`). **Partial** for the document: `global.css:122` still applies `bg-background` and `text-foreground` on `body`.
- `context/archive/2026-10-04-owner-creates-band/plan.md:9` — “There are no domain tables, no `src/types.ts`, and no band UI.” **Supported as the plan’s starting baseline**, in the section titled Current State Analysis. **Contradicted as a description of the current tree**: `dashboard.astro` now lists bands and mounts `CreateBandForm`.
- `context/archive/2026-10-04-owner-creates-band/plan.md:21` and `:208` — dashboard rows show Owner, a creation time that includes seconds, and the first 8 characters of the band id; an empty list shows `You have no bands yet` and the create form. **Supported** by `dashboard.astro:15-22`, `:28-29`, `:39`, and `:43`.
- `context/archive/2026-10-04-owner-creates-band/plan.md:148` — the dashboard form reuses `FormField`, `ServerError`, and `SubmitButton`. **Supported** by `CreateBandForm.tsx:3-5`.
- `context/archive/2026-10-04-owner-creates-band/plan.md:47` — success opens `/bands/[id]`. **Supported** by the view-tree read of `src/pages/api/bands.ts:23-24`. This parent pass did not re-read that handler.
- `context/foundation/roadmap.md:72` — baseline dated 2026-10-04, “chroniony jest tylko demonstracyjny dashboard,” as reported by the prior-decisions pass. **Partial**: the archived plan later specified a band list and create form, and the current page implements that list. This parent pass did not re-open `roadmap.md`.

No other `research.md` exists under `context/` in this checkout (glob `context/**/research.md` returned 0 files).

## Related Research

Not applicable. The glob above found no earlier research artifact to link.

## Open Questions

- Whether charges 2 and 3 are fixed inside `FormField`, `ServerError`, and `SubmitButton` (sign-in and sign-up change with them) or the dashboard stops using those classes while auth keeps them. The archived plan requires the dashboard to reuse the three components; it does not freeze their colors.
- Whether the visual gate renders `.dark` on a kitchen-sink wrapper. The layout does not apply that class today, and this change’s notes do not ask for a theme toggle.
- What a thrown `listMyBands` error renders. Source shows the throw and the missing catch. The response body was not observed.
