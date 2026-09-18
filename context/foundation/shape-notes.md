---
project: null
context_type: greenfield
product_type: web-app
target_scale:
  users: small
created: 2026-09-18
updated: 2026-09-18
timeline_budget:
  mvp_weeks: 7
  hard_deadline: 2026-11-04
  after_hours_only: true
checkpoint:
  current_phase: 8
  phases_completed: [1, 2, 3, 4, 5, 6, 7]
  gray_areas_resolved:
    - topic: pain category
      decision: "coordination overhead + data trapped in Messenger + decision paralysis + workflow friction"
    - topic: primary persona scope
      decision: "any small band (2+ musicians), not limited to user's personal circle"
    - topic: insight vs status quo
      decision: "async propose-and-rate flow before rehearsal; shared playlist alone is insufficient"
    - topic: auth strategy
      decision: "email + password for MVP; Google OAuth deferred"
    - topic: access model
      decision: "owner + members — owner starts voting rounds; members add to pool and vote"
    - topic: vote mechanism
      decision: "rating 1-5 per song, one by one through the round"
    - topic: selection rule
      decision: "top N from round by average rating (e.g. top 3 of 10)"
    - topic: owner votes
      decision: "owner votes like any member"
    - topic: small pool
      decision: "when pool < 10, vote on all available songs"
  frs_drafted: 11
  quality_check_status: accepted
---

## Seed idea

Aplikacja dla muzyków jamujących w duecie/małym zespole. Problem: brak wspólnej setlisty, utwory giną w Messengerze. Rozwiązanie: zespół (2+ użytkowników), propozycje utworów na następną próbę, wzajemne oceny 1–5, reguła wyboru (np. 3 z 10) buduje playlistę próby. MVP: tytuł, artysta, link zewnętrzny; bez Spotify. Docelowo: integracja Spotify. Auth: na start proste logowanie; Google OAuth opcjonalnie później.

## Vision & Problem Statement

Małe zespoły muzyczne (duet lub kilka osób) przed wspólnym jamem lub próbą zaczynają od pustej kartki — nie wiedzą, od jakich utworów zacząć. Propozycje utworów trafiają do Messengera i giną w historii wiadomości. Brakuje jednego miejsca na koordynację, asynchroniczne propozycje i wspólną decyzję przed spotkaniem.

Wspólna playlista Spotify lub notatka w Docs nie wystarcza: zespół potrzebuje procesu, w którym członkowie w swoim czasie budują pulę utworów, a głosowanie uruchamiane przez ownera losuje podzbiór do oceny — tak powstaje setlista na następną próbę.

## User & Persona

**Primary persona:** Muzyk w małym zespole hobbystycznym (2+ osób) — nie ograniczone do jednego kręgu znajomych twórcy. Spotyka się z zespołem na jamy/próby. W momencie planowania następnego spotkania chce szybko ustalić, co grać, zamiast przeszukiwać Messenger lub zaczynać od zera.

## Access Control

- **MVP auth:** email + hasło (proste logowanie)
- **Później (poza MVP):** Google OAuth — opcjonalne rozszerzenie, nie w pierwszej wersji
- **Role owner:** tworzy zespół; jedyny może uruchomić głosowanie
- **Role member:** dodaje utwory do puli we własnym czasie; głosuje, gdy owner uruchomi rundę głosowania
- **Zakres zespołu:** 2+ użytkowników w ramach jednego zespołu/bandu

## Success Criteria

### Primary

- Zespół przechodzi pełny cykl: logowanie → zespół → asynchroniczne dodawanie utworów do puli → owner uruchamia głosowanie (losowe 10 z puli) → członkowie głosują po kolei → po głosach wszystkich: wynik setlisty na próbę; niewybrane utwory zostają w puli.

### Secondary

- Zaproszenie do zespołu linkiem (gdy starczy czasu po core flow).

### Guardrails

- Prywatność zespołu — tylko członkowie widzą pulę, głosowanie i wyniki.
- Uczciwość głosowania — każdy członek głosuje raz w rundzie; wynik setlisty jest przewidywalny i zgodny z regułą.

## Timeline acknowledgment

Acknowledged on 2026-09-18: ~7-week MVP (deadline 2026-11-04, ~10 h/week after hours) requires sustained dedication; user accepted.

## Functional Requirements

### Authentication

- FR-001: User can register and log in with email and password. Priority: must-have
  > Socrates: No counter-argument; it stands as written.

### Bands

