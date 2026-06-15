🌐 [English](README.md) · [Español](README.es.md) · [Français](README.fr.md) · [Português](README.pt.md) · [Deutsch](README.de.md) · [Polski](README.pl.md)

# @studiolxd/react-scorm

Bezinterfejsowa biblioteka React + TypeScript do integracji ze środowiskiem uruchomieniowym SCORM. Udostępnia komponent `<ScormProvider>` oraz hook `useScorm()`, umożliwiające komunikację z LMS za pośrednictwem SCORM 1.2 lub SCORM 2004 (4. edycja).

**Najważniejsze funkcje:**
- Pełna obsługa standardów SCORM 1.2 i 2004
- Bezinterfejsowość (brak UI) — interfejs budujesz samodzielnie
- Ścisłe typy TypeScript dla wszystkich ścieżek CMI i API
- Obsługa błędów oparta na Result (brak niejawnych wyjątków)
- Brak automatycznego stanu, persystencji i autozapisu
- Tryb mock w pamięci operacyjnej na potrzeby lokalnego developmentu
- Opcjonalne zarządzanie cyklem życia za pomocą `useScormAutoTerminate`

## Instalacja

```bash
npm install @studiolxd/react-scorm
```

Wymagany jest React 18+ jako peer dependency.

## Szybki start

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

Komponent `<ScormProvider>` lokalizuje API LMS i udostępnia je przez kontekst. **Nie** inicjalizuje się automatycznie — musisz jawnie wywołać `api.initialize()`.

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

### Opcje `noLmsBehavior`

| Wartość | Zachowanie |
|---------|------------|
| `"error"` (domyślna) | `api` jest `null`, `status.apiFound` wynosi `false`. Operacje nie mogą być wywoływane. |
| `"mock"` | Używa in-memory mock SCORM API. Idealne do lokalnego developmentu i testów. |
| `"throw"` | Rzuca `ScormError` podczas renderowania. Opakuj komponent w React **Error Boundary**. |

> **Tryb `"throw"`** rzuca wyjątek synchronicznie wewnątrz `useMemo`. Bez Error Boundary błąd propaguje się w górę i niszczy całe poddrzewo komponentów. Zawsze opakowuj `<ScormProvider>` w Error Boundary, gdy używasz tego trybu.

## useScorm()

```tsx
const { status, api, raw } = useScorm();
```

| Pole | Typ | Opis |
|------|-----|------|
| `status` | `ScormStatus` | Stan połączenia: `apiFound`, `initialized`*, `terminated`*, `version`, `noLmsBehavior` |
| `api` | `IScormApi \| null` | Wysokopoziomowe API niezależne od wersji. `null`, gdy nie znaleziono API przy zachowaniu `"error"`. |
| `raw` | `IScormDriver \| null` | Niskopoziomowy driver do bezpośrednich wywołań API (wyjście awaryjne). |

> **Uwaga:** `status.initialized` i `status.terminated` mają zawsze wartość `false` w wartości kontekstu — provider nie śledzi stanu środowiska uruchomieniowego. Jeśli potrzebujesz reaktywnego stanu `initialized`/`terminated`, zarządzaj nim samodzielnie przez `useState` po wywołaniu `api.initialize()` i `api.terminate()`.

## Wysokopoziomowe API

Wszystkie metody zwracają `Result<T, ScormError>` — sprawdź `result.ok` przed odczytaniem wartości.

### Cykl życia

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

### Wynik (Score)

```ts
api.setScore({ raw: 85, min: 0, max: 100, scaled: 0.85 })  // scaled is 2004 only
api.getScore()  // Result<ScoreData, ScormError>
```

**Walidacja:** `raw`, `min` i `max` muszą być skończonymi liczbami (NaN/Infinity są odrzucane z kodem błędu 405). `scaled` musi mieścić się w zakresie `[-1, 1]` (kod błędu 407 przy przekroczeniu zakresu). W przypadku SCORM 1.2 parametr `scaled` jest po cichu ignorowany.

### Lokalizacja i Suspend Data

```ts
api.setLocation('page-5')
api.getLocation()
api.setSuspendData(JSON.stringify({ progress: [1, 2, 3] }))
api.getSuspendData()
```

### Czas sesji

```ts
api.setSessionTime(90000)  // 1.2: "00:01:30.00" | 2004: "PT1M30S"
api.getTotalTime()
```

### Informacje o uczącym się (tylko do odczytu)

```ts
api.getLearnerId()
api.getLearnerName()
api.getLaunchData()
api.getMode()
api.getCredit()
api.getEntry()
```

### Cele (Objectives)

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

### Interakcje

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

### Komentarze

```ts
// SCORM 1.2: appends to a single cmi.comments string (newline-separated)
// SCORM 2004: creates indexed entries in cmi.comments_from_learner
api.addLearnerComment('Great course', 'page-3', '2024-01-15T10:00:00Z')
                      // comment        location  timestamp (all optional except comment)

// Count methods: always return 0 for SCORM 1.2
api.getLearnerCommentCount()  // Result<number, ScormError>
api.getLmsCommentCount()      // Result<number, ScormError> — LMS comments read-only
```

### Preferencje

```ts
api.setPreference('language', 'en')
api.getPreferences()  // Result<Record<string, string>, ScormError>
```

### Postęp (wyłącznie SCORM 2004)

```ts
api.setProgressMeasure(0.75)  // value must be in range [0, 1] — error 407 otherwise
                               // no-op (returns ok) for SCORM 1.2
```

### Wyjście (Exit)

```ts
api.setExit('suspend')  // 1.2: cmi.core.exit | 2004: cmi.exit
                        // Common values: 'suspend', 'logout', 'time-out', ''
```

### Dane uczącego się (tylko do odczytu, ustawiane przez LMS)

