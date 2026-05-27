# Briefing — Comparativo de Categorias Mês a Mês
> Capturado em: 2026-05-26
> Por: 🧭 Discovery Agent (com Rafael)
> Status: 🟢 Pronto pra Architect

## 1. Persona
Rafael — gerencia as próprias finanças e quer entender tendências de gastos e receitas por categoria ao longo do tempo, sem precisar exportar dados para cruzar manualmente.

## 2. Dor real
Não é possível ver se os gastos de uma categoria (ex: Transporte, Lazer) estão aumentando ou diminuindo mês a mês. O dashboard atual mostra evolução de saldo total, mas não por categoria. A única alternativa é exportar CSVs de meses diferentes e comparar na mão.

## 3. Valor entregue
Visualização direta no dashboard de quanto foi gasto e recebido por categoria nos últimos 3 meses, com possibilidade de isolar uma categoria para ver a tendência com mais clareza.

## 4. Critério de sucesso (KPIs)
- Usuário identifica tendência de uma categoria (subindo/descendo) sem sair do app
- Visualização cobre despesas e receitas separadamente por categoria
- Drill down funciona: selecionar uma categoria isola sua evolução

## 5. Escopo

**Dentro:**
- Comparativo dos últimos 3 meses completos
- Todas as categorias em visão consolidada (gráfico de barras agrupadas ou tabela)
- Seleção de uma categoria para visualização isolada (drill down)
- Despesas e receitas — ambas cobertas
- Integrado no dashboard atual (não cria tela nova)
- Movimentações sem categoria agrupadas como "Sem categoria"

**Fora (explicitamente):**
- Período configurável pelo usuário (além dos 3 meses fixos)
- Tela ou seção separada de "Relatórios"
- Comparativo entre usuários
- Export do comparativo em CSV/PDF
- Subcategorias ou agrupamentos customizados

## 6. Restrições
- Sem nova rota no frontend (embutido no dashboard existente)
- Sem dependência de nova lib de gráficos (projeto já usa Recharts)
- Sem prazo definido

## 7. Premissas e riscos de produto
- Premissa: usuário tem dados nos 3 meses anteriores ao mês atual; se não tiver, exibe os meses disponíveis sem erro
- Risco: categorias com nomes longos podem poluir a visualização — mitigação: truncar label ou usar tooltip

## 8. Hipóteses descartadas no Discovery
- Comparativo só de despesas: descartado — receitas também são relevantes para entender tendência de salário/renda
- Tela separada de relatórios: descartado — usuário quer ver no fluxo natural do dashboard, sem navegação extra

## 9. Próximo passo recomendado
🎯 **Acionar 🏛️ Architect** com este prompt:

> Leia o briefing em `docs/briefings/comparativo-categorias-mensal.md` e execute `/speckit.specify` para esta feature. Stack: backend .NET 10 Clean Architecture (Core/Infrastructure/API) + EF Core + PostgreSQL. Frontend React 19 + Vite + Tailwind + Recharts (já instalado). A visualização deve ser integrada no dashboard atual. Siga as convenções já estabelecidas no projeto.
