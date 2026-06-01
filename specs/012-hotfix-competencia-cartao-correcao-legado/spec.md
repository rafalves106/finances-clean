# Feature Specification: Hotfix de Competencia do Cartao e Correcao Segura do Legado

Feature Branch: 012-hotfix-competencia-cartao-correcao-legado
Created: 2026-06-01
Status: Draft
Input: docs/briefings/hotfix-competencia-cartao-e-correcao-legado.md

## §0 Contexto de Negocio

- Persona: PO/usuario unico validando operacao real.
- Dor real:
  - compras novas podem cair em fatura incorreta em ciclos que cruzam meses.
  - legado possui compras de cartao com data de vencimento indevidamente no campo de data.
- Valor entregue:
  - competencia correta em todos os ciclos validos (incluindo fechamento 29 e vencimento 5).
  - correcao de legado segura, auditavel e com preview obrigatorio antes da aplicacao.
- KPIs:
  - compra no cartao entra sempre na fatura correta.
  - ciclo cruzando meses suportado sem bloqueio indevido.
  - backfill atua so em cartao marcado e com preview previo.
  - zero ajuste automatico para caso ambiguo.
- Restricoes:
  - sem aplicacao automatica sem preview.
  - sem reprocessar lancamentos nao-cartao.
  - parser restrito aos formatos 07/05 e 07-05.

## User Scenarios and Testing

### User Story 1 - Competencia correta em ciclo cruzando meses (Priority: P1)

Como usuario, quero que a competencia da compra no cartao seja calculada corretamente mesmo quando fechamento e vencimento estao em meses diferentes.

Why this priority: corrige erro funcional central da fatura.

Independent Test: criar compras em datas de borda com cartao fechamento 29 e vencimento 5 e validar fatura resultante.

Acceptance Scenarios:

1. Given cartao com fechamento 29 e vencimento 5, When compra ocorre no dia 28, Then compra entra na fatura atual.
2. Given cartao com fechamento 29 e vencimento 5, When compra ocorre no dia 29, Then compra entra na proxima fatura.
3. Given cartao com fechamento 29 e vencimento 5, When compra ocorre no dia 2 do mes seguinte, Then compra permanece na fatura definida pelo ciclo vigente.

### User Story 2 - Validacao de ciclo por janela e nao por comparacao fixa (Priority: P1)

Como usuario, quero cadastrar combinacoes validas de fechamento/vencimento que cruzam mes, sem bloqueio indevido.

Why this priority: evita impedir configuracoes reais de cartao.

Independent Test: tentar salvar cartao com fechamento maior que vencimento e validar aceitacao quando ciclo for valido.

Acceptance Scenarios:

1. Given fechamento 29 e vencimento 5, When usuario salva configuracao, Then sistema aceita ciclo como valido.
2. Given configuracao estruturalmente invalida (dia fora de 1..31), When usuario salva, Then sistema rejeita com erro de validacao.

### User Story 3 - Backfill seguro de legado com preview obrigatorio (Priority: P1)

Como usuario, quero executar correcao de legado com relatorio previo para aplicar ajustes apenas quando ha confianca na data extraida.

Why this priority: reduz risco de erro em lote.

Independent Test: rodar preview em base de exemplo e validar contagens por status antes de aplicar.

Acceptance Scenarios:

1. Given lancamentos legados marcados como cartao, When preview roda, Then relatorio separa aplicavel, ambiguo e ignorado.
2. Given preview concluido, When comando de aplicacao roda, Then apenas registros classificados como aplicavel sao alterados.
3. Given descricao ambigua/invalida, When parser avalia, Then registro e ignorado e fica para ajuste manual.

### User Story 4 - Parser restrito aos formatos acordados (Priority: P2)

Como usuario, quero parser conservador para evitar inferencias agressivas no legado.

Why this priority: protege integridade do historico.

Independent Test: validar extracao apenas para descricoes com data em 07/05 e 07-05.

Acceptance Scenarios:

1. Given descricao contendo data no formato 07/05, When parser executa, Then data e extraida com sucesso.
2. Given descricao contendo data no formato 07-05, When parser executa, Then data e extraida com sucesso.
3. Given descricao com formato diferente, When parser executa, Then registro fica ignorado sem alteracao automatica.

