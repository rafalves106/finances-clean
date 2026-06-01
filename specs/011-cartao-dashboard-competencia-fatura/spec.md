# Feature Specification: Cartao no Dashboard e Competencia Correta da Fatura

Feature Branch: 011-cartao-dashboard-competencia-fatura
Created: 2026-06-01
Status: Draft
Input: docs/briefings/cartao-no-dashboard-e-competencia-fatura.md

## §0 Contexto de Negocio

- Persona: PO/usuario unico atual, preparando experiencia para futuros usuarios.
- Dor real:
  - cartao sem visibilidade operacional no dashboard.
  - compras de cartao com data distorcida por uso indevido de vencimento, causando deslocamento de competencia.
- Valor entregue:
  - leitura imediata de saude do cartao no dashboard.
  - regra de competencia correta para novas compras, sem empurrar despesa indevidamente.
- KPIs:
  - cartao visivel no dashboard com dados de decisao rapida.
  - novas compras respeitando competencia sem efeito +1 mes.
  - reducao de retrabalho manual para acompanhar fatura.
- Restricoes:
  - sem integracao bancaria/open finance.
  - sem migracao/reprocessamento de historico antigo.
  - sem quebrar fluxo de movimentacoes nao-cartao.
  - manter gestao completa do cartao em tela separada.

## User Scenarios and Testing

### User Story 1 - Card de cartao no dashboard com leitura rapida (Priority: P1)

Como usuario, quero ver um resumo do cartao no dashboard para decidir rapidamente sem abrir a tela dedicada.

Why this priority: gera valor diario imediato de acompanhamento.

Independent Test: abrir dashboard com cartao cadastrado e validar exibicao de indicadores principais.

Acceptance Scenarios:

1. Given cartao ativo cadastrado, When dashboard carrega, Then card de cartao exibe fatura atual, fatura proxima, limite total, usado, disponivel, fechamento e vencimento.
2. Given card de cartao no dashboard, When usuario visualiza o bloco, Then leitura e objetiva e sem poluir layout.
3. Given ausencia de cartao ativo, When dashboard carrega, Then estado vazio guiado orienta abrir tela de gestao de cartao.

### User Story 2 - Acoes rapidas de cartao no dashboard (Priority: P1)

Como usuario, quero atalhos de acao no card de cartao para reduzir cliques em tarefas recorrentes.

Why this priority: reduz friccao operacional mantendo tela dedicada para gestao completa.

Independent Test: usar acoes rapidas no dashboard e validar abertura dos fluxos corretos.

Acceptance Scenarios:

1. Given card de cartao exibido, When usuario clica em acao rapida de nova compra, Then modal de transacao abre preconfigurado para cartao.
2. Given card de cartao exibido, When usuario clica em acao de gerir cartao, Then navegacao para tela dedicada ocorre sem erro.

### User Story 3 - Competencia correta para novas compras de cartao (Priority: P1)

Como usuario, quero que compra de cartao respeite data real da compra e regra de virada para fatura correta.

Why this priority: elimina distorcao mensal e melhora confiabilidade financeira.

Independent Test: registrar compras em datas de corte e validar competencia de fatura resultante.

Acceptance Scenarios:

1. Given compra no cartao com data real anterior ao fechamento, When sistema calcula competencia, Then compra entra na fatura atual.
2. Given compra no cartao com data real no dia do fechamento ou apos, When sistema calcula competencia, Then compra entra na fatura proxima.
3. Given novas compras de cartao, When persistidas, Then data da movimentacao representa data real da compra e nao data de vencimento.

### User Story 4 - Escopo de aplicacao sem retroprocessamento (Priority: P2)

Como usuario, quero que a correcao valha para novas compras sem alterar historico antigo para evitar efeitos colaterais.

Why this priority: reduz risco de regressao e respeita limite de ciclo.

Independent Test: validar que apenas novos lancamentos usam regra nova e historico antigo permanece intacto.

Acceptance Scenarios:

