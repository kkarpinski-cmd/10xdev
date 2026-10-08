---
name: update-status
description: >-
  Set one roadmap slice status and sync it to context/foundation/roadmap.md,
  the matching GitHub issue, and the matching Linear issue via MCP. Use when
  the user invokes /update-status and gives a task plus a status.
disable-model-invocation: true
---

# /update-status — Status przekroju

Ustaw status jednego przekroju z `context/foundation/roadmap.md` i zapisz ten sam status w trzech miejscach: roadmapa, issue GitHub, issue Linear. Identyfikatory biorą się z tabeli `## Backlog Handoff`.

Nie commituj i nie pushuj. Nie zamykaj kamienia milowego i nie uruchamiaj `/10x-archive`. Każde przejście jest dozwolone, także cofnięcie — użytkownik podaje status wprost.

## Wywołanie

```
/update-status <task> <status>
```

`<task>` to jedno z: `F-01` / `S-01`, Change ID (`owner-creates-band`), `#2` albo `2`, identyfikator Linear (`10X-6`).

`<status>` (bez rozróżniania wielkości liter):

| Podany token | Status roadmapy |
| --- | --- |
| `proposed` | `proposed` |
| `ready`, `gotowy` | `ready` |
| `planning`, `planowanie` | `planning` |
| `in-progress`, `in progress`, `w toku` | `in-progress` |
| `done`, `zrobione`, `ukończone` | `done` |
| `blocked`, `zablokowany` | `blocked` |

Ostatni token (albo dwa ostatnie, gdy tworzą `in progress` lub `w toku`) to status. Reszta to task. `gotowe` nie jest aliasem — dopytaj, czy chodzi o `ready`, czy o `done`.

Gdy brakuje taska albo statusu, wypisz przykłady powyżej i **zatrzymaj się**. Nie zgaduj przekroju z „następny” ani z bieżącej gałęzi.

## 1. Rozwiąż przekrój

Przeczytaj `context/foundation/roadmap.md`. W `## Backlog Handoff` znajdź dokładnie jeden wiersz. Dopasowanie:

- `F-NN` / `S-NN` → kolumna **Roadmap ID**
- kebab-case → kolumna **Change ID**
- `#N` lub sama liczba → kolumna **GitHub** (`#2` pasuje do `#2`)
- `10X-N` → kolumna **Linear**

Zero lub więcej niż jeden wiersz → wypisz kandydatów i zatrzymaj się.

Z wiersza i z bloku `### <ID>:` zapisz: Roadmap ID, Change ID, Outcome (`- **Outcome:**`), numer issue GitHub, identyfikator Linear, bieżący `- **Status:**`.

Repozytorium GitHub weź z `gh repo view --json nameWithOwner -q .nameWithOwner` w katalogu projektu. Gdy `gh` nie działa, użyj owner/repo z linku milestone w `## Backlog Handoff`.

## 2. Roadmapa

Edytuj tylko dopasowany przekrój.

1. Komórka **Status** w wierszu `## At a glance`.
2. Linia `- **Status:**` w bloku `### <ID>:`.
3. Komórka **Ready for `/10x-plan`** w `## Backlog Handoff`: `yes` wyłącznie dla `ready`, w każdym innym statusie `no`.
4. Frontmatter: `updated:` na dzisiejszą datę `YYYY-MM-DD` (`date +%F`). Zostaw pozostałe klucze.
5. Wejście w `done`: jeśli pod `## Done` nie ma punktu zaczynającego się od `- **<ID>:` , dopisz na końcu sekcji:

   ```
   - **<ID>: <Outcome>** — Done <YYYY-MM-DD>. Lesson: —.
   ```

   Nie duplikuj punktu, który już jest (także wariantu z archiwum).
6. Wyjście z `done`: usuń punkt `## Done` tego `<ID>` tylko wtedy, gdy zawiera `— Done `. Punktu z `Archived` nie ruszaj.

Nie zmieniaj Outcome, Prerequisites, kolejności wierszy ani `milestone_status`. Nie przeformatowuj całego pliku.

Gdy roadmapa ma już ten status, krok 2 ogranicza się do naprawy dryfu (punkty 5–6, jeśli sekcja `## Done` się nie zgadza) i i tak synchronizujesz GitHub oraz Linear.

## 3. GitHub

Issue: numer z kolumny **GitHub**.

1. `gh issue view <n> --json number,state,labels,body`.
2. Zdejmij każdą etykietę `status:*`. Dodaj `status:<status>`. Gdy etykiety nie ma w `gh label list`, utwórz ją: `gh label create "status:<status>" --description "Roadmap status: <status>"`.
3. W treści issue podmień wyłącznie linię `- Status: …` na `- Status: <status>`. Resztę body zostaw. Zapisz przez `gh issue edit <n> --body-file`.
4. Status `done` i issue otwarte → `gh issue close <n> --reason completed`.
5. Status inny niż `done` i issue zamknięte → `gh issue reopen <n>`.

`gh` niezalogowane albo błąd API: nie udawaj sukcesu. Dokończ Linear i wypisz, że GitHub został pominięty.

## 4. Linear

Serwer MCP: włączony serwer Linear (w tym repozytorium `plugin-linear-linear`). **Przed wywołaniem** przeczytaj deskryptory `get_issue` i `save_issue`.

1. `get_issue` z `id` równym identyfikatorowi z kolumny **Linear** (np. `10X-6`).
2. `save_issue` z tym samym `id`, polem `state` ustawionym na nazwę workflow oraz `patch`, które podmienia jedną linię statusu w opisie.

Mapowanie statusu roadmapy na nazwę stanu Linear (zespół z pola `team` issue, tutaj `10xxxdev`):

| Status roadmapy | `state` |
| --- | --- |
| `proposed` | `Backlog` |
| `blocked` | `Backlog` |
| `ready` | `Todo` |
| `planning` | `Todo` |
| `in-progress` | `In Progress` |
| `done` | `Done` |

W opisie issue linia ma postać `* Status: <stary>`. `patch` to jedna operacja `replace` z dokładnym `old_string` z `get_issue` i `new_string` `* Status: <status>`. Przekazuj markdown ze zwykłymi nowymi liniami, nie z sekwencjami `\\n`.

Gdy linia statusu nie występuje dokładnie raz, i tak ustaw `state`, a w podsumowaniu napisz, że opis nie został podmieniony. Gdy `save_issue` odrzuci nazwę stanu, wywołaj `list_issue_statuses` dla `team` z issue, wypisz dostępne nazwy i zatrzymaj się — nie wybieraj innego stanu.

## 5. Podsumowanie

Wypisz jeden blok. Każda powierzchnia ma własny wynik. Nie cofaj zapisu, który się udał.

```
<ID> <change-id>  <stary> → <status>

roadmap.md   <OK | bez zmiany | błąd: …>
GitHub       #<n>  <OK: status:<status>, open|closed | pominięte: …>
Linear       <10X-n>  <OK: <state> | pominięte: …>
```

Gdy po tej zmianie każdy `F-NN` i `S-NN` ma status `done`, dopisz jedną linię: kamień milowy można zamknąć przez `/10x-roadmap`. Tego skill nie zamyka.
