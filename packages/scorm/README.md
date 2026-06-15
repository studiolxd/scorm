🌐 [English](README.md) · [Español](README.es.md) · [Français](README.fr.md) · [Português](README.pt.md) · [Deutsch](README.de.md) · [Polski](README.pl.md)

# @studiolxd/scorm

A headless TypeScript library for SCORM runtime integration. A **framework-agnostic core** talks to an LMS via SCORM 1.2 or SCORM 2004 (4th Edition), with thin adapters for **React, Vue, Angular, Svelte, Web Components**, and plain vanilla JS / `<script>`.

> Renamed from `@studiolxd/react-scorm`. The React API now lives at the `@studiolxd/scorm/react` subpath.

**Key features:**
- Full SCORM 1.2 and 2004 standard coverage
- Framework-agnostic core + React / Vue / Angular / Svelte / Web Component adapters
- Headless (no UI) — you build the interface
- Strict TypeScript types for all CMI paths and APIs
- Result-based error handling (no implicit throws)
- In-memory mock mode for local development (no LMS required)
- Opt-in lifecycle helpers (`autoTerminate`, `autoCommit`)

## Installation

```bash
npm install @studiolxd/scorm
```

Framework packages (React, Vue, etc.) are **optional** peer dependencies — install only the one you use.

## Entry points

| Import | For |
|--------|-----|
| `@studiolxd/scorm` | Framework-agnostic core + vanilla (`createScormSession`) |
| `@studiolxd/scorm/react` | React: `ScormProvider`, `useScorm`, … (React 18+) |
| `@studiolxd/scorm/vue` | Vue 3.3+: `useScorm()` composable |
| `@studiolxd/scorm/angular` | Angular 17+: `provideScorm()` + `SCORM` token |
| `@studiolxd/scorm/svelte` | Svelte 4+: `createScormStore()` |
| `@studiolxd/scorm/wc` | `<scorm-session>` Web Component |
| `window.Scorm` (CDN `<script>`) | Plain HTML, no bundler |

## Quick Start — vanilla

```ts
import { createScormSession } from '@studiolxd/scorm';

const session = createScormSession('auto', { noLmsBehavior: 'mock' });
session.initialize();
session.api?.setScore({ raw: 95, min: 0, max: 100 });
session.api?.setComplete();
session.commit();
session.terminate();
```

## Quick Start — React

```tsx
import { ScormProvider, useScorm } from '@studiolxd/scorm/react';

function App() {
  return (
    <ScormProvider version="1.2" options={{ noLmsBehavior: 'mock', debug: true }}>
      <CourseContent />
    </ScormProvider>
  );
}

function CourseContent() {
  const { api, status } = useScorm();

  if (!api) return <p>No SCORM API available</p>;

  const handleStart = () => {
    const result = api.initialize();
    if (!result.ok) console.error(result.error);
  };

  const handleComplete = () => {
    api.setScore({ raw: 95, min: 0, max: 100 });
    api.setComplete();
    api.commit();
  };

  return (
    <div>
      <p>API found: {String(status.apiFound)}</p>
      <button onClick={handleStart}>Start</button>
      <button onClick={handleComplete}>Complete</button>
    </div>
  );
}
```

## Other frameworks

All adapters wrap the same observable session (`createScormSession`). Install only the
package you use as a peer dependency.

**Vue 3**
```ts
import { useScorm } from '@studiolxd/scorm/vue';
const { status, initialize, session } = useScorm('auto', { noLmsBehavior: 'mock' });
// status is a reactive ref → status.value.initialized
```

**Angular 17+**
```ts
import { provideScorm, SCORM } from '@studiolxd/scorm/angular';
bootstrapApplication(App, { providers: [provideScorm('auto', { noLmsBehavior: 'mock' })] });
// in a component: const { session, status } = inject(SCORM);  // status() is a signal
```

**Svelte 4+**
```svelte
<script>
  import { createScormStore } from '@studiolxd/scorm/svelte';
  import { onDestroy } from 'svelte';
  const scorm = createScormStore('auto', { noLmsBehavior: 'mock' });
  const { status } = scorm;
  onDestroy(scorm.destroy);
</script>
{#if $status.initialized}live{/if}
```