1. Given lancamentos antigos existentes, When nova versao e implantada, Then historico nao e recalculado automaticamente.
2. Given novo lancamento de compra no cartao, When salvo, Then aplica regra nova de competencia.

## Edge Cases

- Compra no ultimo dia do mes com fechamento no dia seguinte deve calcular competencia correta sem deslocamento indevido.
- Meses curtos (28/29/30 dias) devem manter regra consistente de fechamento e vencimento.
- Modal de transacao aberto por acao rapida de cartao nao pode forcar comportamento cartao para transacoes nao-cartao.
- Ausencia de cartao ativo deve impedir marcacao de compra em cartao com orientacao clara de proxima acao.

## Requirements

### Functional Requirements

- FR-001: sistema MUST exibir no dashboard um card de cartao com fatura atual, fatura proxima, limite total, limite usado, limite disponivel, dia de fechamento e dia de vencimento.
- FR-002: sistema MUST exibir estado vazio guiado no dashboard quando nao houver cartao ativo.
- FR-003: sistema MUST oferecer acoes rapidas no card de cartao para nova compra e acesso a tela dedicada de gestao.
- FR-004: sistema MUST registrar compra no cartao com data real da compra como data da movimentacao.
- FR-005: sistema MUST associar cada nova compra de cartao ao cartao selecionado no momento do lancamento.
- FR-006: sistema MUST calcular competencia com regra de virada: compra ate o dia anterior ao fechamento entra na fatura atual; compra no dia do fechamento ou apos entra na proxima fatura.
- FR-007: sistema MUST aplicar a regra nova apenas para novos lancamentos, sem reprocessar historico antigo.
- FR-008: sistema MUST manter compatibilidade do fluxo de movimentacoes nao-cartao sem regressao funcional.
- FR-009: sistema MUST manter tela dedicada de gestao de cartao como origem da manutencao completa.
- FR-010: sistema MUST bloquear campos sensiveis reais de cartao e manter modulo sem integracao bancaria.

### Non-Functional Requirements

- NFR-001: renderizacao do card de cartao no dashboard SHOULD manter fluidez da tela e nao degradar experiencia percebida.
- NFR-002: componentes novos MUST manter responsividade desktop/mobile.
- NFR-003: componentes novos MUST manter acessibilidade minima (foco, label, contraste).

### Constitution Alignment

- CA-001 (Bounded Architecture): regra de competencia no Core, persistencia em Infrastructure, exibicao no client/API.
- CA-002 (Security by Default): sem dados sensiveis reais de cartao e sem alteracao de auth.
- CA-003 (Quality Gates Executaveis): alteracoes devem passar build backend e lint/build/test frontend.
- CA-004 (Data Integrity): data real de compra e competencia calculada de forma deterministica.
- CA-005 (Operability): erros/estados vazios orientam usuario para fluxo correto.

## Key Entities

- ResumoCartaoDashboard:
  - cartaoId
  - faturaAtual
  - faturaProxima
  - limiteTotal
  - limiteUsado
  - limiteDisponivel
  - diaFechamento
  - diaVencimento
- CompraCartaoNova:
  - movimentacaoId
  - cartaoId
  - dataCompraReal
  - competenciaFatura
  - valor

## Success Criteria

- SC-001: dashboard exibe card de cartao com todos os indicadores esperados em conta com cartao ativo.
- SC-002: compras novas nao sofrem deslocamento indevido de competencia para +1 mes.
- SC-003: fluxo nao-cartao segue funcionando sem regressao.
- SC-004: historico antigo nao e migrado/recalculado automaticamente.
- SC-005: quality gates aplicaveis ficam verdes antes do go-live.

## Assumptions

- modulo de cartao do ciclo 010 existe como base para evolucao.
- historico legado pode manter inconsistencia antiga sem impactar o MVP desta evolucao.

## Out of Scope

- Integracao bancaria/open finance.
- Reprocessamento de historico antigo.
- Redesign amplo fora do contexto dashboard/cartao.
