🌐 [English](README.md) · [Español](README.es.md) · [Français](README.fr.md) · [Português](README.pt.md) · [Deutsch](README.de.md) · [Polski](README.pl.md)

# @studiolxd/react-scorm

Eine headless React + TypeScript-Bibliothek zur SCORM-Laufzeitintegration. Sie stellt einen `<ScormProvider>` und einen `useScorm()`-Hook bereit, um über SCORM 1.2 oder SCORM 2004 (4th Edition) mit einem LMS zu kommunizieren.

**Hauptmerkmale:**
- Vollständige Abdeckung von SCORM 1.2 und 2004
- Headless (keine Benutzeroberfläche) — du baust das Interface selbst
- Strenge TypeScript-Typen für alle CMI-Pfade und APIs
- Result-basierte Fehlerbehandlung (keine impliziten Ausnahmen)
- Kein automatischer Zustand, keine Persistenz, kein Auto-Save
- In-Memory-mock-Modus für die lokale Entwicklung
- Optionales Lifecycle-Management mit `useScormAutoTerminate`

## Installation

```bash
npm install @studiolxd/react-scorm
```

React 18+ ist als Peer-Dependency erforderlich.

## Schnellstart

```tsx
import { ScormProvider, useScorm } from '@studiolxd/react-scorm';

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

## ScormProvider

Die `<ScormProvider>`-Komponente sucht die LMS-API und stellt sie über den Kontext bereit. Sie initialisiert **nicht** automatisch — du musst `api.initialize()` explizit aufrufen.

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

### `noLmsBehavior`-Optionen

| Wert | Verhalten |
|------|-----------|
| `"error"` (Standard) | `api` ist `null`, `status.apiFound` ist `false`. Operationen können nicht aufgerufen werden. |
| `"mock"` | Verwendet eine In-Memory-mock-SCORM-API. Ideal für lokale Entwicklung und Tests. |
| `"throw"` | Wirft einen `ScormError` beim Rendern. Mit einer React **Error Boundary** umschließen. |

> **`"throw"`-Modus** wirft synchron innerhalb von `useMemo`. Ohne eine Error Boundary propagiert der Fehler nach oben und bringt den gesamten Teilbaum zum Absturz. Umschließe `<ScormProvider>` bei Verwendung dieses Modus immer mit einer Error Boundary.

## useScorm()

```tsx
const { status, api, raw } = useScorm();
```

| Feld | Typ | Beschreibung |
|------|-----|--------------|
| `status` | `ScormStatus` | Verbindungsstatus: `apiFound`, `initialized`*, `terminated`*, `version`, `noLmsBehavior` |
| `api` | `IScormApi \| null` | Versionsneutrale High-Level-API. `null`, wenn bei `"error"`-Verhalten keine API gefunden wurde. |
| `raw` | `IScormDriver \| null` | Low-Level-driver für direkte API-Aufrufe (Notausstieg). |

> **Hinweis:** `status.initialized` und `status.terminated` sind im Kontextwert immer `false` — der provider verfolgt den Laufzeitzustand nicht. Wenn du reaktiven initialisierten/terminierten Zustand benötigst, verwalte ihn selbst mit `useState` nach dem Aufruf von `api.initialize()` und `api.terminate()`.

## High-Level-API

Alle Methoden geben `Result<T, ScormError>` zurück — prüfe `result.ok` vor dem Zugriff auf den Wert.

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

**Validierung:** `raw`, `min` und `max` müssen endliche Zahlen sein (NaN/Infinity werden mit Fehlercode 405 abgelehnt). `scaled` muss im Bereich `[-1, 1]` liegen (Fehlercode 407 bei Überschreitung). Bei SCORM 1.2 wird `scaled` stillschweigend ignoriert.

### Location & Suspend Data

```ts
api.setLocation('page-5')
api.getLocation()
api.setSuspendData(JSON.stringify({ progress: [1, 2, 3] }))
api.getSuspendData()
```

### Sitzungszeit

```ts
api.setSessionTime(90000)  // 1.2: "00:01:30.00" | 2004: "PT1M30S"
api.getTotalTime()
```

### Lernenden-Informationen (nur lesend)

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

### Fortschritt (nur SCORM 2004)

```ts
api.setProgressMeasure(0.75)  // value must be in range [0, 1] — error 407 otherwise
                               // no-op (returns ok) for SCORM 1.2
```

### Exit

```ts
api.setExit('suspend')  // 1.2: cmi.core.exit | 2004: cmi.exit
                        // Common values: 'suspend', 'logout', 'time-out', ''
