---
project: JamSet
version: 1
status: draft
created: 2026-10-04
updated: 2026-10-04
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

**M-1: Pierwsza setlista z głosowania** — Status: open

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
| F-01 | first-workers-deploy         | (foundation) drugi członek może otworzyć aplikację pod stałym adresem                                                    | —             | US-01                                          | ready    |
| S-01 | owner-creates-band           | użytkownik może utworzyć zespół i zostaje jego ownerem                                                                   | —             | US-01, FR-001, FR-002                          | ready    |
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
- **Deploy / infra:** partial — konfiguracja hosta i CI (lint, build, smoke) istnieją (`wrangler.jsonc`, `.github/workflows/ci.yml`); aplikacja nie jest jeszcze osiągalna pod publicznym adresem
- **Observability:** absent — brak śledzenia błędów, metryk i middleware logów w aplikacji

## Foundations

### F-01: Aplikacja osiągalna dla drugiego członka

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
- **Status:** ready

## Slices

### S-01: Założenie zespołu

- **Outcome:** użytkownik może utworzyć zespół i zostaje jego ownerem
- **Change ID:** owner-creates-band
- **PRD refs:** US-01, FR-001, FR-002
- **Prerequisites:** —
- **Parallel with:** F-01
- **Blockers:** —
- **Unknowns:** —
- **Risk:** Rejestracja i logowanie są już w stanie bazowym, więc ten przekrój ich nie buduje od nowa. Granica członkostwa powstaje razem z zespołem, bo pula i głosy mają być widoczne tylko dla członków.
- **Status:** ready

### S-02: Dołączenie linkiem zaproszenia

- **Outcome:** użytkownik może dołączyć do zespołu przez link zaproszenia
- **Change ID:** join-band-by-invite
- **PRD refs:** US-01, FR-003
- **Prerequisites:** S-01
- **Parallel with:** S-03, S-04, F-01
- **Blockers:** —
- **Unknowns:** —
- **Risk:** Drugi członek musi mieć jak wejść, zanim runda sprawdzi głosowanie więcej niż jednej osoby.
- **Status:** proposed

### S-03: Dodanie utworu do puli

- **Outcome:** członek może dodać utwór do puli zespołu i ją zobaczyć
- **Change ID:** add-song-to-pool
- **PRD refs:** US-01, FR-004
- **Prerequisites:** S-01
- **Parallel with:** S-02, S-04, F-01
- **Blockers:** —
- **Unknowns:** —
- **Risk:** Pula musi istnieć, zanim owner wylosuje utwory. Wspólna lista jest pierwszym miejscem, gdzie widać, że utwory zespołu widzą tylko członkowie.
- **Status:** proposed

### S-04: Reguła wielkości setlisty

- **Outcome:** owner może ustawić, ile utworów z rundy wchodzi na setlistę
- **Change ID:** owner-sets-setlist-size
- **PRD refs:** US-01, FR-011
- **Prerequisites:** S-01
- **Parallel with:** S-02, S-03, S-05, S-06, F-01
- **Blockers:** —
- **Unknowns:** —
- **Risk:** Reguła nie jest potrzebna, żeby uruchomić rundę, więc może powstawać równolegle z pulą i ocenami. Setlista nie może się zamknąć bez niej.
- **Status:** proposed

### S-05: Start rundy głosowania

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

### S-06: Ocenianie utworów w rundzie

- **Outcome:** członek, w tym owner, może ocenić każdy wylosowany utwór w skali 1–5, po kolei
- **Change ID:** member-rates-round-songs
- **PRD refs:** US-01, FR-007
- **Prerequisites:** S-05
- **Parallel with:** S-04, F-01
- **Blockers:** —
- **Unknowns:** —
- **Risk:** Oceny są ostatnim wkładem użytkownika przed setlistą. Wynik nie powstaje, dopóki nie zagłosują wszyscy członkowie rundy.
- **Status:** proposed

### S-07: Setlista na próbę

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

| Roadmap ID | Change ID                    | Suggested issue title                                              | Ready for `/10x-plan` | Notes                                                                 |
| ---------- | ---------------------------- | ------------------------------------------------------------------ | --------------------- | --------------------------------------------------------------------- |
| F-01       | first-workers-deploy         | Udostępnić aplikację pod adresem, który otworzy drugi członek     | yes                   | Plan tej zmiany już jest. Dokończyć wykonanie, nie pisać drugiego planu. |
| S-01       | owner-creates-band           | Założenie zespołu przez zalogowanego użytkownika                  | yes                   | —                                                                     |
| S-02       | join-band-by-invite          | Dołączenie do zespołu linkiem zaproszenia                         | no                    | Czeka na S-01.                                                        |
| S-03       | add-song-to-pool             | Dodanie utworu do puli zespołu                                    | no                    | Czeka na S-01.                                                        |
| S-04       | owner-sets-setlist-size      | Ustawienie, ile utworów z rundy wchodzi na setlistę               | no                    | Czeka na S-01. Może iść równolegle z S-02 i S-03.                     |
| S-05       | owner-starts-voting-round    | Uruchomienie rundy głosowania i powiadomienie w aplikacji         | no                    | Czeka na S-02 i S-03.                                                 |
| S-06       | member-rates-round-songs     | Ocena wylosowanych utworów w skali 1–5                            | no                    | Czeka na S-05.                                                        |
| S-07       | rehearsal-setlist-from-votes | Setlista na próbę po głosach wszystkich członków                  | no                    | Czeka na S-04 i S-06.                                                 |

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
