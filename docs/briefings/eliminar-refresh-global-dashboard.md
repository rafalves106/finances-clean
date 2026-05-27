# Briefing - Eliminar refresh global do dashboard apos CRUD de movimentacoes

> Capturado em: 27/05/2026
> Por: Discovery Agent (com PO)
> Status: Pronto pra Architect

## 1. Persona

Usuario unico do produto (PO), impactado em desenvolvimento e em uso real da aplicacao.

## 2. Dor real

Ao criar, editar ou deletar movimentacao, o dashboard desmonta e monta novamente, com efeito de recarregamento visual e perda de continuidade (piscada e perda de contexto/scroll).

## 3. Valor entregue

Fluxo mais fluido e intent driven no dashboard, com atualizacao de dados sem piscar a tela inteira.

## 4. Criterio de sucesso (KPIs)

- Nao exibir estado global de carregamento da tela inteira apos CRUD de movimentacoes.
- Preservar scroll e contexto visual do usuario apos operacao.
- Reduzir percepcao de recarregamento nas abas do dashboard.
- Entregar valor mesmo com melhora parcial (80%).

## 5. Escopo

Dentro:

- Evitar refresh global de tudo que esta no dashboard apos alteracoes de movimentacao.
- Substituir recarga total por atualizacao pontual/local de estado e recargas em segundo plano quando necessario.

Fora (explicitamente):

- Desligar HMR/hot reload da stack de desenvolvimento inteira.
- Alterar contratos de API backend.
- Redesign visual amplo do dashboard.

## 6. Restricoes

- Sem restricoes de prazo/infra reportadas.
- Prioridade em impacto de UX com baixo risco de regressao funcional.

## 7. Premissas e riscos de produto

- Premissa: o problema principal nao e hot reload, e sim refresh global provocado por fetch geral apos mutation.
- Premissa: atualizacao otimista/local com sincronizacao posterior reduz piscada mantendo consistencia.
- Risco: divergencia entre estado local e backend em erros de rede; mitigacao: rollback + toast de erro + refetch silencioso.
- Risco: inconsistencias em cards agregados (saldo, categorias, comparativos); mitigacao: recomputar derivados localmente e fazer revalidacao em background.

## 8. Hipoteses descartadas no Discovery

- Desabilitar totalmente hot reload da aplicacao (descartado por baixo ganho e alto custo de produtividade).
- Manter refresh global atual (descartado por atrito claro de UX).

## 9. Proximo passo recomendado

Acionar Architect com este prompt:

Mapeie e planeje uma refatoracao incremental para eliminar refresh global do dashboard apos criar/editar/deletar movimentacoes.

Contexto tecnico observado:

- Em [client/src/App.jsx](client/src/App.jsx), fetchData aciona loading global via setLoading(true/false).
- Em [client/src/components/DashboardView.jsx](client/src/components/DashboardView.jsx), mutacoes de movimentacao chamam fetchData (ex.: handleRemove, handleApplySimulation, onSuccess do TransactionModal), e quando loading=true a view inteira cai no fallback "Carregando informacoes...".

Objetivo:

- Remover a piscada/re-mount global apos CRUD de movimentacoes.
- Preservar scroll e contexto visual.
- Atualizar dashboard de forma pontual (state patch/local update) com revalidacao silenciosa.

Entregue no plano:

1. Diagnostico dos pontos que disparam refresh global.
2. Estrategia incremental em 3 fases:
   - Fase 1: separar loading inicial de loading de mutacao (nao bloquear tela inteira).
   - Fase 2: aplicar atualizacao local otimista para create/edit/delete de movimentacoes.
   - Fase 3: revalidacao em background e protecao contra drift (rollback/toast).
3. Mudancas por arquivo (App, DashboardView, TransactionModal).
4. Riscos/regressoes e mitigacoes.
5. Checklist de validacao manual e tecnica (incluindo preservacao de scroll).
