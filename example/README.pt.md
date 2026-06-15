🌐 [English](README.md) · [Español](README.es.md) · [Français](README.fr.md) · [Português](README.pt.md) · [Deutsch](README.de.md) · [Polski](README.pl.md)

# `@studiolxd/scorm` — Demonstração Interativa

Uma aplicação de exemplo interativa e totalmente funcional que demonstra todas as funcionalidades da
biblioteca [`@studiolxd/scorm`](https://www.npmjs.com/package/@studiolxd/scorm) — incluindo o
núcleo agnóstico de framework (vanilla) e o Web Component `<scorm-session>`.

Construída com **React 19 + TypeScript + Vite** (usando o adaptador `@studiolxd/scorm/react`). Corre
inteiramente no browser através do **modo mock** da biblioteca — sem necessidade de um Learning Management System (LMS).

---

## Primeiros Passos

```bash
npm install
npm run dev
```

Abra `http://localhost:5173` no seu browser.

---

## O Que Esta Demonstração Mostra

A aplicação tem um **seletor de versão SCORM** no cabeçalho (1.2 / 2004). Alternar de versão
volta a montar o `ScormProvider` com a nova versão, repondo todo o estado. Isto permite-lhe comparar
o comportamento de ambos os standards SCORM lado a lado.

### 10 Secções de Demonstração

| Separador | Funcionalidades demonstradas |
|-----|-----------------------|
| **Lifecycle** | `initialize()`, `commit()`, `terminate()`, `ScormStatus` ao vivo, `useScormAutoTerminate`, `useScormAutoCommit` |
| **Learner** | `getLearnerId()`, `getLearnerName()`, `getLaunchData()`, `getMode()`, `getCredit()`, `getEntry()`, `getMasteryScore()`, `getMaxTimeAllowed()`, `getTimeLimitAction()` |
| **Status** | `setComplete()`, `setIncomplete()`, `setPassed()`, `setFailed()`, `getCompletionStatus()`, `getSuccessStatus()` |
| **Score** | `setScore({ raw, min, max, scaled? })`, `getScore()`, `getPreferences()`, `setPreference()` |
| **Location** | `setLocation()`, `getLocation()`, `setSuspendData()`, `getSuspendData()`, `setSessionTime()`, `getTotalTime()`, `setExit()` |
| **Objectives** | `setObjective()`, `getObjective()`, `getObjectiveCount()` — o formulário adapta-se a 1.2/2004 |
| **Interactions** | `recordInteraction()`, `getInteractionCount()`, `getInteraction()` — quiz ao vivo de 4 perguntas com feedback visual de correto/incorreto |
| **Comments** | `addLearnerComment()`, `getLearnerCommentCount()`, `getLmsCommentCount()`, `getLearnerComments()`, `getLmsComments()` |
| **Advanced** | `getRaw()`, `setRaw()`, `setProgressMeasure()`, `setNavRequest()`, `getNavRequestValid()`, `formatScorm12Time()`, `formatScorm2004Time()` |
| **Vanilla / WC** | `createScormSession()` (agnóstico de framework) e o Web Component `<scorm-session>`, ao vivo em modo mock |

---

## Sobre o Modo Mock

A aplicação usa `noLmsBehavior: 'mock'` no `ScormProvider`. Isto ativa uma API SCORM em memória
que se comporta como um LMS real — sem necessidade de servidor. Todos os dados são guardados em memória e perdem-se
ao atualizar a página.

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

## Visão Geral da Biblioteca

`@studiolxd/scorm` é uma biblioteca de runtime SCORM headless em TypeScript: um núcleo agnóstico de framework
com adaptadores para React, Vue, Angular, Svelte e Web Components. Esta demonstração usa o adaptador React.

### Conceitos Fundamentais

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

**2. Ciclo de Vida Explícito**

A biblioteca nunca inicializa automaticamente. Você chama `api.initialize()` quando a sua lição começa:

```tsx
useEffect(() => {
  if (!api) return;
  api.initialize();
  return () => { api.terminate(); };
}, [api]);
```

Ou use o hook opcional de auto-terminate:

```tsx
import { useScormAutoTerminate } from '@studiolxd/scorm/react';

function Lesson() {
  // Auto-initializes on mount, auto-terminates on unmount/unload
  useScormAutoTerminate({ trackSessionTime: true });
}
```

Ou use `useScormSession()` para estado reativo de initialized/terminated:

```tsx
import { useScormSession } from '@studiolxd/scorm/react';

function Course() {
  const { initialized, initialize, terminate, api } = useScormSession();

  useEffect(() => { initialize(); }, [initialize]);

  if (!initialized) return <p>Connecting…</p>;
  return <CourseContent api={api} onFinish={terminate} />;
}
```

`useScormSession()` é um superconjunto de `useScorm()` — devolve tudo o que `useScorm()` devolve (`api`, `status`, `raw`) mais os booleanos reativos `initialized`/`terminated` e os métodos envolvidos `initialize()`, `terminate()`, `commit()` que atualizam esse estado automaticamente.

**3. Tratamento de Erros Baseado em Result**

Cada método da API devolve um `Result<T, ScormError>` — sem exceções lançadas:

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

**4. API Agnóstica de Versão**

Os mesmos nomes de métodos funcionam tanto para SCORM 1.2 como para 2004. A biblioteca mapeia para os caminhos
CMI corretos internamente:

```tsx
// Works identically for 1.2 and 2004
api.setComplete();
api.setPassed();
api.setScore({ raw: 90, min: 0, max: 100 });
api.setLocation('chapter-3');
api.setSuspendData(JSON.stringify(myState));
```

### Métodos Principais da API

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

#### Pontuação
```tsx
api.setScore({ raw, min, max, scaled? })  // → Result<true, ScormError>
api.getScore()                            // → Result<ScoreData, ScormError>
```

`raw`, `min`, `max` têm de ser números finitos (NaN/Infinity → erro 405). `scaled` tem de estar em `[-1, 1]` (erro 407 se estiver fora do intervalo). No SCORM 1.2, `scaled` é silenciosamente ignorado.

#### Localização e Estado
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

#### Interações
```tsx
api.recordInteraction(index, {
  id: 'q1',
  type: 'choice',
  learnerResponse: 'A',
  correctResponses: ['A'],
  result: 'correct',
})  // → Result<true, ScormError>
```

#### Comentários
```tsx
api.addLearnerComment(text, location?, timestamp?)  // → Result<true, ScormError>
api.getLearnerCommentCount()                        // → Result<number, ScormError>
```

No SCORM 1.2, todos os comentários são concatenados numa única string — o valor combinado está limitado a 4096 caracteres (erro 405 se for excedido). O SCORM 2004 usa entradas indexadas em `cmi.comments_from_learner` sem esse limite.

#### Escape Hatch Raw
```tsx
api.getRaw('cmi.learner_id')          // → Result<string, ScormError>
api.setRaw('cmi.progress_measure', '0.75')  // → Result<string, ScormError>
```

#### Apenas SCORM 2004
```tsx
api.setProgressMeasure(0.75)          // no-op in 1.2
api.setNavRequest('continue')
api.getNavRequestValid('continue')
```

### Resumo SCORM 1.2 vs 2004

| Funcionalidade | SCORM 1.2 | SCORM 2004 |
|---------|-----------|------------|
| Conclusão + aprovação | `lesson_status` único | `completion_status` + `success_status` separados |
| Pontuação escalada | Não disponível | `cmi.score.scaled` (-1 a 1) |
| Máx. de dados de suspensão | 4.096 caracteres | 64.000 caracteres |
| Formato do tempo de sessão | `HH:MM:SS.SS` | `PT#H#M#S` (ISO 8601) |
| Medida de progresso | Não disponível | `cmi.progress_measure` (0–1) |
| Navegação | Não disponível | Pedidos de navegação ADL |
| Comentários | String única | Array indexado com localização + timestamp |
| Caminho do ID do aluno | `cmi.core.student_id` | `cmi.learner_id` |

---

## Estrutura do Projeto

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

### Sistema de Design (App.css)

A aplicação usa propriedades CSS personalizadas para um tema escuro consistente:

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

Classes CSS reutilizáveis: `.section`, `.feature-block`, `.controls`, `.field`, `.field-input`,
`.btn`, `.btn-primary`, `.btn-danger`, `.result.ok`, `.result.error`, `.badge-12`, `.badge-2004`,
`.status-grid`, `.status-item`, `.note`, `details.code-details`.

---

## Stack de Desenvolvimento

### Build — Vite 7

O [Vite](https://vite.dev) alimenta tanto o servidor de desenvolvimento como o build de produção.

- HMR instantâneo via `@vitejs/plugin-react` (React Fast Refresh)
- Transpilação de TypeScript tratada pelo Vite (esbuild) — sem emissão por `tsc`
- Build de produção: `tsc -b` para verificação de tipos + `vite build` para o bundling

### Linguagem — TypeScript 5.9 (strict)

Modo strict completo ativado em `tsconfig.app.json`:

| Opção | Valor | Efeito |
|--------|-------|--------|
| `strict` | `true` | Ativa todas as flags de verificação de tipos estrita |
| `noUnusedLocals` | `true` | Erro em variáveis não utilizadas |
| `noUnusedParameters` | `true` | Erro em parâmetros de função não utilizados |
| `noFallthroughCasesInSwitch` | `true` | Força instruções switch exaustivas |
| `verbatimModuleSyntax` | `true` | Preserva a sintaxe de import/export exatamente |
| `noEmit` | `true` | Apenas verificação de tipos — o Vite trata da compilação |

Dois alvos tsconfig: `tsconfig.app.json` (src/, ES2022 + DOM) e `tsconfig.node.json` (vite.config.ts, ES2023 + tipos Node).

### Linting — ESLint 9 (flat config)

`eslint.config.js` usa o formato flat config com quatro conjuntos de regras:

| Plugin | Versão | Regras fornecidas |
|--------|---------|----------------|
| `@eslint/js` | 9.39 | Regras JS recomendadas do ESLint |
| `typescript-eslint` | 8.48 | Linting específico de TypeScript |
| `eslint-plugin-react-hooks` | 7.0 | Dependências exaustivas, regras dos hooks |
| `eslint-plugin-react-refresh` | 0.4 | Validação da exportação de componentes do React Fast Refresh |

Execute com `npm run lint`.

### Scripts

| Script | Comando | Descrição |
|--------|---------|-------------|
| `npm run dev` | `vite` | Inicia o servidor de desenvolvimento em `http://localhost:5173` |
| `npm run build` | `tsc -b && vite build` | Verificação de tipos + bundle de produção |
| `npm run lint` | `eslint .` | Faz lint de todos os ficheiros `.ts` / `.tsx` |
| `npm run preview` | `vite preview` | Pré-visualiza o build de produção localmente |

### CI — GitHub Actions

Corre em cada PR e em cada push para `main` (Node 20, Ubuntu):

```
npm ci → npm run lint → npm run build
```

---

## Skills do Claude Code

Duas skills de desenvolvimento de IA vêm pré-instaladas para uso com o [Claude Code](https://claude.ai/claude-code):

### `frontend-design` — Anthropic

> Fonte: `anthropics/skills`

Orienta a criação de interfaces frontend distintivas e de nível de produção. É despoletada ao construir componentes, páginas ou qualquer UI web. Impõe uma direção estética arrojada, escolhas de design intencionais e uma implementação polida — evitando explicitamente estéticas genéricas geradas por IA.

### `vercel-react-best-practices` — Vercel

> Fonte: `vercel-labs/agent-skills`

Diretrizes de otimização de desempenho de React mantidas pela Vercel Engineering. Contém **57 regras em 8 categorias**, aplicadas ao escrever ou rever componentes React, fetch de dados, configuração de bundle ou qualquer código sensível ao desempenho:

| Categoria | Regras | Foco |
|----------|:-----:|-------|
| `rerender` | 13 | Evitar re-renders desnecessários (memo, estado derivado, refs) |
| `js` | 12 | Desempenho de JavaScript (caching, saídas antecipadas, estruturas de dados eficientes) |
| `rendering` | 10 | Otimização de render (renderização condicional, hidratação, transições) |
| `server` | 7 | Padrões do lado do servidor (fetch paralelo, caching, ações de autenticação) |
| `async` | 5 | Padrões assíncronos (boundaries de Suspense, await diferido, dependências paralelas) |
| `bundle` | 5 | Otimização de bundle (imports dinâmicos, barrel files, preloading) |
| `client` | 4 | Padrões do lado do cliente (event listeners, schema de localStorage, dedup de SWR) |
| `advanced` | 3 | Padrões avançados (refs de event handlers, init-once, useLatest) |

As skills são instaladas em `.agents/skills/` e fixadas em `skills-lock.json`.

---

## Licença

MIT — ver [LICENSE](./LICENSE).
