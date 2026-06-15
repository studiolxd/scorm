🌐 [English](README.md) · [Español](README.es.md) · [Français](README.fr.md) · [Português](README.pt.md) · [Deutsch](README.de.md) · [Polski](README.pl.md)

# `@studiolxd/react-scorm` — Demo interactiva

Una aplicación de ejemplo interactiva y completamente funcional que muestra cada característica de la librería [`@studiolxd/react-scorm`](https://www.npmjs.com/package/@studiolxd/react-scorm).

Construida con **React 19 + TypeScript + Vite**. Se ejecuta íntegramente en el navegador usando el **modo mock** de la librería — no se necesita ningún Learning Management System (LMS).

---

## Primeros pasos

```bash
npm install
npm run dev
```

Abre `http://localhost:5173` en tu navegador.

---

## Qué muestra esta demo

La aplicación tiene un **selector de versión SCORM** en la cabecera (1.2 / 2004). Al cambiar de versión se vuelve a montar el `ScormProvider` con la nueva versión, restableciendo todo el estado. Esto te permite comparar el comportamiento de ambos estándares SCORM lado a lado.

### 9 secciones de demo

| Pestaña | Funcionalidades mostradas |
|---------|--------------------------|
| **Lifecycle** | `initialize()`, `commit()`, `terminate()`, `ScormStatus` en vivo, `useScormAutoTerminate` |
| **Learner** | `getLearnerId()`, `getLearnerName()`, `getLaunchData()`, `getMode()`, `getCredit()`, `getEntry()`, `getMasteryScore()`, `getMaxTimeAllowed()`, `getTimeLimitAction()` |
| **Status** | `setComplete()`, `setIncomplete()`, `setPassed()`, `setFailed()`, `getCompletionStatus()`, `getSuccessStatus()` |
| **Score** | `setScore({ raw, min, max, scaled? })`, `getScore()`, `getPreferences()`, `setPreference()` |
| **Location** | `setLocation()`, `getLocation()`, `setSuspendData()`, `getSuspendData()`, `setSessionTime()`, `getTotalTime()`, `setExit()` |
| **Objectives** | `setObjective()`, `getObjective()`, `getObjectiveCount()` — el formulario se adapta a 1.2/2004 |
| **Interactions** | `recordInteraction()`, `getInteractionCount()` — cuestionario en vivo de 4 preguntas con retroalimentación visual de acierto/error |
| **Comments** | `addLearnerComment()`, `getLearnerCommentCount()`, `getLmsCommentCount()` |
| **Advanced** | `getRaw()`, `setRaw()`, `setProgressMeasure()`, `setNavRequest()`, `getNavRequestValid()`, `formatScorm12Time()`, `formatScorm2004Time()` |

---

## Sobre el modo mock

La aplicación usa `noLmsBehavior: 'mock'` en `ScormProvider`. Esto activa una API SCORM en memoria que se comporta como un LMS real — no se necesita ningún servidor. Todos los datos se almacenan en memoria y se pierden al recargar la página.

```tsx
// App.tsx
<ScormProvider
  key={version}           // remounts on version change → fresh state
  version={version}       // "1.2" | "2004"
  options={{ noLmsBehavior: 'mock', debug: true }}
>
  {/* all components that call useScorm() go here */}
</ScormProvider>
```

---

## Descripción general de la librería

`@studiolxd/react-scorm` es una librería headless de runtime SCORM para TypeScript/React.

### Conceptos fundamentales

**1. Provider + Hook**

```tsx
import { ScormProvider, useScorm } from '@studiolxd/scorm/react';

// Wrap your app (or lesson root)
function Root() {
  return (
    <ScormProvider version="2004" options={{ noLmsBehavior: 'mock' }}>
      <Lesson />
    </ScormProvider>
  );
}

// Consume anywhere inside the provider
function Lesson() {
  const { api, status } = useScorm();
  // api: IScormApi | null
  // status: ScormStatus
}
```

**2. Ciclo de vida explícito**

La librería nunca inicializa automáticamente. Tú llamas a `api.initialize()` cuando tu lección comienza:

```tsx
useEffect(() => {
  if (!api) return;
  api.initialize();
  return () => { api.terminate(); };
}, [api]);
```

O usa el hook de terminación automática opt-in:

```tsx
import { useScormAutoTerminate } from '@studiolxd/scorm/react';

function Lesson() {
  // Auto-initializes on mount, auto-terminates on unmount/unload
  useScormAutoTerminate({ trackSessionTime: true });
}
```

O usa `useScormSession()` para estado reactivo de initialized/terminated:

```tsx
import { useScormSession } from '@studiolxd/scorm/react';

function Course() {
  const { initialized, initialize, terminate, api } = useScormSession();

  useEffect(() => { initialize(); }, [initialize]);

  if (!initialized) return <p>Connecting…</p>;
  return <CourseContent api={api} onFinish={terminate} />;
}
```

`useScormSession()` es un superconjunto de `useScorm()` — devuelve todo lo que devuelve `useScorm()` (`api`, `status`, `raw`) más los booleanos reactivos `initialized`/`terminated` y los métodos envolventes `initialize()`, `terminate()` y `commit()`, que actualizan ese estado automáticamente.

**3. Manejo de errores basado en Result**

Cada método de la API devuelve un `Result<T, ScormError>` — sin excepciones lanzadas:

```tsx
const r = api.setScore({ raw: 85, min: 0, max: 100 });

if (r.ok) {
  console.log('Score saved');
} else {
  console.error(`SCORM error ${r.error.code}: ${r.error.errorString}`);
  // r.error also includes: operation, path, diagnostic, version, apiFound, initialized
  // Security: do NOT render errorString or diagnostic via innerHTML — treat as untrusted input
}
```

**4. API independiente de la versión**

Los mismos nombres de método funcionan tanto para SCORM 1.2 como para 2004. La librería mapea internamente a las rutas CMI correctas:

```tsx
// Works identically for 1.2 and 2004
api.setComplete();
api.setPassed();
api.setScore({ raw: 90, min: 0, max: 100 });
api.setLocation('chapter-3');
api.setSuspendData(JSON.stringify(myState));
```

### Métodos principales de la API

#### Ciclo de vida
```tsx
api.initialize()   // → Result<true, ScormError>
api.commit()       // → Result<true, ScormError>
api.terminate()    // → Result<true, ScormError>
```

#### Estado
```tsx
api.setComplete()          // → Result<string, ScormError>
api.setIncomplete()        // → Result<string, ScormError>
api.setPassed()            // → Result<string, ScormError>
api.setFailed()            // → Result<string, ScormError>
api.getCompletionStatus()  // → Result<string, ScormError>
api.getSuccessStatus()     // → Result<string, ScormError>
```

#### Puntuación
```tsx
api.setScore({ raw, min, max, scaled? })  // → Result<true, ScormError>
api.getScore()                            // → Result<ScoreData, ScormError>
```

`raw`, `min` y `max` deben ser números finitos (NaN/Infinity → error 405). `scaled` debe estar en `[-1, 1]` (error 407 si está fuera de rango). Para SCORM 1.2, `scaled` se ignora silenciosamente.

#### Ubicación y estado
```tsx
api.setLocation(value)    // → Result<string, ScormError>
api.getLocation()         // → Result<string, ScormError>
api.setSuspendData(data)  // → Result<string, ScormError>
api.getSuspendData()      // → Result<string, ScormError>
api.setSessionTime(ms)    // → Result<string, ScormError>  (takes milliseconds)
```

#### Objetivos
```tsx
api.setObjective(index, record)  // → Result<true, ScormError>
api.getObjective(index)          // → Result<ObjectiveRecord, ScormError>
api.getObjectiveCount()          // → Result<number, ScormError>
```

#### Interacciones
```tsx
api.recordInteraction(index, {
  id: 'q1',
  type: 'choice',
  learnerResponse: 'A',
  correctResponses: ['A'],
  result: 'correct',
})  // → Result<true, ScormError>
```

#### Comentarios
```tsx
api.addLearnerComment(text, location?, timestamp?)  // → Result<true, ScormError>
api.getLearnerCommentCount()                        // → Result<number, ScormError>
```

Para SCORM 1.2, todos los comentarios se concatenan en una sola cadena — el valor combinado está limitado a 4096 caracteres (error 405 si se supera). SCORM 2004 usa entradas indexadas en `cmi.comments_from_learner` sin ese límite.

#### Vía de escape directa
```tsx
api.getRaw('cmi.learner_id')          // → Result<string, ScormError>
api.setRaw('cmi.progress_measure', '0.75')  // → Result<string, ScormError>
```

#### Solo SCORM 2004
```tsx
api.setProgressMeasure(0.75)          // no-op in 1.2
api.setNavRequest('continue')
api.getNavRequestValid('continue')
```

### Tabla comparativa SCORM 1.2 vs 2004

| Característica | SCORM 1.2 | SCORM 2004 |
|----------------|-----------|------------|
| Completado + superado | `lesson_status` único | `completion_status` + `success_status` separados |
| Puntuación escalada | No disponible | `cmi.score.scaled` (-1 a 1) |
| Máximo de datos de suspensión | 4.096 caracteres | 64.000 caracteres |
| Formato del tiempo de sesión | `HH:MM:SS.SS` | `PT#H#M#S` (ISO 8601) |
| Medida de progreso | No disponible | `cmi.progress_measure` (0–1) |
| Navegación | No disponible | Solicitudes de navegación ADL |
| Comentarios | Cadena única | Array indexado con ubicación y marca de tiempo |
| Ruta del ID del alumno | `cmi.core.student_id` | `cmi.learner_id` |

---

## Estructura del proyecto

```
src/
├── main.tsx                   # Vite entry point (standard)
├── App.tsx                    # Version switcher + ScormProvider + tab navigation
├── App.css                    # Dark design system (CSS custom properties)
├── index.css                  # Global reset + IBM Plex font import
└── sections/
    ├── LifecycleSection.tsx   # initialize / commit / terminate
    ├── LearnerSection.tsx     # learner info + course metadata
    ├── StatusSection.tsx      # completion + success status
    ├── ScoreSection.tsx       # score reporting + preferences
    ├── LocationSection.tsx    # bookmark + suspend data + session time
    ├── ObjectivesSection.tsx  # SCORM objectives
    ├── InteractionsSection.tsx # quiz interactions
    ├── CommentsSection.tsx    # learner + LMS comments
    └── AdvancedSection.tsx    # raw API + 2004 features + time utils
```

### Sistema de diseño (App.css)

La aplicación usa propiedades personalizadas CSS para un tema oscuro consistente:

```css
--bg            /* #0a0c10 — page background */
--bg-card       /* #111318 — card background */
--accent        /* #34d399 — emerald, primary accent */
--accent-2004   /* #a78bfa — violet, SCORM 2004-only features */
--text          /* #e2e8f0 — primary text */
--text-muted    /* #64748b — secondary text */
--font-ui       /* IBM Plex Sans */
--font-mono     /* IBM Plex Mono */
```

Clases CSS reutilizables: `.section`, `.feature-block`, `.controls`, `.field`, `.field-input`,
`.btn`, `.btn-primary`, `.btn-danger`, `.result.ok`, `.result.error`, `.badge-12`, `.badge-2004`,
`.status-grid`, `.status-item`, `.note`, `details.code-details`.

---

## Pila de desarrollo

### Build — Vite 7

[Vite](https://vite.dev) impulsa tanto el servidor de desarrollo como la build de producción.

- HMR instantáneo mediante `@vitejs/plugin-react` (React Fast Refresh)
- Transpilación de TypeScript gestionada por Vite (esbuild) — sin emisión de `tsc`
- Build de producción: `tsc -b` para verificación de tipos + `vite build` para el empaquetado

### Language — TypeScript 5.9 (strict)

Modo strict completo habilitado en `tsconfig.app.json`:

| Opción | Valor | Efecto |
|--------|-------|--------|
| `strict` | `true` | Activa todos los flags de verificación estricta de tipos |
| `noUnusedLocals` | `true` | Error en variables no utilizadas |
| `noUnusedParameters` | `true` | Error en parámetros de función no utilizados |
| `noFallthroughCasesInSwitch` | `true` | Obliga a sentencias switch exhaustivas |
| `verbatimModuleSyntax` | `true` | Preserva la sintaxis de importación/exportación exactamente |
| `noEmit` | `true` | Solo verificación de tipos — Vite gestiona la compilación |

Dos objetivos tsconfig: `tsconfig.app.json` (src/, ES2022 + DOM) y `tsconfig.node.json` (vite.config.ts, ES2023 + tipos Node).

### Linting — ESLint 9 (flat config)

`eslint.config.js` usa el formato de configuración plana con cuatro conjuntos de reglas:

| Plugin | Versión | Reglas aportadas |
|--------|---------|-----------------|
| `@eslint/js` | 9.39 | Reglas JS recomendadas de ESLint |
| `typescript-eslint` | 8.48 | Linting específico de TypeScript |
| `eslint-plugin-react-hooks` | 7.0 | Dependencias exhaustivas, reglas de hooks |
| `eslint-plugin-react-refresh` | 0.4 | Validación de exportación de componentes React Fast Refresh |

Ejecutar con `npm run lint`.

### Scripts

| Script | Comando | Descripción |
|--------|---------|-------------|
| `npm run dev` | `vite` | Iniciar servidor de desarrollo en `http://localhost:5173` |
| `npm run build` | `tsc -b && vite build` | Verificación de tipos + bundle de producción |
| `npm run lint` | `eslint .` | Analizar todos los archivos `.ts` / `.tsx` |
| `npm run preview` | `vite preview` | Previsualizar la build de producción localmente |

### CI — GitHub Actions

Se ejecuta en cada PR y en cada push a `main` (Node 20, Ubuntu):

```
npm ci → npm run lint → npm run build
```

---

## Habilidades de Claude Code

Dos habilidades de desarrollo de IA vienen preinstaladas para su uso con [Claude Code](https://claude.ai/claude-code):

### `frontend-design` — Anthropic

> Fuente: `anthropics/skills`

Guía la creación de interfaces frontend distintivas y listas para producción. Se activa al construir componentes, páginas o cualquier interfaz web. Impone una dirección estética audaz, decisiones de diseño intencionales y una implementación pulida — evitando explícitamente la estética genérica generada por IA.

### `vercel-react-best-practices` — Vercel

> Fuente: `vercel-labs/agent-skills`

Directrices de optimización de rendimiento para React, mantenidas por Vercel Engineering. Contiene **57 reglas en 8 categorías**, aplicadas al escribir o revisar componentes React, obtención de datos, configuración de bundles o cualquier código sensible al rendimiento:

| Categoría | Reglas | Enfoque |
|-----------|:------:|---------|
| `rerender` | 13 | Evitar renderizados innecesarios (memo, estado derivado, refs) |
| `js` | 12 | Rendimiento JavaScript (caché, salidas tempranas, estructuras de datos eficientes) |
| `rendering` | 10 | Optimización del renderizado (renderizado condicional, hidratación, transiciones) |
| `server` | 7 | Patrones del lado del servidor (obtención paralela, caché, acciones de autenticación) |
| `async` | 5 | Patrones asíncronos (límites Suspense, await diferido, dependencias paralelas) |
| `bundle` | 5 | Optimización del bundle (importaciones dinámicas, barrel files, precarga) |
| `client` | 4 | Patrones del lado del cliente (event listeners, esquema localStorage, deduplicación SWR) |
| `advanced` | 3 | Patrones avanzados (refs de manejadores de eventos, init-once, useLatest) |

Las habilidades están instaladas en `.agents/skills/` y fijadas en `skills-lock.json`.

---

## Licencia

MIT — ver [LICENSE](./LICENSE).
