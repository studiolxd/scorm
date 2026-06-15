🌐 [English](README.md) · [Español](README.es.md) · [Français](README.fr.md) · [Português](README.pt.md) · [Deutsch](README.de.md) · [Polski](README.pl.md)

# @studiolxd/scorm

Monorepo de `@studiolxd/scorm` — un runtime SCORM 1.2 / 2004 headless con un **núcleo agnóstico al framework** y adaptadores para **React, Vue, Angular, Svelte, Web Components** y JavaScript vanilla — además de una aplicación de demostración interactiva.

> Antes `@studiolxd/react-scorm`. La API de React vive ahora en el subpath `@studiolxd/scorm/react`.

## Paquetes

| Paquete | Descripción | Documentación |
|---------|-------------|---------------|
| [`@studiolxd/scorm`](./packages/scorm/) | Runtime SCORM 1.2 / 2004 headless — núcleo agnóstico + adaptadores de framework | [README](./packages/scorm/README.md) |
| [`example`](./example/) | Aplicación de demostración interactiva — muestra todas las funciones de la librería | [README](./example/README.md) |

## Primeros pasos

```bash
npm install          # install all workspaces from the root
npm run dev:lib      # build the library in watch mode
npm run dev:example  # start the example dev server (http://localhost:5173)
```

Scripts adicionales disponibles desde la raíz:

- `npm run build` — compila la librería
- `npm run test` — ejecuta la suite de tests de la librería

## Puntos de entrada

La librería es un único paquete con exports por subpath — importa solo lo que uses:

| Import | Para |
|--------|------|
| `@studiolxd/scorm` | Núcleo agnóstico al framework + vanilla (`createScormSession`) |
| `@studiolxd/scorm/react` | React (`ScormProvider`, `useScorm`, …) |
| `@studiolxd/scorm/vue` | Vue 3.3+ (`useScorm`) |
| `@studiolxd/scorm/angular` | Angular 17+ (`provideScorm`, `SCORM`) |
| `@studiolxd/scorm/svelte` | Svelte 4+ (`createScormStore`) |
| `@studiolxd/scorm/wc` | Web Component `<scorm-session>` |
| `window.Scorm` (CDN `<script>`) | HTML plano, sin bundler |

## Estructura del proyecto

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

## Publicación

Solo se publica `packages/scorm` en npm. El workspace `example` y la raíz son privados. Para publicar:

```bash
cd packages/scorm
npm publish
```

## Licencia

MIT
