🌐 [English](README.md) · [Español](README.es.md) · [Français](README.fr.md) · [Português](README.pt.md) · [Deutsch](README.de.md) · [Polski](README.pl.md)

# @studiolxd/scorm

Monorepo für `@studiolxd/scorm` — eine Headless-Laufzeitumgebung für SCORM 1.2 / 2004 mit einem **frameworkunabhängigen Kern** und Adaptern für **React, Vue, Angular, Svelte, Web Components** sowie reines Vanilla-JS — inklusive einer interaktiven Demo-App.

> Vormals `@studiolxd/react-scorm`. Die React-API befindet sich jetzt im Unterpfad `@studiolxd/scorm/react`.

## Pakete

| Paket | Beschreibung | Doku |
|---------|-------------|------|
| [`@studiolxd/scorm`](./packages/scorm/) | Headless-Laufzeitumgebung für SCORM 1.2 / 2004 — unabhängiger Kern + Framework-Adapter | [README](./packages/scorm/README.md) |
| [`example`](./example/) | Interaktive Demo-App — präsentiert jede Funktion der Bibliothek | [README](./example/README.md) |

## Erste Schritte

```bash
npm install          # install all workspaces from the root
npm run dev:lib      # build the library in watch mode
npm run dev:example  # start the example dev server (http://localhost:5173)
```

Weitere Skripte, die vom Stammverzeichnis aus verfügbar sind:

- `npm run build` — baut die Bibliothek
- `npm run test` — führt die Testsuite der Bibliothek aus

## Einstiegspunkte

Die Bibliothek ist ein einzelnes Paket mit Unterpfad-Exporten — importiere nur das, was du verwendest:

| Import | Für |
|--------|-----|
| `@studiolxd/scorm` | Frameworkunabhängiger Kern + Vanilla (`createScormSession`) |
| `@studiolxd/scorm/react` | React (`ScormProvider`, `useScorm`, …) |
| `@studiolxd/scorm/vue` | Vue 3.3+ (`useScorm`) |
| `@studiolxd/scorm/angular` | Angular 17+ (`provideScorm`, `SCORM`) |
| `@studiolxd/scorm/svelte` | Svelte 4+ (`createScormStore`) |
| `@studiolxd/scorm/wc` | `<scorm-session>` Web Component |
| `window.Scorm` (CDN `<script>`) | Reines HTML, kein Bundler |

## Projektstruktur

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

## Veröffentlichung

Nur `packages/scorm` wird auf npm veröffentlicht. Der `example`-Workspace und das Stammverzeichnis sind privat. So wird veröffentlicht:

```bash
cd packages/scorm
npm publish
```

## Lizenz

MIT
