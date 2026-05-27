# Feature Specification: Eliminar Refresh Global do Dashboard apos CRUD de Movimentacoes

## Changelog (2026-05-27)

- Clarificada consistencia por periodo ativo (`mes/ano`) para patch local e revalidacao.
- Incluida regra de descarte/reconciliacao de respostas antigas quando houver troca de periodo durante mutacao.
- Adicionada cobertura explicita de simulacao em lote (`apply simulation`) nos cenarios de teste.
- Mantido escopo original: sem mudanca de contrato API/backend e sem redesign amplo.

**Feature Branch**: `008-eliminar-refresh-global-dashboard`
**Created**: 2026-05-27
**Status**: Draft
**Input**: `docs/briefings/eliminar-refresh-global-dashboard.md`

## §0 Contexto de Negócio

- **Persona**: usuario unico do produto (PO), com uso diario do dashboard.
- **Dor real**: apos criar/editar/deletar movimentacao, a tela inteira pisca por refresh global e perde continuidade visual.
- **Valor entregue**: fluxo fluido e intent driven, com atualizacao local sem remount global do dashboard.
- **KPIs**:
  - nao exibir fallback global de carregamento apos CRUD de movimentacao.
  - preservar scroll/contexto visual apos mutacoes.
  - reduzir percepcao de recarregamento nas abas do dashboard.
  - entregar ganho parcial ja na fase 1 (meta de 80% de melhoria percebida).
- **Restricoes**:
  - sem alteracao de contrato API/backend.
  - sem redesign amplo do dashboard.
  - risco de regressao minimizado nas abas existentes.

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Criar movimentacao sem piscar a tela inteira (Priority: P1)

Como usuario, quero criar uma movimentacao e ver os cards/listas atualizados sem derrubar o dashboard inteiro em loading.

**Why this priority**: criacao e fluxo mais recorrente do uso diario; remove principal atrito visual.

**Independent Test**: abrir dashboard, criar movimentacao e validar atualizacao de lista/cards sem exibir estado global `Carregando informações...`.

**Acceptance Scenarios**:

1. **Given** dashboard carregado, **When** usuario cria movimentacao, **Then** item aparece sem refresh global da tela.
2. **Given** falha de rede na criacao, **When** operacao retorna erro, **Then** interface nao colapsa e estado local e reconciliado.

---

### User Story 2 - Editar e deletar com patch local e contexto preservado (Priority: P1)

Como usuario, quero editar/deletar movimentacao mantendo scroll e contexto visual atual.

**Why this priority**: elimina perda de contexto durante manutencao de dados no mes corrente.

**Independent Test**: editar e deletar itens no meio da lista com scroll ativo, observando que a posicao visual permanece estavel.

**Acceptance Scenarios**:

1. **Given** usuario com lista rolada, **When** edita uma movimentacao, **Then** somente item/derivados mudam e scroll e preservado.
2. **Given** usuario com lista rolada, **When** deleta uma movimentacao, **Then** item some sem remount global e sem retorno ao topo.

---

### User Story 3 - Garantir consistencia com revalidacao silenciosa (Priority: P2)

Como usuario, quero que o app revalide dados em background para evitar drift entre estado local e backend, sem piscar a tela.

**Why this priority**: protege integridade funcional apos mutacoes otimizadas localmente.

**Independent Test**: executar CRUD sequencial rapido e validar convergencia por refetch silencioso sem loading global.

**Acceptance Scenarios**:

1. **Given** patch local aplicado apos mutacao, **When** revalidacao silenciosa conclui, **Then** dados convergem com backend sem fallback global.
2. **Given** respostas fora de ordem (race), **When** duas mutacoes ocorrem em sequencia curta, **Then** estado final nao regressa para snapshot antigo.

---

### User Story 4 - Aplicar simulacao em lote sem refresh global (Priority: P2)

Como usuario, quero aplicar um lote de simulacoes e ver a atualizacao sem fallback global, mesmo com N transacoes.

**Why this priority**: fluxo em lote e sensivel a drift e regressao visual quando multiplas mutacoes ocorrem em sequencia.

**Independent Test**: com simulacao ativa contendo N transacoes, executar `Aplicar tudo` e validar ausencia de fallback global e consistencia final apos revalidacao silenciosa.

**Acceptance Scenarios**:

1. **Given** lote de simulacao com N itens, **When** usuario aplica lote, **Then** dashboard nao exibe loading global e mantém contexto visual.
2. **Given** falha parcial no lote, **When** processo encerra, **Then** estado final converge por regra de rollback/revalidacao sem contaminar periodo ativo.

## Edge Cases