**Web Component / plain HTML**
```html
<script type="module">import '@studiolxd/scorm/wc';</script>
<scorm-session version="auto" no-lms-behavior="mock" auto-terminate></scorm-session>
<script>
  document.querySelector('scorm-session')
    .addEventListener('change', (e) => console.log(e.detail.status));
</script>
```

**CDN `<script>` (no bundler)** — exposes `window.Scorm`:
```html
<script src="https://unpkg.com/@studiolxd/scorm/dist/scorm.global.js"></script>
<script>
  const session = Scorm.createScormSession('auto', { noLmsBehavior: 'mock' });
  session.initialize();
</script>
```

## ScormProvider

The `<ScormProvider>` component locates the LMS API and makes it available via context. It does **not** auto-initialize — you must call `api.initialize()` explicitly.

```tsx
<ScormProvider
  version="1.2"  // or "2004"
  options={{
    noLmsBehavior: 'error',  // 'error' | 'mock' | 'throw'
    debug: false,             // enable console logging
    maxParentDepth: 10,       // max window.parent traversal depth
    checkOpener: true,        // check window.opener
  }}
>
  {children}
</ScormProvider>
```

### `noLmsBehavior` options

| Value | Behavior |
|-------|----------|
| `"error"` (default) | `api` is `null`, `status.apiFound` is `false`. Operations cannot be called. |
| `"mock"` | Uses an in-memory mock SCORM API. Perfect for local development and testing. |
| `"throw"` | Throws a `ScormError` during render. Wrap with a React **Error Boundary**. |

> **`"throw"` mode** throws synchronously inside `useMemo`. Without an Error Boundary, the error will propagate up and crash the entire subtree. Always wrap `<ScormProvider>` in an Error Boundary when using this mode.

## useScorm()

```tsx
const { status, api, raw } = useScorm();
```

| Field | Type | Description |
|-------|------|-------------|
| `status` | `ScormStatus` | Connection status: `apiFound`, `initialized`*, `terminated`*, `version`, `noLmsBehavior` |
| `api` | `IScormApi \| null` | High-level version-agnostic API. `null` when no API found with `"error"` behavior. |
| `raw` | `IScormDriver \| null` | Low-level driver for direct API calls (escape hatch). |

> **Note:** the `status` from `useScorm()` is a snapshot read at render time. For **reactive** `initialized`/`terminated` state (and wrapped `initialize`/`terminate`/`commit`), use **`useScormSession()`**, which subscribes to the underlying session via `useSyncExternalStore`.

## High-Level API

All methods return `Result<T, ScormError>` — check `result.ok` before accessing the value.

### Lifecycle

```ts
api.initialize()   // Result<true, ScormError>
api.terminate()    // Result<true, ScormError>
api.commit()       // Result<true, ScormError>
```

### Status

```ts
api.setComplete()    // 1.2: cmi.core.lesson_status="completed" | 2004: cmi.completion_status="completed"
api.setIncomplete()
api.setPassed()      // 1.2: cmi.core.lesson_status="passed"    | 2004: cmi.success_status="passed"
api.setFailed()      // 1.2: cmi.core.lesson_status="failed"    | 2004: cmi.success_status="failed"
api.getCompletionStatus()
api.getSuccessStatus()
```

### Score

```ts
api.setScore({ raw: 85, min: 0, max: 100, scaled: 0.85 })  // scaled is 2004 only
api.getScore()  // Result<ScoreData, ScormError>
```

**Validation:** `raw`, `min`, and `max` must be finite numbers (NaN/Infinity are rejected with error code 405). `scaled` must be in the range `[-1, 1]` (error code 407 if out of range). For SCORM 1.2, `scaled` is silently ignored.

### Location & Suspend Data

```ts
api.setLocation('page-5')
api.getLocation()
api.setSuspendData(JSON.stringify({ progress: [1, 2, 3] }))
api.getSuspendData()
```

### Session Time

