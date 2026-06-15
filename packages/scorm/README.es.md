🌐 [English](README.md) · [Español](README.es.md) · [Français](README.fr.md) · [Português](README.pt.md) · [Deutsch](README.de.md) · [Polski](README.pl.md)

# @studiolxd/react-scorm

Una librería headless de React + TypeScript para la integración del runtime SCORM. Proporciona un componente `<ScormProvider>` y un hook `useScorm()` para comunicarse con un LMS mediante SCORM 1.2 o SCORM 2004 (4.ª edición).

**Características principales:**
- Cobertura completa de los estándares SCORM 1.2 y 2004
- Headless (sin interfaz de usuario) — tú construyes la interfaz
- Tipos TypeScript estrictos para todas las rutas CMI y APIs
- Manejo de errores basado en Result (sin lanzamiento implícito de excepciones)
- Sin estado automático, sin persistencia, sin guardado automático
- Modo mock en memoria para el desarrollo local
- Gestión del ciclo de vida opt-in con `useScormAutoTerminate`

## Instalación

```bash
npm install @studiolxd/react-scorm
```

Se requiere React 18+ como dependencia par (peer dependency).

## Inicio rápido

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

El componente `<ScormProvider>` localiza la API del LMS y la pone a disposición a través del contexto. **No** inicializa automáticamente — debes llamar a `api.initialize()` de forma explícita.

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

### Opciones de `noLmsBehavior`

| Valor | Comportamiento |
|-------|----------------|
| `"error"` (predeterminado) | `api` es `null`, `status.apiFound` es `false`. No se pueden realizar operaciones. |
| `"mock"` | Usa una API SCORM mock en memoria. Ideal para el desarrollo local y las pruebas. |
| `"throw"` | Lanza un `ScormError` durante el renderizado. Envuelve con un **Error Boundary** de React. |

> **Modo `"throw"`** lanza de forma síncrona dentro de `useMemo`. Sin un Error Boundary, el error se propagará hacia arriba y hará que todo el subárbol falle. Siempre envuelve `<ScormProvider>` en un Error Boundary cuando uses este modo.

## useScorm()

```tsx
const { status, api, raw } = useScorm();
```

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `status` | `ScormStatus` | Estado de la conexión: `apiFound`, `initialized`*, `terminated`*, `version`, `noLmsBehavior` |
| `api` | `IScormApi \| null` | API de alto nivel independiente de la versión. `null` cuando no se encuentra la API con el comportamiento `"error"`. |
| `raw` | `IScormDriver \| null` | Driver de bajo nivel para llamadas directas a la API (vía de escape). |

> **Nota:** `status.initialized` y `status.terminated` son siempre `false` en el valor del contexto — el provider no rastrea el estado del runtime. Si necesitas estado reactivo de initialized/terminated, mantenlo tú mismo con `useState` después de llamar a `api.initialize()` y `api.terminate()`.

## API de alto nivel

Todos los métodos devuelven `Result<T, ScormError>` — verifica `result.ok` antes de acceder al valor.

### Ciclo de vida

```ts
api.initialize()   // Result<true, ScormError>
api.terminate()    // Result<true, ScormError>
api.commit()       // Result<true, ScormError>
```

### Estado

```ts
api.setComplete()    // 1.2: cmi.core.lesson_status="completed" | 2004: cmi.completion_status="completed"
api.setIncomplete()
api.setPassed()      // 1.2: cmi.core.lesson_status="passed"    | 2004: cmi.success_status="passed"
api.setFailed()      // 1.2: cmi.core.lesson_status="failed"    | 2004: cmi.success_status="failed"
api.getCompletionStatus()
api.getSuccessStatus()
```

### Puntuación

```ts
api.setScore({ raw: 85, min: 0, max: 100, scaled: 0.85 })  // scaled is 2004 only
api.getScore()  // Result<ScoreData, ScormError>
```

**Validación:** `raw`, `min` y `max` deben ser números finitos (NaN/Infinity son rechazados con el código de error 405). `scaled` debe estar en el rango `[-1, 1]` (código de error 407 si está fuera de rango). Para SCORM 1.2, `scaled` se ignora silenciosamente.

### Ubicación y datos de suspensión

```ts
api.setLocation('page-5')
api.getLocation()
api.setSuspendData(JSON.stringify({ progress: [1, 2, 3] }))
api.getSuspendData()
```

### Tiempo de sesión

```ts
api.setSessionTime(90000)  // 1.2: "00:01:30.00" | 2004: "PT1M30S"
api.getTotalTime()
```

### Información del alumno (solo lectura)

```ts
api.getLearnerId()
api.getLearnerName()
api.getLaunchData()
api.getMode()
api.getCredit()
api.getEntry()
```

### Objetivos

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

### Interacciones

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

### Comentarios

```ts
// SCORM 1.2: appends to a single cmi.comments string (newline-separated)
// SCORM 2004: creates indexed entries in cmi.comments_from_learner
api.addLearnerComment('Great course', 'page-3', '2024-01-15T10:00:00Z')
                      // comment        location  timestamp (all optional except comment)

// Count methods: always return 0 for SCORM 1.2
api.getLearnerCommentCount()  // Result<number, ScormError>
api.getLmsCommentCount()      // Result<number, ScormError> — LMS comments read-only
```

### Preferencias

```ts
api.setPreference('language', 'en')
api.getPreferences()  // Result<Record<string, string>, ScormError>
```

### Progreso (solo SCORM 2004)

```ts
api.setProgressMeasure(0.75)  // value must be in range [0, 1] — error 407 otherwise
                               // no-op (returns ok) for SCORM 1.2
```

