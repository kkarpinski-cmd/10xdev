# Dashboard design contract Implementation Plan

## Overview

Bind `/dashboard` to the `.dark` role tokens already published in `src/styles/global.css`. Replace the glass palette, the hand-built band row, and the purple submit button with those roles and the shared catalog. Sign-in and sign-up keep their cosmic page background; their cards gain `dark` so the retokened fields stay light.

## Current State Analysis

`src/styles/global.css:41-59` already defines `.dark` roles for background, foreground, card, muted, border, primary, destructive, input, and ring. `@theme inline` publishes them as `var(--role)` (`global.css:80-97`). The dashboard panel does not use those utilities. It uses `bg-cosmic`, `white`, `blue-100`, and a blue-to-purple heading (`src/pages/dashboard.astro:26-49`).

`src/components/ui` contains `button.tsx` and `LibBadge.astro`. `SubmitButton` imports `Button` and overrides it with `bg-purple-600 text-white hover:bg-purple-500` (`src/components/auth/SubmitButton.tsx:18`). `FormField` and `ServerError` use white, purple, and red palette classes. Sign-in and sign-up render those same components on a cosmic card (`src/pages/auth/signin.astro:10`, `src/pages/auth/signup.astro:10`).

The archived band plan still requires each row to show Owner when the role is owner, a creation time that includes seconds, and the first 8 characters of the band id, and it still requires the dashboard to reuse `FormField`, `ServerError`, and `SubmitButton` (`context/archive/2026-10-04-owner-creates-band/plan.md:208`). Logged-out requests to `/dashboard` redirect to `/auth/signin` (`src/middleware.ts:18-21`). There is no Card, no kitchen sink, and no palette lint.

## Desired End State

A signed-in member opens a dark dashboard whose page title is `Bands`. The list sits above a create form. Each band is a catalog Card and a link to `/bands/<id>`, still showing the name, Owner when applicable, the time including seconds, and the first 8 characters of the id. An empty list still says `You have no bands yet`. The band-name field, its error, and the submit button use role tokens. Focus uses `--ring`. The submit button uses the default `Button` variant.

Sign-in and sign-up still show the cosmic background and their current headings. Their cards carry `dark`, and their fields and submit buttons match the retokened controls. A kitchen sink at `src/pages/dev/dashboard-states.astro` shows the seven states with fixture data. `AGENTS.md` names the token file, the catalog, and that sink.

### Key Discoveries:

- `@custom-variant dark (&:is(.dark *));` is `src/styles/global.css:4`. The `.dark` variable block matches the element that has the class. The `dark:` variant matches descendants of that element.
- `cn()` is `twMerge` (`src/lib/utils.ts:4-6`). A palette background on `SubmitButton` removes `bg-primary` from the default variant.
- `:root` foreground is near-black (`global.css:9`). Role classes on `FormField` stay readable on the cosmic auth card when that card has class `dark`.
- `components.json` already points shadcn at `src/styles/global.css` and `@/components/ui`. Card is absent.
- The band list is awaited before HTML is sent (`src/pages/dashboard.astro:10-13`). The pending label `Creating band...` exists on the submit button.

## What We're NOT Doing

- A user-facing theme toggle, and `class="dark"` on `<html>`.
- Replacing the cosmic background, gradient headings, or purple links on sign-in, sign-up, confirm-email, the band page, Welcome, or Topbar.
- Retokening `PasswordToggle`, the sign-up hint, `LibBadge`, or `Banner`.
- An error page for a thrown `listMyBands` failure.
- Removing Owner, the seconds in the timestamp, or the 8-character id prefix.
- Installing Playwright or a new Tailwind lint dependency.
- Running `shadcn init`, or editing the `text-white` on the destructive variant in `button.tsx`.

## Implementation Approach

Add Card from the existing shadcn config. Record the `.dark` roles this view reads, and add a role in both `:root` and `.dark` only when a needed role is missing. Then change the dashboard and the shared controls together, and mark the two auth cards `dark` in that same phase so sign-in does not briefly show dark text on the cosmic card. Finish with a fixture kitchen sink, a dependency-free palette scan of the cleaned files, and an extended UI section in `AGENTS.md`.

## Critical Implementation Details

- **Dark ancestor.** Put `dark` on a wrapper and paint that wrapper with `bg-background text-foreground`. Those utilities read the inherited variables. A `dark:` utility on the same element that carries the class does not match, because the variant is `&:is(.dark *)`.
- **Same-phase auth class.** `FormField` role colors and the `dark` class on the sign-in and sign-up cards land together. Shipping the role colors first paints `:root` foreground, which is near-black, onto the cosmic card.
- **Button override.** Delete the palette classes from `SubmitButton`'s `className`. Leaving `bg-purple-600` in place keeps it winning over `bg-primary` through `twMerge`.

