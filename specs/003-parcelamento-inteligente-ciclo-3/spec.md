# Feature Specification: Parcelamento Inteligente com Numeracao Automatica (Ciclo 3)

**Feature Branch**: `003-parcelamento-inteligente-ciclo-3`
**Created**: 2026-05-25
**Status**: Draft
**Input**: `docs/briefings/parcelamento-inteligente-ciclo-3.md`

## §0 Contexto de Negócio

- **Persona**: Rafael (unico dev/PO/usuario), uso diario em desktop.
- **Dor real**: compras parceladas sao criadas em lote, mas sem numeracao no titulo, exigindo edicao manual e aumentando chance de erro.
- **Valor entregue**: ao criar movimentacao parcelada, o sistema gera automaticamente titulos `1/N ... N/N`; recorrente fixa permanece sem numeracao.
- **KPIs de sucesso**:
  - 100% das parcelas criadas com sufixo `{i}/{N}` para tipo Parcelada.
  - 100% das recorrentes fixas sem sufixo automatico.
  - retroativo: renumeracao de grupo existente funcionando via UI.
  - `dotnet test` e `npm test` sem regressao.
- **Restricoes**:
  - backend .NET 10 com arquitetura atual (Core/Infrastructure/API).
  - frontend React 19 + Tailwind 4.
  - sem breaking change para clientes existentes.
  - migration com default seguro `RecorrenteFixa`.

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Criacao de parcelado com numeracao automatica (Priority: P1)

Como usuario, Rafael quer cadastrar uma compra parcelada e receber todas as parcelas com numeracao automatica no titulo, sem editar item por item.

**Why this priority**: resolve a dor principal e remove trabalho manual repetitivo.

**Independent Test**: criar movimentacao fixa do tipo Parcelada com periodo N e verificar N registros com sufixo `1/N ... N/N`.

**Acceptance Scenarios**:

1. **Given** uma nova movimentacao `Fixa=true`, tipo `Parcelada`, periodo `N`, **When** o cadastro e salvo, **Then** sao geradas `N` ocorrencias com titulo base + sufixo `{i}/{N}`.
2. **Given** tipo `RecorrenteFixa`, **When** o cadastro e salvo, **Then** comportamento atual e preservado sem numeracao.

---

### User Story 2 - Renumeracao retroativa de grupos existentes (Priority: P2)

Como usuario, Rafael quer renumerar um grupo de recorrencia ja existente para corrigir historico sem inferencia automatica arriscada.

**Why this priority**: viabiliza migracao de dados legados com controle explicito do usuario.

**Independent Test**: acionar endpoint de renumeracao por `grupoRecorrenciaId` e verificar normalizacao do titulo base + reaplicacao ordenada.

**Acceptance Scenarios**:

1. **Given** um grupo legado com sufixos inconsistentes/manuais, **When** a renumeracao e executada, **Then** os titulos ficam normalizados em ordem cronologica `1/N ... N/N`.
2. **Given** grupo inexistente, **When** a renumeracao e solicitada, **Then** sistema retorna erro de dominio apropriado sem efeito colateral.

---

### User Story 3 - Distincao explicita no frontend (Priority: P3)

Como usuario, Rafael quer selecionar claramente se a movimentacao fixa e `Parcelada` ou `Recorrente Fixa` durante o cadastro.

**Why this priority**: evita ambiguidade semantica do modelo atual (`Fixa + Periodo` apenas).

**Independent Test**: validar no modal de transacao a presenca do toggle/radio e payload correto enviado.

**Acceptance Scenarios**:

1. **Given** `Fixa=true` no modal, **When** o usuario escolhe `Parcelada` ou `Recorrente Fixa`, **Then** o payload inclui `TipoMovimentacaoFixa` correto.
2. **Given** listagem de movimentacoes com grupo recorrente, **When** usuario solicita renumerar, **Then** a UI dispara o endpoint e exibe resultado.

## Edge Cases

