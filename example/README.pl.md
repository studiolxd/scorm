🌐 [English](README.md) · [Español](README.es.md) · [Français](README.fr.md) · [Português](README.pt.md) · [Deutsch](README.de.md) · [Polski](README.pl.md)

# `@studiolxd/scorm` — Interaktywne demo

Interaktywna, w pełni działająca aplikacja przykładowa demonstrująca każdą funkcję biblioteki
[`@studiolxd/scorm`](https://www.npmjs.com/package/@studiolxd/scorm) — w tym
rdzeń niezależny od frameworka (vanilla) oraz Web Component `<scorm-session>`.

Zbudowana na bazie **React 19 + TypeScript + Vite** (z użyciem adaptera `@studiolxd/scorm/react`). Działa
w całości w przeglądarce dzięki **trybowi mock** biblioteki — nie wymaga systemu zarządzania nauczaniem (LMS).

---

## Jak zacząć

```bash
npm install
npm run dev
```

Otwórz `http://localhost:5173` w przeglądarce.

---

## Co pokazuje to demo

Aplikacja posiada **przełącznik wersji SCORM** w nagłówku (1.2 / 2004). Zmiana wersji
powoduje ponowne zamontowanie `ScormProvider` z nową wersją, resetując cały stan. Dzięki temu
można porównać zachowanie obu standardów SCORM obok siebie.

### 10 sekcji demonstracyjnych

| Zakładka | Demonstrowane funkcje |
|-----|-----------------------|
| **Lifecycle** | `initialize()`, `commit()`, `terminate()`, live `ScormStatus`, `useScormAutoTerminate`, `useScormAutoCommit` |
| **Learner** | `getLearnerId()`, `getLearnerName()`, `getLaunchData()`, `getMode()`, `getCredit()`, `getEntry()`, `getMasteryScore()`, `getMaxTimeAllowed()`, `getTimeLimitAction()` |
| **Status** | `setComplete()`, `setIncomplete()`, `setPassed()`, `setFailed()`, `getCompletionStatus()`, `getSuccessStatus()` |
| **Score** | `setScore({ raw, min, max, scaled? })`, `getScore()`, `getPreferences()`, `setPreference()` |
| **Location** | `setLocation()`, `getLocation()`, `setSuspendData()`, `getSuspendData()`, `setSessionTime()`, `getTotalTime()`, `setExit()` |
| **Objectives** | `setObjective()`, `getObjective()`, `getObjectiveCount()` — formularz dostosowuje się do wersji 1.2/2004 |
| **Interactions** | `recordInteraction()`, `getInteractionCount()`, `getInteraction()` — quiz z 4 pytaniami na żywo z wizualną informacją zwrotną o poprawności |
| **Comments** | `addLearnerComment()`, `getLearnerCommentCount()`, `getLmsCommentCount()`, `getLearnerComments()`, `getLmsComments()` |
| **Advanced** | `getRaw()`, `setRaw()`, `setProgressMeasure()`, `setNavRequest()`, `getNavRequestValid()`, `formatScorm12Time()`, `formatScorm2004Time()` |
| **Vanilla / WC** | `createScormSession()` (niezależny od frameworka) oraz Web Component `<scorm-session>`, na żywo w trybie mock |

---

## Tryb mock

Aplikacja używa `noLmsBehavior: 'mock'` w `ScormProvider`. Aktywuje to in-memory SCORM
API zachowujące się jak prawdziwy LMS — bez potrzeby uruchamiania serwera. Wszystkie dane
są przechowywane w pamięci i tracone po odświeżeniu strony.

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

## Przegląd biblioteki

`@studiolxd/scorm` to bezgłowa biblioteka TypeScript będąca środowiskiem uruchomieniowym SCORM: rdzeń niezależny od frameworka
z adapterami dla React, Vue, Angular, Svelte oraz Web Components. To demo korzysta z adaptera React.

### Podstawowe koncepcje

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

**2. Jawny cykl życia**

Biblioteka nigdy nie inicjalizuje się automatycznie. Wywołujesz `api.initialize()` w momencie uruchomienia lekcji:

```tsx
useEffect(() => {
  if (!api) return;
  api.initialize();
  return () => { api.terminate(); };
}, [api]);
```

Możesz też skorzystać z opcjonalnego hook'a auto-terminate:

```tsx
import { useScormAutoTerminate } from '@studiolxd/scorm/react';

function Lesson() {
  // Auto-initializes on mount, auto-terminates on unmount/unload
  useScormAutoTerminate({ trackSessionTime: true });
}
```

Albo użyć `useScormSession()` dla reaktywnego stanu `initialized`/`terminated`:

```tsx
import { useScormSession } from '@studiolxd/scorm/react';

function Course() {
  const { initialized, initialize, terminate, api } = useScormSession();

  useEffect(() => { initialize(); }, [initialize]);

  if (!initialized) return <p>Connecting…</p>;
  return <CourseContent api={api} onFinish={terminate} />;
}
```

`useScormSession()` jest nadzbiorem `useScorm()` — zwraca wszystko, co `useScorm()` (`api`, `status`, `raw`), a dodatkowo reaktywne wartości logiczne `initialized`/`terminated` oraz opakowane metody `initialize()`, `terminate()`, `commit()`, które automatycznie aktualizują ten stan.

**3. Obsługa błędów oparta na Result**

Każda metoda API zwraca `Result<T, ScormError>` — bez rzucanych wyjątków:

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

**4. API niezależne od wersji**

Te same nazwy metod działają zarówno dla SCORM 1.2, jak i 2004. Biblioteka wewnętrznie mapuje wywołania na właściwe
ścieżki CMI:

```tsx
// Works identically for 1.2 and 2004
api.setComplete();
api.setPassed();
api.setScore({ raw: 90, min: 0, max: 100 });
api.setLocation('chapter-3');
api.setSuspendData(JSON.stringify(myState));
```

### Najważniejsze metody API

#### Cykl życia
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

#### Wynik (Score)
```tsx
api.setScore({ raw, min, max, scaled? })  // → Result<true, ScormError>
api.getScore()                            // → Result<ScoreData, ScormError>
```

`raw`, `min`, `max` muszą być skończonymi liczbami (NaN/Infinity → błąd 405). `scaled` musi mieścić się w `[-1, 1]` (błąd 407 przy przekroczeniu zakresu). W przypadku SCORM 1.2 parametr `scaled` jest po cichu ignorowany.

#### Lokalizacja i stan
```tsx
api.setLocation(value)    // → Result<string, ScormError>
api.getLocation()         // → Result<string, ScormError>
api.setSuspendData(data)  // → Result<string, ScormError>
api.getSuspendData()      // → Result<string, ScormError>
api.setSessionTime(ms)    // → Result<string, ScormError>  (takes milliseconds)
```

#### Cele (Objectives)
```tsx
api.setObjective(index, record)  // → Result<true, ScormError>
api.getObjective(index)          // → Result<ObjectiveRecord, ScormError>
api.getObjectiveCount()          // → Result<number, ScormError>
```

#### Interakcje
```tsx
api.recordInteraction(index, {
  id: 'q1',
  type: 'choice',
  learnerResponse: 'A',
  correctResponses: ['A'],
  result: 'correct',
})  // → Result<true, ScormError>
```

#### Komentarze
```tsx
api.addLearnerComment(text, location?, timestamp?)  // → Result<true, ScormError>
api.getLearnerCommentCount()                        // → Result<number, ScormError>
```

W przypadku SCORM 1.2 wszystkie komentarze są łączone w jeden ciąg znaków — łączna wartość jest ograniczona do 4096 znaków (błąd 405 przy przekroczeniu). SCORM 2004 używa indeksowanych wpisów `cmi.comments_from_learner` bez takiego ograniczenia.

#### Bezpośredni dostęp do API (wyjście awaryjne)
```tsx
api.getRaw('cmi.learner_id')          // → Result<string, ScormError>
api.setRaw('cmi.progress_measure', '0.75')  // → Result<string, ScormError>
```

#### Wyłącznie SCORM 2004
```tsx
api.setProgressMeasure(0.75)          // no-op in 1.2
api.setNavRequest('continue')
api.getNavRequestValid('continue')
```

### Ściągawka SCORM 1.2 vs 2004

| Funkcja | SCORM 1.2 | SCORM 2004 |
|---------|-----------|------------|
| Ukończenie + zaliczenie | Pojedynczy `lesson_status` | Oddzielny `completion_status` + `success_status` |
| Wynik skalowany | Niedostępny | `cmi.score.scaled` (-1 do 1) |
| Maks. rozmiar suspend data | 4 096 znaków | 64 000 znaków |
| Format czasu sesji | `HH:MM:SS.SS` | `PT#H#M#S` (ISO 8601) |
| Miara postępu | Niedostępna | `cmi.progress_measure` (0–1) |
| Nawigacja | Niedostępna | Żądania nawigacji ADL |
| Komentarze | Pojedynczy ciąg znaków | Indeksowana tablica z lokalizacją i znacznikiem czasu |
| Ścieżka ID uczącego się | `cmi.core.student_id` | `cmi.learner_id` |

---

## Struktura projektu

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

### System designu (App.css)

Aplikacja używa CSS custom properties do spójnego ciemnego motywu:

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

Wielokrotnego użytku klasy CSS: `.section`, `.feature-block`, `.controls`, `.field`, `.field-input`,
`.btn`, `.btn-primary`, `.btn-danger`, `.result.ok`, `.result.error`, `.badge-12`, `.badge-2004`,
`.status-grid`, `.status-item`, `.note`, `details.code-details`.

---

## Development Stack

### Build — Vite 7

[Vite](https://vite.dev) obsługuje zarówno serwer deweloperski, jak i build produkcyjny.

- Natychmiastowe HMR via `@vitejs/plugin-react` (React Fast Refresh)
- Transpilacja TypeScript obsługiwana przez Vite (esbuild) — bez emitowania przez `tsc`
- Build produkcyjny: `tsc -b` do sprawdzania typów + `vite build` do bundlowania

### Language — TypeScript 5.9 (strict)

Pełny tryb strict włączony w `tsconfig.app.json`:

| Opcja | Wartość | Efekt |
|--------|-------|--------|
| `strict` | `true` | Włącza wszystkie flagi ścisłego sprawdzania typów |
| `noUnusedLocals` | `true` | Błąd przy nieużywanych zmiennych |
| `noUnusedParameters` | `true` | Błąd przy nieużywanych parametrach funkcji |
| `noFallthroughCasesInSwitch` | `true` | Wymusza wyczerpujące instrukcje switch |
| `verbatimModuleSyntax` | `true` | Zachowuje składnię import/export dokładnie tak, jak jest |
| `noEmit` | `true` | Tylko sprawdzanie typów — Vite zajmuje się kompilacją |

Dwa cele tsconfig: `tsconfig.app.json` (src/, ES2022 + DOM) i `tsconfig.node.json` (vite.config.ts, ES2023 + typy Node).

### Linting — ESLint 9 (flat config)

`eslint.config.js` używa formatu flat config z czterema zestawami reguł:

| Plugin | Wersja | Dostarczane reguły |
|--------|---------|----------------|
| `@eslint/js` | 9.39 | Zalecane reguły JS ESLint |
| `typescript-eslint` | 8.48 | Linting specyficzny dla TypeScript |
| `eslint-plugin-react-hooks` | 7.0 | Exhaustive deps, rules of hooks |
| `eslint-plugin-react-refresh` | 0.4 | Walidacja eksportu komponentów React Fast Refresh |

Uruchom za pomocą `npm run lint`.

### Skrypty

| Skrypt | Polecenie | Opis |
|--------|---------|-------------|
| `npm run dev` | `vite` | Uruchamia serwer deweloperski pod adresem `http://localhost:5173` |
| `npm run build` | `tsc -b && vite build` | Sprawdzanie typów + bundle produkcyjny |
| `npm run lint` | `eslint .` | Lintuje wszystkie pliki `.ts` / `.tsx` |
| `npm run preview` | `vite preview` | Podgląd buildu produkcyjnego lokalnie |

### CI — GitHub Actions

Uruchamia się przy każdym PR i każdym pushu do `main` (Node 20, Ubuntu):

```
npm ci → npm run lint → npm run build
```

---

## Umiejętności Claude Code

Dwie umiejętności programistyczne AI są wstępnie zainstalowane do użytku z [Claude Code](https://claude.ai/claude-code):

### `frontend-design` — Anthropic

> Źródło: `anthropics/skills`

Kieruje tworzeniem wyróżniających się, produkcyjnych interfejsów frontend. Uruchamia się przy budowaniu komponentów, stron lub dowolnego UI webowego. Wymusza śmiały kierunek estetyczny, przemyślane decyzje projektowe i dopracowaną implementację — jawnie unikając generycznej estetyki tworzonej przez AI.

### `vercel-react-best-practices` — Vercel

> Źródło: `vercel-labs/agent-skills`

Wytyczne optymalizacji wydajności React utrzymywane przez Vercel Engineering. Zawiera **57 reguł w 8 kategoriach**, stosowanych przy pisaniu lub przeglądaniu komponentów React, pobierania danych, konfiguracji bundle lub dowolnego kodu wrażliwego na wydajność:

| Kategoria | Reguły | Skupienie |
|----------|:-----:|-------|
| `rerender` | 13 | Unikanie zbędnych ponownych renderowań (memo, stan pochodny, refs) |
| `js` | 12 | Wydajność JavaScript (cache, wczesne wyjścia, wydajne struktury danych) |
| `rendering` | 10 | Optymalizacja renderowania (renderowanie warunkowe, hydratacja, przejścia) |
| `server` | 7 | Wzorce po stronie serwera (równoległe pobieranie, cache, akcje auth) |
| `async` | 5 | Wzorce asynchroniczne (granice Suspense, opóźniony await, równoległe zależności) |
| `bundle` | 5 | Optymalizacja bundle (dynamiczne importy, pliki barrel, wstępne ładowanie) |
| `client` | 4 | Wzorce po stronie klienta (event listeners, schemat localStorage, deduplikacja SWR) |
| `advanced` | 3 | Zaawansowane wzorce (refs handlerów zdarzeń, init-once, useLatest) |

Umiejętności są instalowane w `.agents/skills/` i przypięte w `skills-lock.json`.

---

## Licencja

MIT — patrz [LICENSE](./LICENSE).
