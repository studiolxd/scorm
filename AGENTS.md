# AGENTS.md — working in this repository

Guidance for AI coding agents (Claude Code, Cursor, Copilot, etc.) operating in this
monorepo. For how to *use* the published library, see `packages/scorm/llms.txt`.

## What this is

`@studiolxd/scorm` — a headless SCORM 1.2 / 2004 runtime. pnpm workspaces monorepo:

- `packages/scorm/` — the published library (`@studiolxd/scorm`).
  - `src/` core is **framework-agnostic** (no framework imports outside `src/react`,
    `src/vue`, `src/angular`, `src/svelte`, `src/wc`).
  - Entry points map to subpaths: `.` (core+vanilla), `./react`, `./vue`,
    `./angular`, `./svelte`, `./wc`. Built with `tsup` (ESM + CJS + IIFE).
- `example/` — the single demo app (React + Vite). Not published.
- `docs/` — planning + design docs.

## Commands (run from repo root)

- `pnpm run build` — build the library.
- `pnpm run test` — run the library test suite (vitest).
- `pnpm run dev:example` — run the demo at http://localhost:5173.
- Per-package: `pnpm --filter @studiolxd/scorm run typecheck`.

Always run `typecheck` + `test:run` + `build` in `packages/scorm` before committing.

Dependencies are managed with **pnpm**; publishing still goes out with `npm publish`
from `packages/scorm`. `tests/angular-smoke/` is deliberately outside the workspace
and installed with npm — it stands in for a real downstream consumer. Never run
`npm install` at the repo root.

## Conventions

- **TypeScript strict.** Every public symbol has JSDoc, ideally with an `@example`.
- **`Result<T, ScormError>`** is the universal return type — never throw across the
  public API (except `noLmsBehavior: 'throw'`). Check `.ok` before `.value`.
- **Framework isolation.** Code in `src/` (outside the adapter folders) must not
  import any framework. Adapters are thin bridges over `createScormSession` and the
  vanilla `autoTerminate`/`autoCommit` helpers — put shared logic in the core, not
  in an adapter.
- **SSR-safe.** Guard any `window`/`document`/`HTMLElement` access with
  `typeof … === 'undefined'`.
- **Tests** live in `packages/scorm/tests/`, mirroring `src/`. Use mock mode
  (`noLmsBehavior: 'mock'`) — no real LMS needed.

## Adding a framework adapter

1. Create `src/<framework>/index.ts` — bridge `session.on('change')` to the
   framework's reactivity; reuse `autoTerminate`/`autoCommit`.
2. Add the entry to `tsup.config.ts` and an `exports` subpath in `package.json`.
3. Add the framework as an **optional** peerDependency (+ devDependency for builds).
4. Add a test under `tests/adapters/`.

## Release workflow

See `docs/PLAN-agnostic-core.md` §7 and the version-bump steps: update CHANGELOG →
`npm version` → commit → (publish is manual and gated on npm auth).

## Do not

- Do not introduce a framework dependency into the core.
- Do not bundle framework deps (they are externalized/optional peers).
- Do not read `.value` without checking `.ok`.
