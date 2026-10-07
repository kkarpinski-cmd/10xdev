---
project: JamSet
version: 1
status: draft
created: 2026-10-04
updated: 2026-10-07
prd_version: 1
main_goal: speed
top_blocker: time
milestone_id: first-rehearsal-setlist
milestone_seq: 1
milestone_status: open
---

# Roadmap: JamSet

> Derived from context/foundation/prd.md (v1) + auto-researched codebase baseline.
> Edit-in-place; archive when superseded.
> Slices below are listed in dependency order. The "At a glance" table is the index.

## Milestone

**M-1: First rehearsal setlist** — Status: open

- **Intent:** Zespół przechodzi drogę od założenia zespołu do setlisty na próbę: wspólna pula, runda uruchomiona przez ownera, oceny wszystkich członków, top N według reguły zespołu, a utwory spoza setlisty zostają w puli.
- **Source materials:** `context/foundation/prd.md` (v1)
- **Done when:** every F-NN and S-NN below is `done`
- **Scope anchors:** US-01, FR-001, FR-002, FR-003, FR-004, FR-005, FR-006, FR-007, FR-008, FR-009, FR-010, FR-011, FR-012

## Vision recap

Małe zespoły przed jamem albo próbą nie mają jednego miejsca na utwory — propozycje giną w historii wiadomości, a pusta kartka wraca przy każdym spotkaniu. Sama playlisty albo notatka nie wystarcza: członkowie w swoim czasie zbierają pulę, owner uruchamia głosowanie na wylosowanym podzbiorze i z ocen powstaje setlista na następną próbę.

## North star

**S-07: użytkownik może zobaczyć setlistę na próbę po głosach wszystkich; utwory spoza niej zostają w puli, a członkowie dostają powiadomienie z wynikiem** — przy szybkości dojścia do działającej wersji ten wynik stoi najwcześniej, jak pozwalają warunki wstępne, bo dopiero setlista pokazuje, że zespół naprawdę ustala, co grać.

> North star to najmniejszy kompletny przebieg widoczny dla użytkownika: jeśli on działa, zespół dostaje setlistę na próbę. Stoi tak wcześnie, jak pozwalają warunki wstępne, bo pozostałe przekroje mają sens tylko wtedy, gdy ten przebieg działa.

## At a glance

| ID   | Change ID                    | Outcome (user can …)                                                                                                      | Prerequisites | PRD refs                                       | Status   |
| ---- | ---------------------------- | ------------------------------------------------------------------------------------------------------------------------- | ------------- | ---------------------------------------------- | -------- |
| F-01 | first-workers-deploy         | (foundation) drugi członek może otworzyć aplikację pod stałym adresem                                                    | —             | US-01                                          | done     |
| S-01 | owner-creates-band           | użytkownik może utworzyć zespół i zostaje jego ownerem                                                                   | —             | US-01, FR-001, FR-002                          | in-progress |
| S-02 | join-band-by-invite          | użytkownik może dołączyć do zespołu przez link zaproszenia                                                               | S-01          | US-01, FR-003                                  | proposed |
| S-03 | add-song-to-pool             | członek może dodać utwór do puli zespołu i ją zobaczyć                                                                   | S-01          | US-01, FR-004                                  | proposed |
| S-04 | owner-sets-setlist-size      | owner może ustawić, ile utworów z rundy wchodzi na setlistę                                                              | S-01          | US-01, FR-011                                  | proposed |
| S-05 | owner-starts-voting-round    | owner może uruchomić rundę głosowania, a członkowie widzą w aplikacji powiadomienie o starcie                            | S-02, S-03    | US-01, FR-005, FR-006                          | proposed |
| S-06 | member-rates-round-songs     | członek, w tym owner, może ocenić każdy wylosowany utwór w skali 1–5, po kolei                                           | S-05          | US-01, FR-007                                  | proposed |
| S-07 | rehearsal-setlist-from-votes | użytkownik może zobaczyć setlistę na próbę po głosach wszystkich; utwory spoza niej zostają w puli, a członkowie dostają powiadomienie z wynikiem | S-04, S-06    | US-01, FR-008, FR-009, FR-010, FR-012          | proposed |

## Streams

Navigation aid — groups items that share a Prerequisites chain. Canonical ordering still lives in the dependency graph below; this table is the proposed reading order across parallel tracks.

| Stream | Theme                    | Chain                                      | Note                                                                                          |
| ------ | ------------------------ | ------------------------------------------ | --------------------------------------------------------------------------------------------- |
| A      | Od zespołu do setlisty   | `S-01` → `S-02` → `S-05` → `S-06` → `S-07` | Przy szybkości dojścia do działającej wersji ta linia idzie pierwsza, bo kończy się setlistą. |
| B      | Pula utworów             | `S-03`                                     | Dołącza do strumienia A przy `S-05` — runda potrzebuje utworów w puli.                       |
| C      | Reguła wyboru            | `S-04`                                     | Dołącza do strumienia A przy `S-07` — liczba utworów na setliście liczy się przy zamknięciu rundy. |
| D      | Adres dla członków       | `F-01`                                     | Równolegle ze strumieniem A; pozwala sprawdzić cykl drugą osobą i nie blokuje planowania przekrojów. |

