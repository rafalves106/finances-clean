# Tasks — Evolucao do Dashboard em 3 Sprints Curtas (Ciclo 9)

**Input**: `specs/009-evolucao-dashboard-ciclo-9/spec.md`, `specs/009-evolucao-dashboard-ciclo-9/plan.md`

## Ordem de Execucao

1. Sprint 1 (quick wins)
2. Sprint 2 (planejamento)
3. Sprint 3 (produtividade)
4. Validacao final e go/no-go

## Sprint 1 — Quick Wins

### TASK-01 — Implementar resumo executivo no topo do dashboard

**O que fazer:** adicionar bloco de resumo executivo no topo com sinais sinteticos do mes, sem remover cards atuais. (Ref: Plan §3 Sprint 1)
**Onde:** `client/src/components/DashboardView.jsx`
**Depende de:** Nenhuma
**Pode ser paralela com:** TASK-02
**Reusar:** dados atuais de `totalIncome`, `totalExpenses`, `finalBalance`, `saldoAnterior`
**Complexidade:** M
**Definition of Done:**

- [ ] Resumo executivo renderiza no topo sem redesign amplo
- [ ] Sem regressao nos cards existentes
- [ ] Acessibilidade basica (labels/ordem de foco) mantida
- [ ] `cd client && npm run lint` passa
- [ ] `cd client && npm run build` passa
- [ ] `cd client && npm test` passa

### TASK-02 — Adicionar microtendencias nos cards principais

**O que fazer:** exibir microtendencia (variacao curta) nos cards de entrada/saida/saldo usando padrao visual discreto e consistente. (Ref: Plan §3 Sprint 1)
**Onde:** `client/src/components/DashboardView.jsx`, `client/src/util/*` (se necessario)
**Depende de:** Nenhuma
**Pode ser paralela com:** TASK-01
**Reusar:** series existentes do periodo e formatadores atuais
**Complexidade:** M
**Definition of Done:**

- [ ] Tendencias exibidas com semantica coerente ao periodo
- [ ] Cores/indicadores seguem padrao consistente
- [ ] Nao aumenta ruído visual critico
- [ ] `cd client && npm test` passa

### TASK-03 — Unificar padrao visual de progresso e acoes rapidas

**O que fazer:** padronizar visual de blocos de progresso e introduzir acoes rapidas para fluxos recorrentes sem nova rota. (Ref: Plan §3 Sprint 1, ADR-2)
**Onde:** `client/src/components/DashboardView.jsx`, `client/src/components/TransactionModal.jsx`, `client/src/components/CategoryManagerModal.jsx` (somente integracao de gatilho)
**Depende de:** TASK-01, TASK-02
**Pode ser paralela com:** Nenhuma
**Reusar:** botões/ações já existentes no dashboard
**Complexidade:** M
**Definition of Done:**

- [ ] Padrao visual de progresso unificado
- [ ] Acoes rapidas abrem fluxos existentes corretamente
- [ ] Sprint 1 permanece incremental (sem redesign amplo)
- [ ] `cd client && npm run lint` passa
- [ ] `cd client && npm run build` passa
- [ ] `cd client && npm test` passa

## Sprint 2 — Planejamento e Prevencao

### TASK-04 — Implementar card de proximos pagamentos

**O que fazer:** criar bloco de proximos pagamentos no dashboard com prioridade visual moderada e consistente com layout atual. (Ref: Plan §3 Sprint 2)
**Onde:** `client/src/components/DashboardView.jsx`
**Depende de:** TASK-03
**Pode ser paralela com:** TASK-05
**Reusar:** dados de movimentacoes e regras de periodo já existentes
**Complexidade:** M
**Definition of Done:**

- [ ] Card renderiza compromissos/projecoes de curto prazo
- [ ] Sem quebra dos blocos atuais
- [ ] Comportamento responsivo validado
- [ ] `cd client && npm test` passa

### TASK-05 — Inserir insights acionaveis e alertas com CTA

**O que fazer:** adicionar insights contextuais com CTA para acao pratica (sem endpoint novo, se possivel). (Ref: Plan §3 Sprint 2)
**Onde:** `client/src/components/DashboardView.jsx`, `client/src/util/*` (se necessario)
**Depende de:** TASK-03
**Pode ser paralela com:** TASK-04
**Reusar:** alertas/orcamentos e blocos de categoria ja presentes
**Complexidade:** M
**Definition of Done:**

- [ ] Insights aparecem apenas quando contexto for relevante
- [ ] CTA dispara acao existente no fluxo atual
- [ ] Sem falso positivo critico em cenarios comuns
- [ ] `cd client && npm test` passa

### TASK-06 — Implementar estados vazios guiados

**O que fazer:** adicionar estados vazios orientados para blocos novos e existentes de planejamento. (Ref: Plan §3 Sprint 2)
**Onde:** `client/src/components/DashboardView.jsx`
**Depende de:** TASK-04, TASK-05
**Pode ser paralela com:** Nenhuma
**Reusar:** padrao de mensagens vazias ja existente no dashboard
**Complexidade:** S
**Definition of Done:**

