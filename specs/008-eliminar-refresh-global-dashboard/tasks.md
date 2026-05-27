# Tasks — Eliminar Refresh Global do Dashboard apos CRUD de Movimentacoes

## Changelog (2026-05-27)

- Adicionadas tasks/DoD explicitas para consistencia por periodo ativo (`mes/ano`).
- Incluida cobertura obrigatoria de `apply simulation` em lote.
- Refinada regra de rollback com criterios determinísticos por tipo de falha.
- Mantido escopo original sem alterar contratos de API/backend.

**Input**: `specs/008-eliminar-refresh-global-dashboard/spec.md`, `specs/008-eliminar-refresh-global-dashboard/plan.md`

## Ordem de Execucao

1. Orquestracao de loading e revalidacao (App)
2. Eventos de mutacao no modal (TransactionModal)
3. Patch local e reconciliacao (DashboardView)
4. Validacao, rollback e regressao

## TASK-01 — Separar loading inicial de revalidacao silenciosa em App

**O que fazer:** refatorar `fetchData` para suportar modo silencioso e separar estado de bootstrap bloqueante de estado de revalidacao nao bloqueante. (Ref: Plan §2, §3, ADR-1)
**Onde:** `client/src/App.jsx`
**Depende de:** Nenhuma
**Pode ser paralela com:** TASK-02
**Reusar:** `fetchData` atual e estados de `incomes/expenses` existentes
**Complexidade:** M
**Definition of Done:**
- [ ] Fallback global e acionado apenas na carga inicial
- [ ] Revalidacao silenciosa atualiza estado sem acionar bloqueio global
- [ ] Estrutura permite chamada de revalidacao por `DashboardView`
- [ ] Estado canonico definido no App e documentado no codigo (comentario breve)
- [ ] Sem violacoes da constitution
- [ ] `cd client && npm run lint` passa
- [ ] `cd client && npm run build` passa
- [ ] `cd client && npm test` passa

## TASK-02 — Evoluir TransactionModal para reportar resultado de mutacao

**O que fazer:** ajustar callback `onSuccess` para incluir metadados da mutacao (`create|edit`, id e payload relevante) sem alterar contrato de API/backend. (Ref: Plan §2, §3)
**Onde:** `client/src/components/TransactionModal.jsx`
**Depende de:** Nenhuma
**Pode ser paralela com:** TASK-01
**Reusar:** fluxo atual de submit e fechamento de modal
**Complexidade:** S
**Definition of Done:**
- [ ] `onSuccess` recebe dados suficientes para patch local
- [ ] Fluxo atual de sucesso/fechamento permanece funcional
- [ ] Nenhum endpoint/contrato backend alterado
- [ ] Sem violacoes da constitution
- [ ] `cd client && npm test` passa

## TASK-03 — Implementar patch local para create em DashboardView

**O que fazer:** substituir `onSuccess={fetchData}` por handler local que insere movimentacao criada no estado em memoria e recomputa derivados sem refresh global. (Ref: Plan §3, §4, ADR-2)
**Onde:** `client/src/components/DashboardView.jsx`
**Depende de:** TASK-01, TASK-02
**Pode ser paralela com:** TASK-04
**Reusar:** `mapApiToFrontend`, agrupamentos e derivados atuais
**Complexidade:** M
**Definition of Done:**
- [ ] Criacao atualiza listas/cards sem mostrar fallback global
- [ ] Scroll/contexto visual permanece estavel
- [ ] Revalidacao silenciosa dispara apos patch local
- [ ] Patch local aplicado apenas ao periodo ativo (`mes/ano`)
- [ ] Sem violacoes da constitution
- [ ] `cd client && npm run lint` passa
- [ ] `cd client && npm run build` passa
- [ ] `cd client && npm test` passa

## TASK-04 — Implementar patch local para edit em DashboardView

**O que fazer:** atualizar item por id no estado local, recalcular agregados e acionar revalidacao silenciosa sem refresh global. (Ref: Plan §3, §4)
**Onde:** `client/src/components/DashboardView.jsx`
**Depende de:** TASK-03
**Pode ser paralela com:** TASK-05
**Reusar:** mesma infraestrutura de patch da task anterior
**Complexidade:** M
**Definition of Done:**
- [ ] Edicao reflete imediatamente em listas/cards/graficos
- [ ] Nao ocorre remount global da view
- [ ] Revalidacao silenciosa garante convergencia backend
- [ ] Se periodo ativo mudou durante request, resposta antiga e descartada/no-op
- [ ] Sem violacoes da constitution
- [ ] `cd client && npm test` passa

## TASK-05 — Implementar patch local para delete em DashboardView