```

### Studentendaten (nur lesend, vom LMS gesetzt)

```ts
api.getMasteryScore()     // 1.2: cmi.student_data.mastery_score | 2004: cmi.scaled_passing_score
api.getMaxTimeAllowed()   // 1.2: cmi.student_data.max_time_allowed | 2004: cmi.max_time_allowed
api.getTimeLimitAction()  // 1.2: cmi.student_data.time_limit_action | 2004: cmi.time_limit_action
```

### Navigation (nur SCORM 2004)

```ts
api.setNavRequest('continue')              // no-op (returns ok) for SCORM 1.2
api.getNavRequestValid('continue')         // 'continue' | 'previous'
api.getNavRequestValid('previous')
```

### Direktzugriff (Notausstieg)

```ts
api.getRaw('cmi.core.lesson_status')
api.setRaw('cmi.core.lesson_status', 'completed')
```

## Fehlerbehandlung

Alle Operationen geben `Result<T, ScormError>` zurück, anstatt Ausnahmen zu werfen:

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

`ScormError` enthält: `version`, `operation`, `path`, `code`, `errorString`, `diagnostic`, `exception`, `apiFound`, `initialized`.

Hilfsfunktionen: `isOk()`, `isErr()`, `unwrap()`, `unwrapOr()`.

> **Sicherheit:** `errorString` und `diagnostic` sind Zeichenketten, die direkt vom LMS stammen. Rendere sie niemals über `innerHTML` oder eine nicht-bereinigte DOM-API — behandle sie als nicht vertrauenswürdige Eingaben und escape HTML vor jeder DOM-Einfügung.

## useScormSession (reaktiver Zustand, opt-in)

`useScorm()` hält `status.initialized` bewusst als statischen Schnappschuss — der provider verfolgt den Lifecycle-Zustand nicht. Wenn du `initialized` und `terminated` als reaktiven React-Zustand benötigst (um Re-Renders auszulösen), verwende stattdessen `useScormSession()`.

```tsx
import { useScormSession } from '@studiolxd/react-scorm';

function Course() {
  const { initialized, initialize, terminate, api } = useScormSession();

  useEffect(() => { initialize(); }, [initialize]);

  if (!initialized) return <p>Connecting…</p>;
  return <CourseContent api={api} onFinish={terminate} />;
}
```

`useScormSession()` ist eine Obermenge von `useScorm()` — es gibt alles zurück, was `useScorm()` zurückgibt (`api`, `status`, `raw`), plus:

| Feld | Typ | Beschreibung |
|------|-----|--------------|
| `initialized` | `boolean` | `true` nach erfolgreichem `initialize()`-Aufruf. Reaktiv. |
| `terminated` | `boolean` | `true` nach erfolgreichem `terminate()`-Aufruf. Reaktiv. |
| `initialize()` | `Result<true, ScormError> \| undefined` | Ruft `api.initialize()` auf und aktualisiert den Zustand. `undefined` wenn keine API vorhanden. |
| `terminate()` | `Result<true, ScormError> \| undefined` | Ruft `api.terminate()` auf und aktualisiert den Zustand. `undefined` wenn keine API vorhanden. |
| `commit()` | `Result<true, ScormError> \| undefined` | Ruft `api.commit()` auf. `undefined` wenn keine API vorhanden. |

> **Hinweis:** Wenn `noLmsBehavior` `'error'` ist und kein LMS gefunden wird, ist `api` `null` und alle drei Methoden geben `undefined` zurück. Prüfe `status.apiFound`, wenn du diesen Fall unterscheiden musst.

## useScormAutoTerminate (opt-in)

Verwaltet den SCORM-Lifecycle automatisch:

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

Typisierte Hilfsfunktionen zum Erstellen indizierter CMI-Pfade:

```ts
import { scorm12ObjectivePath, scorm2004InteractionPath } from '@studiolxd/react-scorm';

scorm12ObjectivePath(0, 'score.raw')       // "cmi.objectives.0.score.raw"
scorm2004InteractionPath(1, 'learner_response')  // "cmi.interactions.1.learner_response"
```

## Zeit-Formatierer

```ts
import { formatScorm12Time, formatScorm2004Time } from '@studiolxd/react-scorm';

formatScorm12Time(90000)   // "00:01:30.00"
formatScorm2004Time(90000) // "PT1M30S"
```

## Tests

Verwende `noLmsBehavior: 'mock'` für Tests. Der mock nutzt einen In-Memory-Speicher mit echtem driver-Verhalten.

```tsx
// In tests
<ScormProvider version="1.2" options={{ noLmsBehavior: 'mock' }}>
  <ComponentUnderTest />
</ScormProvider>
```

Du kannst die mock-Klassen auch direkt verwenden:

```ts
import { MockScorm12Api, Scorm12Driver, ScormApi, createLogger } from '@studiolxd/react-scorm';

const mockApi = new MockScorm12Api();
const driver = new Scorm12Driver(mockApi, createLogger(false));
const api = new ScormApi(driver);
api.initialize();
// ... test your logic
```

## TypeScript

Alle CMI-Pfade sind streng typisiert:

```ts
import type { Scorm12CmiPath, Scorm2004CmiPath } from '@studiolxd/react-scorm';

// These types catch typos at compile time:
const path: Scorm12CmiPath = 'cmi.core.lesson_status';  // OK
// const bad: Scorm12CmiPath = 'cmi.core.typo';          // ERROR
```

## Weitere Dokumentation

- [SCORM 1.2 vs 2004 Mapping-Tabelle](./docs/scorm-mapping-table.md)
- [Testen mit dem mock-Modus](./docs/mock-mode.md)
- [Integrationsleitfaden](./docs/integration-guide.md)

## Lizenz

MIT