- Titulos legados com sufixo parcial/manual (ex.: `Bateria 2/12`) devem ser normalizados removendo `\d+/\d+` terminal antes de reaplicar.
- Periodo invalido (`<=0`) para parcelado deve falhar validacao de dominio/fronteira.
- Grupo com itens fora de ordem de criacao deve ser renumerado por data (e desempate deterministico por id).

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001 [Dominio]**: adicionar enum `TipoMovimentacaoFixa` com valores `Parcelada` e `RecorrenteFixa`.
- **FR-002 [Modelo]**: `Movimentacao` MUST possuir propriedade `TipoMovimentacaoFixa` persistida, com default `RecorrenteFixa` para historico existente.
- **FR-003 [Criacao]**: `CriarMovimentacaoUseCase` MUST gerar sufixo `{i+1}/{N}` no titulo quando `Fixa=true` e `TipoMovimentacaoFixa=Parcelada`.
- **FR-004 [Compatibilidade]**: para `TipoMovimentacaoFixa=RecorrenteFixa`, MUST manter comportamento atual sem numeracao.
- **FR-005 [Migration]**: migration MUST adicionar coluna nova com default seguro `RecorrenteFixa` sem quebrar dados atuais.
- **FR-006 [Retroativo]**: sistema MUST expor caso de uso/endpoint para renumerar grupo por `grupoRecorrenciaId`.
- **FR-007 [Normalizacao]**: renumeracao MUST normalizar titulo base removendo sufixo `\d+/\d+` terminal antes de reaplicar sequencia.
- **FR-008 [Frontend Modal]**: `TransactionModal.jsx` MUST exibir controle `Parcelada/Recorrente Fixa` quando `Fixa=true`.
- **FR-009 [Frontend Renumerar]**: frontend MUST oferecer acao para renumerar grupo existente na listagem de movimentacoes.
- **FR-010 [Testes]**: ciclo MUST incluir validacao automatizada/manual de criacao parcelada, recorrente fixa e renumeracao retroativa.

### Constitution Alignment _(mandatory)_

- **CA-001 (Princípio I - Bounded Architecture)**: enum e regra de numeracao no dominio/use case; persistencia em Infrastructure; endpoint em API; UI no client.
- **CA-002 (Princípio II - Security by Default)**: endpoint de renumeracao segue autenticacao/autorizacao existente e isolamento por usuario.
- **CA-003 (Princípio III - Quality Gates Executáveis)**: execucao de `dotnet test`, `npm run lint`, `npm run build`, `npm test` no escopo alterado.
- **CA-004 (Princípio IV - Data Integrity)**: migration com default seguro e renumeracao deterministica sem perda de registros.
- **CA-005 (Princípio V - Operability/Observability)**: erros de renumeracao e resultados devem ser rastreaveis por respostas/telemetria sem expor dados sensiveis.

### Key Entities

- **TipoMovimentacaoFixa**: enum semantico do tipo de fixacao (`Parcelada | RecorrenteFixa`).
- **GrupoRecorrencia**: agrupador de ocorrencias fixas via `GrupoRecorrenciaId`.
- **RenumeracaoGrupoResultado**: resultado da operacao de renumeracao (grupo, total afetado, status).

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: 100% das movimentacoes criadas como Parcelada recebem sufixo correto `1/N..N/N`.
- **SC-002**: 100% das movimentacoes RecorrenteFixa novas permanecem sem numeracao.
- **SC-003**: renumeracao retroativa atualiza 100% dos itens do grupo alvo em ordem cronologica.
- **SC-004**: migration aplica sem erro e sem quebra de historico existente.
- **SC-005**: `dotnet test` e `npm test` passam apos alteracoes.

## Assumptions

- Base legada com `Fixa=true` sera classificada inicialmente como `RecorrenteFixa`.
- Usuario decide explicitamente quais grupos legados devem ser renumerados.
- Nao ha necessidade de parcelamento com valores diferentes neste ciclo.
