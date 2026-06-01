# Tasks: Hotfix de Competencia do Cartao e Correcao Segura do Legado

Input: specs/012-hotfix-competencia-cartao-correcao-legado/spec.md
Input: specs/012-hotfix-competencia-cartao-correcao-legado/plan.md

## Ordem de implementacao

1. Regra de ciclo e competencia
2. Preview de legado
3. Apply seguro e rollback
4. Regressao e validacao final

### TASK-01 — Ajustar validacao de ciclo para suportar meses cruzados

O que fazer: revisar validacoes de cartao para aceitar ciclos validos como fechamento 29 e vencimento 5, sem regra fixa fechamento < vencimento, conforme Plan §3 e Plan §8.
Onde: server/Core/Domain/Cartao/_, server/Core/UseCases/Cartao/_
Depende de: Nenhuma
Pode ser paralela com: TASK-02
Reusar: validacoes do ciclo 010/011
Complexidade: M
Definition of Done:

- [ ] Validacao estrutural considera apenas faixas validas de dia (1..31)
- [ ] Configuracao 29/5 aceita como valida
- [ ] Nenhuma regressao nas validacoes atuais de cartao
- [ ] Build backend passa

### TASK-02 — Corrigir calculo de competencia por janela de ciclo

O que fazer: implementar algoritmo deterministico de competencia para ciclo cruzando meses mantendo regra de virada no dia do fechamento, conforme Plan §3.
Onde: server/Core/UseCases/Cartao/\*
Depende de: Nenhuma
Pode ser paralela com: TASK-01
Reusar: estruturas de competencia do ciclo 011
Complexidade: M
Definition of Done:

- [ ] Compra antes do fechamento cai na fatura atual
- [ ] Compra no dia do fechamento cai na proxima fatura
- [ ] Compra apos fechamento cai na proxima fatura
- [ ] Cenarios de 28/29/30/31 dias cobertos
- [ ] Build backend passa

### TASK-03 — Implementar parser restrito para legado (dd/MM e dd-MM)

O que fazer: criar parser de data na descricao com suporte exclusivo a dd/MM e dd-MM, classificando ambiguos/invalidos como nao aplicaveis automaticos, conforme Plan §3 e Plan §8.
Onde: server/Core/UseCases/Cartao/Backfill\*
Depende de: TASK-02
Pode ser paralela com: Nenhuma
Reusar: utilitarios de data existentes no Core
Complexidade: M
Definition of Done:

- [ ] Extrai data apenas dos formatos permitidos
- [ ] Descricao com multiplas datas validas vira ambiguo
- [ ] Formatos fora do escopo viram ignorado
- [ ] Build backend passa

### TASK-04 — Criar endpoint/comando de preview com relatorio por status

O que fazer: implementar fluxo preview para lancamentos cartao com relatorio de aplicavel/ambiguo/ignorado e executionId, conforme Plan §3 e Plan §4.
Onde: server/API/Controllers/Cartao/_, server/Core/UseCases/Cartao/Backfill_
Depende de: TASK-03
Pode ser paralela com: TASK-05
Reusar: padrao de endpoints autenticados existentes
Complexidade: M
Definition of Done:

- [ ] Preview inclui somente lancamentos marcados como cartao
- [ ] Relatorio apresenta contagens por status
- [ ] ExecutionId gerado para eventual apply
- [ ] Build backend passa

### TASK-05 — Implementar apply seguro vinculado ao preview

O que fazer: implementar apply que exige preview previo valido e altera somente itens aplicaveis, conforme Plan §3 e Plan §4.
Onde: server/API/Controllers/Cartao/_, server/Infrastructure/Repositories/_
Depende de: TASK-04
Pode ser paralela com: TASK-06
Reusar: filtro de movimentacao cartao existente
Complexidade: M
Definition of Done:

- [ ] Apply sem preview retorna erro BACKFILL_PREVIEW_OBRIGATORIO
- [ ] Apply com executionId invalido retorna erro BACKFILL_EXECUTION_INVALIDA
- [ ] Somente itens aplicaveis do preview sao alterados
- [ ] Nenhum lancamento nao-cartao e alterado
- [ ] Build backend passa

### TASK-06 — Implementar trilha auditavel e rollback por executionId