- Mutacoes simultaneas (create/edit/delete quase em paralelo) nao podem sobrescrever estado com resposta antiga.
- Falha parcial em cadeia (ex.: apply simulation cria N e falha em 1) deve manter comportamento previsivel com rollback/revalidacao.
- CRUD durante troca de mes/ano nao deve contaminar estado de outro periodo.
- Resposta de mutacao/revalidacao iniciada no periodo A e recebida no periodo B deve ser descartada ou reconciliada sem alterar periodo B.
- Revalidacao silenciosa nao deve acionar `loading` global usado na carga inicial.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001 [Loading Split]**: sistema MUST separar carregamento inicial bloqueante de revalidacao silenciosa.
- **FR-002 [No Global Flicker]**: dashboard MUST nao exibir fallback global de loading apos CRUD de movimentacoes.
- **FR-003 [Create Patch]**: create MUST atualizar estado local de movimentacoes e derivados sem refetch bloqueante imediato.
- **FR-004 [Edit Patch]**: edit MUST substituir item local por id e recomputar derivados locais.
- **FR-005 [Delete Patch]**: delete MUST remover item local por id e recomputar derivados locais.
- **FR-006 [Background Revalidation]**: apos patch local, sistema MUST executar revalidacao em background sem bloquear dashboard.
- **FR-007 [Race Guard]**: sistema MUST ignorar respostas atrasadas de revalidacao/mutacao para evitar drift por ordem incorreta.
- **FR-007A [Period Guard]**: patch local e revalidacao MUST afetar apenas o periodo ativo (`mes/ano`) no momento da aplicacao.
- **FR-007B [Stale Response Rule]**: se usuario trocar periodo durante mutation/revalidacao, respostas iniciadas no periodo anterior MUST ser descartadas ou reconciliadas sem contaminar o novo periodo.
- **FR-008 [Rollback Guard]**: em erro de mutacao, sistema MUST aplicar rollback local ou refetch silencioso com feedback ao usuario.
- **FR-009 [Scroll Preservation]**: interacoes de CRUD MUST preservar contexto visual e scroll do dashboard.
- **FR-010 [Scope Guard]**: implementacao MUST priorizar mudancas em `App.jsx`, `DashboardView.jsx` e `TransactionModal.jsx`, podendo incluir arquivos de teste diretamente relacionados (`*.test.jsx`) e pequenos utilitarios locais de apoio quando estritamente necessario, sem alterar contratos backend.
- **FR-011 [Batch Simulation Guard]**: `apply simulation` em lote MUST seguir as mesmas regras de no-global-refresh, period guard e race guard.

### Constitution Alignment _(mandatory)_

- **CA-001 (Princípio I - Bounded Architecture)**: mudanca restrita ao client; sem dependencia indevida entre camadas backend.
- **CA-002 (Princípio II - Security by Default)**: sem alteracao de auth/token/PII; erros continuam sem expor dados sensiveis.
- **CA-003 (Princípio III - Quality Gates Executáveis)**: mudanca MUST passar em `cd client && npm run lint`, `cd client && npm run build`, `cd client && npm test`.
- **CA-004 (Princípio IV - Data Integrity)**: valores financeiros exibidos no patch local devem manter consistencia de calculo e convergir com backend.
- **CA-005 (Princípio V - Operability)**: revalidacoes e falhas devem ser observaveis por logs/mensagens de erro sem quebrar UX.

### Key Entities _(include if feature involves data)_

- **DashboardDataState**: estado local canônico de entradas/saidas e agregados em tela.
- **MutationSnapshot**: snapshot temporario usado para rollback quando mutacao falha.
- **RevalidationToken**: marcador monotônico/local para descartar respostas antigas e evitar race condition.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: 0 exibicoes do fallback global de loading apos create/edit/delete em testes manuais do dashboard.
- **SC-002**: 100% dos fluxos CRUD validam preservacao de contexto visual/scroll no periodo atual.
- **SC-003**: 100% dos cenarios de erro de mutacao convergem para estado consistente apos rollback/revalidacao.
- **SC-004**: regressao funcional zero nas abas do dashboard afetadas pelo estado de movimentacoes.
- **SC-005**: quality gates frontend passam sem regressao.
- **SC-006**: 100% dos testes de `apply simulation` em lote executam sem fallback global e sem drift no periodo ativo.

## Assumptions

- Endpoint backend atual de movimentacoes retorna dados suficientes para patch local e revalidacao sem contrato novo.
- Carga inicial pode permanecer bloqueante para manter simplicidade de bootstrap.
- Feedback de erro continuara no mecanismo atual (alert/console) neste ciclo, sem redesign de notificacoes.
- O periodo ativo (`mes/ano`) e parte do contexto obrigatorio para aplicar patch/revalidacao.
