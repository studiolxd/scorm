# Plan — Núcleo agnóstico + multi-framework + IA

> Estado: **propuesta de planificación** (no implementado). Documento de trabajo.
> Alcance de esta fase ("Opción A completa"): extraer el **core agnóstico** con API
> observable, soporte vanilla + Web Component + build IIFE, y los adaptadores de
> framework como **subpaths del mismo paquete**.
>
> **Decisión de empaquetado: UN SOLO PAQUETE con subpath exports** (modelo Zustand/Valtio),
> no varios paquetes. Razonado en §1. Angular validado dentro de este modelo (§5).
>
> Naming: el paquete pasa a llamarse **`@studiolxd/scorm`**. El actual
> `@studiolxd/react-scorm` se renombra vía deprecate + shim (§7).

---

## 1. Empaquetado: un paquete con subpaths (no split)

```js
import { createScormSession } from '@studiolxd/scorm';          // core + vanilla
import { useScorm }           from '@studiolxd/scorm/react';
import { useScorm }           from '@studiolxd/scorm/vue';
import { provideScorm }       from '@studiolxd/scorm/angular';
import { scormStore }         from '@studiolxd/scorm/svelte';
import '@studiolxd/scorm/wc';                                   // Web Component
// <script src="…/scorm.global.js"> → window.Scorm
```

**Por qué un solo paquete** (precedente: `zustand` + `zustand/vanilla`, `valtio` + `valtio/vanilla`):
- **Sin contaminación entre frameworks**: `exports` por subpath + `sideEffects: false` → un
  usuario de Vue que importa `/vue` **no** mete React en su bundle (tree-shaking). "Importas
  solo tu subpath", no toda la librería.
- **Peers no intrusivas**: react/vue/@angular/core/svelte como `peerDependencies` marcadas
  `optional` vía `peerDependenciesMeta` → a un usuario de Vue no se le pide instalar React.
- **Simplicidad**: un README, un CI, un release, un `llms.txt`, **un** token npm, renombrado
  trivial (un paquete nuevo + deprecate del viejo).

**Trade-offs aceptados** (no bloqueos):
- Versionado/changelog compartidos (un fix del subpath Vue bumpa la versión de todos).
- Se pierde el SEO de `scorm-vue`/`scorm-angular` como paquetes → se compensa con `keywords`.

**Contingencia (reversible):** si algún adaptador llegara a necesitar cadencia de releases
propia o build especial, se saca a su paquete después (mover un subpath a paquete es barato).
Con la validación de §5, **Angular NO necesita salir**.

---

## 2. Estructura (sigue siendo monorepo, pero un solo paquete publicable)

```
packages/
  scorm/                 → @studiolxd/scorm   (ÚNICO paquete publicable)
    src/
      core/  api/  errors/  result/  types/  mock/  debug/   ← motor agnóstico (ya existe)
      session/           ← createScormSession + emisor (nuevo)
      lifecycle/         ← autoTerminate / autoCommit vanilla (extraído de los hooks)
      react/             ← adaptador (subpath ./react)
      vue/               ← adaptador (subpath ./vue)        [futuro]
      angular/           ← adaptador (subpath ./angular)    [futuro, validado §5]
      svelte/            ← adaptador (subpath ./svelte)     [futuro]
      wc/                ← Web Component (subpath ./wc)
      index.ts           ← core + vanilla (subpath ".")
example/                 → app de demo (ÚNICA app; usa el subpath ./react)
docs/                    → este plan + llms.txt agregada + guías (Unity, etc.)
```

> En esta fase se construyen: core+vanilla (`.`), `./react`, `./wc` e IIFE. Vue/Angular/Svelte
> quedan con el contrato definido y se añaden como subpaths cuando toque, sin re-arquitectura.

---

## 3. El core agnóstico (subpath `.`)

### 3.1 Qué se mueve tal cual (0 reescritura)
Todo el código actual **excepto `src/react/`**: `core/`, `api/`, `errors/`, `result/`,
`types/`, `mock/`, `debug/`. Ya es agnóstico y está testeado.

### 3.2 Sesión observable
Pieza central que habilita vanilla y todos los adaptadores.

