🌐 [English](README.md) · [Español](README.es.md) · [Français](README.fr.md) · [Português](README.pt.md) · [Deutsch](README.de.md) · [Polski](README.pl.md)

# @studiolxd/scorm

Monorepo do `@studiolxd/scorm` — um runtime SCORM 1.2 / 2004 headless com um **núcleo agnóstico de framework** e adaptadores para **React, Vue, Angular, Svelte, Web Components** e JavaScript vanilla — além de uma aplicação de demonstração interativa.

> Anteriormente `@studiolxd/react-scorm`. A API do React encontra-se agora no subcaminho `@studiolxd/scorm/react`.

## Pacotes

| Pacote | Descrição | Documentação |
|---------|-------------|------|
| [`@studiolxd/scorm`](./packages/scorm/) | Runtime SCORM 1.2 / 2004 headless — núcleo agnóstico + adaptadores de framework | [README](./packages/scorm/README.md) |
| [`example`](./example/) | Aplicação de demonstração interativa — mostra todas as funcionalidades da biblioteca | [README](./example/README.md) |

## Primeiros Passos

```bash
npm install          # install all workspaces from the root
npm run dev:lib      # build the library in watch mode
npm run dev:example  # start the example dev server (http://localhost:5173)
```

Scripts adicionais disponíveis a partir da raiz:

- `npm run build` — compila a biblioteca
- `npm run test` — executa a suíte de testes da biblioteca

## Pontos de entrada

A biblioteca é um único pacote com exportações por subcaminho — importe apenas aquilo que usa:

| Importação | Para |
|--------|-----|
| `@studiolxd/scorm` | Núcleo agnóstico de framework + vanilla (`createScormSession`) |
| `@studiolxd/scorm/react` | React (`ScormProvider`, `useScorm`, …) |
| `@studiolxd/scorm/vue` | Vue 3.3+ (`useScorm`) |
| `@studiolxd/scorm/angular` | Angular 17+ (`provideScorm`, `SCORM`) |
| `@studiolxd/scorm/svelte` | Svelte 4+ (`createScormStore`) |
| `@studiolxd/scorm/wc` | Web Component `<scorm-session>` |
| `window.Scorm` (CDN `<script>`) | HTML simples, sem bundler |

## Estrutura do Projeto

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

## Publicação

Apenas `packages/scorm` é publicado no npm. O workspace `example` e a raiz são privados. Para publicar:

```bash
cd packages/scorm
npm publish
```

## Licença

MIT
