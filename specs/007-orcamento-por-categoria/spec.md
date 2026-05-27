# Feature Specification: Orcamento por Categoria com Alertas Visuais

**Feature Branch**: `007-orcamento-por-categoria`
**Created**: 2026-05-26
**Status**: Draft
**Input**: `docs/briefings/orcamento-por-categoria.md`

## §0 Contexto de Negócio

- **Persona**: Rafael (usuario diario do Finance).
- **Dor real**: hoje o app registra gasto por categoria, mas nao permite controle ativo de teto mensal, fazendo o usuario descobrir excesso apenas depois.
- **Valor entregue**: o usuario define um limite mensal por categoria e recebe sinais visuais de aproximacao (>=80%) e ultrapassagem (>=100%) sem sair do dashboard.
- **KPIs de sucesso**:
  - usuario consegue criar e editar orçamento mensal por categoria.
  - barras de progresso mudam para amarelo em >=80% e vermelho em >=100%.
  - dashboard mostra indicador com quantidade de categorias em alerta.
- **Restricoes**:
  - gestao de orçamento deve ficar no modal existente `CategoryManagerModal.jsx`.
  - sem nova tela/rota e sem bibliotecas novas.
  - alerta vale apenas para despesas por categoria.

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Definir e editar orçamento mensal por categoria (Priority: P1)

Como usuario, quero configurar no gerenciador de categorias um teto mensal de gasto por categoria para orientar meu controle financeiro.

**Why this priority**: sem configuracao de orçamento, os alertas nao existem e a dor principal permanece.

**Independent Test**: abrir `CategoryManagerModal`, cadastrar/editar categoria com valor de orçamento e confirmar persistencia apos recarregar categorias.

**Acceptance Scenarios**:

1. **Given** categoria existente no modal, **When** usuario informa um valor de orçamento mensal valido e salva, **Then** categoria passa a possuir orçamento persistido.
2. **Given** categoria com orçamento definido, **When** usuario remove/limpa o orçamento e salva, **Then** categoria volta ao estado sem orçamento e sem alerta.

---

### User Story 2 - Exibir progresso de consumo com alerta visual por categoria (Priority: P1)

Como usuario, quero ver no dashboard o progresso de consumo do orçamento por categoria para agir antes de estourar o limite.

**Why this priority**: o valor de negocio depende de visibilidade operacional imediata dos limites.

**Independent Test**: com dados de despesas no mes atual, validar que cada categoria com orçamento mostra progresso e cores corretas para faixas <80%, >=80% e >=100%.

**Acceptance Scenarios**:

1. **Given** categoria com orçamento e gasto mensal entre 80% e 99,99%, **When** dashboard renderiza, **Then** indicador dessa categoria aparece em estado de atencao (amarelo).
2. **Given** categoria com orçamento e gasto mensal >=100%, **When** dashboard renderiza, **Then** indicador aparece em estado estourado (vermelho).
3. **Given** categoria sem orçamento mensal, **When** dashboard renderiza, **Then** categoria nao exibe alerta de orçamento.

---

### User Story 3 - Sinalizar categorias em alerta sem abrir card detalhado (Priority: P2)

Como usuario, quero um badge/resumo no dashboard mostrando quantas categorias estao em alerta para ter visibilidade rapida.

**Why this priority**: reduz friccao de monitoramento e atende ao objetivo de alerta sem navegacao extra.

**Independent Test**: carregar dashboard com categorias em diferentes estados e verificar contador de alertas atualizado.

**Acceptance Scenarios**:

1. **Given** uma ou mais categorias em >=80%, **When** dashboard carrega, **Then** badge mostra quantidade correta de categorias em alerta.
2. **Given** nenhuma categoria em alerta, **When** dashboard carrega, **Then** badge mostra zero ou fica oculto conforme regra de UX definida.

## Edge Cases