```ts
export interface ScormSession {
  readonly api: IScormApi | null;
  readonly raw: IScormDriver | null;
  readonly status: ScormStatus;        // incluye initialized/terminated reactivos
  initialize(): Result<true, ScormError> | undefined;
  commit(): Result<true, ScormError> | undefined;
  terminate(): Result<true, ScormError> | undefined;
  on(event: 'change', cb: (status: ScormStatus) => void): () => void;  // devuelve unsubscribe
  off(event: 'change', cb: (status: ScormStatus) => void): void;
  destroy(): void;
}

export function createScormSession(
  version: ScormVersion | 'auto',
  options?: ScormProviderOptions,
): ScormSession;
```

Implementación: envuelve `createDriver` + `ScormApi` (ya existen) + un emisor mínimo
(`Set<listener>`); emite `change` al tener éxito `initialize`/`terminate`.

### 3.3 Helpers de ciclo de vida (vanilla puro, subpath `.`)
Se extrae la lógica de los hooks actuales (listeners + timer) a funciones con `dispose()`.
**Los hooks de React pasan a llamarlas** → menos duplicación.

```ts
export function autoTerminate(session: ScormSession, opts?: AutoTerminateOptions): () => void;
export function autoCommit(session: ScormSession, intervalMs?: number): () => void;
```

### 3.4 Builds y `exports`
`tsup` con varias entries + 3 formatos. La novedad: **IIFE/global** para `<script>`.

```jsonc
// packages/scorm/package.json (extracto)
{
  "name": "@studiolxd/scorm",
  "type": "module",
  "types": "./dist/index.d.ts",
  "unpkg":   "./dist/scorm.global.js",
  "jsdelivr": "./dist/scorm.global.js",
  "exports": {
    ".":         { "import": "./dist/index.js",   "require": "./dist/index.cjs", "types": "./dist/index.d.ts" },
    "./react":   { "import": "./dist/react.js",   "require": "./dist/react.cjs", "types": "./dist/react.d.ts" },
    "./vue":     { "import": "./dist/vue.js",      "types": "./dist/vue.d.ts" },
    "./angular": { "import": "./dist/angular.js",  "types": "./dist/angular.d.ts" },
    "./svelte":  { "import": "./dist/svelte.js",   "types": "./dist/svelte.d.ts" },
    "./wc":      { "import": "./dist/wc.js",        "types": "./dist/wc.d.ts" }
  },
  "peerDependencies": {
    "react": ">=18", "react-dom": ">=18",
    "vue": ">=3.3", "@angular/core": ">=17", "svelte": ">=4"
  },
  "peerDependenciesMeta": {
    "react": { "optional": true }, "react-dom": { "optional": true },
    "vue": { "optional": true }, "@angular/core": { "optional": true }, "svelte": { "optional": true }
  },
  "files": ["dist", "llms.txt"],
  "sideEffects": false,
  "publishConfig": { "access": "public" }
}
```

Global IIFE → `window.Scorm` (`Scorm.createScormSession(...)`).

---

## 4. Adaptador React (subpath `./react`)

El código de `src/react/` actual, pero consumiendo el core:
- `ScormProvider`/`useScorm` usan `createScormSession`.
- `useScormSession` se simplifica con `useSyncExternalStore` sobre `session.on('change')`.
- `useScormAutoTerminate`/`useScormAutoCommit` llaman a `autoTerminate`/`autoCommit` del core.
- Se re-exportan tipos/utilidades del core para no obligar a dos imports.

---

## 5. Angular — VALIDACIÓN (el caso delicado)

**Riesgo:** Angular no compila `node_modules`. Una clase con decorador `@Injectable` en la lib
exigiría compilación Ivy/APF (ng-packagr) → incompatible con un build tsup de ESM plano.

**Solución validada:** el adaptador Angular se publica **sin decoradores**. Se expone una
función `provideScorm()` que devuelve un `Provider` + un `InjectionToken`, usando `inject()`,
`DestroyRef` y `signal`. Todo es TypeScript plano (cero compilación Ivy) → el builder esbuild
de Angular (v17+) lo consume como cualquier dependencia ESM.

```ts
// @studiolxd/scorm/angular
import { InjectionToken, inject, DestroyRef, signal, type Signal } from '@angular/core';
import { createScormSession, autoTerminate } from '@studiolxd/scorm';
import type { ScormSession, ScormStatus, ScormVersion, ScormProviderOptions } from '@studiolxd/scorm';

export const SCORM = new InjectionToken<{ session: ScormSession; status: Signal<ScormStatus> }>('SCORM');

export function provideScorm(version: ScormVersion | 'auto', options?: ScormProviderOptions) {
  return {
    provide: SCORM,
    useFactory: () => {
      const session = createScormSession(version, options);
      const status = signal<ScormStatus>(session.status);
      const off = session.on('change', (s) => status.set({ ...s }));
      const stop = autoTerminate(session);
      inject(DestroyRef).onDestroy(() => { off(); stop(); session.destroy(); });
      return { session, status };
    },
  };
}
```

