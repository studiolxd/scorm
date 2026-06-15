🌐 [English](README.md) · [Español](README.es.md) · [Français](README.fr.md) · [Português](README.pt.md) · [Deutsch](README.de.md) · [Polski](README.pl.md)

# `@studiolxd/react-scorm` — Démo interactive

Une application de démonstration interactive et entièrement fonctionnelle qui illustre chaque fonctionnalité de la bibliothèque
[`@studiolxd/react-scorm`](https://www.npmjs.com/package/@studiolxd/react-scorm).

Construite avec **React 19 + TypeScript + Vite**. Fonctionne entièrement dans le navigateur grâce au **mode mock** de la bibliothèque — aucun système de gestion de l'apprentissage (LMS) n'est nécessaire.

---

## Mise en route

```bash
npm install
npm run dev
```

Ouvrez `http://localhost:5173` dans votre navigateur.

---

## Ce que montre cette démo

L'application dispose d'un **sélecteur de version SCORM** dans l'en-tête (1.2 / 2004). Changer de version recrée le `ScormProvider` avec la nouvelle version et réinitialise tout l'état. Cela vous permet de comparer le comportement des deux standards SCORM côte à côte.

### 9 sections de démonstration

| Onglet | Fonctionnalités illustrées |
|--------|---------------------------|
| **Lifecycle** | `initialize()`, `commit()`, `terminate()`, `ScormStatus` en direct, `useScormAutoTerminate` |
| **Learner** | `getLearnerId()`, `getLearnerName()`, `getLaunchData()`, `getMode()`, `getCredit()`, `getEntry()`, `getMasteryScore()`, `getMaxTimeAllowed()`, `getTimeLimitAction()` |
| **Status** | `setComplete()`, `setIncomplete()`, `setPassed()`, `setFailed()`, `getCompletionStatus()`, `getSuccessStatus()` |
| **Score** | `setScore({ raw, min, max, scaled? })`, `getScore()`, `getPreferences()`, `setPreference()` |
| **Location** | `setLocation()`, `getLocation()`, `setSuspendData()`, `getSuspendData()`, `setSessionTime()`, `getTotalTime()`, `setExit()` |
| **Objectives** | `setObjective()`, `getObjective()`, `getObjectiveCount()` — formulaire adapté à 1.2/2004 |
| **Interactions** | `recordInteraction()`, `getInteractionCount()` — quiz en direct de 4 questions avec retour visuel correct/incorrect |
| **Comments** | `addLearnerComment()`, `getLearnerCommentCount()`, `getLmsCommentCount()` |
| **Advanced** | `getRaw()`, `setRaw()`, `setProgressMeasure()`, `setNavRequest()`, `getNavRequestValid()`, `formatScorm12Time()`, `formatScorm2004Time()` |

---

## À propos du mode mock

L'application utilise `noLmsBehavior: 'mock'` dans `ScormProvider`. Cela active une API SCORM en mémoire qui se comporte comme un vrai LMS — aucun serveur requis. Toutes les données sont stockées en mémoire et perdues lors du rechargement de la page.

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

## Présentation de la bibliothèque

`@studiolxd/react-scorm` est une bibliothèque TypeScript/React headless pour le runtime SCORM.

### Concepts fondamentaux

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

**2. Cycle de vie explicite**

La bibliothèque ne s'initialise jamais automatiquement. Vous appelez `api.initialize()` au démarrage de votre cours :

```tsx
useEffect(() => {
  if (!api) return;
  api.initialize();
  return () => { api.terminate(); };
}, [api]);
```

Ou utilisez le hook optionnel d'auto-terminaison :

```tsx
import { useScormAutoTerminate } from '@studiolxd/scorm/react';

function Lesson() {
  // Auto-initializes on mount, auto-terminates on unmount/unload
  useScormAutoTerminate({ trackSessionTime: true });
}
```

Ou utilisez `useScormSession()` pour un état réactif `initialized`/`terminated` :

```tsx
import { useScormSession } from '@studiolxd/scorm/react';

function Course() {
  const { initialized, initialize, terminate, api } = useScormSession();

  useEffect(() => { initialize(); }, [initialize]);

  if (!initialized) return <p>Connecting…</p>;
  return <CourseContent api={api} onFinish={terminate} />;
}
```

`useScormSession()` est un surensemble de `useScorm()` — il retourne tout ce que `useScorm()` retourne (`api`, `status`, `raw`), ainsi que des booléens réactifs `initialized`/`terminated` et des méthodes `initialize()`, `terminate()`, `commit()` encapsulées qui mettent à jour cet état automatiquement.

**3. Gestion des erreurs basée sur Result**

Chaque méthode de l'API retourne un `Result<T, ScormError>` — aucune exception n'est levée :

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

**4. API indépendante de la version**

Les mêmes noms de méthodes fonctionnent pour SCORM 1.2 et 2004. La bibliothèque effectue la correspondance vers les bons chemins CMI en interne :

```tsx
// Works identically for 1.2 and 2004
api.setComplete();
api.setPassed();
api.setScore({ raw: 90, min: 0, max: 100 });
api.setLocation('chapter-3');
api.setSuspendData(JSON.stringify(myState));
```

### Principales méthodes de l'API

#### Cycle de vie
```tsx
api.initialize()   // → Result<true, ScormError>
api.commit()       // → Result<true, ScormError>
api.terminate()    // → Result<true, ScormError>
```

#### Statut
```tsx
api.setComplete()          // → Result<string, ScormError>
api.setIncomplete()        // → Result<string, ScormError>
api.setPassed()            // → Result<string, ScormError>
api.setFailed()            // → Result<string, ScormError>
api.getCompletionStatus()  // → Result<string, ScormError>
api.getSuccessStatus()     // → Result<string, ScormError>
```

#### Score
```tsx
api.setScore({ raw, min, max, scaled? })  // → Result<true, ScormError>
api.getScore()                            // → Result<ScoreData, ScormError>
```

`raw`, `min`, `max` doivent être des nombres finis (NaN/Infinity → erreur 405). `scaled` doit être compris dans `[-1, 1]` (erreur 407 si hors plage). Pour SCORM 1.2, `scaled` est ignoré silencieusement.

#### Localisation et état
```tsx
api.setLocation(value)    // → Result<string, ScormError>
api.getLocation()         // → Result<string, ScormError>
api.setSuspendData(data)  // → Result<string, ScormError>
api.getSuspendData()      // → Result<string, ScormError>
api.setSessionTime(ms)    // → Result<string, ScormError>  (takes milliseconds)
```

#### Objectifs
```tsx
api.setObjective(index, record)  // → Result<true, ScormError>
api.getObjective(index)          // → Result<ObjectiveRecord, ScormError>
api.getObjectiveCount()          // → Result<number, ScormError>
```

#### Interactions
```tsx
api.recordInteraction(index, {
  id: 'q1',
  type: 'choice',
  learnerResponse: 'A',
  correctResponses: ['A'],
  result: 'correct',
})  // → Result<true, ScormError>
```

#### Commentaires
```tsx
api.addLearnerComment(text, location?, timestamp?)  // → Result<true, ScormError>
api.getLearnerCommentCount()                        // → Result<number, ScormError>
```

Pour SCORM 1.2, tous les commentaires sont concaténés en une seule chaîne — la valeur combinée est limitée à 4 096 caractères (erreur 405 si dépassée). SCORM 2004 utilise des entrées `cmi.comments_from_learner` indexées sans cette limite.

#### Accès brut de secours
```tsx
api.getRaw('cmi.learner_id')          // → Result<string, ScormError>
api.setRaw('cmi.progress_measure', '0.75')  // → Result<string, ScormError>
```

#### SCORM 2004 uniquement
```tsx
api.setProgressMeasure(0.75)          // no-op in 1.2
api.setNavRequest('continue')
api.getNavRequestValid('continue')
```

### Comparatif SCORM 1.2 / 2004

| Fonctionnalité | SCORM 1.2 | SCORM 2004 |
|----------------|-----------|------------|
| Complétion + réussite | `lesson_status` unique | `completion_status` + `success_status` séparés |
| Score normalisé | Non disponible | `cmi.score.scaled` (-1 à 1) |
| Taille max des données suspendues | 4 096 caractères | 64 000 caractères |
| Format du temps de session | `HH:MM:SS.SS` | `PT#H#M#S` (ISO 8601) |
| Mesure de progression | Non disponible | `cmi.progress_measure` (0–1) |
| Navigation | Non disponible | Requêtes de navigation ADL |
| Commentaires | Chaîne unique | Tableau indexé avec localisation + horodatage |
| Chemin de l'identifiant apprenant | `cmi.core.student_id` | `cmi.learner_id` |

---

## Structure du projet

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

### Système de design (App.css)

L'application utilise des propriétés CSS personnalisées pour un thème sombre cohérent :

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

Classes CSS réutilisables : `.section`, `.feature-block`, `.controls`, `.field`, `.field-input`,
`.btn`, `.btn-primary`, `.btn-danger`, `.result.ok`, `.result.error`, `.badge-12`, `.badge-2004`,
`.status-grid`, `.status-item`, `.note`, `details.code-details`.

---

## Stack technique

### Build — Vite 7

[Vite](https://vite.dev) alimente à la fois le serveur de développement et la build de production.

- HMR instantané via `@vitejs/plugin-react` (React Fast Refresh)
- Transpilation TypeScript gérée par Vite (esbuild) — pas d'émission `tsc`
- Build de production : `tsc -b` pour la vérification de types + `vite build` pour le bundling

### Language — TypeScript 5.9 (strict)

Mode strict complet activé dans `tsconfig.app.json` :

| Option | Valeur | Effet |
|--------|--------|-------|
| `strict` | `true` | Active tous les flags de vérification de types stricte |
| `noUnusedLocals` | `true` | Erreur sur les variables inutilisées |
| `noUnusedParameters` | `true` | Erreur sur les paramètres de fonction inutilisés |
| `noFallthroughCasesInSwitch` | `true` | Impose des instructions switch exhaustives |
| `verbatimModuleSyntax` | `true` | Préserve exactement la syntaxe d'import/export |
| `noEmit` | `true` | Vérification de types uniquement — Vite gère la compilation |

Deux cibles tsconfig : `tsconfig.app.json` (src/, ES2022 + DOM) et `tsconfig.node.json` (vite.config.ts, ES2023 + types Node).

### Linting — ESLint 9 (flat config)

`eslint.config.js` utilise le format de configuration plate avec quatre ensembles de règles :

| Plugin | Version | Règles fournies |
|--------|---------|-----------------|
| `@eslint/js` | 9.39 | Règles JS recommandées ESLint |
| `typescript-eslint` | 8.48 | Linting spécifique TypeScript |
| `eslint-plugin-react-hooks` | 7.0 | Dépendances exhaustives, règles des hooks |
| `eslint-plugin-react-refresh` | 0.4 | Validation des exports de composants React Fast Refresh |

Exécuter avec `npm run lint`.

### Scripts

| Script | Commande | Description |
|--------|----------|-------------|
| `npm run dev` | `vite` | Démarrer le serveur de développement sur `http://localhost:5173` |
| `npm run build` | `tsc -b && vite build` | Vérification de types + bundle de production |
| `npm run lint` | `eslint .` | Analyser tous les fichiers `.ts` / `.tsx` |
| `npm run preview` | `vite preview` | Prévisualiser la build de production en local |

### CI — GitHub Actions

S'exécute à chaque PR et à chaque push sur `main` (Node 20, Ubuntu) :

```
npm ci → npm run lint → npm run build
```

---

## Compétences Claude Code

Deux compétences de développement IA sont préinstallées pour une utilisation avec [Claude Code](https://claude.ai/claude-code) :

### `frontend-design` — Anthropic

> Source : `anthropics/skills`

Guide la création d'interfaces frontend distinctives et prêtes pour la production. Se déclenche lors de la construction de composants, de pages ou de toute interface web. Impose une direction esthétique audacieuse, des choix de conception intentionnels et une implémentation soignée — en évitant explicitement l'esthétique générique générée par IA.

### `vercel-react-best-practices` — Vercel

> Source : `vercel-labs/agent-skills`

Directives d'optimisation des performances React maintenues par Vercel Engineering. Contient **57 règles réparties en 8 catégories**, appliquées lors de l'écriture ou de la révision de composants React, de la récupération de données, de la configuration des bundles ou de tout code sensible aux performances :

| Catégorie | Règles | Focus |
|-----------|:------:|-------|
| `rerender` | 13 | Éviter les re-rendus inutiles (memo, état dérivé, refs) |
| `js` | 12 | Performances JavaScript (mise en cache, sorties anticipées, structures de données efficaces) |
| `rendering` | 10 | Optimisation du rendu (rendu conditionnel, hydratation, transitions) |
| `server` | 7 | Modèles côté serveur (récupération parallèle, mise en cache, actions d'authentification) |
| `async` | 5 | Modèles asynchrones (limites Suspense, await différé, dépendances parallèles) |
| `bundle` | 5 | Optimisation des bundles (imports dynamiques, barrel files, préchargement) |
| `client` | 4 | Modèles côté client (écouteurs d'événements, schéma localStorage, déduplication SWR) |
| `advanced` | 3 | Modèles avancés (refs de gestionnaires d'événements, init-once, useLatest) |

Les compétences sont installées dans `.agents/skills/` et épinglées dans `skills-lock.json`.

---

## Licence

MIT — voir [LICENSE](./LICENSE).
