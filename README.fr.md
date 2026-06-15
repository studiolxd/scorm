🌐 [English](README.md) · [Español](README.es.md) · [Français](README.fr.md) · [Português](README.pt.md) · [Deutsch](README.de.md) · [Polski](README.pl.md)

# @studiolxd/scorm

Monorepo pour `@studiolxd/scorm` — un runtime SCORM 1.2 / 2004 headless doté d'un **cœur agnostique vis-à-vis du framework** et d'adaptateurs pour **React, Vue, Angular, Svelte, Web Components** ainsi que du JavaScript vanilla — accompagné d'une application de démonstration interactive.

> Anciennement `@studiolxd/react-scorm`. L'API React se trouve désormais sous le sous-chemin `@studiolxd/scorm/react`.

## Packages

| Package | Description | Documentation |
|---------|-------------|------|
| [`@studiolxd/scorm`](./packages/scorm/) | Runtime SCORM 1.2 / 2004 headless — cœur agnostique + adaptateurs de framework | [README](./packages/scorm/README.md) |
| [`example`](./example/) | Application de démonstration interactive — illustre chaque fonctionnalité de la bibliothèque | [README](./example/README.md) |

## Démarrage

```bash
npm install          # install all workspaces from the root
npm run dev:lib      # build the library in watch mode
npm run dev:example  # start the example dev server (http://localhost:5173)
```

Scripts supplémentaires disponibles depuis la racine :

- `npm run build` — compile la bibliothèque
- `npm run test` — exécute la suite de tests de la bibliothèque

## Points d'entrée

La bibliothèque est un package unique avec des exports par sous-chemin — n'importez que ce que vous utilisez :

| Import | Pour |
|--------|-----|
| `@studiolxd/scorm` | Cœur agnostique vis-à-vis du framework + vanilla (`createScormSession`) |
| `@studiolxd/scorm/react` | React (`ScormProvider`, `useScorm`, …) |
| `@studiolxd/scorm/vue` | Vue 3.3+ (`useScorm`) |
| `@studiolxd/scorm/angular` | Angular 17+ (`provideScorm`, `SCORM`) |
| `@studiolxd/scorm/svelte` | Svelte 4+ (`createScormStore`) |
| `@studiolxd/scorm/wc` | Web Component `<scorm-session>` |
| `window.Scorm` (CDN `<script>`) | HTML simple, sans bundler |

## Structure du projet

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

## Publication

Seul `packages/scorm` est publié sur npm. Le workspace `example` et la racine sont privés. Pour publier :

```bash
cd packages/scorm
npm publish
```

## Licence

MIT
