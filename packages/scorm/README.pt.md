🌐 [English](README.md) · [Español](README.es.md) · [Français](README.fr.md) · [Português](README.pt.md) · [Deutsch](README.de.md) · [Polski](README.pl.md)

# @studiolxd/react-scorm

Uma biblioteca headless React + TypeScript para integração com o runtime SCORM. Fornece um `<ScormProvider>` e o hook `useScorm()` para comunicação com um LMS via SCORM 1.2 ou SCORM 2004 (4ª Edição).

**Principais funcionalidades:**
- Cobertura completa dos padrões SCORM 1.2 e 2004
- Headless (sem UI) — você constrói a interface
- Tipagem TypeScript estrita para todos os caminhos CMI e APIs
- Tratamento de erros baseado em Result (sem lançamentos implícitos)
- Sem estado automático, sem persistência, sem salvamento automático
- Modo mock em memória para desenvolvimento local
- Gerenciamento de ciclo de vida opcional com `useScormAutoTerminate`

## Instalação

```bash
npm install @studiolxd/react-scorm
```

React 18+ é necessário como peer dependency.

## Início Rápido

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

O componente `<ScormProvider>` localiza a API do LMS e a disponibiliza via contexto. Ele **não** inicializa automaticamente — você deve chamar `api.initialize()` explicitamente.

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

### Opções de `noLmsBehavior`

| Valor | Comportamento |
|-------|---------------|
| `"error"` (padrão) | `api` é `null`, `status.apiFound` é `false`. As operações não podem ser chamadas. |
| `"mock"` | Usa uma API SCORM mock em memória. Ideal para desenvolvimento local e testes. |
| `"throw"` | Lança um `ScormError` durante a renderização. Envolva com um **Error Boundary** do React. |

> **Modo `"throw"`** lança de forma síncrona dentro do `useMemo`. Sem um Error Boundary, o erro se propagará e derrubará toda a subárvore. Sempre envolva o `<ScormProvider>` em um Error Boundary ao usar esse modo.

## useScorm()

```tsx
const { status, api, raw } = useScorm();
```

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `status` | `ScormStatus` | Status da conexão: `apiFound`, `initialized`*, `terminated`*, `version`, `noLmsBehavior` |
| `api` | `IScormApi \| null` | API de alto nível agnóstica à versão. `null` quando nenhuma API é encontrada com o comportamento `"error"`. |
| `raw` | `IScormDriver \| null` | Driver de baixo nível para chamadas diretas à API (escape hatch). |

> **Nota:** `status.initialized` e `status.terminated` são sempre `false` no valor de contexto — o provider não rastreia o estado do runtime. Se você precisar de estado reativo de inicialização/encerramento, mantenha-o você mesmo com `useState` após chamar `api.initialize()` e `api.terminate()`.

## API de Alto Nível

Todos os métodos retornam `Result<T, ScormError>` — verifique `result.ok` antes de acessar o valor.

### Ciclo de Vida

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

### Pontuação

```ts
api.setScore({ raw: 85, min: 0, max: 100, scaled: 0.85 })  // scaled is 2004 only
api.getScore()  // Result<ScoreData, ScormError>
```

**Validação:** `raw`, `min` e `max` devem ser números finitos (NaN/Infinity são rejeitados com o código de erro 405). `scaled` deve estar no intervalo `[-1, 1]` (código de erro 407 se fora do intervalo). Para SCORM 1.2, `scaled` é silenciosamente ignorado.

### Localização e Dados de Suspensão

```ts
api.setLocation('page-5')
api.getLocation()
api.setSuspendData(JSON.stringify({ progress: [1, 2, 3] }))
api.getSuspendData()
```

### Tempo de Sessão

```ts
api.setSessionTime(90000)  // 1.2: "00:01:30.00" | 2004: "PT1M30S"
api.getTotalTime()
```

### Informações do Aprendiz (somente leitura)

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

### Interações

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

### Comentários

```ts
// SCORM 1.2: appends to a single cmi.comments string (newline-separated)
// SCORM 2004: creates indexed entries in cmi.comments_from_learner
api.addLearnerComment('Great course', 'page-3', '2024-01-15T10:00:00Z')
                      // comment        location  timestamp (all optional except comment)

// Count methods: always return 0 for SCORM 1.2
api.getLearnerCommentCount()  // Result<number, ScormError>
api.getLmsCommentCount()      // Result<number, ScormError> — LMS comments read-only
```

### Preferências

```ts
api.setPreference('language', 'en')
api.getPreferences()  // Result<Record<string, string>, ScormError>
```

### Progresso (somente SCORM 2004)

```ts
api.setProgressMeasure(0.75)  // value must be in range [0, 1] — error 407 otherwise
                               // no-op (returns ok) for SCORM 1.2
```

### Saída

```ts
api.setExit('suspend')  // 1.2: cmi.core.exit | 2004: cmi.exit
                        // Common values: 'suspend', 'logout', 'time-out', ''
```

### Dados do Aluno (somente leitura, definido pelo LMS)

