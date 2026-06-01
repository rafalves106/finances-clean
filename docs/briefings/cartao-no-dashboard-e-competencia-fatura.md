# Briefing - Cartao no dashboard e regra de competencia da fatura

> Capturado em: 01/06/2026
> Por: Discovery Agent (com PO)
> Status: Pronto pra Architect

## 1. Persona

PO e usuario unico atual do app, com objetivo de evoluir a experiencia para futuros usuarios.

## 2. Dor real

Hoje o cartao nao aparece no dashboard no formato de acompanhamento rapido desejado, e o fluxo atual de compra no cartao usa data de vencimento como data da movimentacao, causando distorcao de competencia e efeito de deslocamento de mes.

## 3. Valor entregue

Dar visibilidade imediata do cartao no dashboard com dados de decisao rapida e corrigir a logica de competencia da fatura para refletir data real de compra, evitando empurrar despesas para o mes seguinte indevidamente.

## 4. Criterio de sucesso (KPIs)

- Cartao exibido no dashboard com leitura rapida dos indicadores principais.
- Compras novas de cartao respeitam competencia correta sem efeito de +1 mes.
- Reducao de retrabalho manual para controlar compras e fatura.

## 5. Escopo

Dentro:

- Exibir card de cartao no dashboard com: fatura atual, fatura proxima, limite total, limite usado, limite disponivel, dia de fechamento e dia de vencimento.
- Permitir no dashboard leitura + acoes rapidas relacionadas ao cartao.
- No fluxo de compra, registrar data real da compra e cartao usado.
- Calcular competencia de fatura com regra de virada definida:
  - compra ate o dia anterior ao fechamento entra na fatura atual.
  - compra a partir do dia do fechamento entra na proxima fatura.
- Corrigir comportamento apenas para novos lancamentos (sem migracao retroativa do historico).

Fora (explicitamente):

- Reprocessar historico antigo para tentar inferir data de compra da descricao.
- Integracao bancaria/open finance.
- Mudanca ampla de layout fora do contexto do dashboard/cartao.

## 6. Restricoes

- Manter gestao completa do cartao em tela separada (aceito pelo PO).
- Dashboard deve mostrar resumo operacional e acoes rapidas, sem sobrecarregar o layout.
- Solucao deve preservar compatibilidade com fluxo atual de movimentacoes nao-cartao.

## 7. Premissas e riscos de produto

- Premissa: card de cartao no dashboard acelera decisao diaria e reduz necessidade de abrir tela dedicada.
- Premissa: separar data real da compra de competencia de fatura elimina distorcao mensal.
- Risco: usuarios antigos manterem padrao antigo de preenchimento manual da descricao; mitigacao: copy explicativa no modal e validacoes de entrada.
- Risco: divergencia de expectativa sobre visao de relatorios (data de compra vs competencia); mitigacao: definir regra padrao no spec e documentar claramente.

## 8. Hipoteses descartadas no Discovery

- Continuar usando data de vencimento como data da compra (descartado por gerar distorcao de competencia).
- Reprocessar automaticamente historico antigo (descartado para manter escopo e risco controlados neste ciclo).

## 9. Proximo passo recomendado

Acionar Architect com este prompt:

Temos um briefing aprovado para evoluir o modulo de cartao com foco em dashboard + competencia correta de fatura. Use [docs/briefings/cartao-no-dashboard-e-competencia-fatura.md](docs/briefings/cartao-no-dashboard-e-competencia-fatura.md) e siga o fluxo completo Spec Kit.

1. Gerar spec com foco em:

- card de cartao no dashboard contendo: fatura atual, fatura proxima, limite total, limite usado, limite disponivel, fechamento, vencimento;
- acoes rapidas do cartao no dashboard (sem remover tela dedicada de gestao);
- fluxo de compra no cartao com data real da compra + cartao selecionado;
- regra de competencia:
  - compra ate o dia anterior ao fechamento = fatura atual;
  - compra a partir do dia do fechamento = proxima fatura;
- aplicacao apenas para novos lancamentos, sem migrar historico.

2. Gerar plan tecnico com:

- mudancas por arquivo (backend e frontend),
- impactos no dashboard e no modal de transacao,
- estrategia de validacao de competencia de fatura,
- riscos e mitigacoes.

3. Gerar tasks executaveis com quality gates e checklist manual.

Restricoes obrigatorias:

- sem integracao bancaria;
- sem migracao de historico antigo;
- sem quebrar fluxo nao-cartao.

Entregar no final:

- links de spec/plan/tasks,
- criterio go/no-go,
- checklist de validacao funcional do dashboard e da regra de virada da fatura.
