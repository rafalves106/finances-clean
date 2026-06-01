# Briefing - Hotfix de competencia do cartao e correcao segura do legado

> Capturado em: 01/06/2026
> Por: Discovery Agent (com PO)
> Status: Pronto pra Architect

## 1. Persona

PO e usuario unico atual, validando o fluxo de cartao em uso real.

## 2. Dor real

Compras de cartao com data real corrigida podem cair na fatura errada. Alem disso, ha lancamentos antigos com data de vencimento no campo de data, distorcendo competencia.

## 3. Valor entregue

Garantir competencia correta para cartao em todos os cenarios, incluindo ciclo com fechamento no fim do mes e vencimento no inicio do mes seguinte, e disponibilizar correcao segura de legado sem alteracao cega.

## 4. Criterio de sucesso (KPIs)

- Compra no cartao sempre entra na fatura correta conforme regra de fechamento.
- Regra suporta ciclo valido com fechamento 29 e vencimento 5.
- Correcao de legado roda apenas para compras marcadas como cartao e com preview previo.
- Zero alteracoes automaticas em casos ambiguos na descricao.

## 5. Escopo

Dentro:

- Corrigir regra de competencia da fatura para suportar fechamento posterior ao vencimento (ciclo cruzando meses).
- Ajustar validacoes do cartao para permitir combinacoes validas de fechamento e vencimento em meses diferentes.
- Manter regra de virada definida: compra no dia do fechamento ou depois vai para a proxima fatura.
- Criar mecanismo de correcao de legado para compras marcadas como cartao, extraindo data da descricao nos formatos 07/05 e 07-05.
- Implementar modo preview (relatorio) antes da aplicacao efetiva.
- Ignorar automaticamente casos ambiguos/invalidos para ajuste manual posterior.

Fora (explicitamente):

- Correcao de lancamentos nao marcados como cartao.
- Correcoes automaticas sem etapa de preview.
- Inferencias agressivas para descricoes fora dos formatos definidos.

## 6. Restricoes

- Fechamento e vencimento devem ser calculados por ciclo, nao por comparacao simples no mesmo mes.
- Processo de backfill deve ser seguro, auditavel e reversivel.
- Sem quebra do fluxo atual de lancamentos nao-cartao.

## 7. Premissas e riscos de produto

- Premissa: ciclo com fechamento 29 e vencimento 5 e valido e comum no contexto real.
- Premissa: formatos de descricao mais frequentes no legado sao 07/05 e 07-05.
- Risco: parser interpretar data errada em alguns textos; mitigacao: ignorar ambiguos e mostrar relatorio.
- Risco: alteracao em massa sem visibilidade; mitigacao: obrigatoriedade de preview com contagem por status (aplicavel, ambiguo, ignorado).

## 8. Hipoteses descartadas no Discovery

- Bloquear fechamento maior que vencimento por regra fixa (descartado por invalidar ciclos reais cruzando mes).
- Aplicar correcao automatica sem preview (descartado por risco alto de erro em lote).

## 9. Proximo passo recomendado

Acionar Architect com este prompt:

Temos um hotfix aprovado para competencia de cartao e correcao segura do legado. Use [docs/briefings/hotfix-competencia-cartao-e-correcao-legado.md](docs/briefings/hotfix-competencia-cartao-e-correcao-legado.md) e siga o fluxo completo Spec Kit.

1. Gerar spec com foco em:

- regra de competencia correta para ciclo cruzando meses (ex.: fechamento 29, vencimento 5),
- regra de virada mantida: compra no dia do fechamento ou apos vai para proxima fatura,
- correcao de legado apenas para compras marcadas como cartao,
- parser de data na descricao apenas formatos 07/05 e 07-05,
- casos ambiguos ignorados para ajuste manual,
- etapa obrigatoria de preview com relatorio antes da aplicacao.

2. Gerar plan tecnico com:

- ajustes em validacao de ciclo no cartao,
- ajustes no calculo de competencia,
- estrategia de backfill seguro (preview e aplicacao),
- plano de rollback e observabilidade.

3. Gerar tasks executaveis com quality gates e checklist de validacao.

Restricoes obrigatorias:

- sem aplicacao automatica sem preview,
- sem reprocessar lancamentos nao-cartao,
- sem heuristicas de parser fora dos formatos acordados.

Entregar no final:

- links de spec, plan e tasks,
- criterio go/no-go,
- checklist de validacao funcional do hotfix e do backfill.