```ts
api.getMasteryScore()     // 1.2: cmi.student_data.mastery_score | 2004: cmi.scaled_passing_score
api.getMaxTimeAllowed()   // 1.2: cmi.student_data.max_time_allowed | 2004: cmi.max_time_allowed
api.getTimeLimitAction()  // 1.2: cmi.student_data.time_limit_action | 2004: cmi.time_limit_action
```

### Navegação (somente SCORM 2004)

```ts
api.setNavRequest('continue')              // no-op (returns ok) for SCORM 1.2
api.getNavRequestValid('continue')         // 'continue' | 'previous'
api.getNavRequestValid('previous')
```

### Acesso Direto (escape hatch)

```ts
api.getRaw('cmi.core.lesson_status')
api.setRaw('cmi.core.lesson_status', 'completed')
```

## Tratamento de Erros

Todas as operações retornam `Result<T, ScormError>` em vez de lançar exceções:

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

`ScormError` inclui: `version`, `operation`, `path`, `code`, `errorString`, `diagnostic`, `exception`, `apiFound`, `initialized`.

Funções auxiliares: `isOk()`, `isErr()`, `unwrap()`, `unwrapOr()`.

> **Segurança:** `errorString` e `diagnostic` são strings provenientes diretamente do LMS. Não as renderize via `innerHTML` ou qualquer API DOM sem sanitização — trate-as como entrada não confiável e faça escape de HTML antes de qualquer inserção no DOM.

## useScormSession (estado reativo opcional)

`useScorm()` mantém intencionalmente `status.initialized` como um snapshot estático — o provider não rastreia o estado do ciclo de vida. Se você precisar de `initialized` e `terminated` como estado reativo do React (para acionar re-renderizações), use `useScormSession()` no lugar.

```tsx
import { useScormSession } from '@studiolxd/react-scorm';

function Course() {
  const { initialized, initialize, terminate, api } = useScormSession();

  useEffect(() => { initialize(); }, [initialize]);

  if (!initialized) return <p>Connecting…</p>;
  return <CourseContent api={api} onFinish={terminate} />;
}
```

`useScormSession()` é um superconjunto de `useScorm()` — retorna tudo que `useScorm()` retorna (`api`, `status`, `raw`) mais:

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `initialized` | `boolean` | `true` após `initialize()` ser executado com sucesso. Reativo. |
| `terminated` | `boolean` | `true` após `terminate()` ser executado com sucesso. Reativo. |
| `initialize()` | `Result<true, ScormError> \| undefined` | Chama `api.initialize()` e atualiza o estado. `undefined` se não houver API. |
| `terminate()` | `Result<true, ScormError> \| undefined` | Chama `api.terminate()` e atualiza o estado. `undefined` se não houver API. |
| `commit()` | `Result<true, ScormError> \| undefined` | Chama `api.commit()`. `undefined` se não houver API. |

> **Nota:** Quando `noLmsBehavior` é `'error'` e nenhum LMS é encontrado, `api` é `null` e os três métodos retornam `undefined`. Verifique `status.apiFound` se precisar distinguir esse caso.

## useScormAutoTerminate (opcional)

Gerencia o ciclo de vida SCORM automaticamente:

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

## Construtores de Caminhos

Funções auxiliares tipadas para construir caminhos CMI indexados:

```ts
import { scorm12ObjectivePath, scorm2004InteractionPath } from '@studiolxd/react-scorm';

scorm12ObjectivePath(0, 'score.raw')       // "cmi.objectives.0.score.raw"
scorm2004InteractionPath(1, 'learner_response')  // "cmi.interactions.1.learner_response"
```

## Formatadores de Tempo

```ts
import { formatScorm12Time, formatScorm2004Time } from '@studiolxd/react-scorm';

formatScorm12Time(90000)   // "00:01:30.00"
formatScorm2004Time(90000) // "PT1M30S"
```

## Testes

Use `noLmsBehavior: 'mock'` para testes. O mock utiliza um armazenamento em memória com comportamento real do driver.

```tsx
// In tests
<ScormProvider version="1.2" options={{ noLmsBehavior: 'mock' }}>
  <ComponentUnderTest />
</ScormProvider>
```

Você também pode usar as classes mock diretamente:

```ts
import { MockScorm12Api, Scorm12Driver, ScormApi, createLogger } from '@studiolxd/react-scorm';

const mockApi = new MockScorm12Api();
const driver = new Scorm12Driver(mockApi, createLogger(false));
const api = new ScormApi(driver);
api.initialize();
// ... test your logic
```

## TypeScript

Todos os caminhos CMI são estritamente tipados:

```ts
import type { Scorm12CmiPath, Scorm2004CmiPath } from '@studiolxd/react-scorm';

// These types catch typos at compile time:
const path: Scorm12CmiPath = 'cmi.core.lesson_status';  // OK
// const bad: Scorm12CmiPath = 'cmi.core.typo';          // ERROR
```

## Documentação Adicional

- [Tabela de Mapeamento SCORM 1.2 vs 2004](./docs/scorm-mapping-table.md)
- [Testes com o Modo Mock](./docs/mock-mode.md)
- [Guia de Integração](./docs/integration-guide.md)

## Licença

MIT
