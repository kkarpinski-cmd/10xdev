# Dashboard design contract — Plan Brief

> Full plan: `context/changes/dashboard-design-contract/plan.md`
> Research: `context/changes/dashboard-design-contract/research.md`

## What & Why

`/dashboard` is the screen a member sees after login, and it is still the cosmic sign-in card: white and blue palette classes, a blue-to-purple title, and a hand-built band row. The starter tokens in `src/styles/global.css` are already published. This change makes that one view read the `.dark` roles, and it retokens the shared field, error, and submit button that the view uses.

## Starting Point

The `.dark` block already holds background, card, foreground, muted, border, primary, destructive, input, and ring. The dashboard uses none of them. `Button` does. `SubmitButton` paints over it with purple. `FormField` and `ServerError` are shared with sign-in and sign-up, which sit on the same cosmic card. The catalog has no Card. Each band row already shows Owner, a time including seconds, and the first 8 characters of the id.

## Desired End State

A signed-in member sees a dark page titled `Bands`, then the list, then a create form. Rows are Card links and keep the three identifying fields. The field, the error text, and the submit button use role tokens, including the focus ring. Sign-in and sign-up keep the cosmic background and gain `dark` on the card so the same controls stay readable. A fixture kitchen sink shows all seven states.

## Key Decisions Made

| Decision | Choice | Why (1 sentence) | Source |
| --- | --- | --- | --- |
| Token layer | `dark` on the dashboard root | The post-login screen stays dark using roles already in `.dark` | Plan |
| Shared controls | Retoken `FormField`, `ServerError`, and `SubmitButton`; add `dark` on the sign-in and sign-up cards | One field and one Button, and auth text stays light on the cosmic card | Plan |
| Cosmic hex | Leave it for other screens | This change binds one view to existing roles | Research |
| Row contents | Keep Owner, seconds, and the 8-character id | The archived band plan still requires them | Research |
| List query failure | Deferred | Empty copy and `?error=` already exist | Research |
| Theme toggle | Deferred | The change notes do not ask for one | Research |
| Card | Add it from the existing shadcn config | The catalog has no Card | Research |
| Visual gate | Kitchen sink, no Playwright | The repo has no screenshot runner | Research |

## Scope

**In scope:**

- Card from the current shadcn config
- A deposit of the adopted `.dark` roles in this change folder
- `/dashboard` layout, rows, and create form
- Role classes on `FormField`, `ServerError`, and `SubmitButton`
- `dark` on the sign-in and sign-up cards
- Kitchen sink, palette scan, and the `AGENTS.md` UI section

**Out of scope:**

- Theme toggle and a global `dark` class on `<html>`
- Cosmic backgrounds, gradient headings, and purple links on the other screens
- `PasswordToggle`, the sign-up hint, `LibBadge`, and `Banner`
- An error page for a thrown `listMyBands`
- Playwright or a new lint dependency

## Architecture / Approach

The page root carries `dark`, so descendants inherit the `.dark` variables. `dark:` utilities match descendants, not the element that has the class. Card and Button come from `src/components/ui`. The auth cards get the same `dark` class in the same phase as the field retoken, because `:root` foreground is near-black and would disappear on the cosmic shell.

## Phases at a Glance

| Phase | What it delivers | Key risk |
| --- | --- | --- |
| 1. Library | `src/components/ui/card.tsx` from the existing registry config | The CLI rewrites `global.css` beyond the card |
| 2. Token values | `tokens.md` listing the adopted `.dark` roles | A missing role tempts a one-off color instead of a pair of token edits |
| 3. Dashboard view | Dark dashboard, Card rows, retokened controls, `dark` on the two auth cards | Shipping the field colors before the auth `dark` class makes sign-in unreadable |
| 4. States and guardrail | Seven-state sink, scan script, `AGENTS.md` note | Hover and focus are easy to leave off a static page |

**Prerequisites:** `components.json` and the `.dark` block already exist. No new application dependency.
**Estimated effort:** About two sessions across four phases.

## Open Risks & Assumptions

- The shadcn CLI may touch `components.json` or `src/styles/global.css`. Unrelated edits are restored in Phase 1.
- `PasswordToggle` and the sign-up hint keep their current light palette. On a `dark` cosmic card they stay visible, and they stay outside this scan.
- The kitchen sink forces hover, focus-visible, and pending as resting specimens. Keyboard focus is still checked on the real dashboard controls.

## Success Criteria (Summary)

- A signed-in member sees `Bands`, then their rows, then the create form, with Owner, seconds, and the id prefix still on each row.
- The field, the error, and the submit button follow the role tokens on the dashboard and remain readable on sign-in.
- The kitchen sink shows all seven states at desktop width and at one mobile width, and the palette scan for the cleaned files exits 0.