Uso en una app standalone:
```ts
bootstrapApplication(App, { providers: [provideScorm('auto', { noLmsBehavior: 'mock' })] });
// en un componente:
const { session, status } = inject(SCORM);   // status() es un signal reactivo
```

**Por qué funciona:** no hay nada que `ngc` deba pre-compilar (ni componentes, ni `@Injectable`).
`InjectionToken`, `provideScorm` y la factory son JS plano; `inject`/`DestroyRef`/`signal` son
APIs de runtime de `@angular/core`.

**Versión mínima documentada: Angular 17** (signals estables, builder esbuild y standalone por
defecto). Recomendado 17+; se validará en CI contra v17 LTS y la última (22.x).
`@angular/core` va como peerDependency **opcional** `>=17`.

**Verificación pendiente en implementación (criterio de aceptación):** un *smoke test* en CI
que cree una app Angular 17+ mínima, instale el paquete, inyecte `provideScorm` y compile en
modo producción (AOT). Si pasara a fallar por APF, el subpath `./angular` se saca a su propio
paquete construido con ng-packagr (única contingencia) — el resto del modelo no cambia.

---

## 6. Contrato para los demás adaptadores (Vue / Svelte / Solid)

Todo adaptador es un **puente de reactividad** sobre el mismo contrato `session.on('change')`:

| Framework | Primitiva | Notas |
|---|---|---|
| Vue | `shallowRef` + `onUnmounted` | encaje natural, ~½ día |
| Svelte | `readable` store | un store *es* `{subscribe}` → casi gratis |
| Solid | `createSignal` | igual |

Los helpers `autoTerminate`/`autoCommit` se reutilizan tal cual.

---

## 7. La app de ejemplo (única) y npmjs

### 7.1 App
Se mantiene **solo** la app actual: migra su import a `@studiolxd/scorm/react` y añade
(opcional) una pestaña que muestre el uso **vanilla** y el **Web Component**. Sin mini-apps ni
StackBlitz.

### 7.2 Cambios en npmjs (renombrado, ahora simple)
Con un solo paquete, el renombrado es directo:
1. Publicar **`@studiolxd/scorm@1.0.0`** (primer publish scoped → `publishConfig.access: public`).
2. **Token**: con un único paquete, **un** granular token (con *Bypass 2FA*) o un Automation
   token que cubra `@studiolxd/scorm` es suficiente. (Recordatorio: los granular tokens son por
   paquete; hay que generarlo para el nombre **nuevo**.)
3. **Shim**: última versión de `@studiolxd/react-scorm` que depende de y re-exporta
   `@studiolxd/scorm/react`, con README apuntando al nuevo nombre.
4. **Deprecate**:
   `npm deprecate @studiolxd/react-scorm@"*" "Renombrado a @studiolxd/scorm (usa @studiolxd/scorm/react)."`
5. **CDN**: unpkg/jsdelivr sirven el IIFE al publicar; `unpkg`/`jsdelivr` fijan el fichero. Sin
   config en npmjs.
6. **Versionado**: `@studiolxd/scorm` arranca en `1.0.0` (o `2.0.0` para alinear con el salto de
   nombre). Documentar en el README.

---

## 8. Documentación para herramientas de "vibecoding"

Por impacto:
1. **Tipos + JSDoc** (lo que más leen los agentes vía `.d.ts`). Mantener `@example` en cada
   símbolo público; tipos literales para vocabulario SCORM.
2. **`llms.txt`** en la raíz del paquete (incluido en `files`): propósito, install, quickstart,
   índice de API, diferencias 1.2/2004, *gotchas* (comprobar `.ok`; 1.2 interacciones
   write-only; score 0–100; SSR guard; latch post-terminate). Plus `docs/llms-full.txt` agregada.
3. **README** con secciones fijas `Quick start` / `API` / `Recipes` / `Version differences`,
   todo copiable.
4. **`AGENTS.md`** en la raíz del repo (instrucciones para agentes que trabajen en el repo).
5. **`Result` discriminado** (ya): obliga al manejo correcto, muy *agent-friendly*.

En el tarball npm: `README` + `llms.txt` + `dist` con `.d.ts`+JSDoc. `AGENTS.md` vive en el repo.

---

