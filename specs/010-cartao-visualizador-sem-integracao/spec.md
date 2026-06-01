# Feature Specification: Cartao Visualizador sem Integracao Bancaria

Changelog breve (2026-06-01):

- requisito de 1 cartao ativo por usuario promovido para FR explicito.
- manutencao minima do cartao no MVP definida como editar e inativar.
- coerencia entre dia de fechamento e dia de vencimento promovida para validacao funcional obrigatoria.

Feature Branch: 010-cartao-visualizador-sem-integracao
Created: 2026-06-01
Status: Draft
Input: docs/briefings/cartao-visualizador-sem-integracao.md

## §0 Contexto de Negocio

- Persona: PO e usuario unico atual.
- Dor real: necessidade de abrir app bancario para consultar limite, fechamento e vencimento, com retrabalho manual.
- Valor entregue: centralizar organizacao do cartao no app financeiro, sem dependencias bancarias.
- KPI de sucesso:
  - reduzir trabalho manual de consulta externa.
  - permitir consulta de limite e previsao de fatura no proprio app.
  - validar fluxo de previsibilidade em ate 7 dias.
- Restricoes comerciais e tecnicas:
  - prazo maximo de 7 dias (MVP).
  - modulo apenas visualizador interno manual.
  - sem dados sensiveis reais (numero completo, CVV, token).
  - sem processamento de pagamento.

## User Scenarios and Testing

### User Story 1 - Cadastro manual de cartao (Priority: P1)

Como usuario, quero cadastrar manualmente dados basicos do cartao para controlar limite e ciclo de fatura sem depender de banco.

Why this priority: sem cadastro nao existe modulo funcional.

Independent Test: cadastrar um cartao com nome, limite total, dia de fechamento e dia de vencimento e consultar os dados salvos.

Acceptance Scenarios:

1. Given usuario autenticado, When preenche formulario valido, Then cartao e salvo com sucesso.
2. Given formulario invalido (limite <= 0, dias fora do intervalo), When tenta salvar, Then sistema bloqueia com mensagem clara.
3. Given cartao salvo, When reabre modulo, Then dados basicos aparecem de forma consistente.

### User Story 2 - Limite usado, disponivel e percentual (Priority: P1)

Como usuario, quero visualizar consumo do limite no periodo atual para decidir compras com previsibilidade.

Why this priority: entrega valor direto de controle diario.

Independent Test: com lancamentos de cartao no periodo, validar calculo de limite usado, disponivel e percentual.

Acceptance Scenarios:

1. Given limite total e lancamentos de cartao, When dashboard de cartao carrega, Then exibe limite usado e disponivel corretos.
2. Given consumo parcial, When percentual e calculado, Then valor fica entre 0 e 100.
3. Given sem lancamentos, When modulo abre, Then usado e zero e disponivel igual ao limite total.

### User Story 3 - Previsao de fatura atual e proxima (Priority: P2)

Como usuario, quero visualizar previsao da fatura atual e proxima com base nos lancamentos cadastrados para planejar caixa.

Why this priority: previsibilidade e principal ganho de negocio do modulo.

Independent Test: cadastrar lancamentos com datas antes/depois do fechamento e validar agrupamento na fatura correta.

Acceptance Scenarios:

1. Given dia de fechamento configurado, When lancamento ocorre ate o fechamento, Then entra na fatura atual.
2. Given lancamento apos fechamento, When regra de ciclo e aplicada, Then entra na proxima fatura.
3. Given modulo sem dados suficientes, When previsao nao puder ser calculada totalmente, Then estado vazio guiado orienta proxima acao.

### User Story 4 - Comunicacao clara de modulo manual (Priority: P2)

Como usuario, quero mensagens claras de que nao existe sincronizacao bancaria para alinhar expectativa.

Why this priority: evita frustracao e chamados por funcionalidade fora de escopo.

Independent Test: acessar modulo e validar textos de orientacao em onboarding/estado vazio.

Acceptance Scenarios:

1. Given primeiro acesso ao modulo, When tela abre, Then texto informa que dados sao manuais.
2. Given usuario sem lancamentos, When estado vazio aparece, Then CTA orienta cadastrar compra manualmente.

### User Story 5 - Manutencao minima do cartao no MVP (Priority: P1)

Como usuario, quero editar dados basicos do cartao e inativar cartao para manter o controle atualizado sem recriar todo o fluxo.

Why this priority: sem manutencao minima, o modulo perde utilidade apos mudanca de limite/ciclo.

Independent Test: editar limite/dias do cartao ativo e inativar o cartao, validando impacto no visualizador.

