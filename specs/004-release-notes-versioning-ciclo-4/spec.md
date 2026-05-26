# Feature Specification: Versionamento e Release Notes Automaticas (Ciclo 4)

**Feature Branch**: `004-release-notes-versioning-ciclo-4`
**Created**: 2026-05-26
**Status**: Draft
**Input**: `docs/briefings/release-notes-versioning-ciclo-4.md`

## §0 Contexto de Negócio

- **Persona**: Rafael (unico dev, PO e usuario).
- **Dor real**: apos deploy, nao existe sinal visual de nova versao nem resumo do que mudou dentro do app.
- **Valor entregue**: ao abrir app em nova versao, modal exibe release notes da versao atual uma unica vez; versao visivel no sidebar.
- **KPIs de sucesso**:
  - modal aparece automaticamente apenas na primeira abertura de versao nova.
  - modal nao reaparece enquanto versao atual continuar igual.
  - versao atual visivel no rodape do sidebar em telas autenticadas.
  - conteudo vem do `CHANGELOG.md` sem manutencao duplicada.
  - `npm test` permanece verde.
- **Restricoes comerciais e tecnicas**:
  - escopo 100% frontend; sem backend.
  - stack React 19 + Vite 7 + Tailwind 4.
  - sem adicionar bibliotecas.
  - chave localStorage obrigatoria: `finance_last_seen_version`.

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Exibicao automatica de novidades da versao atual (Priority: P1)

Como usuario, Rafael quer ver automaticamente o que mudou quando abrir uma versao nova do app.

**Why this priority**: resolve diretamente a dor central de falta de feedback pos-deploy.

**Independent Test**: com `finance_last_seen_version` diferente de `VITE_APP_VERSION`, modal abre com conteudo da secao da versao atual no changelog.

**Acceptance Scenarios**:

1. **Given** versao do app `0.4.0` e `finance_last_seen_version` ausente/diferente, **When** app autenticado e aberto, **Then** modal abre automaticamente com notas da secao `## [0.4.0]`.
2. **Given** `finance_last_seen_version` igual a `0.4.0`, **When** app autenticado e aberto, **Then** modal nao abre automaticamente.

---

### User Story 2 - Fonte unica de verdade no CHANGELOG (Priority: P1)

Como PO, Rafael quer manter release notes apenas no `CHANGELOG.md`, sem duplicacao manual em JSON/JS.

**Why this priority**: reduz custo operacional e risco de inconsistencias.

**Independent Test**: alterar texto da secao da versao atual no `CHANGELOG.md` e validar refletido no modal apos build.

**Acceptance Scenarios**:

1. **Given** `CHANGELOG.md` com header semver `## [0.4.0]`, **When** app renderiza modal para essa versao, **Then** conteudo e extraido dessa secao.
2. **Given** secao da versao atual inexistente, **When** app abre, **Then** comportamento silencia graciosamente sem quebrar a interface.

---

### User Story 3 - Visibilidade continua da versao em uso (Priority: P2)

Como usuario, Rafael quer ver a versao atual no rodape do sidebar para confirmar rapidamente qual build esta em execucao.

**Why this priority**: melhora suporte operacional e rastreabilidade de feedback.

**Independent Test**: em qualquer aba autenticada, verificar texto de versao exibido no rodape do sidebar.

**Acceptance Scenarios**:

1. **Given** usuario autenticado, **When** qualquer tela principal e exibida, **Then** sidebar mostra versao `v0.4.0` no rodape.

## Edge Cases

- `localStorage` indisponivel (modo privado/restricao): fluxo nao deve quebrar renderizacao do app.
- `CHANGELOG.md` sem secao da versao atual: modal nao abre automaticamente e app segue funcional.
- Conteudo com secoes markdown (`###`) deve ser exibido de forma legivel sem parser externo.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001 [Versioning]**: `CHANGELOG.md` MUST usar headers semver no formato `## [0.X.0]` para ciclos publicados.
- **FR-002 [Versioning]**: `client/package.json` MUST refletir baseline `0.3.0` (ciclo 3) e bump para `0.4.0` neste ciclo.
- **FR-003 [Build]**: `vite.config.js` MUST injetar `VITE_APP_VERSION` via `define` a partir do `client/package.json`.
- **FR-004 [Release Notes Source]**: app MUST importar `CHANGELOG.md` como raw string (`?raw`) e usar essa fonte para renderizar notas.
- **FR-005 [Detection]**: app MUST comparar `import.meta.env.VITE_APP_VERSION` com `localStorage.finance_last_seen_version`.
- **FR-006 [Modal]**: novo `ReleaseNotesModal.jsx` MUST abrir apenas quando versao atual for nova para o usuario.
- **FR-007 [Persistence]**: ao fechar/confirmar modal, app MUST persistir `finance_last_seen_version` com versao atual.
- **FR-008 [Sidebar]**: `App.jsx` MUST exibir versao atual no rodape do sidebar autenticado.
- **FR-009 [Fallback]**: ausencia de secao no changelog para versao atual MUST falhar de forma silenciosa, sem crash.
- **FR-010 [Scope Guard]**: implementacao MUST permanecer frontend-only e sem novas bibliotecas.

### Constitution Alignment _(mandatory)_

- **CA-001 (Princípio I - Bounded Architecture)**: mudancas restritas ao `client/` e `CHANGELOG.md`, sem acoplamento indevido a backend.
- **CA-002 (Princípio II - Security by Default)**: uso de `localStorage` sem dados sensiveis (apenas string de versao).
- **CA-003 (Princípio III - Quality Gates Executáveis)**: executar `cd client && npm run lint`, `cd client && npm run build`, `cd client && npm test`.
- **CA-004 (Princípio V - Operability)**: versao visivel na UI para facilitar diagnostico de suporte.

### Key Entities

- **AppVersion**: valor de versao injetado em build (`import.meta.env.VITE_APP_VERSION`).
- **LastSeenVersion**: valor salvo em `localStorage` com chave `finance_last_seen_version`.
- **CurrentReleaseSection**: trecho do `CHANGELOG.md` correspondente ao header da versao atual.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: modal abre em 100% dos cenarios onde `last_seen != current_version`.
- **SC-002**: modal nao abre em 100% dos cenarios onde `last_seen == current_version`.
- **SC-003**: sidebar exibe versao em 100% das telas autenticadas.
- **SC-004**: parser extrai corretamente secao `## [0.4.0]` sem dependencia externa.
- **SC-005**: `npm run lint`, `npm run build`, `npm test` passam apos alteracoes.

## Assumptions

- A baseline funcional do ciclo 3 e `0.3.0`, mesmo que o arquivo atual esteja divergente.
- `CHANGELOG.md` permanece legivel por humanos no GitHub e no modal.
- Modal sera mostrado apenas para sessoes autenticadas (dentro de `App.jsx`).

## Open Clarification Log

- **CL-001**: estado atual de `client/package.json` esta em `0.0.0`; este ciclo assumira normalizacao para `0.3.0` e bump para `0.4.0` no mesmo conjunto de alteracoes, conforme briefing.