- FR-002: User can create a band and becomes its owner. Priority: must-have
  > Socrates: No counter-argument; it stands as written.
- FR-003: User can join a band via invite link. Priority: must-have
  > Socrates: No counter-argument; it stands as written.
- FR-011: Owner can configure the band's selection rule (e.g. how many songs from the voting round make the setlist). Priority: must-have
  > Socrates: No counter-argument; it stands as written.

### Song pool

- FR-004: Member can add a song (title, artist, external link) to the band pool at any time. Priority: must-have
  > Socrates: No counter-argument; it stands as written.
- FR-010: Songs not selected in a voting round remain in the pool for the next round. Priority: must-have
  > Socrates: No counter-argument; it stands as written.

### Voting rounds

- FR-005: Owner can start a voting round; system randomly selects 10 songs from the pool. Priority: must-have
  > Socrates: No counter-argument; it stands as written.
- FR-006: Member receives notification when a voting round starts. Priority: must-have
  > Socrates: No counter-argument; it stands as written.
- FR-007: Member (including owner) can rate each song in the active round 1–5, proceeding through songs one by one. Priority: must-have
  > Socrates: No counter-argument; it stands as written.
- FR-008: System builds rehearsal setlist when all members have voted, selecting top N songs from the round by average rating per the band's rule (e.g. top 3 of 10). Priority: must-have
  > Socrates: No counter-argument; it stands as written.
- FR-009: All members receive notification with the setlist result after voting completes. Priority: must-have
  > Socrates: No counter-argument; it stands as written.

### Setlists

- FR-012: User can view the current rehearsal setlist. Priority: must-have
  > Socrates: No counter-argument; it stands as written.

## User Stories

### US-01: Zespół ustala setlistę przez pulę i rundę głosowania

- **Given** zalogowany członek zespołu i utwory dodane do puli we własnym czasie
- **When** owner uruchamia głosowanie (system losuje 10 utworów z puli), członkowie dostają powiadomienie i głosują po kolei przez utwory, a po oddaniu głosów przez wszystkich system stosuje regułę zespołu
- **Then** wszyscy członkowie dostają wiadomość z utworami wchodzącymi na następną próbę; utwory niewybrane zostają w puli

#### Acceptance Criteria

- Tylko owner może uruchomić rundę głosowania
- Gdy pula ≥ 10: losowane jest 10 utworów; gdy pula < 10: głosowanie obejmuje wszystkie dostępne utwory z puli
- Każdy członek (w tym owner) ocenia każdy wylosowany utwór skalą 1–5, przechodząc po kolei
- Setlista = top N utworów z rundy według średniej ocen (np. 3 z 10), zgodnie z regułą zespołu
- Setlista powstaje dopiero po zagłosowaniu przez wszystkich członków
- Niewybrane utwory wracają do puli na następną rundę
- Tylko członkowie zespołu widzą pulę, głosowanie i wyniki

## Business Logic

Aplikacja wybiera utwory na następną próbę, losując do 10 pozycji z puli zespołu, zbierając oceny 1–5 od wszystkich członków i promując top N według średniej do setlisty, a niewybrane utwory zostawiając w puli.

Wejścia: pula utworów zespołu, reguła wyboru (N), losowy podzbiór (do 10), oceny członków 1–5. Wynik: setlista na następną próbę + utwory pozostałe w puli. Użytkownik napotyka regułę, gdy owner uruchamia głosowanie, a po głosach wszystkich widzi wynik setlisty.

## Non-Functional Requirements

- Powiadomienia o starcie głosowania i wyniku setlisty są widoczne in-app dla członków zespołu (MVP bez email/push).
- Tylko członkowie zespołu mają dostęp do puli, rund głosowania i wyników (prywatność zespołu).

## Non-Goals

- Integracja Spotify / odsłuch utworów in-app — link zewnętrzny w MVP wystarczy; odsłuch poza aplikacją.
- Powiadomienia email/push — MVP ogranicza się do powiadomień in-app.
- Natywna aplikacja mobilna — MVP to aplikacja webowa.
- Publiczne wyszukiwanie zespołów — dołączenie tylko przez zaproszenie.

## Quality cross-check

All items present: Access Control, Business Logic (one-sentence rule), project artifacts, timeline-cost acknowledgment, Non-Goals. Status: accepted.

## Forward: tech-stack

- Google OAuth — opcjonalne rozszerzenie po MVP (email + hasło na start).
- Integracja Spotify — docelowy smaczek po MVP.
