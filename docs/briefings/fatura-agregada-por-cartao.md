# Briefing - Fatura agregada por cartao com atualizacao automatica

> Capturado em: 2026-06-07
> Por: Discovery Agent (com PO)
> Status: Pronto pra Architect

## 1. Persona

PO e usuario final que precisa controlar gasto real sem duplicidade entre compras do cartao e pagamento da fatura.

## 2. Dor real

Ao lancar compras no cartao, o sistema pode refletir saida duplicada no fluxo financeiro quando soma compras individuais e valor da fatura. Falta um comportamento automatico de consolidacao da fatura por cartao.

## 3. Valor entregue

Garantir que o caixa reflita apenas o impacto real do cartao no vencimento da fatura, mantendo rastreabilidade das compras sem duplicidade de saida.

## 4. Criterio de sucesso (KPIs)

- Nao existe duplicidade de saida entre compras individuais no cartao e movimentacao de fatura.
- Existe exatamente uma movimentacao de fatura por cartao e por ciclo, atualizada automaticamente.
- Alteracoes em compras do cartao (criar, editar, excluir) refletem no valor consolidado da fatura sem acao manual.

## 5. Escopo

Dentro:

- Uma fatura por cartao.
- Cada compra de cartao nao entra como saida de caixa consolidada.
- Sistema cria/atualiza automaticamente uma movimentacao agregada de fatura no dia de vencimento do cartao.
- A cada compra, edicao ou exclusao de movimentacao vinculada ao cartao, a movimentacao agregada da fatura e recalculada.
- Na virada de ciclo (apos fechamento), manter fatura atual fechada e criar/atualizar a proxima fatura.
- Permitir edicao da movimentacao de fatura fechada quando necessario.
- Se total da fatura ficar zero, manter a movimentacao de fatura zerada (nao excluir).
- Incluir compras parceladas no pacote, conectando a funcionalidade existente ao fluxo de cartao e consolidacao de fatura.

Fora (explicitamente):

- Juros de cartao.
- Pagamento parcial de fatura.
- Multiplos vencimentos por cartao no mesmo ciclo.

## 6. Restricoes

- Solucao deve priorizar baixa complexidade de implementacao.
- Manter compatibilidade com funcionalidades atuais ja em producao.
- Nao quebrar fluxo de movimentacoes nao-cartao.

## 7. Premissas e riscos de produto

- Premissa: consolidar saida no vencimento resolve percepcao de duplicidade e melhora leitura de caixa.
- Premissa: manter fatura zerada em vez de excluir simplifica o ciclo e reduz complexidade.
- Risco: regras de ciclo podem gerar inconsistencias em borda de fechamento/vencimento; mitigacao: testes de fronteira por data e por cartao.
- Risco: parcelamento ja existente pode nao estar totalmente alinhado ao modelo de consolidacao; mitigacao: mapear rastreabilidade de parcelas para fatura por ciclo no spec.

## 8. Hipoteses descartadas no Discovery

- Excluir automaticamente faturas zeradas (descartado para reduzir complexidade e manter historico operacional).
- Tratar juros e pagamento parcial neste ciclo (descartado por escopo).

## 9. Proximo passo recomendado

Acionar Architect com este prompt:

Leia o briefing em docs/briefings/fatura-agregada-por-cartao.md e execute o fluxo Spec Kit para gerar spec, plan e tasks.

Objetivo funcional:

- Implementar modelo de fatura agregada por cartao.
- Cada compra de cartao nao deve contabilizar saida duplicada no caixa.
- Deve existir uma movimentacao agregada de fatura por cartao/ciclo, no dia de vencimento.
- Criar, editar e excluir compra de cartao deve recalcular automaticamente a movimentacao agregada correspondente.
- Na virada de ciclo, manter fatura atual fechada e iniciar a proxima.
- Se total ficar zero, manter movimentacao zerada.
- Conectar compras parceladas existentes ao fluxo de cartao e consolidacao da fatura.

Restrições obrigatorias:

- Sem juros.
- Sem pagamento parcial.
- Sem multiplos vencimentos por cartao no mesmo ciclo.
- Sem regressao no fluxo nao-cartao.

Entregar ao final:

- links de spec, plan e tasks;
- matriz de rastreabilidade dos requisitos;
- checklist de testes de fronteira (fechamento/vencimento, edicao/exclusao, parcelado, total zero).
