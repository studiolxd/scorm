# Changelog

All notable changes to `@studiolxd/scorm` are documented here.

## [2.0.0] - 2026-06-15

### Changed (BREAKING)
- **Renamed** `@studiolxd/react-scorm` → `@studiolxd/scorm`. The React API moved to the
  `@studiolxd/scorm/react` subpath (`import { ScormProvider, useScorm } from '@studiolxd/scorm/react'`).
- The package root (`@studiolxd/scorm`) is now **framework-agnostic** — no React imports.

### Added
- **Framework-agnostic core**: `createScormSession(version, options)` — an observable
  session with `on('change')` / `off` / `destroy` and reactive `status`.
- **Vanilla lifecycle helpers**: `autoTerminate(session, opts)` and `autoCommit(session, ms)`,
  each returning a `dispose()` (the React hooks now delegate to these).
- **Adapters as subpaths**:
  - `@studiolxd/scorm/vue` — `useScorm()` composable (Vue 3.3+)
  - `@studiolxd/scorm/angular` — `provideScorm()` + `SCORM` token (Angular 17+, decorator-free)
  - `@studiolxd/scorm/svelte` — `createScormStore()` (Svelte 4+)
  - `@studiolxd/scorm/wc` — `<scorm-session>` Web Component
- **IIFE/global build** for plain `<script>` / CDN usage (`window.Scorm`, `dist/scorm.global.js`).
- `version: 'auto'` resolution surfaced through the session/adapters.
- `llms.txt` shipped in the package for AI coding tools; `AGENTS.md` + a `skills/` source.

### Internal
- `useScormSession()` now subscribes via `useSyncExternalStore` for reactive
  `initialized`/`terminated`; `ScormProvider` builds and shares a `ScormSession`.
- Framework dependencies are **optional** peer dependencies — install only what you use.

## [1.1.0] - 2026-06-15

### Added
- `version="auto"` on `<ScormProvider>`: detect the host LMS's API at runtime (probes SCORM 2004, then 1.2), with a new `fallbackVersion` option for the no-API case
- `detectScormApi()` and `detectScormVersion()` standalone helpers
- `useScormAutoCommit(intervalMs)` hook for periodic best-effort commits during long sessions
- `getInteraction(index)` to read a recorded interaction back (SCORM 2004; returns a write-only error in 1.2 per spec)
- `getLearnerComments()` / `getLmsComments()` to read comment text (not just counts), plus the `CommentRecord` type

### Fixed
- **SSR safety:** `findScormApi` no longer touches `window` during server-side rendering, so `<ScormProvider>` no longer throws in Next.js / Remix
- `initialize()` is now idempotent while a session is live — a redundant call is a no-op returning `ok(true)` instead of triggering LMS error 103
- SCORM 1.2 `setScore` now validates `raw`/`min`/`max` are within 0–100 (matching the 2004 `scaled` validation)
- `formatScorm12Time` clamps durations beyond the SCORM 1.2 `CMITimespan` maximum to `9999:99:99.99`

### Documentation
- `InteractionRecord.learnerResponse` / `correctResponses` now document the expected encoding for each interaction type
- Clarified the post-`terminate()` driver latch (remount the provider with a changed `key` to start a new session)

## [1.0.2] - 2026-03-24

### Changed
- Upgrade vitest from `^2.0.0` to `^4.1.1` and align `@vitest/coverage-v8` to `^4.1.1`
- Add `jsdom` to monorepo root `devDependencies` to ensure correct hoisting in npm workspaces

## [1.0.1] - 2026-03-24

### Documentation
- Add multilingual README translations (es, fr, pt, de, pl)
- Add language navigation switcher to all README files
- Migrate to npm workspaces monorepo (library under `packages/react-scorm/`)

## [1.0.0] - 2026-03-23

### Added
- Full SCORM 1.2 and SCORM 2004 (4th Edition) runtime support
- `<ScormProvider>` component with `noLmsBehavior` option: `'error'` | `'mock'` | `'throw'`
- `useScorm()` hook exposing `status`, `api`, and `raw` driver
- `useScormAutoTerminate()` hook for opt-in lifecycle management (initialize on mount, terminate on unmount/unload)
- High-level `ScormApi` with full coverage of the CMI data model:
  - Lifecycle: `initialize`, `terminate`, `commit`
  - Status: `setComplete`, `setIncomplete`, `setPassed`, `setFailed`, `getCompletionStatus`, `getSuccessStatus`
  - Score: `setScore` (with `raw`, `min`, `max`, `scaled`), `getScore`
  - Location & suspend data: `setLocation`, `getLocation`, `setSuspendData`, `getSuspendData`
  - Session time: `setSessionTime`, `getTotalTime`
  - Learner info: `getLearnerId`, `getLearnerName`, `getLaunchData`, `getMode`, `getCredit`, `getEntry`
  - Objectives: `setObjective`, `getObjective`, `getObjectiveCount`
  - Interactions: `recordInteraction`, `getInteractionCount`
  - Comments: `addLearnerComment`, `getLearnerCommentCount`, `getLmsCommentCount`
  - Preferences: `setPreference`, `getPreferences`
  - Progress (2004 only): `setProgressMeasure`
  - Exit: `setExit`
  - Student data: `getMasteryScore`, `getMaxTimeAllowed`, `getTimeLimitAction`
  - Navigation (2004 only): `setNavRequest`, `getNavRequestValid`
  - Raw escape hatch: `getRaw`, `setRaw`
- In-memory mock SCORM API (`MockScorm12Api`, `MockScorm2004Api`) for development and testing
- Result type pattern (`ok`/`err`) — no implicit throws from API calls
- Typed CMI path types (`Scorm12CmiPath`, `Scorm2004CmiPath`) catching typos at compile time
- Path builder helpers (`scorm12ObjectivePath`, `scorm2004InteractionPath`, etc.)
- Time formatter utilities (`formatScorm12Time`, `formatScorm2004Time`)
- Duck-type validation when locating the LMS API in the window hierarchy

### Hooks
- `useScormSession()` — superset of `useScorm()` that tracks `initialized` and `terminated` as reactive React state, for consumers that need re-renders on lifecycle transitions without managing that state themselves

### Security
- LMS API objects are validated for all 8 required methods before use, preventing hostile partial objects from passing as a valid API
- `errorString` and `diagnostic` fields documented as untrusted LMS input — must be HTML-escaped before DOM insertion
- Score, scaled, and progress measure inputs validated with proper SCORM error codes (405/407) before forwarding to the LMS

### Validation
- `setScore`: `raw`, `min`, `max` reject NaN/Infinity (error 405); `scaled` rejects values outside `[-1, 1]` (error 407)
- `setProgressMeasure`: rejects NaN and values outside `[0, 1]` (error 407)
- `addLearnerComment` (SCORM 1.2): rejects comments that would cause `cmi.comments` to exceed 4096 characters (error 405)
