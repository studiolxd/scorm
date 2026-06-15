🌐 [English](README.md) · [Español](README.es.md) · [Français](README.fr.md) · [Português](README.pt.md) · [Deutsch](README.de.md) · [Polski](README.pl.md)

# @studiolxd/scorm

Monorepo `@studiolxd/scorm` — headlessowego środowiska uruchomieniowego SCORM 1.2 / 2004 z **rdzeniem niezależnym od frameworka** oraz adapterami dla **React, Vue, Angular, Svelte, Web Components** i czystego JavaScriptu (vanilla) — wraz z interaktywną aplikacją demonstracyjną.

> Wcześniej `@studiolxd/react-scorm`. API dla Reacta znajduje się teraz w podścieżce `@studiolxd/scorm/react`.

## Pakiety

| Pakiet | Opis | Dokumentacja |
|---------|-------------|------|
| [`@studiolxd/scorm`](./packages/scorm/) | Headlessowe środowisko uruchomieniowe SCORM 1.2 / 2004 — niezależny rdzeń + adaptery frameworków | [README](./packages/scorm/README.md) |
| [`example`](./example/) | Interaktywna aplikacja demonstracyjna — prezentuje każdą funkcję biblioteki | [README](./example/README.md) |

## Pierwsze kroki

```bash
npm install          # install all workspaces from the root
npm run dev:lib      # build the library in watch mode
npm run dev:example  # start the example dev server (http://localhost:5173)
```

Dodatkowe skrypty dostępne z poziomu katalogu głównego:

- `npm run build` — buduje bibliotekę
- `npm run test` — uruchamia zestaw testów biblioteki

## Punkty wejścia

Biblioteka to pojedynczy pakiet z eksportami podścieżek — importuj tylko to, czego używasz:

| Import | Do czego |
|--------|-----|
| `@studiolxd/scorm` | Niezależny od frameworka rdzeń + vanilla (`createScormSession`) |
| `@studiolxd/scorm/react` | React (`ScormProvider`, `useScorm`, …) |
| `@studiolxd/scorm/vue` | Vue 3.3+ (`useScorm`) |
| `@studiolxd/scorm/angular` | Angular 17+ (`provideScorm`, `SCORM`) |
| `@studiolxd/scorm/svelte` | Svelte 4+ (`createScormStore`) |
| `@studiolxd/scorm/wc` | Web Component `<scorm-session>` |
| `window.Scorm` (CDN `<script>`) | Czysty HTML, bez bundlera |

## Struktura projektu

```
react-scorm/
├── package.json          # npm workspaces root (private)
├── packages/
│   └── scorm/            # @studiolxd/scorm — published to npm
│       └── README.md     # full library documentation
├── example/              # interactive demo (not published)
│   └── README.md         # demo documentation
├── skills/               # AI agent skills (Claude Code, Cursor, …)
├── tests/angular-smoke/  # Angular AOT smoke test fixture
└── docs/                 # design & planning docs
```

## Publikowanie

Do npm publikowany jest wyłącznie `packages/scorm`. Workspace `example` oraz katalog główny są prywatne. Aby opublikować pakiet:

```bash
cd packages/scorm
npm publish
```

## Licencja

MIT
