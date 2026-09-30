# Plan pierwszego wdrożenia na Cloudflare Workers

Do przejrzenia przed wykonaniem. Po zatwierdzeniu tego pliku wdrożenie rusza krok po kroku. Teraz nie logujemy Wranglera, nie ustawiamy sekretów i nie robimy deployu.

Źródło: sekcja Getting Started w [infrastructure.md](../../foundation/infrastructure.md) (kroki 1, 2, 4 i 5) oraz korekta `deployment_target`. Adapter `@astrojs/cloudflare` i [wrangler.jsonc](../../../wrangler.jsonc) już są. Nie uruchamiamy `astro add cloudflare` ani poradnika Cloudflare Pages. CI w [.github/workflows/ci.yml](../../../.github/workflows/ci.yml) zostaje bez zmian.

## Czego potrzebujesz, zanim to wykonamy

Stan na teraz:

- Konto Cloudflare: **brak sesji**. Szczegóły niżej.
- Sekrety aplikacji: **brak plików**. Nie ma ani `.dev.vars`, ani `.env`. Szczegóły niżej.

### Konto Cloudflare

`npx wrangler whoami` zwraca „You are not authenticated”. Workera nie zakładasz ręcznie w panelu i nie podpinasz własnej domeny. Darmowy plan Workers jest domyślny, karta nie jest potrzebna. Aplikacja `jam-set` powstanie dopiero przy `wrangler deploy`, pod adresem `https://jam-set.<subdomena-konta>.workers.dev`.

- [x] Załóż konto na [dash.cloudflare.com/sign-up](https://dash.cloudflare.com/sign-up) albo zaloguj się na [dash.cloudflare.com](https://dash.cloudflare.com). Potwierdź adres z maila, jeśli Cloudflare o to poprosi. Przy wyborze planu zostaw **Free**. Nie przechodź na Workers Paid (5 USD miesięcznie).
- [x] Otwórz w panelu **Workers & Pages** (w nowszym menu: **Compute** → **Workers**). Pierwsze wejście tworzy subdomenę konta `<twoja-subdomena>.workers.dev`. Jeśli panel pyta o nazwę, ustaw ją raz — to nazwa konta, nie aplikacji. Nazwa Workera `jam-set` jest osobna i musi być wolna na tym koncie.
- [x] Z katalogu projektu uruchom `npx wrangler login`. Przeglądarka otworzy zgodę OAuth; zaloguj się na to samo konto i zatwierdź dostęp dla Wranglera. Gdy przeglądarka się nie otworzy, wklej URL wypisany w terminalu. Token zostaje lokalnie w konfiguracji Wranglera (`~/Library/Preferences/.wrangler`), nie w repozytorium.
- [x] Sprawdź `npx wrangler whoami`. Ma pokazać e-mail i Account ID, bez „not authenticated”.

Jeśli późniejszy deploy zwróci „You need a workers.dev subdomain”, wejdź na [dash.cloudflare.com/?to=/:account/workers/subdomain](https://dash.cloudflare.com/?to=/:account/workers/subdomain), zapisz subdomenę i powtórz deploy. Tokena API nie potrzeba: OAuth z `wrangler login` wystarcza.

### Plik `.dev.vars`

Deploy czyta `SUPABASE_URL` i `SUPABASE_KEY` (klucz publiczny `anon`, jak w [.env.example](../../../.env.example)). Plik `.dev.vars` jest już w [.gitignore](../../../.gitignore) — nie dodajesz go do gita i nie wklejasz wartości na czat. Wgranie tych samych wartości jako sekrety Workera (`wrangler secret put`) zrobię sam przy wykonaniu planu.

Adres `http://127.0.0.1:54321` z lokalnego Supabase tu nie zadziała: Worker na Cloudflare nie dosięgnie Twojego komputera. Potrzebny jest hostowany projekt Supabase. Smoke (`scripts/smoke.mjs`) założy w nim konto `smoke-<timestamp>@example.com` i od razu się zaloguje, więc potwierdzanie e-maila musi być wyłączone.

- [ ] Załóż projekt na [supabase.com/dashboard](https://supabase.com/dashboard) (plan Free wystarczy) albo otwórz istniejący, w którym wolno utworzyć użytkownika testowego.
- [ ] W panelu projektu otwórz **Project Settings → API**. Skopiuj **Project URL** (`https://<project-ref>.supabase.co`) oraz klucz publiczny **anon** (w nowszym panelu może nazywać się **publishable**). Nie kopiuj `service_role` ani klucza **secret**.
- [ ] Wyłącz potwierdzanie e-maila: **Authentication → Email → Confirm email** (albo **Authentication → Sign In / Providers → Email**) ustaw na wyłączone. Inaczej smoke odpadnie na logowaniu zaraz po rejestracji.
- [ ] W katalogu głównym repo (obok `package.json`) utwórz plik `.dev.vars`. Dwie linie, bez cudzysłowów i bez spacji wokół `=`:

```
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_KEY=<anon key>
```

Zanim powiesz „wykonaj”, przygotuj:

- [x] Konto Cloudflare skonfigurowane według kroków wyżej (`npx wrangler whoami` pokazuje zalogowane konto).
- [ ] Plik `.dev.vars` według kroków wyżej (oba klucze uzupełnione, plik nie jest w gicie).

## Zmiany w repo

- [wrangler.jsonc](../../../wrangler.jsonc): `"name"` z `10x-astro-starter` na `jam-set`, `"compatibility_date"` z `2026-05-08` na `2026-09-30`.
- [package.json](../../../package.json):
  - `dev`: `wrangler types && astro dev`
  - `build`: `wrangler types && astro check && astro build`
  - `preview`: `wrangler types && astro preview`
- [.gitignore](../../../.gitignore): dopisać `worker-configuration.d.ts` obok `.dev.vars` (plik generuje `wrangler types`).
- [tech-stack.md](../../foundation/tech-stack.md): `deployment_target: cloudflare-workers` oraz zdanie „Deploy na Cloudflare Pages” zamienione na Workers. `@astrojs/cloudflare` od v13 nie obsługuje Pages.

Job CI dalej woła `npm run build` i `npm run preview -- --port 4321`. `wrangler types` nie wymaga logowania, a `--port` dokleja się do `astro preview`. Osobny `npx astro check` w CI zostaje, więc check poleci dwa razy.

## Kroki wykonania (dopiero po Twojej akceptacji)

1. Wprowadzić zmiany w repo z sekcji wyżej.
2. `npx wrangler whoami`. Jeśli nadal brak sesji: `npx wrangler login` i Twoje logowanie w przeglądarce.
3. Z `.dev.vars` ustawić sekrety produkcyjne: `npx wrangler secret put SUPABASE_URL` i `npx wrangler secret put SUPABASE_KEY`. Jeśli pliku albo klucza brakuje, stop i pytanie o wartości.
4. `npm run build && npx wrangler deploy`. Wynik: URL `https://jam-set.<twoje-konto>.workers.dev`.
5. `BASE_URL=<ten-url> npm run smoke`.

Krok 6 z infrastructure.md (preview alias, promocja, rollback) dotyczy kolejnych zmian, nie tego pierwszego wdrożenia.
