---
project: JamSet
researched_at: 2026-09-29
recommended_platform: Cloudflare Workers
runner_up: Railway
context_type: mvp
tech_stack:
  language: TypeScript
  framework: Astro 7 (SSR) + React 19
  runtime: Cloudflare Workers (workerd) via @astrojs/cloudflare ^14.3.1
---

## Recommendation

**Deploy on Cloudflare Workers.**

Cloudflare Workers jest jedyną platformą z krótkiej listy, która daje realny darmowy próg produkcyjny (100 000 żądań na dobę, żądania do zasobów statycznych darmowe i nielimitowane) przy zerowym koszcie migracji — repo JamSetu jest już skonfigurowane pod ten runtime (`@astrojs/cloudflare` ^14.3.1, `wrangler` ^4.131.1, `wrangler.jsonc` z `main: "@astrojs/cloudflare/entrypoints/server"` i bindingiem `ASSETS`). Platforma zdobywa komplet ocen we wszystkich pięciu kryteriach: pełna obsługa przez CLI (`wrangler deploy` / `rollback` / `tail` / `secret put`), model w pełni zarządzany, dokumentacja publikowana jako markdown i `llms.txt`, deterministyczny model wersji i wdrożeń oraz katalog oficjalnych zdalnych serwerów MCP.

Decyzję dodatkowo przesądza profil projektu: skala „small" z PRD i deadline 2026-11-04 przy pracy solo po godzinach premiują platformę, na której nie trzeba nic przekonfigurowywać. Alternatywy wymagałyby wymiany adaptera Astro, konfiguracji i CI — co przy siedmiotygodniowym budżecie czasowym jest kosztem bez pokrycia w korzyściach.

**Ważna korekta wobec `tech-stack.md`:** dokument deklaruje `deployment_target: cloudflare-pages`, ale `@astrojs/cloudflare` od wersji 13 **całkowicie usunął wsparcie dla Cloudflare Pages**. Celem jest Cloudflare Workers ze Static Assets. Pages nie jest wygaszane jako produkt, ale Cloudflare kieruje wszystkie nowe projekty na Workers i tam trafiają wszystkie inwestycje w platformę.

## Platform Comparison

| Platforma | CLI-first | Managed/Serverless | Dokumentacja czytelna dla agentów | Stabilne API wdrożeniowe | MCP / Integracja | Suma |
|---|---|---|---|---|---|---|
| Cloudflare Workers | Pass | Pass | Pass | Pass | Pass | 5 Pass |
| Netlify | Pass | Pass | Pass | Pass | Pass | 5 Pass |
| Railway | Pass | Pass | Pass | Pass | Pass | 5 Pass |
| Render | Pass | Pass | Pass | Pass | Pass | 5 Pass |
| Vercel | Pass | Pass | Pass | Pass | Partial | 4 Pass, 1 Partial |
| Fly.io | Pass | Partial | Pass | Pass | Fail | 3 Pass, 1 Partial, 1 Fail |

