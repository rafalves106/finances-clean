# Tasks: Cartao Visualizador sem Integracao Bancaria

Changelog breve (2026-06-01):

- regra de 1 cartao ativo por usuario explicitada nas tarefas e DoD.
- manutencao minima (editar/inativar) incorporada em API, frontend e testes.
- validacao obrigatoria diaFechamento < diaVencimento adicionada a implementacao e testes.

Input: specs/010-cartao-visualizador-sem-integracao/spec.md
Input: specs/010-cartao-visualizador-sem-integracao/plan.md

## Ordem de implementacao

1. Data e dominio
2. Infraestrutura e persistencia
3. API
4. Frontend
5. Validacao final

### TASK-01 — Criar entidade de dominio de cartao manual

O que fazer: criar entidade CartaoManual com regras basicas de invariantes e campos do MVP, conforme Plan §2 e Plan §4.
Onde: server/Core/Domain/Cartao/CartaoManual.cs
Depende de: Nenhuma
Pode ser paralela com: TASK-02
Reusar: padrao de entidades existentes em server/Core/Domain
Complexidade: S
Definition of Done:

- [ ] Entidade possui apenas campos permitidos (sem dados sensiveis reais)
- [ ] Validacoes de limite/dias implementadas no dominio, incluindo diaFechamento < diaVencimento
- [ ] Sem dependencia de bibliotecas de Infrastructure
- [ ] Build backend passa

### TASK-02 — Criar portas de repositorio e contratos de use case

O que fazer: adicionar interface ICartaoRepository e contratos de casos de uso para cadastro, consulta, edicao, inativacao de cartao, limite e previsao de fatura, conforme Plan §2 e Plan §3.
Onde: server/Core/Repositories/ICartaoRepository.cs, server/Core/UseCases/Cartao/\*
Depende de: Nenhuma
Pode ser paralela com: TASK-01
Reusar: convencoes de interfaces e use cases existentes no Core
Complexidade: M
Definition of Done:

- [ ] Interfaces cobrem operacoes necessarias do MVP, incluindo editar/inativar
- [ ] Contratos de entrada/saida dos use cases definidos
- [ ] Sem quebra de arquitetura limpa
- [ ] Build backend passa

### TASK-03 — Implementar mapeamento EF e migration reversivel

O que fazer: mapear CartaoManual e vinculo com movimentacao no EF Core e gerar migration com rollback testado, conforme Plan §2 e Estrategia de migracao.
Onde: server/Infrastructure/Data/Configurations/_, server/Infrastructure/Migrations/_
Depende de: TASK-01, TASK-02
Pode ser paralela com: Nenhuma
Reusar: padroes de configuracao EF e migrations existentes
Complexidade: M
Definition of Done:

- [ ] Tabela de cartao criada com tipos monetarios numeric/decimal
- [ ] Datas persistidas em UTC
- [ ] Migration aplica e reverte sem erro em ambiente local
- [ ] Build backend passa

### TASK-04 — Implementar repositorio de cartao na Infrastructure

O que fazer: implementar CartaoRepository com operacoes de persistencia e consulta para limite/fatura, conforme Plan §2 e Plan §3.
Onde: server/Infrastructure/Repositories/CartaoRepository.cs
Depende de: TASK-03
Pode ser paralela com: TASK-05
Reusar: padrao dos repositories existentes
Complexidade: M
Definition of Done:

- [ ] Operacoes de cadastro/consulta/edicao/inativacao do cartao MVP implementadas
- [ ] Consultas respeitam isolamento por usuario autenticado
- [ ] Sem logs de dados sensiveis
- [ ] Build backend passa

### TASK-05 — Implementar use cases de cadastro, limite e previsao

O que fazer: implementar regras de negocio para cadastro do cartao, calculo de limite usado/disponivel e previsao de fatura atual/proxima, conforme Plan §3 e Plan §4.
Onde: server/Core/UseCases/Cartao/\*
Depende de: TASK-02, TASK-03
Pode ser paralela com: TASK-04
Reusar: casos de uso e padrao de tratamento de erros existentes
Complexidade: L
Definition of Done:

- [ ] Regras de fechamento/vencimento aplicadas corretamente
- [ ] Regra de 1 cartao ativo por usuario aplicada no cadastro
- [ ] Calculo de fatura atual/proxima validado com datas antes/depois do fechamento
- [ ] Erros de validacao retornam codigos definidos no plan
- [ ] Build backend passa

### TASK-06 — Expor endpoints autenticados do modulo cartao

O que fazer: criar controlador e endpoints para cadastro, edicao, inativacao, consulta de resumo e previsao de fatura do cartao, conforme Plan §2 e Plan §4.
Onde: server/API/Controllers/Cartao/CartaoController.cs
Depende de: TASK-04, TASK-05
Pode ser paralela com: Nenhuma
Reusar: base de AuthenticatedController e convencoes de rotas v1
Complexidade: M
Definition of Done:

- [ ] Endpoints respeitam autenticacao e isolamento por usuario
- [ ] Endpoints de manutencao minima (editar/inativar) expostos e funcionais
- [ ] Payload bloqueia campos sensiveis fora de escopo
- [ ] Codigos HTTP e erros aderentes ao plan
- [ ] Build backend passa

### TASK-07 — Integrar client API e navegacao do modulo

O que fazer: adicionar servicos HTTP do modulo cartao e entrada de navegacao para a tela no app, conforme Plan §2 e Plan §3.
Onde: client/src/services/api.js, client/src/App.jsx
Depende de: TASK-06
Pode ser paralela com: TASK-08
Reusar: padrao de chamadas existentes no api.js
Complexidade: M
Definition of Done:

