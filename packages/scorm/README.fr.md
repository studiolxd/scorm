🌐 [English](README.md) · [Español](README.es.md) · [Français](README.fr.md) · [Português](README.pt.md) · [Deutsch](README.de.md) · [Polski](README.pl.md)

# @studiolxd/scorm

Une bibliothèque TypeScript headless pour l'intégration du runtime SCORM. Un **cœur agnostique vis-à-vis du framework** communique avec un LMS via SCORM 1.2 ou SCORM 2004 (4e édition), accompagné d'adaptateurs légers pour **React, Vue, Angular, Svelte, Web Components** et du JavaScript vanilla / `<script>`.

> Renommée depuis `@studiolxd/react-scorm`. L'API React se trouve désormais sous le sous-chemin `@studiolxd/scorm/react`.

**Fonctionnalités principales :**
- Couverture complète des standards SCORM 1.2 et 2004
- Cœur agnostique vis-à-vis du framework + adaptateurs React / Vue / Angular / Svelte / Web Component
- Headless (sans UI) — vous construisez l'interface
- Types TypeScript stricts pour tous les chemins CMI et les APIs
- Gestion des erreurs basée sur Result (sans exceptions implicites)
- Mode mock en mémoire pour le développement local (aucun LMS requis)
- Helpers de cycle de vie optionnels (`autoTerminate`, `autoCommit`)

## Installation

```bash
npm install @studiolxd/scorm
```

Les packages de framework (React, Vue, etc.) sont des dépendances pair **optionnelles** — n'installez que celui que vous utilisez.

## Points d'entrée

| Import | Pour |
|--------|-----|
| `@studiolxd/scorm` | Cœur agnostique vis-à-vis du framework + vanilla (`createScormSession`) |
| `@studiolxd/scorm/react` | React : `ScormProvider`, `useScorm`, … (React 18+) |
| `@studiolxd/scorm/vue` | Vue 3.3+ : composable `useScorm()` |
| `@studiolxd/scorm/angular` | Angular 17+ : `provideScorm()` + token `SCORM` |
| `@studiolxd/scorm/svelte` | Svelte 4+ : `createScormStore()` |
| `@studiolxd/scorm/wc` | Web Component `<scorm-session>` |
| `window.Scorm` (CDN `<script>`) | HTML simple, sans bundler |

## Démarrage rapide — vanilla

```ts
import { createScormSession } from '@studiolxd/scorm';

const session = createScormSession('auto', { noLmsBehavior: 'mock' });
session.initialize();
session.api?.setScore({ raw: 95, min: 0, max: 100 });
session.api?.setComplete();
session.commit();
session.terminate();
```

## Démarrage rapide — React

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

## Autres frameworks

Tous les adaptateurs encapsulent la même session observable (`createScormSession`). N'installez que le
package que vous utilisez en tant que dépendance pair.

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

**Web Component / HTML simple**
```html
<script type="module">import '@studiolxd/scorm/wc';</script>
<scorm-session version="auto" no-lms-behavior="mock" auto-terminate></scorm-session>
<script>
  document.querySelector('scorm-session')
    .addEventListener('change', (e) => console.log(e.detail.status));
</script>
```

**CDN `<script>` (sans bundler)** — expose `window.Scorm` :
```html
<script src="https://unpkg.com/@studiolxd/scorm/dist/scorm.global.js"></script>
<script>
  const session = Scorm.createScormSession('auto', { noLmsBehavior: 'mock' });
  session.initialize();
</script>
```

## ScormProvider

Le composant `<ScormProvider>` localise l'API du LMS et la rend disponible via le contexte. Il **n'initialise pas automatiquement** — vous devez appeler `api.initialize()` explicitement.

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

### Options de `noLmsBehavior`

| Valeur | Comportement |
|-------|----------|
| `"error"` (défaut) | `api` vaut `null`, `status.apiFound` vaut `false`. Aucune opération ne peut être appelée. |
| `"mock"` | Utilise une API SCORM mock en mémoire. Idéal pour le développement local et les tests. |
| `"throw"` | Lève une `ScormError` pendant le rendu. À encapsuler dans une **Error Boundary** React. |

> **Le mode `"throw"`** lève l'exception de manière synchrone à l'intérieur de `useMemo`. Sans Error Boundary, l'erreur se propage vers le haut et fait planter tout le sous-arbre. Encapsulez toujours `<ScormProvider>` dans une Error Boundary lorsque vous utilisez ce mode.