- [ ] Estados vazios orientam proxima acao com clareza
- [ ] Nao bloqueiam o fluxo principal
- [ ] Acessibilidade textual preservada
- [ ] `cd client && npm run lint` passa
- [ ] `cd client && npm run build` passa
- [ ] `cd client && npm test` passa

## Sprint 3 — Produtividade e Refinamento

### TASK-07 — Refinar navegacao por intencao no dashboard

**O que fazer:** reorganizar pontos de acao/filtro para reduzir friccao por tarefa, mantendo consistencia com estrutura atual. (Ref: Plan §3 Sprint 3)
**Onde:** `client/src/components/DashboardView.jsx`
**Depende de:** TASK-06
**Pode ser paralela com:** TASK-08
**Reusar:** tabs de categoria, filtros atuais e gatilhos de modal
**Complexidade:** M
**Definition of Done:**

- [ ] Menos passos para tarefas frequentes
- [ ] Sem regressao de usabilidade nas interacoes atuais
- [ ] Estrutura continua reconhecivel para usuario atual
- [ ] `cd client && npm test` passa

### TASK-08 — Otimizar lista de transacoes para eficiencia operacional

**O que fazer:** melhorar legibilidade e velocidade de acao na lista de transacoes (desktop/mobile), sem alterar regra de negocio. (Ref: Plan §3 Sprint 3)
**Onde:** `client/src/components/DashboardView.jsx`, `client/src/components/TransactionModal.jsx` (apenas ajustes de UX operacional)
**Depende de:** TASK-06
**Pode ser paralela com:** TASK-07
**Reusar:** agrupamentos e controles de editar/deletar/renumerar existentes
**Complexidade:** M
**Definition of Done:**

- [ ] Lista fica mais eficiente para leitura e acao
- [ ] Fluxos CRUD e simulacao permanecem intactos
- [ ] Sem quebra visual em mobile
- [ ] `cd client && npm run lint` passa
- [ ] `cd client && npm run build` passa
- [ ] `cd client && npm test` passa

### TASK-09 — Consolidar ajustes de UX desktop/mobile e acessibilidade

**O que fazer:** aplicar ajustes finais de responsividade e acessibilidade decorrentes dos sprints anteriores. (Ref: Plan §0, §7)
**Onde:** `client/src/components/DashboardView.jsx`, testes relacionados
**Depende de:** TASK-07, TASK-08
**Pode ser paralela com:** Nenhuma
**Reusar:** classes utilitarias Tailwind e padrões de foco existentes
**Complexidade:** S
**Definition of Done:**

- [ ] Navegacao por teclado funcional nos blocos novos
- [ ] Contraste/foco/labels adequados nos componentes adicionados
- [ ] Comportamento consistente desktop/mobile
- [ ] `cd client && npm run lint` passa
- [ ] `cd client && npm run build` passa
- [ ] `cd client && npm test` passa

## TASK-10 — Gate final de validacao e decisao go/no-go

**O que fazer:** executar checklist manual por sprint, registrar evidencias e decidir avancar/parar com base nos criterios de go/no-go. (Ref: Plan seção Go/No-Go)
**Onde:** `specs/009-evolucao-dashboard-ciclo-9/` (registro operacional)
**Depende de:** TASK-03, TASK-06, TASK-09
**Pode ser paralela com:** Nenhuma
**Reusar:** evidencias de testes/lint/build e observacoes de UX
**Complexidade:** S
**Definition of Done:**

- [ ] Checklist Sprint 1 preenchido e aprovado
- [ ] Checklist Sprint 2 preenchido e aprovado
- [ ] Checklist Sprint 3 preenchido e aprovado
- [ ] Criterio go/no-go registrado para cada transicao
- [ ] Sem violacoes da constitution

## Gate Operacional Obrigatorio (ao final de cada task com codigo)

1. Executar `cd client && npm run lint`.
2. Executar `cd client && npm run build`.
3. Executar `cd client && npm test`.
4. Corrigir qualquer falha antes da proxima task.

## Checklist Manual por Sprint

### Sprint 1

1. Resumo executivo aparece no topo e leitura do mes fica clara em ate 5s.
2. Microtendencias dos cards estao consistentes com dados do periodo.
3. Acoes rapidas funcionam sem alterar regra de negocio.
4. Nao houve redesign amplo nem quebra visual estrutural.

### Sprint 2

1. Card de proximos pagamentos aparece com relevancia pratica.
2. Insights acionaveis exibem CTA objetivo e funcional.
3. Estados vazios orientam o usuario sem travar fluxo.
4. Densidade de informacao continua controlada.

### Sprint 3

1. Navegacao por intencao reduziu friccao de tarefas recorrentes.
2. Lista de transacoes ficou mais eficiente para leitura/acao.
3. Desktop e mobile mantem continuidade visual.
4. Acessibilidade minima validada (foco, labels, ordem de tab).

## Critério de Go/No-Go por Sprint

1. **Go S1 -> S2**: quick wins entregues sem redesign amplo + gates verdes + sem regressao critica.
2. **Go S2 -> S3**: planejamento/insights aprovados pelo PO + estados vazios adequados + sem regressao bloqueante.
3. **Go S3 -> Fechamento**: ganhos de produtividade confirmados + responsividade/acessibilidade aceitas + quality gates verdes.
