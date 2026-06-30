## §0 Contexto de Negócio

- Persona: PO e usuário final que precisa de leitura correta do caixa sem duplicidade entre compras no cartão e a fatura.
- Dor real: duplicidade de saída quando compras individuais e o pagamento da fatura são somados ao caixa.
- Valor entregue: garantir exatamente uma movimentação de saída por cartão por ciclo, mantendo rastreabilidade das compras.
- KPI/critério de sucesso:
  - Não existe duplicidade de saída entre compras individuais do cartão e a movimentação de fatura. (binário)
  - Existe exatamente 1 movimentação agregada por cartão/ciclo, atualizada automaticamente. (binário)
  - Criação/edição/exclusão de compras reflete automaticamente na movimentação agregada. (binário)

## Decisões aprovadas pelo PO (congeladas neste spec)

- Uma fatura por cartão.
- Data da movimentação agregada = data de vencimento do cartão.
- Na virada de ciclo, manter fatura anterior fechada, mas editável; edições disparam recálculo automático.
- Se total ficar zero, manter movimentação zerada (não excluir).
- Compra parcelada entra no pacote e deve conectar ao cartão/fatura agregada.
- Fora de escopo: juros, pagamento parcial e múltiplos vencimentos por cartão.
- Regra de cutoff: compra no dia de fechamento pertence ao próximo ciclo.

## §1 O que precisa ser feito (escopo funcional)

- Implementar modelo de fatura agregada por cartão, por ciclo.
- Cada compra vinculada a cartão NÃO deve contabilizar saída duplicada no caixa; somente a movimentação agregada da fatura deve impactar o caixa.
- Deve existir uma movimentação agregada por (cartão, ciclo) com data de efetivação = data de vencimento do cartão para aquele ciclo.
- Operações CRUD em compras do cartão (criar/editar/excluir) recalculam automaticamente a movimentação agregada correspondente.
- Ao fechar um ciclo, a fatura atual é mantida como fechada e a próxima fatura/ciclo é criada/atualizada.
- Se o total da fatura for zero, manter movimentação zerada (não excluir).
- Conectar compras parceladas existentes ao fluxo de consolidação por fatura/ciclo.

## §2 Restrições obrigatórias (aceitas sem exceção)

- Sem juros.
- Sem pagamento parcial.
- Sem múltiplos vencimentos por cartão no mesmo ciclo.
- Não regressar o fluxo de movimentações não-cartao.

## §3 Critérios de aceitação (testáveis e binários)

- CA-01: Para um cartão e ciclo, existe exatamente uma movimentação agregada com soma igual ao somatório das parcelas/compras daquele ciclo. (ver fixtures)
- CA-02: Criar/editar/excluir compra atualiza o valor da movimentação agregada de forma síncrona e idempotente durante a mesma operação de CRUD; a leitura deve refletir o novo valor imediatamente após a resposta. (testar busca imediata)
- CA-03: Na data de vencimento, a movimentação agregada tem `tipo = saída` e impacta o caixa; antes da data de vencimento, as compras NÃO impactam o caixa como saídas consolidadas. (testar estado antes/depois)
- CA-04: Ao fechar ciclo, fatura antiga fica marcada como fechada; a fatura do próximo ciclo inicia com as compras subsequentes. (testar transição)
- CA-05: Se soma do ciclo = 0, manter movimentação com valor 0 em vez de excluir. (testar existência)
- CA-06: Compras parceladas existentes devem ser associadas ao fluxo de fatura; total consolidado deve considerar parcelas do ciclo atual. (testar parcelamento)
- CA-07: Fluxo de movimentações não-cartao continua funcionando sem alteração observável. (regressão)

## §4 Regras de mapeamento de domínio

- Entidade `Cartao` identifica-se por `id` com `vencimentoDia` e `numero` (não exposto aqui).
- Entidade `CompraCartao`:
  - campos: id, cartaoId, valorTotal, dataCompra, parcelas (numero, valor_por_parcela, vencimento_parcela?), referencia_ciclo (ano-mes), status
  - cada parcela é atribuída ao ciclo corrente de acordo com dataCompra e regras existentes de parcelamento.
- Entidade `FaturaAgregada` (nova):
  - campos: id, cartaoId, ciclo (YYYY-MM), vencimento (date), valorTotal, status (aberta/fechada), movimentacaoId
  - invariantes: uma única `FaturaAgregada` por (cartaoId,ciclo)
- Entidade `Movimentacao` (existente): a movimentação financeira que impacta o caixa. Para faturas, teremos uma `Movimentacao` única por `FaturaAgregada` com data = vencimento.

## §5 Casos de borda e decisões finais

- Corte de ciclo: compras com `dataCompra` == dia de fechamento são pertencentes ao próximo ciclo (cutoff atribuído ao início do dia de fechamento). Esta regra é definitiva para a fase 1.
- Edição retroativa: edições em faturas já fechadas são permitidas e disparam recálculo automático; alterações devem registrar auditoria (usuário, timestamp, delta).
- Migração de parcelamento (escopo mínimo): migrar associação de parcelas para `FaturaAgregada` apenas para os últimos 12 meses por padrão; operações históricas fora deste período ficarão como exceção e serão avaliadas manualmente.

## §6 Observabilidade e métricas mínimas

- Log de recalculo: registrar evento `fatura.recalculo` com cartaoId, ciclo, delta, origem (criar/editar/excluir), timestamp.
- Métricas: `fatura.recalculos.total`, `fatura.movimentacoes.criadas`, `fatura.movimentacoes.atualizadas`, `fatura.movimentacoes.zereadas`.

## §7 Dependências e impactos

- Impacta: módulos de Movimentacao, Compras/Parcelamento, Fluxo de Caixa, APIs públicas de listagem de movimentacoes.
- Não deve alterar comportamento de movimentacoes não-cartao.

## §8 Documentos relacionados

- Briefing original: docs/briefings/fatura-agregada-por-cartao.md

## §9 Tarefas de validação de aceitação (resumo)

- Validar CA-01..CA-07 com fixtures unitários e testes de integração.