## Phase 1: Library

### Overview

Add the missing Card to the catalog that `components.json` already describes. The submit control stays `Button`.

### Changes Required:

#### 1. Card

**File**: `src/components/ui/card.tsx`

**Intent**: Give the band row a catalog card instead of a one-off link, using the registry this repo already configured.

**Contract**: Add `card` with the existing shadcn CLI and `components.json` (`style` `new-york`, CSS variables on, alias `@/components/ui`). Do not run `shadcn init`. The new file includes `bg-card` and `text-card-foreground`. If the CLI rewrites `src/styles/global.css` or `components.json` beyond what the card needs, restore those unrelated edits. No new application dependency.

### Success Criteria:

#### Automated Verification:

- `npx astro check` passes after Card is added
- `npm run lint` passes after Card is added
- `src/components/ui/card.tsx` exists and includes `bg-card`

#### Manual Verification:

- Card comes from the shadcn registry for the existing components.json, not a second hand-built card

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation from the human that the manual testing was successful before proceeding to the next phase.

---

## Phase 2: Token values

### Overview

Record the `.dark` roles the dashboard will read. Do not invent a cosmic token and do not retint `:root`.

### Changes Required:

#### 1. Adopted roles

**File**: `context/changes/dashboard-design-contract/tokens.md`

**Intent**: Deposit the values this change adopts so the next session does not invent a second palette.

**Contract**: List background, foreground, card, card-foreground, muted-foreground, border, primary, primary-foreground, destructive, input, and ring. Copy each current value from the `.dark` block in `src/styles/global.css` at implementation time, and name that file and the `.dark` block as the origin. Do not edit `global.css` in this phase unless one of those roles is absent. A missing role is added to both `:root` and `.dark`, then published through the existing `@theme inline` pattern (`var(--role)`), and recorded in `tokens.md` with the same origin line.

### Success Criteria:

#### Automated Verification:

- context/changes/dashboard-design-contract/tokens.md names src/styles/global.css and the .dark roles background, foreground, card, card-foreground, muted-foreground, border, primary, primary-foreground, destructive, input, and ring
- A grep of src/styles/global.css finds #0a0e1a and #0f1529 in the bg-cosmic utility and nowhere else in that file

#### Manual Verification:

- Each role listed in tokens.md matches a variable in the .dark block of src/styles/global.css

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation from the human that the manual testing was successful before proceeding to the next phase.

---

## Phase 3: Dashboard view

### Overview

Make `/dashboard` a dark token page with a real list and a create form. Retoken the shared controls, and mark the auth cards `dark` so those screens stay readable.

### Changes Required:

#### 1. Dashboard page

**File**: `src/pages/dashboard.astro`

**Intent**: A signed-in member sees their bands first, on the dark role surface, with creation as a following section.

**Contract**: The page root has class `dark` and uses `bg-background text-foreground`. It does not use `bg-cosmic` or palette colors. One column, `max-w-lg`, page padding. The only `h1` is `Bands`. When `bands.length === 0`, the page shows `You have no bands yet` in `text-muted-foreground`. Otherwise each row is a link to `/bands/${band.id}` that uses `Card`. The row still shows `band.name`, `Owner` when `band.role === "owner"`, the existing `Intl.DateTimeFormat` output including seconds, and `band.id.slice(0, 8)`. The create form follows the list, inside a `Card`, under an `h2` of `Create a band`. Hover on a row uses a role utility such as `hover:bg-accent`.

#### 2. Shared controls

**File**: `src/components/auth/FormField.tsx`
**File**: `src/components/auth/ServerError.tsx`
**File**: `src/components/auth/SubmitButton.tsx`

**Intent**: The field, the error, and the submit button on the dashboard and on the auth forms read the same roles as `Button`.

**Contract**: `FormField` uses `text-foreground`, `bg-input` or `bg-background`, `border-input`, `text-muted-foreground` for the label and placeholder, and `focus-visible:ring-ring` plus `focus-visible:border-ring`. The error branch uses `border-destructive`, `text-destructive`, and `ring-destructive`, and still renders the message text. `ServerError` uses `border-destructive`, a destructive tint background, and `text-destructive`, and still renders `message`. `SubmitButton` keeps `type="submit"`, `disabled` while pending, and the pending label. Its `className` may include `w-full` and must not include a palette color or a radius that replaces the button radius. The pending spinner uses `primary-foreground` or `currentColor`, not `white`. React class merges go through `cn()`.