## useScorm()

```tsx
const { status, api, raw } = useScorm();
```

| Champ | Type | Description |
|-------|------|-------------|
| `status` | `ScormStatus` | État de la connexion : `apiFound`, `initialized`*, `terminated`*, `version`, `noLmsBehavior` |
| `api` | `IScormApi \| null` | API de haut niveau indépendante de la version. `null` si aucune API n'est trouvée avec le comportement `"error"`. |
| `raw` | `IScormDriver \| null` | Driver bas niveau pour les appels directs à l'API (accès de secours). |

> **Remarque :** le `status` retourné par `useScorm()` est un instantané lu au moment du rendu. Pour un état **réactif** `initialized`/`terminated` (et des méthodes `initialize`/`terminate`/`commit` encapsulées), utilisez **`useScormSession()`**, qui s'abonne à la session sous-jacente via `useSyncExternalStore`.

## API de haut niveau

Toutes les méthodes retournent `Result<T, ScormError>` — vérifiez `result.ok` avant d'accéder à la valeur.

### Cycle de vie

```ts
api.initialize()   // Result<true, ScormError>
api.terminate()    // Result<true, ScormError>
api.commit()       // Result<true, ScormError>
```

### Statut

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

**Validation :** `raw`, `min` et `max` doivent être des nombres finis (NaN/Infinity sont rejetés avec le code d'erreur 405). `scaled` doit être compris dans l'intervalle `[-1, 1]` (code d'erreur 407 si hors plage). Pour SCORM 1.2, `scaled` est ignoré silencieusement.

### Localisation et données de suspension

```ts
api.setLocation('page-5')
api.getLocation()
api.setSuspendData(JSON.stringify({ progress: [1, 2, 3] }))
api.getSuspendData()
```

### Temps de session

```ts
api.setSessionTime(90000)  // 1.2: "00:01:30.00" | 2004: "PT1M30S"
api.getTotalTime()
```

### Informations sur l'apprenant (lecture seule)

```ts
api.getLearnerId()
api.getLearnerName()
api.getLaunchData()
api.getMode()
api.getCredit()
api.getEntry()
```

### Objectifs

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

### Commentaires

```ts
// SCORM 1.2: appends to a single cmi.comments string (newline-separated)
// SCORM 2004: creates indexed entries in cmi.comments_from_learner
api.addLearnerComment('Great course', 'page-3', '2024-01-15T10:00:00Z')
                      // comment        location  timestamp (all optional except comment)

// Count methods: always return 0 for SCORM 1.2
api.getLearnerCommentCount()  // Result<number, ScormError>
api.getLmsCommentCount()      // Result<number, ScormError> — LMS comments read-only
```

### Préférences

```ts
api.setPreference('language', 'en')
api.getPreferences()  // Result<Record<string, string>, ScormError>
```

### Progression (SCORM 2004 uniquement)

```ts
api.setProgressMeasure(0.75)  // value must be in range [0, 1] — error 407 otherwise
                               // no-op (returns ok) for SCORM 1.2
```

### Sortie

```ts
api.setExit('suspend')  // 1.2: cmi.core.exit | 2004: cmi.exit
                        // Common values: 'suspend', 'logout', 'time-out', ''
```

### Données apprenant (lecture seule, définies par le LMS)

```ts
api.getMasteryScore()     // 1.2: cmi.student_data.mastery_score | 2004: cmi.scaled_passing_score
api.getMaxTimeAllowed()   // 1.2: cmi.student_data.max_time_allowed | 2004: cmi.max_time_allowed
api.getTimeLimitAction()  // 1.2: cmi.student_data.time_limit_action | 2004: cmi.time_limit_action
```

### Navigation (SCORM 2004 uniquement)

```ts
api.setNavRequest('continue')              // no-op (returns ok) for SCORM 1.2
api.getNavRequestValid('continue')         // 'continue' | 'previous'
api.getNavRequestValid('previous')
```

### Accès brut (accès de secours)

```ts
api.getRaw('cmi.core.lesson_status')
api.setRaw('cmi.core.lesson_status', 'completed')
```

## Gestion des erreurs

Toutes les opérations retournent `Result<T, ScormError>` au lieu de lever des exceptions :

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

`ScormError` contient : `version`, `operation`, `path`, `code`, `errorString`, `diagnostic`, `exception`, `apiFound`, `initialized`.

Fonctions utilitaires : `isOk()`, `isErr()`, `unwrap()`, `unwrapOr()`.

> **Sécurité :** `errorString` et `diagnostic` sont des chaînes provenant directement du LMS. Ne les affichez pas via `innerHTML` ni aucune API DOM non assainie — traitez-les comme des entrées non fiables et échappez-les en HTML avant toute insertion dans le DOM.

## useScormSession (état réactif optionnel)

`useScorm()` maintient intentionnellement `status.initialized` comme un instantané statique — le provider ne suit pas l'état du cycle de vie. Si vous avez besoin de `initialized` et `terminated` comme état React réactif (pour déclencher des rendus), utilisez `useScormSession()` à la place.

```tsx
import { useScormSession } from '@studiolxd/scorm/react';

function Course() {
  const { initialized, initialize, terminate, api } = useScormSession();

  useEffect(() => { initialize(); }, [initialize]);

  if (!initialized) return <p>Connecting…</p>;
  return <CourseContent api={api} onFinish={terminate} />;
}
```

`useScormSession()` est un surensemble de `useScorm()` — il retourne tout ce que `useScorm()` retourne (`api`, `status`, `raw`) plus :

| Champ | Type | Description |
|-------|------|-------------|
| `initialized` | `boolean` | `true` après le succès de `initialize()`. Réactif. |
| `terminated` | `boolean` | `true` après le succès de `terminate()`. Réactif. |
| `initialize()` | `Result<true, ScormError> \| undefined` | Appelle `api.initialize()` et met à jour l'état. `undefined` si aucune API. |
| `terminate()` | `Result<true, ScormError> \| undefined` | Appelle `api.terminate()` et met à jour l'état. `undefined` si aucune API. |
| `commit()` | `Result<true, ScormError> \| undefined` | Appelle `api.commit()`. `undefined` si aucune API. |

> **Remarque :** Lorsque `noLmsBehavior` vaut `'error'` et qu'aucun LMS n'est trouvé, `api` est `null` et les trois méthodes retournent `undefined`. Vérifiez `status.apiFound` si vous avez besoin de distinguer ce cas.

## useScormAutoTerminate (optionnel)

Gère automatiquement le cycle de vie SCORM :

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

## Constructeurs de chemins

Fonctions utilitaires typées pour construire des chemins CMI indexés :

```ts
import { scorm12ObjectivePath, scorm2004InteractionPath } from '@studiolxd/scorm/react';

scorm12ObjectivePath(0, 'score.raw')       // "cmi.objectives.0.score.raw"
scorm2004InteractionPath(1, 'learner_response')  // "cmi.interactions.1.learner_response"
```

## Formateurs de temps

```ts
import { formatScorm12Time, formatScorm2004Time } from '@studiolxd/scorm/react';

formatScorm12Time(90000)   // "00:01:30.00"
formatScorm2004Time(90000) // "PT1M30S"
```

## Tests

Utilisez `noLmsBehavior: 'mock'` pour les tests. Le mock utilise un store en mémoire avec le comportement réel du driver.

```tsx
// In tests
<ScormProvider version="1.2" options={{ noLmsBehavior: 'mock' }}>
  <ComponentUnderTest />
</ScormProvider>
```

Vous pouvez également utiliser les classes mock directement :

```ts
import { MockScorm12Api, Scorm12Driver, ScormApi, createLogger } from '@studiolxd/scorm/react';

const mockApi = new MockScorm12Api();
const driver = new Scorm12Driver(mockApi, createLogger(false));
const api = new ScormApi(driver);
api.initialize();
// ... test your logic
```

## TypeScript

Tous les chemins CMI sont strictement typés :

```ts
import type { Scorm12CmiPath, Scorm2004CmiPath } from '@studiolxd/scorm/react';

// These types catch typos at compile time:
const path: Scorm12CmiPath = 'cmi.core.lesson_status';  // OK
// const bad: Scorm12CmiPath = 'cmi.core.typo';          // ERROR
```

## Documentation complémentaire

- [Tableau de correspondance SCORM 1.2 / 2004](./docs/scorm-mapping-table.md)
- [Tests avec le mode mock](./docs/mock-mode.md)
- [Guide d'intégration](./docs/integration-guide.md)

## Licence

MIT