### Salida

```ts
api.setExit('suspend')  // 1.2: cmi.core.exit | 2004: cmi.exit
                        // Common values: 'suspend', 'logout', 'time-out', ''
```

### Datos del estudiante (solo lectura, establecidos por el LMS)

```ts
api.getMasteryScore()     // 1.2: cmi.student_data.mastery_score | 2004: cmi.scaled_passing_score
api.getMaxTimeAllowed()   // 1.2: cmi.student_data.max_time_allowed | 2004: cmi.max_time_allowed
api.getTimeLimitAction()  // 1.2: cmi.student_data.time_limit_action | 2004: cmi.time_limit_action
```

### Navegación (solo SCORM 2004)

```ts
api.setNavRequest('continue')              // no-op (returns ok) for SCORM 1.2
api.getNavRequestValid('continue')         // 'continue' | 'previous'
api.getNavRequestValid('previous')
```

### Acceso directo (vía de escape)

```ts
api.getRaw('cmi.core.lesson_status')
api.setRaw('cmi.core.lesson_status', 'completed')
```

## Manejo de errores

Todas las operaciones devuelven `Result<T, ScormError>` en lugar de lanzar excepciones:

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

`ScormError` incluye: `version`, `operation`, `path`, `code`, `errorString`, `diagnostic`, `exception`, `apiFound`, `initialized`.

Funciones de ayuda: `isOk()`, `isErr()`, `unwrap()`, `unwrapOr()`.

> **Seguridad:** `errorString` y `diagnostic` son cadenas que provienen directamente del LMS. No las renderices mediante `innerHTML` ni ninguna API del DOM sin sanitizar — tratalas como entrada no confiable y escapa el HTML antes de cualquier inserción en el DOM.

## useScormSession (estado reactivo opt-in)

`useScorm()` mantiene intencionalmente `status.initialized` como una instantánea estática — el provider no rastrea el estado del ciclo de vida. Si necesitas `initialized` y `terminated` como estado reactivo de React (para disparar re-renderizados), usa `useScormSession()` en su lugar.

```tsx
import { useScormSession } from '@studiolxd/react-scorm';

function Course() {
  const { initialized, initialize, terminate, api } = useScormSession();

  useEffect(() => { initialize(); }, [initialize]);

  if (!initialized) return <p>Connecting…</p>;
  return <CourseContent api={api} onFinish={terminate} />;
}
```

`useScormSession()` es un superconjunto de `useScorm()` — devuelve todo lo que devuelve `useScorm()` (`api`, `status`, `raw`) más:

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `initialized` | `boolean` | `true` tras el éxito de `initialize()`. Reactivo. |
| `terminated` | `boolean` | `true` tras el éxito de `terminate()`. Reactivo. |
| `initialize()` | `Result<true, ScormError> \| undefined` | Llama a `api.initialize()` y actualiza el estado. `undefined` si no hay API. |
| `terminate()` | `Result<true, ScormError> \| undefined` | Llama a `api.terminate()` y actualiza el estado. `undefined` si no hay API. |
| `commit()` | `Result<true, ScormError> \| undefined` | Llama a `api.commit()`. `undefined` si no hay API. |

> **Nota:** Cuando `noLmsBehavior` es `'error'` y no se encuentra ningún LMS, `api` es `null` y los tres métodos devuelven `undefined`. Comprueba `status.apiFound` si necesitas distinguir este caso.

## useScormAutoTerminate (opt-in)

Gestiona el ciclo de vida de SCORM de forma automática:

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

## Constructores de rutas (Path Builders)

Funciones de ayuda tipadas para construir rutas CMI indexadas:

```ts
import { scorm12ObjectivePath, scorm2004InteractionPath } from '@studiolxd/react-scorm';

scorm12ObjectivePath(0, 'score.raw')       // "cmi.objectives.0.score.raw"
scorm2004InteractionPath(1, 'learner_response')  // "cmi.interactions.1.learner_response"
```

## Formateadores de tiempo

```ts
import { formatScorm12Time, formatScorm2004Time } from '@studiolxd/react-scorm';

formatScorm12Time(90000)   // "00:01:30.00"
formatScorm2004Time(90000) // "PT1M30S"
```

## Pruebas

Usa `noLmsBehavior: 'mock'` para las pruebas. El mock utiliza un almacén en memoria con el comportamiento real del driver.

```tsx
// In tests
<ScormProvider version="1.2" options={{ noLmsBehavior: 'mock' }}>
  <ComponentUnderTest />
</ScormProvider>
```

También puedes usar las clases mock directamente:

```ts
import { MockScorm12Api, Scorm12Driver, ScormApi, createLogger } from '@studiolxd/react-scorm';

const mockApi = new MockScorm12Api();
const driver = new Scorm12Driver(mockApi, createLogger(false));
const api = new ScormApi(driver);
api.initialize();
// ... test your logic
```

## TypeScript

Todas las rutas CMI están tipadas de forma estricta:

```ts
import type { Scorm12CmiPath, Scorm2004CmiPath } from '@studiolxd/react-scorm';

// These types catch typos at compile time:
const path: Scorm12CmiPath = 'cmi.core.lesson_status';  // OK
// const bad: Scorm12CmiPath = 'cmi.core.typo';          // ERROR
```

## Documentación adicional

- [Tabla de equivalencias SCORM 1.2 vs 2004](./docs/scorm-mapping-table.md)
- [Pruebas con el modo mock](./docs/mock-mode.md)
- [Guía de integración](./docs/integration-guide.md)

## Licencia

MIT