O que fazer: persistir auditoria de preview/apply e disponibilizar rollback reversivel por executionId, conforme Plan estrategia de rollback e observabilidade.
Onde: server/Core/UseCases/Cartao/Backfill*, server/Infrastructure/Repositories/*
Depende de: TASK-05
Pode ser paralela com: Nenhuma
Reusar: convencoes de transacao e UTC existentes
Complexidade: L
Definition of Done:

- [ ] Auditoria grava timestamp UTC, operador e contagens
- [ ] Rollback reverte somente itens daquele executionId
- [ ] Rollback nao afeta itens fora do lote
- [ ] Build backend passa

### TASK-07 — Ajustes de UX operacional no modal/dashboard

O que fazer: reforcar mensagens no fluxo de compra para evitar confusao entre data de compra e vencimento e refletir hotfix sem sobrecarga visual, conforme Plan §2 e Plan §7.
Onde: client/src/components/TransactionModal.jsx, client/src/components/DashboardView.jsx
Depende de: TASK-02
Pode ser paralela com: TASK-04
Reusar: copy e componentes de alertas existentes
Complexidade: S
Definition of Done:

- [ ] Copy explicativa exibida no contexto de cartao
- [ ] Sem alteracao indevida no fluxo nao-cartao
- [ ] Dashboard continua legivel apos hotfix
- [ ] cd client && npm run lint passa
- [ ] cd client && npm run build passa

### TASK-08 — Testes automatizados do hotfix e backfill

O que fazer: cobrir cenarios criticos de competencia, preview/apply, parser e rollback, conforme Plan §7 e Plan Go/No-Go.
Onde: server/_tests_ (se existente), client/src/components/\*.test.jsx
Depende de: TASK-01, TASK-02, TASK-03, TASK-04, TASK-05, TASK-06, TASK-07
Pode ser paralela com: Nenhuma
Reusar: infraestrutura de testes existente
Complexidade: L
Definition of Done:

- [ ] Cenario fechamento 29/vencimento 5 validado
- [ ] Cenarios de virada no dia do fechamento e apos fechamento validados
- [ ] Preview classifica corretamente aplicavel/ambiguo/ignorado
- [ ] Apply sem preview bloqueado
- [ ] Apply altera somente aplicaveis e somente cartao
- [ ] Rollback por executionId validado
- [ ] Fluxo nao-cartao sem regressao
- [ ] cd client && npm test passa
- [ ] Build backend passa

### TASK-09 — Gate funcional final e decisao go/no-go

O que fazer: executar checklist funcional completo do hotfix e backfill, consolidar evidencias e registrar decisao final.
Onde: specs/012-hotfix-competencia-cartao-correcao-legado/
Depende de: TASK-08
Pode ser paralela com: Nenhuma
Reusar: criterios do spec/plan
Complexidade: S
Definition of Done:

- [ ] Checklist funcional preenchido
- [ ] Evidencias de quality gates anexadas
- [ ] Go/No-Go documentado
- [ ] Sem violacao da constitution

## Quality gates obrigatorios

Backend:

1. dotnet build server/Finance.slnx -c Release

Frontend:

1. cd client && npm run lint
2. cd client && npm run build
3. cd client && npm test

## Checklist de validacao funcional do hotfix e backfill

1. Competencia de compra nova
1. Validar compra antes do fechamento na fatura atual.
1. Validar compra no dia do fechamento na proxima fatura.
1. Validar compra apos fechamento na proxima fatura.
1. Validar cenario fechamento 29 e vencimento 5.

1. Preview do legado
1. Rodar preview e conferir total analisado.
1. Conferir contagens de aplicavel, ambiguo e ignorado.
1. Confirmar que apenas lancamentos cartao foram considerados.

1. Apply e rollback
1. Tentar apply sem preview e validar bloqueio.
1. Executar apply com executionId valido.
1. Confirmar alteracao apenas dos aplicaveis.
1. Executar rollback e confirmar reversao do lote correto.

1. Seguranca de escopo
1. Confirmar zero alteracoes em nao-cartao.
1. Confirmar zero alteracoes automaticas em ambiguos.
1. Confirmar parser limitado a dd/MM e dd-MM.

## Criterio Go/No-Go

Go:

1. Competencia correta validada nos cenarios de borda, incluindo 29/5.
2. Preview obrigatorio e apply seguro funcionando.
3. Rollback por executionId validado.
4. Nenhuma alteracao em nao-cartao ou ambiguo.
5. Quality gates aprovados.

No-Go:

1. Qualquer alteracao sem preview.
2. Qualquer ajuste automatico em ambiguo.
3. Qualquer impacto em lancamento nao-cartao.
4. Falha de rollback/auditoria.
5. Falha em quality gates sem mitigacao aprovada.