**O que fazer:** remover item do estado local em delete e recomputar derivados, com fallback de rollback/revalidacao em erro. (Ref: Plan §4, §7)
**Onde:** `client/src/components/DashboardView.jsx`
**Depende de:** TASK-03
**Pode ser paralela com:** TASK-04
**Reusar:** handlers atuais `handleRemove` e estrutura de estado
**Complexidade:** M
**Definition of Done:**
- [ ] Delete remove item local sem fallback global de loading
- [ ] Em falha HTTP/rede de delete, rollback imediato + revalidacao silenciosa obrigatoria
- [ ] Scroll/contexto visual permanece preservado
- [ ] Sem violacoes da constitution
- [ ] `cd client && npm test` passa

## TASK-06 — Introduzir protecao contra race/drift e consistencia por periodo

**O que fazer:** adicionar token monotônico/ref e `periodKey` para descartar respostas antigas e impedir sobrescrita de estado novo por request atrasada ou periodo divergente. (Ref: Plan §3, ADR-3)
**Onde:** `client/src/App.jsx`, `client/src/components/DashboardView.jsx`
**Depende de:** TASK-01, TASK-03, TASK-04, TASK-05
**Pode ser paralela com:** TASK-07
**Reusar:** refs/hooks atuais do React
**Complexidade:** M
**Definition of Done:**
- [ ] Respostas antigas nao sobrescrevem estado mais novo
- [ ] Sequencias rapidas de CRUD mantem estado final correto
- [ ] Respostas iniciadas no periodo A nao alteram estado quando periodo ativo for B
- [ ] Logica documentada e coberta por testes
- [ ] Sem violacoes da constitution
- [ ] `cd client && npm test` passa

## TASK-06A — Padronizar regra determinística de rollback por tipo de falha

**O que fazer:** implementar e documentar no codigo as regras: (a) validacao local -> sem patch/sem rollback, (b) falha HTTP/rede em mutacao -> rollback imediato + revalidacao obrigatoria, (c) falha apenas de revalidacao -> manter patch e retentar depois, (d) resposta obsoleta por token/periodo -> descarte sem rollback. (Ref: Plan §8.1)
**Onde:** `client/src/App.jsx`, `client/src/components/DashboardView.jsx`
**Depende de:** TASK-06
**Pode ser paralela com:** TASK-07
**Reusar:** snapshot local e dispatcher de revalidacao da fase anterior
**Complexidade:** M
**Definition of Done:**
- [ ] Cada tipo de falha segue comportamento deterministico definido
- [ ] Nao ha rollback indevido para resposta obsoleta
- [ ] Revalidacao obrigatoria ocorre nos casos previstos
- [ ] `cd client && npm test` passa

## TASK-07 — Validar rollback e regressao nas abas do dashboard

**O que fazer:** consolidar testes manuais e automatizados para create/edit/delete sem refresh global, incluindo cenarios de erro e preservacao de scroll/contexto. (Ref: Plan §4, §7, Estratégia de Rollback)
**Onde:** `client/src/components/DashboardView.test.jsx`, `client/src/components/TransactionModal.test.jsx` (ou equivalentes), checklist operacional da feature
**Depende de:** TASK-06, TASK-06A
**Pode ser paralela com:** Nenhuma
**Reusar:** suites de teste existentes do dashboard/modal
**Complexidade:** M
**Definition of Done:**
- [ ] Testes cobrem CRUD sem fallback global
- [ ] Testes cobrem erro de rede com rollback/revalidacao
- [ ] Testes cobrem troca de periodo durante mutacao/revalidacao (sem contaminacao)
- [ ] Testes cobrem `apply simulation` em lote (N transacoes) sem fallback global e sem drift
- [ ] Validacao manual confirma preservacao de scroll/contexto
- [ ] Regressao nas abas do dashboard avaliada
- [ ] Sem violacoes da constitution
- [ ] `cd client && npm run lint` passa
- [ ] `cd client && npm run build` passa
- [ ] `cd client && npm test` passa

## Checklist de Validação Manual e Técnica

1. Create/edit/delete no periodo atual sem mostrar fallback global.
2. Trocar mes/ano durante mutacao e confirmar descarte de resposta antiga.
3. Trocar mes/ano durante revalidacao e confirmar ausencia de contaminacao de periodo.
4. Executar `apply simulation` com N transacoes e validar ausencia de piscada global.
5. Simular falha parcial em lote e validar convergencia final por regra de rollback/revalidacao.
6. Confirmar preservacao de scroll/contexto apos CRUD e apos lote.
7. Executar `npm run lint`, `npm run build`, `npm test` com resultado verde.

## Gate Operacional Obrigatorio (ao final de cada task com codigo)

1. Executar `cd client && npm run lint`.
2. Executar `cd client && npm run build`.
3. Executar `cd client && npm test`.
4. Corrigir qualquer falha antes de iniciar a proxima task.