## Edge Cases

- Compra no dia de fechamento sempre vira proxima fatura, mesmo em virada de mes.
- Fevereiro (28/29 dias) deve manter regra deterministica do ciclo.
- Descricao com multiplas datas no formato valido deve ser classificada como ambigua e ignorada.
- Lancamento de cartao sem descricao com data valida nao deve ser alterado automaticamente.

## Requirements

### Functional Requirements

- FR-001: sistema MUST calcular competencia por ciclo de cartao, suportando combinacoes validas que cruzam meses (ex.: fechamento 29, vencimento 5).
- FR-002: sistema MUST manter regra de virada: compra no dia do fechamento ou apos entra na proxima fatura.
- FR-003: sistema MUST aceitar configuracoes de ciclo validas sem bloquear casos em que fechamento > vencimento.
- FR-004: sistema MUST executar correcao de legado apenas para lancamentos marcados como cartao.
- FR-005: sistema MUST exigir etapa de preview com relatorio antes de qualquer aplicacao de backfill.
- FR-006: sistema MUST classificar registros do preview em aplicavel, ambiguo e ignorado.
- FR-007: sistema MUST aplicar ajuste apenas em registros classificados como aplicavel.
- FR-008: sistema MUST ignorar automaticamente casos ambiguos/invalidos para ajuste manual posterior.
- FR-009: sistema MUST limitar parser de data da descricao aos formatos dd/MM e dd-MM.
- FR-010: sistema MUST impedir correcao automatica de lancamentos nao-cartao.
- FR-011: sistema MUST manter fluxo de movimentacao nao-cartao sem regressao funcional.
- FR-012: sistema MUST manter trilha auditavel da execucao de preview e aplicacao (contagens, timestamp, operador).

### Non-Functional Requirements

- NFR-001: processo de backfill MUST ser reversivel via plano de rollback.
- NFR-002: operacao de preview SHOULD concluir com relatorio claro e reproducivel para o mesmo snapshot de dados.
- NFR-003: APIs e logs MUST evitar exposicao de dados sensiveis.

### Constitution Alignment

- CA-001 (Bounded Architecture): regra de competencia e parser no Core/UseCases; persistencia em Infrastructure; acionamento em API.
- CA-002 (Security by Default): sem integracao bancaria e sem dados sensiveis reais de cartao.
- CA-003 (Quality Gates Executaveis): build backend + lint/build/test frontend para escopo impactado.
- CA-004 (Data Integrity): competencia e backfill deterministico, com auditoria e rollback.
- CA-005 (Operability): preview e aplicacao com status acionaveis e erros claros.

## Key Entities

- RegraCompetenciaCartao:
  - cartaoId
  - diaFechamento
  - diaVencimento
  - dataCompra
  - competenciaCalculada
- BackfillPreviewItem:
  - movimentacaoId
  - cartaoId
  - descricaoOriginal
  - dataExtraida
  - status (aplicavel|ambiguo|ignorado)
  - motivoStatus
- BackfillExecutionAudit:
  - executionId
  - modo (preview|apply)
  - executedAtUtc
  - executedBy
  - totalAnalisado
  - totalAplicavel
  - totalAmbiguo
  - totalIgnorado

## Success Criteria

- SC-001: competencia de compra no cartao correta nos cenarios de borda, incluindo fechamento 29/vencimento 5.
- SC-002: preview do backfill apresenta contagem por status antes da aplicacao.
- SC-003: aplicacao altera somente registros aplicaveis e nao-cartao permanece intacto.
- SC-004: casos ambiguos ficam sem alteracao automatica.
- SC-005: evidencias de auditoria e rollback disponiveis para execucao.

## Assumptions

- modulo de cartao do ciclo 011 existe como base para hotfix.
- descricoes legadas relevantes usam majoritariamente dd/MM e dd-MM.

## Out of Scope

- Correcao de lancamentos nao-cartao.
- Aplicacao sem preview.
- Parser com heuristicas fora dos formatos acordados.