**Cloudflare Workers.** `wrangler` pokrywa pełną pętlę operacyjną bez dashboardu: `deploy`, `rollback`, `versions upload/deploy/list`, `tail`, `secret put`. Model w pełni zarządzany, bez cold startów. Dokumentacja dostępna jako markdown (adresy `.md`, przyciski „Copy as Markdown") oraz `llms.txt`. Model wersji i wdrożeń jest rozdzielony i deterministyczny — można wgrać wersję bez przekierowania ruchu. Katalog oficjalnych zdalnych serwerów MCP (dokumentacja, bindings, Browser Run, GraphQL/analityka) z OAuth. Koszt dla JamSetu: **$0**.

**Netlify.** Technicznie komplet ocen — `netlify` CLI, oficjalny `@netlify/mcp`, aktywnie utrzymywany `@astrojs/netlify`, a od Astro 5.12 `astro dev` działa bez CLI dzięki pluginowi Vite. Wypadł z krótkiej listy na wadze kosztowej: nowy model kredytowy daje na darmowym planie 300 kredytów miesięcznie z **twardym limitem bez możliwości doładowania**, gdzie każdy produkcyjny deploy kosztuje 15 kredytów (~20 wdrożeń/mies. zanim doliczy się compute SSR, transfer i żądania). Przy ustawieniu `auto-deploy-on-merge` z `tech-stack.md` to realne ryzyko, a przekroczenie pauzuje **wszystkie** projekty na koncie do końca cyklu.

**Railway.** Bardzo dobry CLI, oficjalny serwer MCP (`mcp.railway.com` plus wariant lokalny `railway mcp local`), runtime Node bez limitu CPU na wywołanie i bez cold startów. Plan Free daje $1 kredytu miesięcznie przy 1 vCPU / 0,5 GB i jednej replice; Hobby to $5/mies. z $5 wliczonego zużycia. Przegrywa z Cloudflare tylko dlatego, że wymaga wymiany adaptera na `@astrojs/node` i wprowadza stały koszt tam, gdzie Cloudflare daje zero — ale jest najlepszą ścieżką ucieczki, jeśli `workerd` okaże się za ciasny.

**Render.** Hostowany serwer MCP (`mcp.render.com/mcp`) z oficjalnymi wtyczkami dla Cursora, CLI z trybem nieinteraktywnym i uwierzytelnianiem kluczem API, blueprinty `render.yaml`. Darmowy web service istnieje naprawdę, ale **zjeżdża po 15 minutach bezczynności i wstaje około minuty**. Dla aplikacji, którą muzyk otwiera raz na kilka dni tuż przed próbą, oznacza to, że praktycznie każde wejście trafia na cold start — to zabija podstawowy scenariusz z PRD. Darmowy Postgres dodatkowo wygasa po 30 dniach. Trzecie miejsce zamiast drugiego właśnie przez to.

**Vercel.** Świetne CLI i dokumentacja (również jako `.md`), ale MCP jest w **publicznej becie** (stan na 2026-09-29), a plan Hobby jest ograniczony regulaminowo do **użytku niekomercyjnego i osobistego** — JamSet dziś się w tym mieści, lecz każda forma monetyzacji, reklamy czy nawet linku z prośbą o wsparcie wymusza przejście na Pro ($20/mies.). Limity Hobby (4 CPU-godziny Active CPU, 360 GB-h pamięci, 1 mln wywołań) są dla tej skali nadmiarowe, ale ich przekroczenie pauzuje projekt na 30 dni bez opcji dokupienia zasobów.

**Fly.io.** Odpadł na dwóch kryteriach. Model kontenerowy z Dockerfile'em przesuwa istotną część odpowiedzialności operacyjnej na dewelopera (ocena „Partial" przy zarządzaniu), a oficjalnego serwera MCP brak. Dodatkowo **darmowy próg został zlikwidowany dla nowych kont** — jest tylko trial ograniczony do 2 godzin VM lub 7 dni. Realny koszt małej aplikacji to ~$4/mies. przy jednej maszynie `shared-cpu-1x` 256 MB z dedykowanym IPv4, a typowo $8-12 po doliczeniu transferu i drugiego środowiska.

### Shortlisted Platforms

#### 1. Cloudflare Workers (Recommended)

Komplet pięciu ocen „Pass", zerowa migracja (repo już skonfigurowane), zerowy koszt przy skali JamSetu, brak cold startów i najbogatszy zestaw oficjalnych serwerów MCP. Dokumentacja jest publikowana w formacie, który agent może czytać bezpośrednio, a rozdzielenie wersji od wdrożeń daje bezpieczną ścieżkę „wgraj, obejrzyj na preview URL, dopiero potem przekieruj ruch".

#### 2. Railway

Również komplet „Pass". Kluczowa przewaga nad rekomendacją: pełny runtime Node bez limitu CPU na wywołanie, więc żadna zależność nie może zablokować buildu z powodu niekompatybilności z `workerd`. To czyni z Railway naturalny plan B — jeśli JamSet napotka bibliotekę CommonJS-only albo wymagającą API Node spoza `nodejs_compat`, migracja tam jest krótsza niż walka z bundlerem. Luka wobec rekomendacji: wymiana adaptera na `@astrojs/node`, stały koszt $5/mies. na planie Hobby i utrata darmowej globalnej dystrybucji.

#### 3. Render

Jedyna platforma z krótkiej listy oferująca **trwale darmowy** runtime Node (750 godzin instancji na miesiąc) z dobrym MCP i CLI. Luka wobec rekomendacji jest jednak dotkliwa dokładnie w scenariuszu JamSetu: zjazd po 15 minutach bezczynności i ~minuta zimnego startu oznaczają, że muzyk otwierający aplikację przed próbą co kilka dni prawie zawsze czeka na ekranie ładowania. Usunięcie tego zachowania wymaga płatnego planu, co likwiduje jedyną przewagę Rendera nad Railwayem.

## Anti-Bias Cross-Check: Cloudflare Workers

### Devil's Advocate — Weaknesses

1. **`workerd` to nie Node, a od Astro 6 dotyczy to również `astro dev` i prerenderingu.** Nowe środowisko deweloperskie nie obsługuje składni CommonJS (`require`, `module.exports`). Obecne zależności działają, ale pierwsza biblioteka spoza ESM — do wysyłki maila, generowania ICS, kryptografii — wywali się przy buildzie albo w dev, nie przy deployu. Obejścia istnieją (`optimizeDeps.include` w pluginie Vite, `prerenderEnvironment: 'node'`), ale wymagają archeologii per zależność.
2. **10 ms CPU na wywołanie na darmowym planie to twardy limit, nie średnia.** Render widoku głosowania z dziesięcioma utworami się zmieści, ale cięższe strony — historia rund, agregacja średnich ocen liczona po stronie Workera — mogą zacząć zwracać błędy 1102 losowym użytkownikom. Plan płatny podnosi limit do 30 sekund domyślnie (do 5 minut maks.), ale kosztuje minimum $5/mies.
3. **Dokumentowany cel wdrożenia w `tech-stack.md` już nie istnieje.** Deklaracja `cloudflare-pages` jest nieaktualna: adapter od v13 usunął obsługę Pages. Cloudflare nadal hostuje żywy, wysoko pozycjonowany poradnik „Deploy an Astro site to Cloudflare Pages", który każe użyć tego samego adaptera — pójście za nim daje konfigurację, która nie zadziała, i trudny do zdiagnozowania błąd.
4. **Sekrety żyją w trzech miejscach bez jednego źródła prawdy.** `astro:env/server` odczytuje je w runtime, ale na Workers muszą być ustawione przez `wrangler secret put`, lokalnie przez `.dev.vars`, a w CI przez GitHub Secrets. Rotacja klucza Supabase zaktualizowana w dwóch z trzech miejsc zawiedzie po cichu w dokładnie jednym środowisku.
5. **`wrangler rollback` nie cofa danych i bywa wprost zablokowany.** Wycofanie Workera po nieudanej migracji Supabase zostawia stary kod na nowym schemacie. Niezależnie od tego Cloudflare odrzuca rollback, jeśli między wersjami zmieniły się zasoby platformy — na przykład po dodaniu bindingu KV dla sesji Astro nie da się wrócić do wersji sprzed zmiany.

### Pre-Mortem — How This Could Fail

Zespół wdrożył JamSet na Workers w tydzień i przez pierwsze trzy tygodnie wszystko szło gładko — prosty CRUD puli utworów renderował się dobrze poniżej limitu CPU. Problem zaczął się przy FR-006 i FR-009, czyli powiadomieniach o starcie głosowania i wyniku setlisty. Założenie, że „in-app" znaczy „bez infrastruktury", okazało się błędne: powiadomienia wymagały odpytywania stanu rundy przy każdym załadowaniu strony, co przy pięciu osobach odświeżających widok głosowania zamieniło lekki ruch w setki wywołań SSR dziennie. Potem doszła agregacja średnich ocen liczona w Workerze zamiast w Postgresie i pojedyncze rendery zaczęły przekraczać 10 ms CPU, zwracając błędy 1102 losowym użytkownikom. Diagnoza zajęła dwa wieczory, bo lokalnie problem nigdy się nie powtarzał. Przejście na plan płatny naprawiłoby to za pięć dolarów, ale w międzyczasie dodano bibliotekę do formatowania dat, która okazała się CommonJS-only, i build przestał przechodzić na cztery dni przed deadline'em 4 listopada. Migracja na runtime Node w tym momencie oznaczała wymianę adaptera, konfiguracji i CI naraz.

### Unknown Unknowns

- Limit 100 000 żądań na dobę obowiązuje **na całe konto** Cloudflare (reset o północy UTC), nie na projekt. Drugi eksperyment na tym samym koncie zjada budżet JamSetu.
- Z drugiej strony **żądania do zasobów statycznych są darmowe i nielimitowane**, a Cloudflare nie nalicza opłat za podzapytania wychodzące z Workera. Płatną powierzchnią są wyłącznie rendery SSR i trasy API, więc realny sufit jest znacznie wyżej, niż sugeruje sama liczba „100k żądań".
- Dokumentacja Astro zaleca prefiks `wrangler types &&` przed `astro dev`, `astro build` i `astro preview`, żeby typy środowiska nie rozjechały się z konfiguracją Wranglera. `package.json` JamSetu tego nie robi — `astro check` w CI może zachowywać się inaczej niż lokalnie.
- `Astro.locals.runtime` zostało **usunięte** w adapterze v13. Kod JamSetu go nie używa (korzysta z `astro:env/server`), ale każdy tutorial i każda odpowiedź modelu sprzed tej zmiany będzie go podsuwać.
- Preview URL-e na Workers są **domyślnie publiczne**. Guardrail prywatności z PRD („tylko członkowie zespołu widzą pulę, głosowanie i wyniki") wymaga albo ochrony przez Cloudflare Access, albo świadomej decyzji, że środowiska preview nigdy nie dostają prawdziwych danych.
- `compatibility_date` w `wrangler.jsonc` to `2026-05-08`, prawie pięć miesięcy wstecz. To bezpieczne, zamrożone zachowanie runtime, ale nowsze poprawki i API nie dotrą bez świadomej aktualizacji tej daty.
- Od Wranglera 4.102.0 istnieje `wrangler deploy --temporary`, który pozwala agentowi wdrożyć projekt bez poświadczeń Cloudflare i zwraca URL do przejęcia wdrożenia w ciągu 60 minut. Repo pinuje `wrangler` ^4.131.1, więc ta ścieżka jest dostępna.

## Operational Story

- **Preview deploys**: `npx wrangler versions upload --preview-alias <nazwa>` tworzy wersję i zwraca stabilny preview URL **bez** przekierowania ruchu produkcyjnego; promocja to `npx wrangler versions deploy`. Preview URL-e są publiczne z założenia — jeśli mają wskazywać na prawdziwą bazę Supabase, trzeba je osłonić Cloudflare Access. Rekomendacja: preview wskazuje na osobny projekt Supabase, nie na produkcję.
- **Secrets**: `SUPABASE_URL` i `SUPABASE_KEY` w trzech miejscach, świadomie — produkcja przez `npx wrangler secret put <NAZWA>` (Workers Secrets, po zapisie nieodczytywalne), lokalnie przez `.dev.vars` w katalogu głównym (gitignorowany), CI przez GitHub Secrets wstrzykiwane do `.env` i `.dev.vars` w workflow. Rotacja musi objąć wszystkie trzy naraz. Odczyt w kodzie wyłącznie przez `astro:env/server`, nigdy przez `process.env`.
- **Rollback**: `npx wrangler rollback` wraca do wersji poprzedzającej ostatnią; `npx wrangler versions list` pokazuje do 100 ostatnich wersji, a `npx wrangler rollback <VERSION_ID>` celuje w konkretną. Czas wycofania to sekundy. Zastrzeżenie: migracje Supabase **nie cofają się razem z Workerem**, a rollback zostanie odrzucony, jeśli między wersjami dodano lub usunięto binding (KV, D1, kolejkę).
- **Approval**: agent może bez nadzoru uruchamiać `wrangler versions upload` (preview), `wrangler tail`, `wrangler versions list` i `wrangler deployments list`. Człowiek zatwierdza: `wrangler deploy` i `wrangler versions deploy` na produkcję, `wrangler secret put` dla klucza Supabase, każdą migrację w `supabase/migrations/` oraz zmianę `compatibility_date`.
- **Logs**: `npx wrangler tail` daje strumień na żywo w terminalu. `observability.enabled: true` jest już ustawione w `wrangler.jsonc`, więc logi trafiają też do Workers Logs z retencją i możliwością zapytań. Do odczytu strukturalnego agent może użyć zdalnego serwera MCP Cloudflare dla obserwowalności oraz `https://docs.mcp.cloudflare.com/mcp` dla aktualnej dokumentacji.

## Risk Register

| Risk | Source | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| Zależność CommonJS-only lub wymagająca API Node spoza `nodejs_compat` blokuje build | Adwokat diabła / Pre-mortem | M | H | Przed dodaniem każdej nowej zależności sprawdzić, czy publikuje ESM i działa na `workerd`. Awaryjnie: `optimizeDeps.include` w pluginie Vite lub `prerenderEnvironment: 'node'` dla stron prerenderowanych. Plan B: migracja na Railway z `@astrojs/node`. |
| Przekroczenie 10 ms CPU na wywołanie → błędy 1102 na produkcji | Adwokat diabła / Pre-mortem | M | H | Agregacje (średnie ocen, top N z rundy) liczyć zapytaniem w Postgresie, nie w Workerze. Przy pierwszym błędzie 1102 przejść na Workers Paid ($5/mies., limit 30 s). |
| Konfiguracja pod Cloudflare Pages z nieaktualnego poradnika | Adwokat diabła / Ustalenie z badań | M | M | Zaktualizować `deployment_target` w `context/foundation/tech-stack.md` na `cloudflare-workers`. Korzystać wyłącznie z poradnika Workers w docs Cloudflare i strony adaptera w docs Astro. Ignorować `developers.cloudflare.com/pages/framework-guides/deploy-an-astro-site/`. |
| Rozjazd sekretów między produkcją, `.dev.vars` i GitHub Secrets | Adwokat diabła | M | M | Rotację klucza Supabase traktować jako jedną atomową procedurę obejmującą wszystkie trzy miejsca. Po rotacji uruchomić `BASE_URL=<url> npm run smoke` na każdym środowisku. |
| Rollback Workera po nieudanej migracji Supabase zostawia stary kod na nowym schemacie | Adwokat diabła | M | H | Migracje projektować jako wstecznie zgodne (najpierw dodaj kolumnę, potem użyj, dopiero w kolejnym wdrożeniu usuń starą). Nigdy nie łączyć migracji łamiącej zgodność z wdrożeniem kodu w jednym kroku. |
| Limit 100k żądań/dobę współdzielony przez całe konto Cloudflare | Nieznane niewiadome | L | M | Trzymać JamSet na osobnym koncie Cloudflare albo nie hostować tam eksperymentów. Monitorować zużycie przez serwer MCP GraphQL/analityki. |
| Publiczne preview URL-e ujawniają pulę i wyniki głosowań wbrew guardrailowi prywatności z PRD | Nieznane niewiadome | M | H | Podpiąć preview do osobnego projektu Supabase z danymi testowymi albo osłonić preview URL-e Cloudflare Access przed pierwszym użyciem na realnych danych. |
| Brak `wrangler types` w skryptach → rozjazd typów środowiska między lokalnie a CI | Nieznane niewiadome | M | L | Dodać prefiks `wrangler types &&` do skryptów `dev`, `build` i `preview` w `package.json`, zgodnie z zaleceniem dokumentacji adaptera. |
| Nieaktualna `compatibility_date` zamraża runtime na wersji z maja 2026 | Nieznane niewiadome | L | L | Zaktualizować `compatibility_date` w `wrangler.jsonc` do daty pierwszego wdrożenia i weryfikować ją przy każdej większej aktualizacji Wranglera. |

## Getting Started

Projekt jest już okablowany pod Workers — `@astrojs/cloudflare` ^14.3.1, `wrangler` ^4.131.1 i `wrangler.jsonc` z właściwym entrypointem są na miejscu. **Nie uruchamiaj `astro add cloudflare`** ani niczego z poradnika Cloudflare Pages.

1. **Zaloguj Wranglera i nazwij Workera.** Uruchom `npx wrangler login`, następnie w `wrangler.jsonc` zmień `"name"` z `"10x-astro-starter"` na `"jam-set"` (zgodnie z `project_name` w `tech-stack.md`) i podnieś `"compatibility_date"` do daty pierwszego wdrożenia.

2. **Ustaw sekrety produkcyjne.** `npx wrangler secret put SUPABASE_URL`, potem `npx wrangler secret put SUPABASE_KEY`. Wartości wpisujesz interaktywnie i po zapisie nie da się ich odczytać. Lokalnie te same klucze trzymasz w `.dev.vars` — plik jest już gitignorowany.

3. **Pracuj lokalnie przez `npm run dev`, nie przez `wrangler dev`.** Od Astro 6 i adaptera v13 `astro dev` i `astro preview` uruchamiają projekt na prawdziwym runtime `workerd` przez plugin Vite Cloudflare, więc osobny serwer Wranglera jest zbędny. Do sprawdzenia builda produkcyjnego: `npm run build && npm run preview`.

4. **Dodaj generowanie typów do skryptów.** W `package.json` zmień `"dev"` na `"wrangler types && astro dev"`, `"build"` na `"wrangler types && astro check && astro build"` i `"preview"` na `"wrangler types && astro preview"`. Bez tego typy bindingów i zmiennych środowiskowych rozjeżdżają się z `wrangler.jsonc`.

5. **Pierwsze wdrożenie.** `npm run build && npx wrangler deploy`. Wrangler zwróci URL na subdomenie `workers.dev`. Zweryfikuj wdrożenie testem dymnym: `BASE_URL=<zwrócony-url> npm run smoke`.

6. **Wprowadź bezpieczny cykl wdrożeń.** Kolejne zmiany wgrywaj jako `npm run build && npx wrangler versions upload --preview-alias next`, obejrzyj na preview URL, a dopiero potem promuj przez `npx wrangler versions deploy`. Awaryjnie: `npx wrangler rollback`. Logi na żywo: `npx wrangler tail`.

## Out of Scope

The following were not evaluated in this research:

- Docker image configuration
- CI/CD pipeline setup (w tym podpięcie `wrangler deploy` do istniejącego workflow w `.github/workflows/ci.yml`)
- Production-scale architecture (multi-region, HA, DR)