## Baseline

What's already in place in the codebase as of 2026-10-04 (auto-researched + user-confirmed).
Foundations below assume these are present and do NOT re-scaffold them.

- **Frontend:** present — routing stron i podłączone formularze logowania (`src/pages`, `src/pages/auth/signin.astro`)
- **Backend / API:** partial — aplikacja serwerowa i handlery logowania istnieją; brak obsługi zespołu, puli i głosowania
- **Data:** partial — klient bazy jest (`src/lib/supabase.ts`); brak migracji i tabel domenowych
- **Auth:** partial — rejestracja, logowanie i strażnik tras istnieją (`src/middleware.ts`); chroniony jest tylko demonstracyjny dashboard
- **Deploy / infra:** present — aplikacja jest osiągalna pod https://jam-set.k-karpinski.workers.dev/; konfiguracja hosta i CI (lint, build, smoke) są w `wrangler.jsonc` i `.github/workflows/ci.yml`
- **Observability:** absent — brak śledzenia błędów, metryk i middleware logów w aplikacji

## Foundations

### F-01: App reachable for a second member

- **Outcome:** (foundation) drugi członek może otworzyć aplikację pod stałym adresem
- **Change ID:** first-workers-deploy
- **PRD refs:** US-01
- **Unlocks:** weryfikację S-02 i S-07 przez drugą osobę, która nie siedzi przy maszynie autora
- **Prerequisites:** —
- **Parallel with:** S-01, S-02, S-03, S-04, S-05, S-06, S-07
- **Blockers:** —
- **Unknowns:**
  - Hostowany projekt logowania i klucze publiczne muszą być dostępne przy wdrożeniu, inaczej drugi członek nie zaloguje się na wspólnym adresie. — Owner: user. Block: no.
- **Risk:** Szkielet hosta już jest; ten fundament tylko domyka adres, pod którym da się sprawdzić zaproszenie i setlistę. Nie poprzedza przekrojów produktowych, bo te da się planować lokalnie.
- **Status:** done

## Slices

### S-01: Create a band

- **Outcome:** użytkownik może utworzyć zespół i zostaje jego ownerem
- **Change ID:** owner-creates-band
- **PRD refs:** US-01, FR-001, FR-002
- **Prerequisites:** —
- **Parallel with:** F-01
- **Blockers:** —
- **Unknowns:** —
- **Risk:** Rejestracja i logowanie są już w stanie bazowym, więc ten przekrój ich nie buduje od nowa. Granica członkostwa powstaje razem z zespołem, bo pula i głosy mają być widoczne tylko dla członków.
- **Status:** in-progress

### S-02: Join by invite link

- **Outcome:** użytkownik może dołączyć do zespołu przez link zaproszenia
- **Change ID:** join-band-by-invite
- **PRD refs:** US-01, FR-003
- **Prerequisites:** S-01
- **Parallel with:** S-03, S-04, F-01
- **Blockers:** —
- **Unknowns:** —
- **Risk:** Drugi członek musi mieć jak wejść, zanim runda sprawdzi głosowanie więcej niż jednej osoby.
- **Status:** proposed

### S-03: Add a song to the pool

- **Outcome:** członek może dodać utwór do puli zespołu i ją zobaczyć
- **Change ID:** add-song-to-pool
- **PRD refs:** US-01, FR-004
- **Prerequisites:** S-01
- **Parallel with:** S-02, S-04, F-01
- **Blockers:** —
- **Unknowns:** —
- **Risk:** Pula musi istnieć, zanim owner wylosuje utwory. Wspólna lista jest pierwszym miejscem, gdzie widać, że utwory zespołu widzą tylko członkowie.
- **Status:** proposed

### S-04: Setlist size rule

- **Outcome:** owner może ustawić, ile utworów z rundy wchodzi na setlistę
- **Change ID:** owner-sets-setlist-size
- **PRD refs:** US-01, FR-011
- **Prerequisites:** S-01
- **Parallel with:** S-02, S-03, S-05, S-06, F-01
- **Blockers:** —
- **Unknowns:** —
- **Risk:** Reguła nie jest potrzebna, żeby uruchomić rundę, więc może powstawać równolegle z pulą i ocenami. Setlista nie może się zamknąć bez niej.
- **Status:** proposed

### S-05: Start a voting round

- **Outcome:** owner może uruchomić rundę głosowania, a członkowie widzą w aplikacji powiadomienie o starcie
- **Change ID:** owner-starts-voting-round
- **PRD refs:** US-01, FR-005, FR-006
- **Prerequisites:** S-02, S-03
- **Parallel with:** S-04, F-01
- **Blockers:** —
- **Unknowns:**
  - Kto wchodzi do rundy, jeśli ktoś dołączy do zespołu po jej starcie? — Owner: user. Block: no.
