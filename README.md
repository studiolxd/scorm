🌐 [English](README.md) · [Español](README.es.md) · [Français](README.fr.md) · [Português](README.pt.md) · [Deutsch](README.de.md) · [Polski](README.pl.md)

# @studiolxd/scorm

Monorepo for `@studiolxd/scorm` — a headless SCORM 1.2 / 2004 runtime with a **framework-agnostic core** and adapters for **React, Vue, Angular, Svelte, Web Components**, and plain vanilla JS — plus an interactive demo app.

> Formerly `@studiolxd/react-scorm`. The React API now lives at the `@studiolxd/scorm/react` subpath.

## Packages

| Package | Description | Docs |
|---------|-------------|------|
| [`@studiolxd/scorm`](./packages/scorm/) | Headless SCORM 1.2 / 2004 runtime — agnostic core + framework adapters | [README](./packages/scorm/README.md) |
| [`example`](./example/) | Interactive demo app — showcases every library feature | [README](./example/README.md) |

## Getting Started

```bash
npm install          # install all workspaces from the root
npm run dev:lib      # build the library in watch mode
npm run dev:example  # start the example dev server (http://localhost:5173)
```

Additional scripts available from the root:

- `npm run build` — builds the library
- `npm run test` — runs the library test suite

## Entry points

The library is a single package with subpath exports — import only what you use:

| Import | For |
|--------|-----|
| `@studiolxd/scorm` | Framework-agnostic core + vanilla (`createScormSession`) |
| `@studiolxd/scorm/react` | React (`ScormProvider`, `useScorm`, …) |
| `@studiolxd/scorm/vue` | Vue 3.3+ (`useScorm`) |
| `@studiolxd/scorm/angular` | Angular 17+ (`provideScorm`, `SCORM`) |
| `@studiolxd/scorm/svelte` | Svelte 4+ (`createScormStore`) |
| `@studiolxd/scorm/wc` | `<scorm-session>` Web Component |
| `window.Scorm` (CDN `<script>`) | Plain HTML, no bundler |

## Project Structure

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

## Publishing

Only `packages/scorm` is published to npm. The `example` workspace and the root are private. To publish:

```bash
cd packages/scorm
npm publish
```

## License

MIT
