🌐 [English](README.md) · [Español](README.es.md) · [Français](README.fr.md) · [Português](README.pt.md) · [Deutsch](README.de.md) · [Polski](README.pl.md)

# `@studiolxd/scorm` — Interaktive Demo

Eine interaktive, voll funktionsfähige Beispielanwendung, die jede Funktion der
Bibliothek [`@studiolxd/scorm`](https://www.npmjs.com/package/@studiolxd/scorm) demonstriert — einschließlich des
frameworkunabhängigen Kerns (Vanilla) und der `<scorm-session>` Web Component.

Erstellt mit **React 19 + TypeScript + Vite** (unter Verwendung des `@studiolxd/scorm/react`-Adapters). Läuft
vollständig im Browser über den **Mock-Modus** der Bibliothek — kein Learning Management System (LMS) erforderlich.

---

## Erste Schritte

```bash
npm install
npm run dev
```

Öffne `http://localhost:5173` in deinem Browser.

---

## Was diese Demo zeigt

Die App enthält in der Kopfzeile einen **SCORM-Versionsumschalter** (1.2 / 2004). Beim Umschalten der Version
wird der `ScormProvider` mit der neuen Version neu gemountet, wobei der gesamte Zustand zurückgesetzt wird. So lässt sich
das Verhalten beider SCORM-Standards direkt nebeneinander vergleichen.

### 10 Demo-Bereiche

| Tab | Demonstrierte Funktionen |
|-----|-----------------------|
| **Lifecycle** | `initialize()`, `commit()`, `terminate()`, Live-`ScormStatus`, `useScormAutoTerminate`, `useScormAutoCommit` |
| **Learner** | `getLearnerId()`, `getLearnerName()`, `getLaunchData()`, `getMode()`, `getCredit()`, `getEntry()`, `getMasteryScore()`, `getMaxTimeAllowed()`, `getTimeLimitAction()` |
| **Status** | `setComplete()`, `setIncomplete()`, `setPassed()`, `setFailed()`, `getCompletionStatus()`, `getSuccessStatus()` |
| **Score** | `setScore({ raw, min, max, scaled? })`, `getScore()`, `getPreferences()`, `setPreference()` |
| **Location** | `setLocation()`, `getLocation()`, `setSuspendData()`, `getSuspendData()`, `setSessionTime()`, `getTotalTime()`, `setExit()` |
| **Objectives** | `setObjective()`, `getObjective()`, `getObjectiveCount()` — Formular passt sich an 1.2/2004 an |
| **Interactions** | `recordInteraction()`, `getInteractionCount()`, `getInteraction()` — Live-Quiz mit 4 Fragen und visueller Richtig/Falsch-Rückmeldung |
| **Comments** | `addLearnerComment()`, `getLearnerCommentCount()`, `getLmsCommentCount()`, `getLearnerComments()`, `getLmsComments()` |
| **Advanced** | `getRaw()`, `setRaw()`, `setProgressMeasure()`, `setNavRequest()`, `getNavRequestValid()`, `formatScorm12Time()`, `formatScorm2004Time()` |
| **Vanilla / WC** | `createScormSession()` (frameworkunabhängig) und die `<scorm-session>` Web Component, live im Mock-Modus |

---

## Über den Mock-Modus

Die App verwendet `noLmsBehavior: 'mock'` im `ScormProvider`. Damit wird eine In-Memory-SCORM-API
aktiviert, die sich wie ein echtes LMS verhält — kein Server erforderlich. Alle Daten werden im Arbeitsspeicher
gehalten und gehen beim Neuladen der Seite verloren.

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

## Bibliotheksübersicht

`@studiolxd/scorm` ist eine Headless-TypeScript-Bibliothek für die SCORM-Runtime: ein frameworkunabhängiger Kern
mit Adaptern für React, Vue, Angular, Svelte und Web Components. Diese Demo verwendet den React-Adapter.

### Grundkonzepte

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

**2. Expliziter Lifecycle**

Die Bibliothek initialisiert niemals automatisch. Du rufst `api.initialize()` auf, wenn deine Lektion startet:

```tsx
useEffect(() => {
  if (!api) return;
  api.initialize();
  return () => { api.terminate(); };
}, [api]);
```

Oder verwende den optionalen Auto-Terminate-Hook:

```tsx
import { useScormAutoTerminate } from '@studiolxd/scorm/react';

function Lesson() {
  // Auto-initializes on mount, auto-terminates on unmount/unload
  useScormAutoTerminate({ trackSessionTime: true });
}
```

Oder nutze `useScormSession()` für reaktiven `initialized`/`terminated`-Zustand:

```tsx
import { useScormSession } from '@studiolxd/scorm/react';

function Course() {
  const { initialized, initialize, terminate, api } = useScormSession();

  useEffect(() => { initialize(); }, [initialize]);

  if (!initialized) return <p>Connecting…</p>;
  return <CourseContent api={api} onFinish={terminate} />;
}
```

`useScormSession()` ist eine Obermenge von `useScorm()` — es gibt alles zurück, was `useScorm()` zurückgibt (`api`, `status`, `raw`), und zusätzlich die reaktiven booleschen Werte `initialized`/`terminated` sowie die gekapselten Methoden `initialize()`, `terminate()` und `commit()`, die diesen Zustand automatisch aktualisieren.

**3. Result-basierte Fehlerbehandlung**

Jede API-Methode gibt ein `Result<T, ScormError>` zurück — keine geworfenen Exceptions:

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

**4. Versionsneutrale API**

Dieselben Methodennamen funktionieren für SCORM 1.2 und 2004. Die Bibliothek bildet sie intern auf die
korrekten CMI-Pfade ab:

```tsx
// Works identically for 1.2 and 2004
api.setComplete();
api.setPassed();
api.setScore({ raw: 90, min: 0, max: 100 });
api.setLocation('chapter-3');
api.setSuspendData(JSON.stringify(myState));
```

### Wichtige API-Methoden

#### Lifecycle
```tsx
api.initialize()   // → Result<true, ScormError>
api.commit()       // → Result<true, ScormError>
api.terminate()    // → Result<true, ScormError>
```

#### Status
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

`raw`, `min` und `max` müssen endliche Zahlen sein (NaN/Infinity → Fehler 405). `scaled` muss in `[-1, 1]` liegen (Fehler 407 bei Überschreitung). Bei SCORM 1.2 wird `scaled` stillschweigend ignoriert.

#### Location & Zustand
```tsx
api.setLocation(value)    // → Result<string, ScormError>
api.getLocation()         // → Result<string, ScormError>
api.setSuspendData(data)  // → Result<string, ScormError>
api.getSuspendData()      // → Result<string, ScormError>
api.setSessionTime(ms)    // → Result<string, ScormError>  (takes milliseconds)
```

#### Objectives
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

#### Comments
```tsx
api.addLearnerComment(text, location?, timestamp?)  // → Result<true, ScormError>
api.getLearnerCommentCount()                        // → Result<number, ScormError>
```

Bei SCORM 1.2 werden alle Comments in einer einzigen Zeichenkette zusammengeführt — der kombinierte Wert ist auf 4096 Zeichen begrenzt (Fehler 405 bei Überschreitung). SCORM 2004 verwendet indizierte `cmi.comments_from_learner`-Einträge ohne diese Einschränkung.

#### Raw Escape Hatch
```tsx
api.getRaw('cmi.learner_id')          // → Result<string, ScormError>
api.setRaw('cmi.progress_measure', '0.75')  // → Result<string, ScormError>
```

#### Nur SCORM 2004
```tsx
api.setProgressMeasure(0.75)          // no-op in 1.2
api.setNavRequest('continue')
api.getNavRequestValid('continue')
```

### SCORM 1.2 vs. 2004 — Spickzettel

| Funktion | SCORM 1.2 | SCORM 2004 |
|---------|-----------|------------|
| Abschluss + Bestehen | Einzelner `lesson_status` | Getrennte `completion_status` + `success_status` |
| Skalierter Score | Nicht verfügbar | `cmi.score.scaled` (-1 bis 1) |
| Max. Suspend Data | 4.096 Zeichen | 64.000 Zeichen |
| Sitzungszeit-Format | `HH:MM:SS.SS` | `PT#H#M#S` (ISO 8601) |
| Fortschrittsmessung | Nicht verfügbar | `cmi.progress_measure` (0–1) |
| Navigation | Nicht verfügbar | ADL-Nav-Requests |
| Comments | Einzelne Zeichenkette | Indiziertes Array mit Location + Zeitstempel |
| Pfad der Lernenden-ID | `cmi.core.student_id` | `cmi.learner_id` |

---

## Projektstruktur

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

### Design-System (App.css)

Die App verwendet CSS Custom Properties für ein einheitliches Dark Theme:

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

Wiederverwendbare CSS-Klassen: `.section`, `.feature-block`, `.controls`, `.field`, `.field-input`,
`.btn`, `.btn-primary`, `.btn-danger`, `.result.ok`, `.result.error`, `.badge-12`, `.badge-2004`,
`.status-grid`, `.status-item`, `.note`, `details.code-details`.

---

## Development Stack

### Build — Vite 7

[Vite](https://vite.dev) treibt sowohl den Dev-Server als auch den Production-Build an.

- Sofortiges HMR über `@vitejs/plugin-react` (React Fast Refresh)
- TypeScript-Transpilierung durch Vite (esbuild) — kein `tsc`-Emit
- Production-Build: `tsc -b` für die Typprüfung + `vite build` für das Bundling

### Language — TypeScript 5.9 (strict)

Voller Strict-Modus aktiviert in `tsconfig.app.json`:

| Option | Wert | Effekt |
|--------|-------|--------|
| `strict` | `true` | Aktiviert alle strikten Typprüfungs-Flags |
| `noUnusedLocals` | `true` | Fehler bei ungenutzten Variablen |
| `noUnusedParameters` | `true` | Fehler bei ungenutzten Funktionsparametern |
| `noFallthroughCasesInSwitch` | `true` | Erzwingt vollständige Switch-Anweisungen |
| `verbatimModuleSyntax` | `true` | Behält die Import-/Export-Syntax exakt bei |
| `noEmit` | `true` | Nur Typprüfung — Vite übernimmt die Kompilierung |

Zwei tsconfig-Ziele: `tsconfig.app.json` (src/, ES2022 + DOM) und `tsconfig.node.json` (vite.config.ts, ES2023 + Node-Typen).

### Linting — ESLint 9 (flat config)

`eslint.config.js` verwendet das Flat-Config-Format mit vier Regelsätzen:

| Plugin | Version | Bereitgestellte Regeln |
|--------|---------|----------------|
| `@eslint/js` | 9.39 | ESLint-empfohlene JS-Regeln |
| `typescript-eslint` | 8.48 | TypeScript-spezifisches Linting |
| `eslint-plugin-react-hooks` | 7.0 | Exhaustive deps, rules of hooks |
| `eslint-plugin-react-refresh` | 0.4 | Validierung von React-Fast-Refresh-Komponentenexporten |

Ausführen mit `npm run lint`.

### Skripte

| Skript | Befehl | Beschreibung |
|--------|---------|-------------|
| `npm run dev` | `vite` | Startet den Dev-Server unter `http://localhost:5173` |
| `npm run build` | `tsc -b && vite build` | Typprüfung + Production-Bundle |
| `npm run lint` | `eslint .` | Lintet alle `.ts`- / `.tsx`-Dateien |
| `npm run preview` | `vite preview` | Vorschau des Production-Builds lokal |

### CI — GitHub Actions

Läuft bei jedem PR und jedem Push auf `main` (Node 20, Ubuntu):

```
npm ci → npm run lint → npm run build
```

---

## Claude Code Skills

Zwei KI-Entwicklungs-Skills sind für die Verwendung mit [Claude Code](https://claude.ai/claude-code) vorinstalliert:

### `frontend-design` — Anthropic

> Quelle: `anthropics/skills`

Unterstützt die Erstellung unverwechselbarer, produktionsreifer Frontend-Oberflächen. Wird beim Erstellen von Komponenten, Seiten oder beliebiger Web-UI ausgelöst. Erzwingt eine markante ästhetische Richtung, bewusste Designentscheidungen und eine ausgefeilte Umsetzung — und vermeidet dabei ausdrücklich generische KI-Ästhetik.

### `vercel-react-best-practices` — Vercel

> Quelle: `vercel-labs/agent-skills`

Richtlinien zur React-Performance-Optimierung, gepflegt von Vercel Engineering. Enthält **57 Regeln in 8 Kategorien**, die beim Schreiben oder Reviewen von React-Komponenten, Datenabruf, Bundle-Konfiguration oder beliebigem performancekritischem Code angewendet werden:

| Kategorie | Regeln | Schwerpunkt |
|----------|:-----:|-------|
| `rerender` | 13 | Unnötige Re-Renders vermeiden (memo, abgeleiteter Zustand, Refs) |
| `js` | 12 | JavaScript-Performance (Caching, frühe Rückgaben, effiziente Datenstrukturen) |
| `rendering` | 10 | Render-Optimierung (bedingtes Rendern, Hydration, Transitions) |
| `server` | 7 | Serverseitige Muster (paralleler Datenabruf, Caching, Auth-Actions) |
| `async` | 5 | Asynchrone Muster (Suspense-Boundaries, verzögertes await, parallele Abhängigkeiten) |
| `bundle` | 5 | Bundle-Optimierung (dynamische Imports, Barrel-Dateien, Preloading) |
| `client` | 4 | Clientseitige Muster (Event-Listener, localStorage-Schema, SWR-Deduplizierung) |
| `advanced` | 3 | Fortgeschrittene Muster (Event-Handler-Refs, Init-once, useLatest) |

Die Skills werden unter `.agents/skills/` installiert und in `skills-lock.json` gepinnt.

---

## Lizenz

MIT — siehe [LICENSE](./LICENSE).