```ts
api.setSessionTime(90000)  // 1.2: "00:01:30.00" | 2004: "PT1M30S"
api.getTotalTime()
```

### Learner Info (read-only)

```ts
api.getLearnerId()
api.getLearnerName()
api.getLaunchData()
api.getMode()
api.getCredit()
api.getEntry()
```

### Objectives

```ts
api.setObjective(0, {
  id: 'obj-1',
  scoreRaw: 90,
  scoreScaled: 0.9,       // 2004 only
  status: 'passed',       // 1.2
  successStatus: 'passed', // 2004
  completionStatus: 'completed', // 2004
})
api.getObjective(0)       // Result<ObjectiveRecord, ScormError>
api.getObjectiveCount()   // Result<number, ScormError>
```

### Interactions

```ts
api.recordInteraction(0, {
  id: 'q1',
  type: 'choice',
  learnerResponse: 'a',
  correctResponses: ['b'],
  result: 'incorrect',
  weighting: 1,
  description: 'Question text',  // 2004 only
})
api.getInteractionCount()
```

### Comments

```ts
// SCORM 1.2: appends to a single cmi.comments string (newline-separated)
// SCORM 2004: creates indexed entries in cmi.comments_from_learner
api.addLearnerComment('Great course', 'page-3', '2024-01-15T10:00:00Z')
                      // comment        location  timestamp (all optional except comment)

// Count methods: always return 0 for SCORM 1.2
api.getLearnerCommentCount()  // Result<number, ScormError>
api.getLmsCommentCount()      // Result<number, ScormError> — LMS comments read-only
```

### Preferences

```ts
api.setPreference('language', 'en')
api.getPreferences()  // Result<Record<string, string>, ScormError>
```

### Progress (SCORM 2004 only)

```ts
api.setProgressMeasure(0.75)  // value must be in range [0, 1] — error 407 otherwise
                               // no-op (returns ok) for SCORM 1.2
```

### Exit

```ts
api.setExit('suspend')  // 1.2: cmi.core.exit | 2004: cmi.exit
                        // Common values: 'suspend', 'logout', 'time-out', ''
```

### Student Data (read-only, set by LMS)

```ts
api.getMasteryScore()     // 1.2: cmi.student_data.mastery_score | 2004: cmi.scaled_passing_score
api.getMaxTimeAllowed()   // 1.2: cmi.student_data.max_time_allowed | 2004: cmi.max_time_allowed
api.getTimeLimitAction()  // 1.2: cmi.student_data.time_limit_action | 2004: cmi.time_limit_action
```

### Navigation (SCORM 2004 only)

```ts
api.setNavRequest('continue')              // no-op (returns ok) for SCORM 1.2
api.getNavRequestValid('continue')         // 'continue' | 'previous'
api.getNavRequestValid('previous')
```

### Raw Access (escape hatch)

```ts
api.getRaw('cmi.core.lesson_status')
api.setRaw('cmi.core.lesson_status', 'completed')
```

## Error Handling

All operations return `Result<T, ScormError>` instead of throwing:

```ts
const result = api.setComplete();
if (result.ok) {
  console.log('Success:', result.value);
} else {
  console.error('Error:', result.error.code, result.error.errorString);
  console.error('Operation:', result.error.operation);
  console.error('Path:', result.error.path);
  console.error('Diagnostic:', result.error.diagnostic);
}
```

`ScormError` includes: `version`, `operation`, `path`, `code`, `errorString`, `diagnostic`, `exception`, `apiFound`, `initialized`.

Helper functions: `isOk()`, `isErr()`, `unwrap()`, `unwrapOr()`.

> **Security:** `errorString` and `diagnostic` are strings sourced directly from the LMS. Do not render them via `innerHTML` or any unsanitized DOM API — treat them as untrusted input and HTML-escape before any DOM insertion.

## useScormSession (opt-in reactive state)

`useScorm()` intentionally keeps `status.initialized` as a static snapshot — the provider does not track lifecycle state. If you need `initialized` and `terminated` as reactive React state (to trigger re-renders), use `useScormSession()` instead.

