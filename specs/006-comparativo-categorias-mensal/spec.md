# Feature Specification: Comparativo de Categorias Mês a Mês

**Feature Branch**: `006-comparativo-categorias-mensal`
**Created**: 2026-05-26
**Status**: Draft
**Input**: `docs/briefings/comparativo-categorias-mensal.md`

## §0 Contexto de Negócio

- **Persona**: Rafael, usuario que administra as proprias finanças e quer entender tendencia por categoria sem exportar dados manualmente.
- **Dor real**: hoje o dashboard mostra saldo total, mas nao revela se categorias especificas estao crescendo ou caindo ao longo do tempo.
- **Valor entregue**: uma visualizacao embutida no dashboard que mostra despesas e receitas por categoria nos ultimos 3 meses completos, com drill down para isolar uma categoria.
- **KPIs de sucesso**:
  - usuario identifica tendencia de uma categoria sem sair do app.
  - visualizacao cobre receitas e despesas separadamente.
  - drill down permite isolar uma categoria e observar sua evolucao.
  - a feature nao cria navegação nova nem exige export manual.
- **Restricoes**:
  - integrado no dashboard atual.
  - sem nova lib de gráficos; usar Recharts ja instalado.
  - sem periodo configuravel pelo usuario neste ciclo.
  - movimentacoes sem categoria devem aparecer como `Sem categoria`.

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Visualizar comparativo dos ultimos 3 meses no dashboard (Priority: P1)

Como usuario, quero ver uma visualizacao dos gastos e receitas por categoria nos ultimos 3 meses completos para identificar tendencias sem montar planilhas.

**Why this priority**: resolve a dor principal e entrega valor imediatamente dentro do fluxo atual do dashboard.

**Independent Test**: abrir o dashboard com dados de tres meses e verificar que o comparativo exibe as categorias por mes, cobrindo receitas e despesas.

**Acceptance Scenarios**:

1. **Given** usuario autenticado com movimentacoes em meses recentes, **When** abre o dashboard, **Then** a area de comparativo exibe os ultimos 3 meses completos.
2. **Given** meses com categorias diferentes e sem categoria, **When** a visualizacao e renderizada, **Then** todas as categorias relevantes aparecem e itens sem categoria sao agrupados como `Sem categoria`.

---

### User Story 2 - Isolar uma categoria para entender a tendencia (Priority: P1)

Como usuario, quero selecionar uma categoria especifica para ver sua evolucao com mais clareza.

**Why this priority**: o drill down e parte central do valor do comparativo; sem ele, a leitura de tendencia fica mais dificil.

**Independent Test**: selecionar uma categoria no dashboard e confirmar que o grafico/tabela passa a exibir apenas os valores daquela categoria ao longo dos 3 meses.

**Acceptance Scenarios**:

1. **Given** o comparativo com multiplas categorias visiveis, **When** o usuario seleciona uma categoria, **Then** a visualizacao e filtrada para aquela categoria.
2. **Given** o usuario limpa a selecao, **When** o drill down e desfeito, **Then** a visao consolidada e restaurada.

---

### User Story 3 - Interpretar receitas e despesas separadamente (Priority: P2)

Como usuario, quero distinguir receitas e despesas por categoria para compreender melhor a origem da tendencia.

**Why this priority**: evita leitura ambigua de categoria que mistura entradas e saidas.

**Independent Test**: validar que a visualizacao diferencia os valores de receita e despesa por categoria nos meses comparados.

**Acceptance Scenarios**:

1. **Given** uma categoria com entradas e saidas no mesmo periodo, **When** o comparativo e exibido, **Then** os valores aparecem separados por tipo.
2. **Given** uma categoria sem movimentacao em um dos meses, **When** a visualizacao e renderizada, **Then** o mes ausente aparece como zero ou vazio de forma consistente com o componente.

## Edge Cases