- **Risk:** Runda startuje dopiero gdy da się zaprosić drugą osobę i w puli są utwory. Wcześniej „głos wszystkich” niczego nie sprawdza. Powiadomienie w aplikacji pojawia się tutaj po raz pierwszy.
- **Status:** proposed

### S-06: Rate songs in a round

- **Outcome:** członek, w tym owner, może ocenić każdy wylosowany utwór w skali 1–5, po kolei
- **Change ID:** member-rates-round-songs
- **PRD refs:** US-01, FR-007
- **Prerequisites:** S-05
- **Parallel with:** S-04, F-01
- **Blockers:** —
- **Unknowns:** —
- **Risk:** Oceny są ostatnim wkładem użytkownika przed setlistą. Wynik nie powstaje, dopóki nie zagłosują wszyscy członkowie rundy.
- **Status:** proposed

### S-07: Rehearsal setlist

- **Outcome:** użytkownik może zobaczyć setlistę na próbę po głosach wszystkich; utwory spoza niej zostają w puli, a członkowie dostają powiadomienie z wynikiem
- **Change ID:** rehearsal-setlist-from-votes
- **PRD refs:** US-01, FR-008, FR-009, FR-010, FR-012
- **Prerequisites:** S-04, S-06
- **Parallel with:** F-01
- **Blockers:** —
- **Unknowns:**
  - Jak uporządkować utwory o tej samej średniej ocen, żeby wynik był jednoznaczny? — Owner: user. Block: no.
- **Risk:** To najwcześniejszy moment, w którym widać setlistę. Wcześniejsze przekroje tylko zbierają zespół, pulę, regułę i oceny.
- **Status:** proposed

## Backlog Handoff

GitHub milestone: [M-1: First rehearsal setlist](https://github.com/kkarpinski-cmd/10xdev/milestone/1)
Linear project: [JamSet](https://linear.app/10xxxdev/project/jamset-fdfef5c27265) — milestone [M-1: First rehearsal setlist](https://linear.app/10xxxdev/project/jamset-fdfef5c27265)

| Roadmap ID | Change ID                    | GitHub | Linear | Suggested issue title                                      | Ready for `/10x-plan` | Notes                                                                 |
| ---------- | ---------------------------- | ------ | ------ | ---------------------------------------------------------- | --------------------- | --------------------------------------------------------------------- |
| F-01       | first-workers-deploy         | #1     | 10X-7  | Publish the app at an address a second member can open    | no                    | Wdrożone: https://jam-set.k-karpinski.workers.dev/ |
| S-01       | owner-creates-band           | #2     | 10X-6  | Signed-in user creates a band                             | yes                   | —                                                                     |
| S-02       | join-band-by-invite          | #3     | 10X-8  | Join a band with an invite link                           | no                    | Czeka na S-01.                                                        |
| S-03       | add-song-to-pool             | #4     | 10X-5  | Add a song to the band pool                               | no                    | Czeka na S-01.                                                        |
| S-04       | owner-sets-setlist-size      | #5     | 10X-9  | Set how many songs from a round make the setlist          | no                    | Czeka na S-01. Może iść równolegle z S-02 i S-03.                     |
| S-05       | owner-starts-voting-round    | #6     | 10X-10 | Start a voting round and notify in the app                | no                    | Czeka na S-02 i S-03.                                                 |
| S-06       | member-rates-round-songs     | #7     | 10X-11 | Rate drawn songs on a 1–5 scale                           | no                    | Czeka na S-05.                                                        |
| S-07       | rehearsal-setlist-from-votes | #8     | 10X-12 | Rehearsal setlist after every member has voted            | no                    | Czeka na S-04 i S-06.                                                 |

## Open Roadmap Questions

Brak. Wersja PRD nie zawiera otwartych pytań, a ten przebieg nie dodał pytania, które dotyczy więcej niż jednego przekroju. Pytania przy S-05 i S-07 zostają przy tych przekrojach i nie blokują planowania.

## Parked

- **Integracja z katalogiem albo odsłuchem w aplikacji** — Why parked: PRD §Non-Goals; w tej wersji wystarcza link zewnętrzny.
- **Powiadomienia poza aplikacją (email, push)** — Why parked: PRD §Non-Goals; powiadomienia w aplikacji wchodzą w S-05 i S-07.
- **Natywna aplikacja mobilna** — Why parked: PRD §Non-Goals; ta wersja jest aplikacją webową.
- **Publiczne wyszukiwanie zespołów** — Why parked: PRD §Non-Goals; dołączenie tylko przez zaproszenie (S-02).
- **Logowanie przez zewnętrznego dostawcę tożsamości** — Why parked: PRD §Access Control; poza tą wersją. Logowanie e-mailem i hasłem już jest w stanie bazowym.

## Milestone History

## Done

- **F-01: (foundation) drugi członek może otworzyć aplikację pod stałym adresem** — Done 2026-10-04. Live at https://jam-set.k-karpinski.workers.dev/. Lesson: —.