```tsx
import { useScormSession } from '@studiolxd/scorm/react';

function Course() {
  const { initialized, initialize, terminate, api } = useScormSession();

  useEffect(() => { initialize(); }, [initialize]);

  if (!initialized) return <p>Connecting…</p>;
  return <CourseContent api={api} onFinish={terminate} />;
}
```

`useScormSession()` is a superset of `useScorm()` — it returns everything `useScorm()` returns (`api`, `status`, `raw`) plus:

| Field | Type | Description |
|-------|------|-------------|
| `initialized` | `boolean` | `true` after `initialize()` succeeds. Reactive. |
| `terminated` | `boolean` | `true` after `terminate()` succeeds. Reactive. |
| `initialize()` | `Result<true, ScormError> \| undefined` | Calls `api.initialize()` and updates state. `undefined` if no API. |
| `terminate()` | `Result<true, ScormError> \| undefined` | Calls `api.terminate()` and updates state. `undefined` if no API. |
| `commit()` | `Result<true, ScormError> \| undefined` | Calls `api.commit()`. `undefined` if no API. |

> **Note:** When `noLmsBehavior` is `'error'` and no LMS is found, `api` is `null` and all three methods return `undefined`. Check `status.apiFound` if you need to distinguish this case.

## useScormAutoTerminate (opt-in)

Handles the SCORM lifecycle automatically:

```tsx
function CourseContent() {
  const { api } = useScorm();
  useScormAutoTerminate({
    trackSessionTime: true,  // default: true
    handleUnload: true,      // listen to beforeunload/pagehide
    handleFreeze: true,      // listen to freeze event
  });

  // api is auto-initialized on mount
  // auto-commits + terminates on unmount/unload
}
```

## Path Builders

Typed helper functions for building indexed CMI paths:

```ts
import { scorm12ObjectivePath, scorm2004InteractionPath } from '@studiolxd/scorm/react';

scorm12ObjectivePath(0, 'score.raw')       // "cmi.objectives.0.score.raw"
scorm2004InteractionPath(1, 'learner_response')  // "cmi.interactions.1.learner_response"
```

## Time Formatters

```ts
import { formatScorm12Time, formatScorm2004Time } from '@studiolxd/scorm/react';

formatScorm12Time(90000)   // "00:01:30.00"
formatScorm2004Time(90000) // "PT1M30S"
```

## Testing

Use `noLmsBehavior: 'mock'` for testing. The mock uses an in-memory store with real driver behavior.

```tsx
// In tests
<ScormProvider version="1.2" options={{ noLmsBehavior: 'mock' }}>
  <ComponentUnderTest />
</ScormProvider>
```

You can also use the mock classes directly:

```ts
import { MockScorm12Api, Scorm12Driver, ScormApi, createLogger } from '@studiolxd/scorm/react';

const mockApi = new MockScorm12Api();
const driver = new Scorm12Driver(mockApi, createLogger(false));
const api = new ScormApi(driver);
api.initialize();
// ... test your logic
```

## TypeScript

All CMI paths are strictly typed:

```ts
import type { Scorm12CmiPath, Scorm2004CmiPath } from '@studiolxd/scorm/react';

// These types catch typos at compile time:
const path: Scorm12CmiPath = 'cmi.core.lesson_status';  // OK
// const bad: Scorm12CmiPath = 'cmi.core.typo';          // ERROR
```

## AI coding agents

Using Claude Code, Cursor, or another AI coding assistant? Add the **[scorm-skills](https://github.com/studiolxd/scorm-skills)** so the agent knows how to use this library:

```
# Claude Code
/plugin marketplace add studiolxd/scorm-skills
/plugin install scorm-integration@studiolxd-scorm

# Cursor: copy cursor/scorm-integration.mdc into your project's .cursor/rules/
```

## Additional Documentation

- [SCORM 1.2 vs 2004 Mapping Table](./docs/scorm-mapping-table.md)
- [Testing with Mock Mode](./docs/mock-mode.md)
- [Integration Guide](./docs/integration-guide.md)

## License

MIT