```ts
api.getMasteryScore()     // 1.2: cmi.student_data.mastery_score | 2004: cmi.scaled_passing_score
api.getMaxTimeAllowed()   // 1.2: cmi.student_data.max_time_allowed | 2004: cmi.max_time_allowed
api.getTimeLimitAction()  // 1.2: cmi.student_data.time_limit_action | 2004: cmi.time_limit_action
```

### Nawigacja (wyłącznie SCORM 2004)

```ts
api.setNavRequest('continue')              // no-op (returns ok) for SCORM 1.2
api.getNavRequestValid('continue')         // 'continue' | 'previous'
api.getNavRequestValid('previous')
```

### Bezpośredni dostęp do API (wyjście awaryjne)

```ts
api.getRaw('cmi.core.lesson_status')
api.setRaw('cmi.core.lesson_status', 'completed')
```

## Obsługa błędów

Wszystkie operacje zwracają `Result<T, ScormError>` zamiast rzucać wyjątki:

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

`ScormError` zawiera: `version`, `operation`, `path`, `code`, `errorString`, `diagnostic`, `exception`, `apiFound`, `initialized`.

Funkcje pomocnicze: `isOk()`, `isErr()`, `unwrap()`, `unwrapOr()`.

> **Bezpieczeństwo:** `errorString` i `diagnostic` to ciągi znaków pochodzące bezpośrednio z LMS. Nie renderuj ich przez `innerHTML` ani żadne inne niezabezpieczone DOM API — traktuj je jako niezaufane dane wejściowe i stosuj HTML-escaping przed jakimkolwiek wstawieniem do DOM.

## useScormSession (reaktywny stan — opcjonalnie)

`useScorm()` celowo utrzymuje `status.initialized` jako statyczną migawkę — provider nie śledzi stanu cyklu życia. Jeśli potrzebujesz `initialized` i `terminated` jako reaktywnego stanu React (wyzwalającego ponowne renderowanie), użyj zamiast tego `useScormSession()`.

```tsx
import { useScormSession } from '@studiolxd/react-scorm';

function Course() {
  const { initialized, initialize, terminate, api } = useScormSession();

  useEffect(() => { initialize(); }, [initialize]);

  if (!initialized) return <p>Connecting…</p>;
  return <CourseContent api={api} onFinish={terminate} />;
}
```

`useScormSession()` jest nadzbiorem `useScorm()` — zwraca wszystko, co `useScorm()` (`api`, `status`, `raw`), a dodatkowo:

| Pole | Typ | Opis |
|------|-----|------|
| `initialized` | `boolean` | `true` po pomyślnym wywołaniu `initialize()`. Reaktywne. |
| `terminated` | `boolean` | `true` po pomyślnym wywołaniu `terminate()`. Reaktywne. |
| `initialize()` | `Result<true, ScormError> \| undefined` | Wywołuje `api.initialize()` i aktualizuje stan. `undefined`, gdy brak API. |
| `terminate()` | `Result<true, ScormError> \| undefined` | Wywołuje `api.terminate()` i aktualizuje stan. `undefined`, gdy brak API. |
| `commit()` | `Result<true, ScormError> \| undefined` | Wywołuje `api.commit()`. `undefined`, gdy brak API. |

> **Uwaga:** Gdy `noLmsBehavior` ma wartość `'error'` i nie znaleziono LMS, `api` jest `null`, a wszystkie trzy metody zwracają `undefined`. Sprawdź `status.apiFound`, jeśli chcesz rozróżnić ten przypadek.

## useScormAutoTerminate (opcjonalnie)

Automatycznie zarządza cyklem życia SCORM:

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

## Konstruktory ścieżek (Path Builders)

Typowane funkcje pomocnicze do budowania indeksowanych ścieżek CMI:

```ts
import { scorm12ObjectivePath, scorm2004InteractionPath } from '@studiolxd/react-scorm';

scorm12ObjectivePath(0, 'score.raw')       // "cmi.objectives.0.score.raw"
scorm2004InteractionPath(1, 'learner_response')  // "cmi.interactions.1.learner_response"
```

## Formatery czasu

```ts
import { formatScorm12Time, formatScorm2004Time } from '@studiolxd/react-scorm';

formatScorm12Time(90000)   // "00:01:30.00"
formatScorm2004Time(90000) // "PT1M30S"
```

## Testowanie

Do testów używaj `noLmsBehavior: 'mock'`. Mock korzysta z magazynu in-memory z rzeczywistym zachowaniem driver'a.

```tsx
// In tests
<ScormProvider version="1.2" options={{ noLmsBehavior: 'mock' }}>
  <ComponentUnderTest />
</ScormProvider>
```

Możesz też bezpośrednio korzystać z klas mock:

```ts
import { MockScorm12Api, Scorm12Driver, ScormApi, createLogger } from '@studiolxd/react-scorm';

const mockApi = new MockScorm12Api();
const driver = new Scorm12Driver(mockApi, createLogger(false));
const api = new ScormApi(driver);
api.initialize();
// ... test your logic
```

## TypeScript

Wszystkie ścieżki CMI są ściśle typowane:

```ts
import type { Scorm12CmiPath, Scorm2004CmiPath } from '@studiolxd/react-scorm';

// These types catch typos at compile time:
const path: Scorm12CmiPath = 'cmi.core.lesson_status';  // OK
// const bad: Scorm12CmiPath = 'cmi.core.typo';          // ERROR
```

## Dodatkowa dokumentacja

- [Tabela mapowania SCORM 1.2 vs 2004](./docs/scorm-mapping-table.md)
- [Testowanie z trybem mock](./docs/mock-mode.md)
- [Przewodnik integracji](./docs/integration-guide.md)

## Licencja

MIT