- Categoria sem orçamento definido deve continuar funcional sem barra/alerta.
- Orçamento com valor zero ou negativo deve ser rejeitado por validacao.
- Mes sem despesas para categoria com orçamento deve mostrar consumo zero.
- Categoria deletada com orçamento nao deve deixar lixo de alerta no dashboard.
- Receitas associadas a categoria nao entram no calculo de consumo do orçamento.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001 [Modelo de Categoria]**: categoria MUST suportar campo opcional de orçamento mensal para despesas.
- **FR-002 [Persistencia]**: sistema MUST persistir orçamento mensal por categoria no backend (Core/Infrastructure/API) mantendo compatibilidade com categorias existentes sem orçamento.
- **FR-003 [API Categorias]**: endpoints de criar/listar/atualizar categoria MUST aceitar e retornar o campo de orçamento mensal.
- **FR-004 [Modal Integrado]**: `CategoryManagerModal.jsx` MUST permitir criar, editar e limpar orçamento mensal no fluxo existente de categorias.
- **FR-005 [Calculo de Consumo]**: dashboard MUST calcular consumo de orçamento por categoria usando apenas despesas do mes atual e do usuario autenticado.
- **FR-006 [Regra de Alerta]**: sistema MUST classificar estado da categoria por faixas: normal (<80%), atencao (>=80% e <100%), estourado (>=100%).
- **FR-007 [Visual no Dashboard]**: dashboard MUST exibir progresso visual por categoria com codificacao de cor para os estados de alerta.
- **FR-008 [Badge de Alerta]**: dashboard MUST exibir indicador agregado com quantidade de categorias em alerta (>=80%).
- **FR-009 [Sem Orçamento]**: categorias sem orçamento MUST nao disparar alerta nem afetar contador agregado.
- **FR-010 [Escopo de Alertas]**: alertas MUST considerar apenas despesas; receitas estao fora de escopo.
- **FR-011 [Sem Nova Tela]**: implementacao MUST permanecer integrada ao dashboard e ao modal de categorias existentes, sem criar nova rota.
- **FR-012 [Compatibilidade]**: base atual de categorias MUST continuar operando sem migração manual de dados pelo usuario.

### Constitution Alignment _(mandatory)_

- **CA-001 (Princípio I - Bounded Architecture)**: regra de orçamento e classificacao de alerta no Core/UseCases; persistencia em Infrastructure; API apenas como fronteira HTTP; renderizacao no client.
- **CA-002 (Princípio II - Security by Default)**: operacoes de categoria devem respeitar isolamento por usuario autenticado e nao expor dados de terceiros.
- **CA-003 (Princípio III - Quality Gates Executáveis)**: alteracoes MUST passar por `dotnet build`, `dotnet test`, `cd client && npm run lint`, `cd client && npm run build`, `cd client && npm test`.
- **CA-004 (Princípio IV - Data Integrity)**: valor de orçamento MUST usar tipo monetario preciso (decimal/numeric) e validacoes de dominio para evitar estados invalidos.
- **CA-005 (Princípio V - Operability e Observabilidade Segura)**: erros de validacao e persistencia de orçamento devem retornar respostas acionaveis sem PII.

### Key Entities _(include if feature involves data)_

- **OrcamentoCategoriaMensal**: valor opcional de teto mensal associado a uma categoria.
- **ConsumoCategoriaMesAtual**: total de despesas da categoria no mes corrente para comparacao com orçamento.
- **EstadoAlertaCategoria**: classificacao de risco (`Normal`, `Atencao`, `Estourado`) derivada da razao consumo/orçamento.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: usuario consegue configurar orçamento mensal em 100% das categorias editaveis via `CategoryManagerModal`.
- **SC-002**: 100% das categorias com consumo >=80% exibem estado visual de alerta no dashboard.
- **SC-003**: 100% das categorias com consumo >=100% exibem estado estourado no dashboard.
- **SC-004**: contador agregado de alertas reflete corretamente o numero de categorias em >=80% no mes atual.
- **SC-005**: build, lint e testes do escopo alterado passam sem regressao.

## Assumptions

- O orçamento e um valor fixo mensal por categoria (sem calendario por mes diferente).
- O calculo usa o mes atual selecionado no dashboard como referencia operacional.
- Categorias globais podem ter comportamento igual as categorias do usuario para orçamento, salvo regra explicita em plan.
- A exibicao de alerta ficara no bloco de categorias do dashboard para evitar nova secao isolada.

## Open Clarification Log

- **CL-001**: definir se categorias globais devem aceitar orçamento por usuario (sobrescrita) ou permanecer sem orçamento customizavel.
- **CL-002**: definir comportamento exato do badge quando total de alerta for zero (mostrar `0` ou ocultar).