Acceptance Scenarios:

1. Given cartao ativo existente, When usuario edita nome, limite, fechamento ou vencimento com dados validos, Then alteracoes sao persistidas.
2. Given cartao ativo existente, When usuario tenta editar com ciclo invalido, Then sistema bloqueia com mensagem clara.
3. Given cartao ativo existente, When usuario inativa cartao, Then cartao deixa de ser o ativo para novos vinculos e tela orienta proxima acao.

## Edge Cases

- Fevereiro e meses de 30 dias devem respeitar normalizacao de datas configuradas.
- Limite total reduzido abaixo do ja utilizado deve gerar alerta, sem apagar historico.
- Exclusao de lancamento de cartao deve recalcular previsoes imediatamente.
- Usuario pode esperar sincronizacao com banco; mensagem de escopo manual deve estar visivel.

## Requirements

### Functional Requirements

- FR-001: sistema MUST permitir cadastro manual de cartao com nome, limite total, dia de fechamento e dia de vencimento.
- FR-002: sistema MUST validar regras de entrada (limite > 0, dia fechamento entre 1 e 31, dia vencimento entre 1 e 31).
- FR-003: sistema MUST exibir limite total, limite utilizado, limite disponivel e percentual de uso no periodo ativo.
- FR-004: sistema MUST permitir marcar movimentacoes como compras de cartao para agrupamento na previsao.
- FR-005: sistema MUST calcular previsao de fatura atual e proxima com base no dia de fechamento.
- FR-006: sistema MUST exibir estado vazio guiado quando nao houver cartao ou lancamentos suficientes.
- FR-007: sistema MUST comunicar explicitamente que o modulo e manual e sem integracao bancaria.
- FR-008: sistema MUST impedir armazenamento de dados sensiveis reais de cartao (numero completo, CVV, token).
- FR-009: sistema MUST funcionar sem alterar fluxos existentes de movimentacoes nao-cartao.
- FR-010: sistema MUST registrar valores monetarios do modulo de cartao com precisao decimal e UTC nas datas persistidas.
- FR-011: sistema MUST permitir no maximo 1 cartao ativo por usuario no MVP de 7 dias.
- FR-012: sistema MUST permitir manutencao minima do cartao no MVP via editar dados basicos e inativar cartao.
- FR-013: sistema MUST validar coerencia de ciclo exigindo diaFechamento menor que diaVencimento.

### Non-Functional Requirements

- NFR-001: tempo de resposta das consultas do modulo de cartao SHOULD permanecer abaixo de 300ms em ambiente local com carga normal.
- NFR-002: telas do modulo MUST ser responsivas em mobile e desktop.
- NFR-003: componentes novos MUST manter acessibilidade minima (foco, label e contraste).

### Constitution Alignment

- CA-001 (Bounded Architecture): dominio de cartao em Core, persistencia em Infrastructure, orquestracao HTTP em API.
- CA-002 (Security by Default): nenhum dado sensivel real de cartao sera coletado ou persistido.
- CA-003 (Quality Gates Executaveis): entregas do MVP devem passar lint, build e testes automatizados aplicaveis.
- CA-004 (Data Integrity): calculos de limite/fatura com decimal e datas UTC.
- CA-005 (Operability): estados de erro e vazio com mensagens acionaveis para operacao manual.

## Key Entities

- CartaoManual:
  - id
  - usuarioId
  - nome
  - limiteTotal
  - diaFechamento
  - diaVencimento
  - ativo
  - createdAtUtc
  - updatedAtUtc
- LancamentoCartaoVinculado:
  - movimentacaoId
  - cartaoId
  - competenciaFatura (AAAAMM)
  - valor

## Success Criteria

- SC-001: usuario consegue cadastrar cartao valido em menos de 1 minuto sem suporte externo.
- SC-002: limite usado/disponivel bate com soma dos lancamentos vinculados no periodo.
- SC-003: previsao de fatura atual e proxima e exibida corretamente para cenarios antes/depois do fechamento.
- SC-004: nenhum dado sensivel real de cartao aparece em payloads, banco ou logs.
- SC-005: quality gates do escopo passam antes do go-live do MVP.
- SC-006: usuario consegue editar e inativar cartao sem regressao do fluxo principal.

## Assumptions

- Reuso do modulo de movimentacoes atual para origem dos lancamentos de cartao.
- Sem necessidade de alterar autenticacao/autorizacao no ciclo.

## Out of Scope

- Integracao bancaria e Open Finance.
- Pagamento de fatura ou conciliacao automatica.
- Armazenamento de numero completo de cartao, CVV ou token.