## 9. Skills para agentes IA (Claude Code, Cursor, Antigravity, …)

### 9.1 Formatos (convergen en markdown + metadatos)
- **Claude Code**: `SKILL.md` (frontmatter `name`, `description`, *when to use*) + apoyo;
  distribuido como *plugin/marketplace* (repo git con manifiesto).
- **Cursor**: `.cursor/rules/*.mdc` (frontmatter `description`, `globs`, `alwaysApply`).
- **AGENTS.md**: baseline portable.
- **Antigravity / otros**: convención de reglas/contexto similar; donde el formato exacto no
  esté claro, el baseline portable (`AGENTS.md` + `llms.txt`) cubre el caso.

### 9.2 Una fuente, varios formatos
**Un contenido canónico** + un script que **genera** cada formato. Enseña: install + **mock
mode**, ciclo de vida, manejo de `Result`, diferencias 1.2/2004, recetas y *pitfalls*.

```
scorm-skills/                      (repo/distribución APARTE)
  source/skill.md                  ← fuente canónica
  build/{claude/SKILL.md, cursor/scorm.mdc, agents/AGENTS.md, llms.txt}
  .claude-plugin/marketplace.json  ← añadir como marketplace en Claude Code
  scripts/build.mjs                ← source → build/*
```

### 9.3 ¿Mismo paquete npm o separado? → **Separado**
El paquete de runtime queda ligero (solo `dist` + `llms.txt`). Las skills viven en un **repo
dedicado `studiolxd/scorm-skills`** (audiencia y distribución distintas: *marketplaces*, no
`npm install`). Versionado en paralelo, no empaquetado en el tarball.

### 9.4 Publicación
- **Claude Code**: repo con `.claude-plugin/marketplace.json` añadible como marketplace.
- **Cursor**: reglas `.mdc` copiables al proyecto o a registros de reglas.
- **Portable**: `AGENTS.md` + `llms.txt` para el resto.
- Enlazar el repo de skills desde el README del paquete.

---

## 10. Fases de ejecución y esfuerzo

| Fase | Contenido | Esfuerzo |
|---|---|---|
| 0 | Cerrar 1.1.0 (publish actual) | pendiente token |
| 1 | Renombrar paquete a `@studiolxd/scorm`; mover `react/` a subpath; tests verdes | ~½ día |
| 2 | Sesión observable `createScormSession` + emisor + tests | ~½ día |
| 3 | Extraer `autoTerminate`/`autoCommit` a vanilla; hooks React los reusan | ~¼ día |
| 4 | Build IIFE/global + `exports` por subpath + `unpkg` | ~¼ día |
| 5 | Web Component `./wc` + tests | ~½ día |
| 6 | Adaptador React sobre el core (`useSyncExternalStore`), re-exports | ~½ día |
| 7 | Renombrado npm (shim + deprecate) + token nuevo | ~¼ día |
| 8 | `llms.txt` + `AGENTS.md` + README | ~½ día |
| 9 | Repo `scorm-skills` (fuente + generadores + marketplace) | ~1 día |
| 10 | Migrar app de ejemplo + pestaña vanilla/WC | ~½ día |
| 11 | **Smoke test Angular 17+ en CI** (valida §5) + subpath `./angular` | ~½ día |
| — | Vue / Svelte (subpaths, futuro) | ~½ día c/u |

Total (fases 1–11): **~5–5½ días** efectivos.

---

## 11. Criterios de aceptación

- [ ] `@studiolxd/scorm` publica ESM+CJS+IIFE; `window.Scorm.createScormSession` funciona en `<script>`.
- [ ] Core sin imports de ningún framework; tests del core verdes (paridad con los actuales).
- [ ] `createScormSession().on('change')` emite en initialize/terminate.
- [ ] Subpaths `./react` y `./wc` funcionan; un import de `/wc` no arrastra React (tree-shaking).
- [ ] **Angular**: smoke test en CI — app Angular 17+ con `provideScorm` compila en AOT/producción.
- [ ] `@studiolxd/react-scorm` deprecado con shim; imports antiguos siguen resolviendo.
- [ ] Paquete incluye `llms.txt`; repo con `AGENTS.md`.
- [ ] Repo `scorm-skills` añadible como marketplace en Claude Code; reglas Cursor generadas.
- [ ] Token npm con alcance al nombre nuevo + bypass 2FA documentado.
- [ ] README documenta versión mínima por adaptador (React ≥18, Vue ≥3.3, **Angular ≥17**, Svelte ≥4).