#### 3. Auth cards

**File**: `src/pages/auth/signin.astro`
**File**: `src/pages/auth/signup.astro`

**Intent**: Retokened fields stay light on the cosmic card.

**Contract**: Add `dark` to the existing card element on each page. Leave `bg-cosmic`, the gradient heading, and the purple links as they are.

### Success Criteria:

#### Automated Verification:

- The 10x-ui palette scan returns no hits in src/pages/dashboard.astro, src/components/auth/FormField.tsx, src/components/auth/ServerError.tsx, and src/components/auth/SubmitButton.tsx
- npx astro check passes
- npm run lint passes
- src/pages/dashboard.astro includes dark and does not include bg-cosmic
- src/pages/auth/signin.astro and src/pages/auth/signup.astro include dark on the card

#### Manual Verification:

- A signed-in dashboard shows the title Bands above the list and the create form below it
- A band row shows the name, Owner when the role is owner, a creation time that includes seconds, the first 8 characters of the id, and links to /bands/<id>
- An empty membership list shows the sentence You have no bands yet
- Sign-in field text is readable on the cosmic card
- A too-short band name shows Band name must be 1–80 characters next to the field

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation from the human that the manual testing was successful before proceeding to the next phase.

---

## Phase 4: States and guardrail

### Overview

Show every required state on one fixture page, then leave a rule and a scan so the next agent keeps the contract.

### Changes Required:

#### 1. Kitchen sink

**File**: `src/pages/dev/dashboard-states.astro`

**Intent**: One page shows the seven states of this view with fixture data, so the gate does not depend on a signed-in session.

**Contract**: The route is not added to `PROTECTED_ROUTES`. It does not call Supabase. It renders seven labeled specimens: default (one fixture band), hover (row resting in the hover role classes), focus-visible (field and submit control resting in the ring classes), disabled (submit button disabled), error (field message `Band name must be 1–80 characters` and a server message), empty (`You have no bands yet`), and loading (the pending label `Creating band...`). Specimens compose `Card`, `FormField`, `ServerError`, and `SubmitButton`. `SubmitButton` accepts an optional forced-pending flag so the loading specimen does not submit. Hover and focus-visible are resting classes because a static page cannot hold `:hover` and `:focus-visible` on every control at once. List loading is N/A: the dashboard list is rendered on the server before HTML is sent. The page root uses `dark` and the same roles as the dashboard.

#### 2. Palette scan

**File**: `scripts/check-dashboard-tokens.mjs`

**Intent**: A failed check beats a rule the next agent can miss, without a new lint dependency.

**Contract**: A dependency-free Node script exits 0 when the scan is clean and exits 1 when it finds a hit. It scans only `src/pages/dashboard.astro`, `src/pages/dev/dashboard-states.astro`, `src/components/auth/FormField.tsx`, `src/components/auth/ServerError.tsx`, `src/components/auth/SubmitButton.tsx`, and `src/components/ui/card.tsx`. The pattern is the 10x-ui hardcoded-value scan:

```
#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\(|oklch\(|-\[[0-9.]+(px|rem)\]|\b(bg|text|border|ring|outline|from|via|to|fill|stroke|shadow|divide)-(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|white|black)\b
```

#### 3. Agent rule

**File**: `AGENTS.md`

**Intent**: The next agent can find the tokens, the catalog, and the sink without a second rules file.

**Contract**: Extend the existing `## UI` section. Do not edit `.cursor/rules/10x-course.mdc`. State that tokens live in `src/styles/global.css` (`:root`, `.dark`, `@theme inline`), that components live in `src/components/ui` and missing ones are added from the shadcn registry, that views use role tokens instead of literal colors or arbitrary values, and that the dashboard kitchen sink is `src/pages/dev/dashboard-states.astro`.

### Success Criteria:

#### Automated Verification:

- node scripts/check-dashboard-tokens.mjs exits 0
- src/pages/dev/dashboard-states.astro exists and is not listed in PROTECTED_ROUTES
- npx astro check passes
- npm run lint passes

#### Manual Verification:

- The kitchen sink shows default, hover, focus-visible, disabled, error, empty, and the submit pending label
- The same sink is checked at a desktop width and at one mobile width
- Keyboard focus on the band-name field and the submit button shows the ring token
- AGENTS.md UI section names the token file, src/components/ui, the shadcn add path, the ban on literal colors, and the kitchen sink path

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation from the human that the manual testing was successful before proceeding to the next phase.