- Se houver menos de 3 meses completos de dados, a visualizacao deve mostrar apenas os meses disponiveis sem quebrar o layout.
- Categorias com nomes longos devem truncar ou usar tooltip para manter legibilidade.
- Se nao houver dados no periodo, o dashboard deve exibir estado vazio explicito e util.
- Movimentacoes sem categoria devem ser consolidadas como `Sem categoria`.
- Drill down em categoria inexistente ou sem dados nao deve quebrar a pagina.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001 [Dashboard Integration]**: sistema MUST exibir o comparativo de categorias dentro do dashboard atual, sem criar nova rota ou tela separada.
- **FR-002 [Period Scope]**: comparativo MUST cobrir os ultimos 3 meses completos em relacao ao contexto atual do usuario.
- **FR-003 [Category Coverage]**: visualizacao MUST incluir todas as categorias presentes no periodo, incluindo `Sem categoria`.
- **FR-004 [Revenue and Expense Separation]**: visualizacao MUST separar receitas e despesas por categoria, de forma legivel para negocio.
- **FR-005 [Drill Down]**: usuario MUST poder selecionar uma categoria para isolar sua evolucao mensal.
- **FR-006 [Reset Filter]**: usuario MUST poder limpar o drill down e voltar a visao consolidada.
- **FR-007 [Data Source]**: backend MUST fornecer dados agregados suficientes para renderizar o comparativo sem depender de export manual ou processamento pesado no client.
- **FR-008 [No Extra Scope]**: feature MUST permanecer restrita ao comparativo mensal, sem incluir subcategorias, exportacao ou periodo configuravel pelo usuario.
- **FR-009 [Fallbacks]**: ausencia de dados em um ou mais meses MUST ser tratada sem erro, exibindo valores zerados ou estado vazio conforme apropriado.
- **FR-010 [Accessibility/Legibility]**: labels e interacoes MUST permanecer compreensiveis em telas desktop e não podem poluir a interface do dashboard.

### Constitution Alignment _(mandatory)_

- **CA-001 (Princípio I - Bounded Architecture)**: agregacao e regra de negocio devem ficar no Core/UseCase, persistencia/consulta em Infrastructure, exposição via API e visualizacao no client.
- **CA-002 (Princípio II - Security by Default)**: os dados do comparativo devem respeitar o usuario autenticado e nunca cruzar limites de sessao.
- **CA-003 (Princípio III - Quality Gates Executáveis)**: implementacao deve passar por build backend, build frontend, lint frontend e testes do escopo alterado.
- **CA-004 (Princípio IV - Data Integrity)**: agregacoes por categoria e mes devem preservar valores monetarios sem perda de precisao.
- **CA-005 (Princípio V - Operability e Observabilidade Segura)**: falhas de agregacao ou renderizacao devem ser detectaveis por erros acionaveis sem expor PII.

### Key Entities _(include if feature involves data)_

- **ComparativoCategoriaMensal**: agregacao por categoria, mes e tipo de movimentacao.
- **SerieMensalCategoria**: conjunto de valores por mes para uma categoria.
- **VisaoConsolidadaCategorias**: representacao do comparativo geral sem drill down.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: usuario consegue identificar tendencia de pelo menos uma categoria diretamente no dashboard sem exportar dados.
- **SC-002**: a visualizacao exibe receitas e despesas separadamente para cada categoria no periodo de 3 meses.
- **SC-003**: drill down isola uma categoria com sucesso e pode ser desfeito.
- **SC-004**: movimentacoes sem categoria aparecem consolidadas como `Sem categoria`.
- **SC-005**: a feature entrega sem regressao em build, lint e testes do escopo alterado.

## Assumptions

- O comparativo sera embutido no dashboard existente, junto das areas ja renderizadas pelo `DashboardView`.
- O periodo de 3 meses completos sera calculado em relacao ao mes atual do usuario no contexto da tela.
- Recharts sera reutilizado para barras agrupadas, tabela ou combinacao equivalente sem adicionar dependencia.
- A visibilidade de categorias sem dados em determinado mes nao deve impedir a renderizacao do conjunto.

## Open Clarification Log

- **CL-001**: definir no desenho tecnico se a visualizacao principal sera um grafico de barras agrupadas, uma tabela comparativa ou uma combinacao dos dois.
- **CL-002**: definir se o drill down ocorrera por clique no grafico, em chips de categoria ou em ambos.