- [ ] Cliente consome endpoints de cartao com tratamento de erro basico
- [ ] Navegacao para modulo cartao acessivel no fluxo atual
- [ ] Sem regressao nas abas/telas existentes
- [ ] cd client && npm run lint passa
- [ ] cd client && npm run build passa

### TASK-08 — Criar tela CartaoView com estados vazio e resumo

O que fazer: implementar interface de cadastro, edicao, inativacao e visualizacao de limite/fatura com comunicacao explicita de modulo manual, conforme Plan §2, Plan §3 e Plan §7.
Onde: client/src/components/CardViewerView.jsx
Depende de: TASK-07
Pode ser paralela com: TASK-09
Reusar: estilos e padroes de componentes do dashboard
Complexidade: L
Definition of Done:

- [ ] Formulario de cadastro de cartao funcional
- [ ] Fluxo de editar e inativar cartao funcional
- [ ] Blocos de limite usado/disponivel/percentual renderizados
- [ ] Previsao de fatura atual/proxima renderizada
- [ ] Estado vazio guiado e mensagem sem integracao bancaria visiveis
- [ ] cd client && npm run lint passa
- [ ] cd client && npm run build passa

### TASK-09 — Ajustar TransactionModal para vinculo de compra ao cartao

O que fazer: incluir opcao de vincular movimentacao de saida ao cartao ativo no fluxo de cadastro de transacao, conforme Plan §2 e Decisao 2.
Onde: client/src/components/TransactionModal.jsx
Depende de: TASK-07
Pode ser paralela com: TASK-08
Reusar: controles e validacoes existentes de movimentacao
Complexidade: M
Definition of Done:

- [ ] Usuario consegue marcar compra como cartao no modal
- [ ] Vinculo exige cartao ativo e orienta usuario quando cartao estiver inativo/ausente
- [ ] Fluxo de movimentacao nao-cartao permanece intacto
- [ ] Dados enviados nao incluem campos sensiveis proibidos
- [ ] cd client && npm run lint passa
- [ ] cd client && npm run build passa

### TASK-10 — Testes automatizados e regressao do MVP

O que fazer: adicionar testes dos cenarios criticos de regra de fatura e regressao de fluxo principal no frontend/backend, conforme Plan §6 e Plan §7.
Onde: server/_tests_ (se existente), client/src/components/\*.test.jsx
Depende de: TASK-06, TASK-08, TASK-09
Pode ser paralela com: Nenhuma
Reusar: infraestrutura de vitest no client e padrao de testes backend existente no repo
Complexidade: M
Definition of Done:

- [ ] Cenarios de fechamento/vencimento testados
- [ ] Cenario de fechamento >= vencimento bloqueado e coberto por teste
- [ ] Cenario de segundo cartao ativo bloqueado e coberto por teste
- [ ] Cenarios de editar e inativar cartao cobertos por teste
- [ ] Cenario sem lancamentos (estado vazio) testado
- [ ] Cenario de bloqueio de dados sensiveis testado
- [ ] cd client && npm test passa
- [ ] Build backend passa

### TASK-11 — Checklist final e decisao go/no-go do MVP

O que fazer: executar validacao manual completa e consolidar decisao go/no-go com evidencias, conforme Plan Criterio Go/No-Go.
Onde: specs/010-cartao-visualizador-sem-integracao/
Depende de: TASK-10
Pode ser paralela com: Nenhuma
Reusar: roteiro de checklist abaixo
Complexidade: S
Definition of Done:

- [ ] Checklist manual MVP preenchido
- [ ] Evidencias de quality gates anexadas
- [ ] Decisao go/no-go registrada
- [ ] Sem violacao da constitution

## Quality gates obrigatorios

Backend:

1. dotnet build server/Finance.slnx -c Release

Frontend:

1. cd client && npm run lint
2. cd client && npm run build
3. cd client && npm test

## Checklist manual de validacao do MVP

1. Cadastro de cartao
1. Cadastrar cartao com nome, limite, fechamento e vencimento validos.
1. Tentar cadastro invalido e confirmar bloqueio de validacao.
1. Tentar cadastrar segundo cartao ativo e confirmar bloqueio com mensagem clara.
1. Editar cartao ativo e confirmar persistencia.
1. Inativar cartao e confirmar orientacao de proxima acao.

1. Limite e consumo
1. Vincular compras ao cartao e validar limite usado/disponivel.
1. Validar percentual de uso em cenarios 0%, parcial e proximo do limite.

1. Previsao de fatura
1. Criar compra antes do fechamento e confirmar fatura atual.
1. Criar compra apos fechamento e confirmar fatura proxima.
1. Tentar configurar fechamento maior ou igual ao vencimento e confirmar bloqueio.

1. Escopo e seguranca
1. Confirmar mensagem explicita de modulo manual sem banco.
1. Confirmar ausencia de campos sensiveis reais em UI/payload/log.

1. Regressao
1. Validar que movimentacoes nao-cartao continuam funcionando.
1. Validar navegacao principal do app sem quebra.

## Criterio go/no-go do MVP

Go:

1. Todas as funcionalidades P1 e P2 do spec aprovadas em teste manual.
2. Quality gates obrigatorios aprovados.
3. Nenhuma falha critica de integridade de calculo ou seguranca.

No-Go:

1. Divergencia de calculo de limite/fatura em cenario basico.
2. Persistencia/aceitacao de dado sensivel real de cartao.
3. Regressao bloqueante no fluxo de movimentacoes.
