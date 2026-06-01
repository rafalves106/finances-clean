# Tasks: Cartao no Dashboard e Competencia Correta da Fatura

Input: specs/011-cartao-dashboard-competencia-fatura/spec.md
Input: specs/011-cartao-dashboard-competencia-fatura/plan.md

## Ordem de implementacao

1. Dominio e regra de competencia
2. API e contratos de resumo
3. Dashboard e modal de transacao
4. Testes e validacao final

### TASK-01 — Formalizar regra de competencia para novas compras

O que fazer: implementar regra de virada da fatura no dominio/use case de cartao para novas compras, conforme Plan §3 e Plan §4.
Onde: server/Core/UseCases/Cartao/\*
Depende de: Nenhuma
Pode ser paralela com: TASK-02
Reusar: regras e structs do ciclo 010
Complexidade: M
Definition of Done:

- [ ] Regra implementada: ate dia anterior ao fechamento = fatura atual
- [ ] Regra implementada: no dia do fechamento ou apos = fatura proxima
- [ ] Regra aplicada somente para novos lancamentos
- [ ] Build backend passa

### TASK-02 — Garantir persistencia de data real da compra e cartao selecionado

O que fazer: ajustar fluxo de criacao de compra no cartao para persistir data real e cartao associado, conforme Plan §2 e Plan §3.
Onde: server/API/Controllers/Movimentacao/_, server/Infrastructure/Repositories/_
Depende de: Nenhuma
Pode ser paralela com: TASK-01
Reusar: fluxo atual de movimentacoes
Complexidade: M
Definition of Done:

- [ ] Data da movimentacao reflete data real da compra para transacoes de cartao
- [ ] Cartao selecionado e persistido no lancamento
- [ ] Fluxo nao-cartao permanece inalterado
- [ ] Build backend passa

### TASK-03 — Expor resumo operacional de cartao para dashboard

O que fazer: expor endpoint/DTO com fatura atual/proxima, limites e dias de ciclo para consumo do dashboard, conforme Plan §2.
Onde: server/API/Controllers/Cartao/CartaoController.cs, server/Core/UseCases/Cartao/\*
Depende de: TASK-01, TASK-02
Pode ser paralela com: Nenhuma
Reusar: modulo cartao do ciclo 010
Complexidade: M
Definition of Done:

- [ ] Endpoint retorna todos os campos mandatarios do card
- [ ] Erros de cartao inativo/ausente retornam padrao definido
- [ ] Sem dados sensiveis reais no payload
- [ ] Build backend passa

### TASK-04 — Renderizar card de cartao no dashboard com estado vazio guiado

O que fazer: adicionar card de cartao no dashboard com indicadores e estado vazio orientativo, conforme Plan §2 e Plan §7.
Onde: client/src/components/DashboardView.jsx
Depende de: TASK-03
Pode ser paralela com: TASK-05
Reusar: padrao visual de cards existente
Complexidade: M
Definition of Done:

- [ ] Card mostra fatura atual/proxima, limite total/usado/disponivel, fechamento e vencimento
- [ ] Estado vazio orienta abrir tela de gestao quando nao houver cartao ativo
- [ ] Layout permanece legivel sem sobrecarga visual
- [ ] cd client && npm run lint passa
- [ ] cd client && npm run build passa

### TASK-05 — Implementar acoes rapidas de cartao no dashboard

O que fazer: adicionar atalhos de nova compra no cartao e abrir gestao dedicada, conforme Plan §3.
Onde: client/src/components/DashboardView.jsx, client/src/App.jsx
Depende de: TASK-03
Pode ser paralela com: TASK-04
Reusar: navegacao e gatilhos de modal existentes
Complexidade: S
Definition of Done:

- [ ] Acao rapida de nova compra abre modal com contexto de cartao
- [ ] Acao rapida de gerir cartao abre tela dedicada
- [ ] Nenhuma regressao em navegacao existente
- [ ] cd client && npm run lint passa
- [ ] cd client && npm run build passa

### TASK-06 — Ajustar TransactionModal para copy e validacao da data real

O que fazer: reforcar UX no modal para diferenciar data de compra e vencimento, com validacao de entrada, conforme Plan §7.
Onde: client/src/components/TransactionModal.jsx
Depende de: TASK-05
Pode ser paralela com: Nenhuma
Reusar: validacoes atuais do modal
Complexidade: M
Definition of Done:

- [ ] Copy explicativa sobre data real da compra visivel em contexto cartao
- [ ] Validacao bloqueia submissao sem data de compra valida em compra de cartao
- [ ] Fluxo nao-cartao nao herda validacoes indevidas
- [ ] cd client && npm run lint passa
- [ ] cd client && npm run build passa

### TASK-07 — Testes automatizados de competencia e regressao

O que fazer: cobrir cenarios de virada de competencia e regressao de fluxo nao-cartao, conforme Plan §7 e estrategia de validacao.
Onde: client/src/components/*.test.jsx, server/*tests\* (se existente)
Depende de: TASK-01, TASK-02, TASK-03, TASK-04, TASK-05, TASK-06
Pode ser paralela com: Nenhuma
Reusar: infraestrutura vitest e padroes existentes
Complexidade: M
Definition of Done:

- [ ] Cenario compra antes do fechamento cai na fatura atual
- [ ] Cenario compra no dia do fechamento cai na fatura proxima
- [ ] Cenario compra apos fechamento cai na fatura proxima
- [ ] Cenario historico antigo permanece sem reprocessamento
- [ ] Cenario fluxo nao-cartao permanece funcional
- [ ] cd client && npm test passa
- [ ] Build backend passa

### TASK-08 — Gate funcional final e decisao go/no-go

O que fazer: executar checklist manual do dashboard e da regra de virada para registrar decisao final, conforme Plan Criterio Go/No-Go.
Onde: specs/011-cartao-dashboard-competencia-fatura/
Depende de: TASK-07
Pode ser paralela com: Nenhuma
Reusar: criterios do spec/plan
Complexidade: S
Definition of Done:

- [ ] Checklist funcional preenchido e aprovado
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

## Checklist de validacao funcional

1. Dashboard - Card de cartao
1. Validar exibicao de fatura atual/proxima.
1. Validar exibicao de limite total, usado e disponivel.
1. Validar exibicao de dia de fechamento e vencimento.
1. Validar estado vazio guiado sem cartao ativo.

1. Dashboard - Acoes rapidas
1. Acao de nova compra abre modal no contexto cartao.
1. Acao de gestao abre tela dedicada sem erro.

1. Competencia de fatura
1. Compra com data ate dia anterior ao fechamento cai na fatura atual.
1. Compra no dia do fechamento cai na proxima fatura.
1. Compra apos fechamento cai na proxima fatura.
1. Data da compra persistida como data real da movimentacao.

1. Escopo e compatibilidade
1. Confirmar que historico antigo nao foi reprocessado.
1. Confirmar que fluxo nao-cartao segue funcional.
1. Confirmar ausencia de integracao bancaria e de dados sensiveis reais.

## Criterio Go/No-Go

Go:

1. Card de cartao e acoes rapidas aprovados no dashboard.
2. Regra de virada validada em todos os cenarios principais.
3. Historico antigo mantido sem migracao.
4. Fluxo nao-cartao sem regressao.
5. Quality gates obrigatorios aprovados.

No-Go:

1. Qualquer cenario de virada com competencia incorreta.
2. Qualquer regressao bloqueante no fluxo nao-cartao.
3. Qualquer tentativa de migracao de historico fora de escopo.
4. Qualquer falha de quality gates sem mitigacao aprovada.