---

## Testing Strategy

### Unit Tests:

- No unit suite exists. The automated gate is `npm run lint`, `npx astro check`, and `node scripts/check-dashboard-tokens.mjs` once that script exists.

### Integration Tests:

- `npm run smoke` stays the auth-flow smoke test. This change does not alter the sign-in redirect target or `POST /api/bands`.

### Manual Testing Steps:

1. Open `/dashboard` signed in with at least two bands and confirm the title, order, row fields, and links.
2. Open `/dashboard` with no bands and confirm `You have no bands yet` and the create form.
3. Submit an empty band name and confirm the field message. Load `/dashboard?error=Band%20name%20must%20be%201%E2%80%9380%20characters` and confirm the server message.
4. Tab to the band-name field and the submit button and confirm the ring.
5. Open `/auth/signin` and `/auth/signup` and confirm the cosmic background with readable fields and a token submit button.
6. Open `/dev/dashboard-states` at desktop width and at about 390px and confirm the seven specimens.

## Performance Considerations

The dashboard still loads one membership query per request. The kitchen sink uses fixtures and does not add a query.

## Migration Notes

No data migration. No new environment variable. No change to `PROTECTED_ROUTES`.

## References

- Related research: `context/changes/dashboard-design-contract/research.md`
- Adopted values: `src/styles/global.css:41-59` and `src/styles/global.css:4`
- Catalog config: `components.json`
- Row contract: `context/archive/2026-10-04-owner-creates-band/plan.md:208`
- Shared-form reuse: `context/archive/2026-10-04-owner-creates-band/plan.md:148`

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles. See `references/progress-format.md`.

### Phase 1: Library

#### Automated

- [x] 1.1 `npx astro check` passes after Card is added — 9c4a441
- [x] 1.2 `npm run lint` passes after Card is added — 9c4a441
- [x] 1.3 `src/components/ui/card.tsx` exists and includes `bg-card` — 9c4a441

#### Manual

- [x] 1.4 Card comes from the shadcn registry for the existing components.json, not a second hand-built card — 9c4a441

### Phase 2: Token values

#### Automated

- [x] 2.1 context/changes/dashboard-design-contract/tokens.md names src/styles/global.css and the .dark roles background, foreground, card, card-foreground, muted-foreground, border, primary, primary-foreground, destructive, input, and ring
- [x] 2.2 A grep of src/styles/global.css finds #0a0e1a and #0f1529 in the bg-cosmic utility and nowhere else in that file

#### Manual

- [x] 2.3 Each role listed in tokens.md matches a variable in the .dark block of src/styles/global.css

### Phase 3: Dashboard view

#### Automated

- [ ] 3.1 The 10x-ui palette scan returns no hits in src/pages/dashboard.astro, src/components/auth/FormField.tsx, src/components/auth/ServerError.tsx, and src/components/auth/SubmitButton.tsx
- [ ] 3.2 npx astro check passes
- [ ] 3.3 npm run lint passes
- [ ] 3.4 src/pages/dashboard.astro includes dark and does not include bg-cosmic
- [ ] 3.5 src/pages/auth/signin.astro and src/pages/auth/signup.astro include dark on the card

#### Manual

- [ ] 3.6 A signed-in dashboard shows the title Bands above the list and the create form below it
- [ ] 3.7 A band row shows the name, Owner when the role is owner, a creation time that includes seconds, the first 8 characters of the id, and links to /bands/<id>
- [ ] 3.8 An empty membership list shows the sentence You have no bands yet
- [ ] 3.9 Sign-in field text is readable on the cosmic card
- [ ] 3.10 A too-short band name shows Band name must be 1–80 characters next to the field

### Phase 4: States and guardrail

#### Automated

- [ ] 4.1 node scripts/check-dashboard-tokens.mjs exits 0
- [ ] 4.2 src/pages/dev/dashboard-states.astro exists and is not listed in PROTECTED_ROUTES
- [ ] 4.3 npx astro check passes
- [ ] 4.4 npm run lint passes

#### Manual

- [ ] 4.5 The kitchen sink shows default, hover, focus-visible, disabled, error, empty, and the submit pending label
- [ ] 4.6 The same sink is checked at a desktop width and at one mobile width
- [ ] 4.7 Keyboard focus on the band-name field and the submit button shows the ring token
- [ ] 4.8 AGENTS.md UI section names the token file, src/components/ui, the shadcn add path, the ban on literal colors, and the kitchen sink path
