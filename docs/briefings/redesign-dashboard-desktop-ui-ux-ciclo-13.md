# Briefing - Redesign Dashboard Desktop (UI/UX) Ciclo 13

> Capturado em: 2026-06-01
> Por: Discovery Agent (com PO)
> Status: Pronto pra Architect

## 1. Persona

Usuario unico do produto (PO), com uso operacional diario e analise rapida no desktop.

## 2. Dor real

O dashboard atual exige rolagem excessiva, tem baixa hierarquia visual e gera confusao na leitura, aumentando o tempo para localizar informacoes essenciais.

## 3. Valor entregue

Painel mais direto e escaneavel, com organizacao em blocos fixos e prioridade visual clara, reduzindo o esforco cognitivo e acelerando decisoes operacionais.

## 4. Criterio de sucesso (KPIs)

- Tempo para localizar informacoes principais no dashboard em ate 30 segundos.
- Reducao perceptivel de confusao visual e de navegacao por rolagem global (validacao qualitativa do PO apos uso real).

## 5. Escopo

**Dentro:**

- Sidebar retratil (mostrar/ocultar) para ganho de area util quando necessario.
- Dashboard com altura fixa no desktop, sem scroll global da pagina do dashboard.
- Scroll interno apenas nos componentes/blocos que excederem o espaco disponivel.
- Estrutura horizontal em 3 secoes:
  - Secao 1: 1/3 cartoes (design moderno) + 2/3 grafico mensal (receita, despesas e saldo).
  - Secao 2: 1/3 proximos pagamentos + 2/3 blocos de valores (entradas, saidas, investimentos e saldo livre).
  - Secao 3: 1/3 categorias com gasto e orcamento mensal + 2/3 movimentacoes detalhadas com entradas a direita e saidas a esquerda.
- Entrega completa do escopo definido neste ciclo (100%).

**Fora (explicitamente):**

- Mobile/responsividade completa.
- Filtros avancados.
- Novos relatorios.
- Refatoracao de APIs backend.
- Mudancas de regra de negocio.

## 6. Restricoes

- Prazo: hoje.
- Foco exclusivo em desktop.
- Permitido adotar biblioteca de layout/UI para acelerar execucao e elevar qualidade visual.

## 7. Premissas e riscos de produto

- Premissa: organizacao em blocos fixos reduz tempo de localizacao para <= 30s.
  - Validacao: teste de uso real do PO com tarefas objetivas de localizacao de informacao.
- Risco: eliminacao de scroll global pode comprometer usabilidade em resolucoes desktop menores.
  - Mitigacao: definir breakpoints desktop e limites de altura por bloco com scroll interno controlado e headers fixos.
- Risco: entrega 100% no mesmo dia aumenta chance de ajuste fino pos-release.
  - Mitigacao: priorizar fidelidade estrutural first-pass e reservar rodada curta de refinamento visual apos validacao.

## 8. Hipoteses descartadas no Discovery

- Incluir mudancas de regra de negocio no ciclo atual (descartado; ciclo restrito a UI/UX).
- Incluir mobile completo agora (descartado; foco desktop).
- Incluir filtros avancados e relatorios (descartado para preservar foco e prazo).

## 9. Proximo passo recomendado

Acionar Architect com este prompt:

> Use o briefing em docs/briefings/redesign-dashboard-desktop-ui-ux-ciclo-13.md e gere o pacote completo do ciclo (spec, plan e tasks) para um redesign UI/UX do dashboard desktop sem mudanca de regra de negocio. Requisitos obrigatorios: sidebar retratil; dashboard com altura fixa e sem scroll global; scroll apenas interno nos blocos quando necessario; layout horizontal em 3 secoes com composicao 1/3 + 2/3 conforme briefing; secao de movimentacoes com entradas a direita e saidas a esquerda; entrega 100% do escopo neste ciclo; fora de escopo mobile, filtros avancados, relatorios e refatoracao de API. Inclua criterios de aceite objetivos para validar KPI de localizacao em ate 30 segundos.
