# Matriz de Rastreabilidade — Fatura Agregada por Cartão

Objetivos funcionais / Restrições -> Spec § / Plan § / Tasks

- Implementar modelo de fatura agregada por cartão.
  - Spec: §1, §4
  - Plan: §1, §2
  - Tasks: TASK-01, TASK-03

- Cada compra de cartão não deve contabilizar saída duplicada no caixa.
  - Spec: §1, §3 (CA-03)
  - Plan: §3 (fluxo de dados)
  - Tasks: TASK-04, TASK-05, TASK-09

- Deve existir uma movimentação agregada de fatura por cartão/ciclo, no dia de vencimento.
  - Spec: §1, §4
  - Plan: §1, §3
  - Tasks: TASK-01, TASK-04, TASK-05

- Criar, editar e excluir compra de cartão deve recalcular automaticamente a movimentação agregada correspondente.
  - Spec: §1, §3 (CA-02)
  - Plan: §3, §4
  - Tasks: TASK-05, TASK-09

- Na virada de ciclo, manter fatura atual fechada e iniciar a próxima.
  - Spec: §1, §3 (CA-04)
  - Plan: §3
  - Tasks: TASK-03, TASK-09

- Se total ficar zero, manter movimentação zerada.
  - Spec: §1 (CA-05)
  - Plan: §4
  - Tasks: TASK-03, TASK-04, TASK-09

- Conectar compras parceladas existentes ao fluxo de cartão e consolidação da fatura.
  - Spec: §1, §4 (CA-06)
  - Plan: §2, §3
  - Tasks: TASK-02, TASK-08, TASK-09

Restrição: Sem juros / Sem pagamento parcial / Sem múltiplos vencimentos por cartão no mesmo ciclo / Sem regressão no fluxo não-cartao

- Spec: §2
- Plan: §4 (validações)
- Tasks: TASK-03 (valida regras), TASK-04 (rejeição/422), TASK-09 (testes de regressão)

# Checklist de testes de fronteira (fechamento/vencimento, edição/exclusão, parcelado, total zero)

- Fechamento / Vencimento:
  - CT-01: Criar compras no cartão dentro de um ciclo e validar que a `Movimentacao` é criada com data = vencimento e soma correta.
  - CT-02: Validar que antes da data de vencimento o caixa não mostra saída consolidada (apenas após vencimento a movimentação afeta saldo).
  - CT-03: Simular virada de ciclo: compras antes e depois do fechamento devem pertencer a faturas distintas; fatura antiga marcada como `fechada`.

- Edição / Exclusão:
  - CT-04: Editar valor de uma compra e validar recalculo da `FaturaAgregada` e `Movimentacao` (delta aplicado).
  - CT-05: Excluir uma compra e validar recalculo (se total virar 0, manter movimentação com valor 0).
  - CT-06: Edição retroativa após fechamento: editar compra em fatura fechada e validar que recalculo é permitido e log/auditoria registrada. (se política exigir permissão, testar com e sem permissão)

- Parcelado:
  - CT-07: Compras parceladas cuja parcelas caem em ciclos diferentes devem ser atribuídas ao ciclo correto; somatório por fatura deve refletir parcelas do ciclo.
    - CT-08: Migrar parcelas dos últimos 12 meses e validar associação correta com `FaturaAgregada` em dataset de teste; documentar exceções para histórico mais antigo.

- Total zero:
  - CT-09: Quando soma do ciclo = 0, garantir que exista `FaturaAgregada` e `Movimentacao` com valor 0 (não excluir), e que não gere impacto no caixa.

- Regressão / Não-cartao:
  - CT-10: Executar suíte de regressão de `Movimentacao` para assegurar que outros tipos de movimentação mantêm comportamento inalterado.

- Concurrency / Race conditions:
  - CT-11: Simular múltiplas atualizações simultâneas em compras do mesmo cartão/ciclo e validar que locks/retries previnem inconsistências.

Observações de execução dos testes:

- Executar testes locais com dataset reduzido e com timezone controlado.
- Incluir testes end-to-end que simulem requisições CRUD e validem efeitos no DB e no retorno de APIs públicas (fase 1 síncrona).
