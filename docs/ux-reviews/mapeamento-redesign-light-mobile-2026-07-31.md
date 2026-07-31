# Mapeamento de Redesign UI/UX — Light Mode, Mobile-First

> Por: 🎨 UI/UX Agent
> Data: 2026-07-31
> Escopo: client/src/index.css; client/src/util/cardTheme.js; client/src/components/dashboard/chartTooltips.jsx; client/src/components/DashboardDesktopRedesignView.jsx; client/src/components/DashboardMobileView.jsx; client/src/components/LoginView.jsx; client/src/components/InvestmentsView.jsx; client/src/components/WishListView.jsx; client/src/components/VehicleView.jsx; client/src/components/CategoryManagerModal.jsx; client/src/components/TransactionModal.jsx; client/src/components/ExportCsvModal.jsx; client/src/App.jsx
> Tipo: **Mapeamento/planejamento** — nenhum código de aplicação foi alterado. Este documento é insumo para uma sessão de implementação futura.
> Persona alvo: Rafael (dev/PO/usuário único), uso majoritário em celular, decisões financeiras rápidas

---

## 0. Como ler este documento

O pedido do PO, traduzido em requisitos de trabalho:

1. **Light mode de verdade** — não é inverter as variáveis dark, é uma paleta clara nova com contraste, sombra e hierarquia pensados do zero.
2. **Mobile é o alvo primário**, desktop é secundário.
3. **Simples à primeira vista, completo quando necessário** — cada tela abaixo resolve essa tensão explicitamente (o que fica visível sempre vs. o que vira "toque para expandir").
4. **Mais interatividade, sem gimmick** — trocar exibições estáticas por ações diretas (tocar para detalhar, swipe entre períodos, linhas expansíveis).

Cada uma das 12 telas/fluxos abaixo segue o mesmo formato: **Estado atual → Problemas → Direção proposta → Risco/complexidade**.

---

## 1. Achado estrutural que muda o plano de execução

Antes das seções por tela, um achado do código que **reduz o risco do trabalho**: o dashboard desktop já foi construído, em algum momento, com classes Tailwind **claras** no JSX (`bg-white`, `border-slate-200`, `text-slate-700`, `text-slate-800` nos `<article>` de KPI e nos cards de "Investimentos"/"Análise"/"Movimentações" — ver `DashboardDesktopRedesignView.jsx:1842,1952,2023,2178`). O visual dark que se vê hoje na tela **não vem dessas classes** — vem de um bloco de override em `client/src/index.css:168-188`:

```css
.dashboard-desktop-redesign article {
  background: var(--uiux-panel) !important;
  border-color: var(--uiux-border) !important;
}
.dashboard-desktop-redesign .text-slate-700,
.dashboard-desktop-redesign .text-slate-800 {
  color: var(--uiux-text-accent) !important;
}
```

Ou seja: para os `<article>` de nível superior (KPIs, carrossel de cards, blocos de análise), a "pele clara" já existe no markup e está sendo **repintada de escuro via CSS com `!important`**. Isso significa que uma fatia real e visível do trabalho de "ir para light mode" no desktop é **deletar CSS**, não escrever componentes novos. Já os **slides em tela cheia** (investimentos, cartões, transações, gráficos — abertos via `activeSlide`) não passam por esse mecanismo: usam cor hardcoded diretamente no JSX (`text-[#dbe3ff]`, `bg-[#10152d]`, `border-[#2a3554]`, dezenas de ocorrências) e vão exigir edição linha a linha.

Isso não muda a paleta proposta nem o plano mobile-first, mas muda a estimativa de esforço por tela — está refletido na coluna Risco/complexidade de cada seção.

---

## 2. Tokens de design — Light Mode

Substituto direto para as variáveis `--uiux-*` / `--color-*` hoje em `client/src/index.css:4-57`. Valores concretos, prontos para virar CSS.

### 2.1 Camadas de fundo (background layers)

| Token | Valor | Uso |
|---|---|---|
| `--bg-app` | `#F7F8FB` | Fundo geral da aplicação (substitui `--uiux-bg-a: #0e0e0e`) |
| `--bg-surface` | `#FFFFFF` | Cards, painéis, modais (substitui `--uiux-panel`) |
| `--bg-surface-raised` | `#FFFFFF` com `--shadow-md` | Cards em destaque/hover (KPI ativo, slide aberto) |
| `--bg-surface-sunken` | `#EEF1F6` | Inputs, áreas de filtro, chips não-selecionados (substitui `#10152d`) |
| `--bg-inverse` | `#12121A` | Superfícies escuras propositais (ex.: bottom sheet de confirmação, tooltip de gráfico — ver 2.6) |

### 2.2 Texto

| Token | Valor | Contraste (sobre `--bg-surface`) | Uso |
|---|---|---|---|
| `--text-primary` | `#12141C` | 17.9:1 | Títulos, valores monetários principais |
| `--text-secondary` | `#4B5169` | 8.1:1 | Corpo de texto, labels |
| `--text-tertiary` | `#767C93` | 4.6:1 | Texto auxiliar, timestamps, helper text (ainda AA) |
| `--text-disabled` | `#A6ABBD` | — (não usar para texto com significado) | Placeholders, estados desabilitados |
| `--text-on-accent` | `#FFFFFF` | — | Texto sobre botões/badges coloridos |

### 2.3 Bordas e divisores

| Token | Valor | Uso |
|---|---|---|
| `--border-subtle` | `#E7E9F0` | Divisórias internas, separador de lista |
| `--border-default` | `#DBDFEA` | Borda padrão de card/input |
| `--border-strong` | `#C4C9DA` | Borda de foco secundário, hover de card |

### 2.4 Cor de marca / ação

| Token | Valor | Uso |
|---|---|---|
| `--accent-600` | `#4F46E5` (indigo) | Botão primário, link ativo, tab selecionada |
| `--accent-500` | `#6366F1` | Hover de accent-600 |
| `--accent-100` | `#E7E6FB` | Fundo de badge/chip com acento (ex.: tag de categoria selecionada) |
| `--accent-50` | `#F3F2FE` | Fundo sutil de item ativo em lista/nav |

### 2.5 Semânticas (sucesso, alerta, perigo)

Mantém o princípio atual do `cardTheme.js` (derivar shades a partir de um hue), mas com base clara em vez de escura:

| Token | Valor | Uso |
|---|---|---|
| `--success-700` | `#15803D` | Texto de valor positivo (receita, saldo positivo) |
| `--success-100` | `#DCFCE7` | Fundo de badge/tag positiva |
| `--success-border` | `#86EFAC` | Borda de card/tag positiva |
| `--danger-700` | `#B91C1C` | Texto de valor negativo (despesa, saldo negativo, exclusão) |
| `--danger-100` | `#FEE2E2` | Fundo de badge/tag negativa |
| `--danger-border` | `#FCA5A5` | Borda de card/tag negativa |
| `--warning-700` | `#B45309` | Alertas de orçamento estourado, vencimento próximo |
| `--warning-100` | `#FEF3C7` | Fundo de badge de alerta |
| `--info-700` | `#1D4ED8` | Saldo/neutro informativo (linha "saldo" no gráfico) |
| `--info-100` | `#DBEAFE` | Fundo de badge informativo |

Categorias (hoje geradas dinamicamente em `getCategoryStandardColor()` a partir do hue salvo por categoria): manter a mesma função, só trocar a fórmula de S/L para o modo claro — sugestão: `hsl(hue, 65%, 94%)` de fundo, `hsl(hue, 55%, 35%)` de texto, `hsl(hue, 45%, 82%)` de borda. Isso preserva "cor por categoria escolhida pelo usuário" sem herdar o dark.

### 2.6 Sombra e elevação

Light mode depende de sombra (não de contraste de painel) para comunicar hierarquia — hoje isso é feito com `border` + `background` diferentes por camada, o que não existe mais quando tudo é branco.

| Token | Valor |
|---|---|
| `--shadow-xs` | `0 1px 2px rgba(16, 24, 40, 0.05)` |
| `--shadow-sm` | `0 1px 3px rgba(16, 24, 40, 0.08), 0 1px 2px rgba(16, 24, 40, 0.04)` |
| `--shadow-md` | `0 4px 12px rgba(16, 24, 40, 0.08), 0 2px 4px rgba(16, 24, 40, 0.04)` |
| `--shadow-lg` | `0 12px 24px rgba(16, 24, 40, 0.10), 0 4px 8px rgba(16, 24, 40, 0.04)` |
| `--shadow-modal` | `0 24px 48px rgba(16, 24, 40, 0.18)` |

### 2.7 Gráficos e tooltips (`chartTooltips.jsx`, `cardTheme.js`)

- Linhas do gráfico de fluxo (`CHART_THEME_COLORS`): manter os *fills* atuais (`#059669` verde, `#E11D48` vermelho, `#2563EB` azul — já são vibrantes o bastante para fundo claro), trocar apenas `line`/`glow` para tons compatíveis com fundo branco (glow muito sutil, ex. `rgba(5,150,105,0.12)`).
- Tooltip (`renderChartTooltip`, `renderCategoryComparisonTooltip`, `renderCategoryPieTooltip` em `chartTooltips.jsx:62-170`): usar `--bg-inverse` (`#12121A`) como fundo do tooltip com texto branco — tooltip escuro sobre gráfico claro é um padrão de contraste consagrado (Stripe, Linear, Vercel fazem isso) e evita ficar "tudo branco em cima de branco".
- `cardTheme.js` (`mixWithWhite`/`mixWithBlack`, `getThemePalette`, `getBackLayerStyle`, `getFrontLayerStyle`): a lógica de mistura de cor é reaproveitável (ladder: já existe no código, não reescrever) — só os pontos de mistura mudam de "misturar com branco para clarear sobre fundo escuro" para "misturar com preto/cinza-escuro para dar contraste sobre fundo claro". Ex.: `backName`/`usedText` hoje usam `mixWithWhite(themeColor, 0.58/0.62)` (clareia o tema para ficar legível no escuro); em light mode o equivalente é `mixWithBlack(themeColor, 0.35-0.45)` (escurece o tema para ficar legível no claro, mantendo o hue escolhido pelo usuário no cartão).

---

## 3. Filosofia de layout mobile-first: unificar ou manter duas views?

**Situação hoje:** `App.jsx:400` faz um switch binário por `window.innerWidth < 1024` entre `DashboardMobileView.jsx` (1089 linhas) e `DashboardDesktopRedesignView.jsx` (2383 linhas) — dois componentes que buscam os mesmos dados (via os mesmos hooks `useDashboardFinancials`, `useCardSummaries`, `useTransactionFilters`, `useTransactionActions`) mas reimplementam o layout e boa parte da lógica de exibição do zero, cada um com seu próprio JSX de KPI, carrossel de cartões, lista de transações e tela de investimentos. Um achado concreto do tamanho do problema: a tela de investimentos mobile (`DashboardMobileView.jsx:826`, `renderInvestmentsScreen`) é uma versão simplificada escrita à mão, **não** reaproveita `InvestmentsView.jsx` — ao contrário do desktop, que importa e monta `InvestmentsView` inteiro dentro do slide (`DashboardDesktopRedesignView.jsx:59,307`). Isso já gerou divergência funcional: **o simulador de esforço de compra e a lista completa de metas de investimento existem no desktop e não existem na versão mobile**.

**Achado ainda mais crítico para a decisão:** a navegação lateral em `App.jsx:442-529` (que dá acesso a "Conquistas"/Wishlist e "Manutenção Veicular"/Vehicle) só é renderizada no branch desktop (`!isMobileViewport`). No branch mobile (`App.jsx:400-439`) só existe `DashboardMobileView`. **Isso significa que hoje, no celular, não há nenhum caminho de UI para abrir WishListView ou VehicleView** — são telas inteiras inacessíveis em mobile, não é "pior organizadas", é ausentes. Dado que o pedido é "mobile é o alvo primário", esse é o problema #1 a resolver, não um detalhe de polish.

### Recomendação: convergir para **um componente responsivo por tela**, não duas árvores de componentes paralelas

Razões:

1. **O custo real hoje não é o de ter dois layouts — é o de manter duas fontes de verdade de UI.** Cada nova feature (o simulador de esforço, por ex.) precisa ser escrita duas vezes ou fica desalinhada, como já aconteceu.
2. **Mobile ficando primário torna esse desalinhamento mais grave, não menos** — se mobile for a build de referência, toda regressão em paridade de features passa a ser regressão no fluxo principal do usuário.
3. **Os dois componentes já compartilham os hooks de dados** (`useDashboardFinancials`, `useCardSummaries`, etc.) — a divergência está só na camada de apresentação. Isso é exatamente o cenário em que vale a pena consolidar: a lógica cara (fetch, cálculo, filtros) já está isolada; falta isolar a apresentação.
4. Reescrever tudo em um único componente monolítico de ~3000 linhas seria pior — a resposta não é "1 arquivo", é "1 árvore de componentes menores, compostos de forma diferente por breakpoint via Tailwind responsivo (`sm:`/`lg:`) e, onde o layout realmente diverge (ex.: bottom-tab-bar mobile vs. sidebar desktop), via *composição* (`<Shell>` que recebe `nav` como slot), não via `if (isMobile) return <OutroComponente />`".

### Como migrar sem virar um projeto de meses

Não é big-bang. Sequência sugerida (ver também a seção de punch list):

1. **Fase 1 (concreta, baixo risco):** ao redesenhar cada tela para light mode, já quebrar em subcomponentes de apresentação puros (ex.: `KpiCard`, `TransactionRow`, `CategoryBadge`, `InvestmentSummaryCard`) que recebem props e não sabem se estão em mobile ou desktop. Isso já é valor mesmo se, no curto prazo, `DashboardMobileView` e `DashboardDesktopRedesignView` continuarem existindo como "orquestradores" — eles passam a montar os mesmos blocos, só que em grades diferentes.
2. **Fase 2:** trocar o switch binário de `App.jsx:400` por navegação unificada (mesma sidebar/nav vira bottom-tab em mobile e sidebar em desktop, ambas renderizando os mesmos 4 destinos: Dashboard, Conquistas, Veículos, + o que fizer sentido). Isso já resolve o bug de acesso ausente no mobile, independente de a Fase 3 acontecer.
3. **Fase 3 (opcional, pode nunca ser necessária):** fundir os dois orquestradores de dashboard em um só com layout condicional via CSS/Tailwind. Só vale a pena se, depois da Fase 1, o "orquestrador" mobile e o desktop ainda tiverem muita duplicação de JSX de composição (não de estilo).

Não recomendo pular direto para "um arquivo só" sem passar pela Fase 1 — o risco de regressão em uma tela usada diariamente para decisão financeira é alto demais para reescrever de uma vez.

---

## 4. Telas e fluxos

### 4.1 Dashboard Home (KPIs + carrossel de cartões)

**Estado atual:** `DashboardDesktopRedesignView.jsx` renderiza uma grade fixa por altura de viewport (`useViewportDensity`, `client/src/hooks/useViewportDensity.js:102-116` — calcula `hUtil` como `viewportHeight - headerHeight - paddings` e distribui 3 "seções" por percentual fixo da altura restante). `DashboardMobileView.jsx` renderiza uma versão separada com `renderHomeScreen()`, scroll vertical normal e bottom-tab-bar fixa.

**Problemas:**
- O layout desktop é **calculado em pixels de altura de tela**, não em conteúdo — está desenhado para caber sem scroll em resoluções específicas (há blocos de CSS dedicados a `1440x900` e `1366x768` em `index.css:496-626`). Isso é o oposto de mobile-first: é "desktop-fixo-first".
- KPIs (Receita/Despesa/Saldo/Investimentos) competem por espaço com o carrossel de cartões de crédito e a lista de categorias na mesma tela sem hierarquia clara de "o que eu preciso ver primeiro hoje".
- Paleta mista: `<article>` com classes claras que são repintadas de escuro por CSS (seção 1) — inconsistência visual sutil que só aparece ao inspecionar (ex. algum estado de hover pode vazar a cor clara original).

**Direção proposta:** Mobile como referência de layout, desktop como grade de múltiplas colunas do mesmo conteúdo (não um layout redesenhado à parte).
- **Primário (sempre visível, above the fold em mobile):** saldo do mês em destaque (tipografia grande, `--text-primary`), variação vs. mês anterior como badge colorido (`--success-100`/`--danger-100`), seletor de mês por swipe horizontal (gesto real, hoje são dois botões "Mês -"/"Mês +" em `DashboardMobileView.jsx:953-969` — trocar por swipe no card de saldo com os botões como fallback acessível).
- **Secundário (scroll, 1-2 toques):** cards de Receita/Despesa/Investimento em linha horizontal com scroll snap (não grid 2x2 fixo) — cada card abre o detalhe ao toque, igual ao padrão de "slide" que já existe no desktop hoje (bom padrão, deve virar o padrão mobile também).
- **Progressive disclosure:** o carrossel de cartões de crédito vira uma seção colapsável abaixo do resumo, com o cartão "em uso" (mais recente) sempre visível e os demais atrás de "ver todos os cartões" — hoje todos os cartões competem por espaço igual independente de uso recente.
- Trocar o cálculo de altura por pixel (`hUtil`) por scroll natural com `min-height` de seção — isso também resolve o problema de telas mobile com teclado aberto ou barra de navegação do sistema variável, que o cálculo atual não considera (é só para desktop).

**Risco/complexidade:** **Grande, estrutural.** É a tela mais usada e a que mais mistura cálculo de layout com apresentação. Requer novos componentes (`KpiCard`, `MonthSwiper`) e remoção do sistema de densidade por pixel.

---

### 4.2 Gráficos / Análise de Categoria ("slide charts")

**Estado atual:** Acessível via toque no card "Análise de categorias" no desktop (`DashboardDesktopRedesignView.jsx:2023-2038`, `activeSlide === "charts"`) e via tab "Charts" no bottom-nav mobile (`DashboardMobileView.jsx:933`). Mostra: gráfico de área (receita/despesa/saldo por dia via Recharts `AreaChart`), ranking de categorias em duas colunas, pizza de categorias, e comparativo mês atual vs. anterior.

**Problemas:**
- Quatro visualizações diferentes (linha, ranking em coluna dupla, pizza, comparativo em barra) empilhadas na mesma tela sem abas — sobrecarga cognitiva em uma tela que já é "a tela de detalhe", não a home.
- Ranking em "duas colunas" (`slideCategoryLeftColumn`/`slideCategoryRightColumn`, `DashboardDesktopRedesignView.jsx:1130-1142`) é um layout pensado para largura desktop; em mobile isso provavelmente vira uma leitura em zigue-zague (esquerda→direita→próxima linha esquerda de novo) — ruim para leitura vertical natural de celular.
- Tooltip do gráfico (`chartTooltips.jsx`) hardcoded em hex escuro (`#15172a`, `#32375e`) — não vem de token, então qualquer troca de tema exige achar essas strings manualmente (assinalado na seção 2.7).

**Direção proposta:**
- Trocar "tudo empilhado" por **abas dentro da tela de análise**: Fluxo (linha) / Categorias (ranking + pizza) / Comparativo — mobile mostra uma aba por vez com swipe entre elas, desktop pode mostrar 2 lado a lado se a viewport permitir, mas não é obrigatório.
- Ranking de categorias: lista vertical única (não duas colunas), cada linha já mostra barra de progresso proporcional ao gasto — isso substitui a necessidade de olhar para a pizza ao lado para entender proporção, então a pizza pode virar secundária ("ver como pizza" como toggle, não uma segunda visualização sempre visível).
- Toque numa categoria do ranking já filtra a lista de transações para aquela categoria (interatividade real: hoje o ranking é só leitura).

**Risco/complexidade:** **Médio.** Estrutura de dados (`useDashboardFinancials`) já entrega os dados prontos; o trabalho é de composição visual e de contrato de interação (abas + filtro cruzado), não de novo cálculo.

---

### 4.3 Cartões / Gestão de Cartões de Crédito ("slide cards")

**Estado atual:** `DashboardDesktopRedesignView.jsx:311-746`, slide dedicado com colunas de cartão (`cardColumns`), cada cartão mostrando limite usado, progresso, movimentações do cartão e formulário de edição/criação inline. Usa `cardTheme.js` para gerar gradientes de cartão a partir de uma cor escolhida pelo usuário (`getFrontLayerStyle`, `getBackLayerStyle` — visual de "cartão físico" empilhado). Mobile tem sua própria tela de cartões (`renderCardsScreen`, referenciada em `DashboardMobileView.jsx:937`).

**Problemas:**
- O efeito visual de "cartão empilhado" (`uiux-card-layer-back-1/2`, `index.css:273-337`) é bonito mas caro em espaço vertical — em mobile, onde a tela é estreita e alta, empilhar cartões fisicamente pode forçar scroll excessivo antes de chegar às movimentações.
- Criar/editar cartão é inline dentro do slide (formulário aparece embutido) — em mobile isso significa formulário longo dentro de uma tela que já tem scroll, sem foco (não vira modal/bottom-sheet dedicado).
- Ação de "usar este cartão" fica em texto pequeno de link (~11px) — alvo de toque abaixo do recomendado para mobile.

**Direção proposta:**
- Manter o visual de "cartão empilhado" como identidade visual (é um bom diferencial), mas em mobile mostrar **um cartão por vez** com swipe horizontal entre cartões (carrossel real, não pilha vertical) — o efeito 3D de camada atrás funciona melhor como affordance de "arraste para o próximo" do que como lista vertical.
- Criar/editar cartão vira bottom-sheet modal (desliza de baixo, ocupa a tela), não formulário inline — separa claramente "estou vendo o cartão" de "estou editando o cartão".
- Movimentações do cartão: mostrar as 3-5 mais recentes com "ver todas" (link para a lista de transações já filtrada por aquele cartão) em vez de lista completa sempre expandida.

**Risco/complexidade:** **Médio-grande.** Reaproveita bastante da lógica de `cardTheme.js` e dos dados de `useCardSummaries`, mas o carrossel horizontal com swipe é um componente de interação novo (hoje não existe swipe/gesture em nenhuma tela do app).

---

### 4.4 Movimentações / Lista de Transações ("slide transactions")

**Estado atual:** Lista com busca por texto e filtro por tipo (`slideTransactionSearch`/`slideTransactionFilter`, `DashboardDesktopRedesignView.jsx:785-901`), cada linha mostra nome, categoria, valor, com ação de editar/excluir. Também existe uma versão resumida na home (`sortedMovimentacoes`, últimas N transações).

**Problemas:**
- Filtro é só por "tipo" (entrada/saída) e busca textual — não há filtro por categoria, por cartão ou por intervalo de datas dentro da lista (existe só no CSV export). Para "visualização completa" pedida pelo PO, esse é o gap mais direto.
- Exclusão não tem confirmação nem desfazer (mesmo achado já registrado em `fluxos-criticos-2026-05-25.md`, ainda válido — não foi corrigido entre os dois documentos anteriores e este).
- Linha de transação não é expansível — se o usuário quer ver descrição completa, precisa abrir o modal de edição (ação pesada para uma consulta leve).

**Direção proposta:**
- Linha de transação **expansível ao toque** (accordion inline): toque expande para mostrar descrição completa, categoria com ícone, e ações (editar/excluir) — sem abrir modal para só ler. Editar continua abrindo o modal completo.
- Adicionar filtro por categoria e por cartão como chips horizontais roláveis acima da lista (reaproveita o mesmo componente de chip que a tela de categorias vai usar).
- Exclusão: swipe-to-delete com confirmação (padrão mobile nativo) + toast com "Desfazer" por alguns segundos, em vez de excluir direto no clique do ícone de lixeira.

**Risco/complexidade:** **Pequeno-médio.** Maior parte é composição de UI sobre dados que já existem (`useTransactionFilters` já entrega a lista filtrada); accordion e swipe-to-delete são os únicos elementos de interação novos.

---

### 4.5 Categorias / Comparativo de Categorias

**Estado atual:** Ranking de categorias e comparativo mês-a-mês vivem dentro do slide de gráficos (seção 4.2) — não é uma tela separada hoje, é uma subseção. Gestão de categorias (criar/editar/excluir) é um modal separado (`CategoryManagerModal.jsx`, seção 4.10).

**Problemas:**
- Consumir e gerenciar categoria são dois fluxos desconectados (ver dados de gasto por categoria não leva a "editar essa categoria", e vice-versa) — para editar o orçamento de uma categoria que estourou, o usuário precisa sair da análise, abrir o modal de categorias, achar a categoria de novo.
- Alertas de orçamento estourado (`exceededAlertsLeftColumn`/`exceededAlertsRightColumn`) ficam em duas colunas dentro do slide, mesma crítica de leitura em zigue-zague da seção 4.2.

**Direção proposta:**
- Do ranking de categoria (seção 4.2), toque longo ou ícone de atalho abre direto a edição daquela categoria no `CategoryManagerModal` pré-selecionada — fecha o ciclo "vi que estourei → ajustei o orçamento" em dois toques.
- Alertas de orçamento estourado sobem para o topo da lista de categorias (não ficam em bloco separado) — o estado "estourado" já é a informação mais acionável daquela tela, deveria ser a primeira coisa vista, não uma seção à parte competindo por atenção.

**Risco/complexidade:** **Pequeno.** É majoritariamente reorganização de informação já existente + um atalho de navegação entre telas que já existem.

---

### 4.6 Investimentos

**Estado atual:** `InvestmentsView.jsx` (1061 linhas) é usado inteiro dentro do slide desktop (`DashboardDesktopRedesignView.jsx:307`). Tem: calculadora de esforço de compra ("quantas horas de trabalho custa isso"), simulador de juros compostos, cards de investimento com modal de detalhe/histórico, resumo com saldo total investido. Mobile tem uma versão paralela e mais simples (`renderInvestmentsScreen`, `DashboardMobileView.jsx:826`) que **não inclui** a calculadora de esforço nem o simulador completo (achado da seção 3).

**Problemas:**
- Paridade de features quebrada entre mobile e desktop (o gap mais concreto de "mobile bolted on" do app inteiro).
- Grid `md:grid-cols-3` (`InvestmentsView.jsx:668`) é desktop-first — em telas estreitas o conteúdo empilha, mas foi desenhado pensando em 3 colunas primeiro, não em pensar "o que cabe numa tela de 375px" primeiro.
- Simulador e calculadora de esforço competem por atenção com a lista de investimentos na mesma tela sem hierarquia (achado similar ao de `fluxos-criticos-2026-05-25.md` sobre o simulador quebrar com taxa 0 — não verificado neste passe, mas a estrutura de UI que mistura simulação com dado real permanece).

**Direção proposta:**
- Eliminar a duplicação: mobile passa a usar os mesmos subcomponentes que desktop (após a Fase 1 da seção 3), garantindo que calculadora de esforço e simulador existam em ambos.
- Home da tela de investimentos: saldo total + lista de investimentos (primário). Calculadora de esforço e simulador de juros viram **ferramentas** acessíveis por abas ou botão "Simular", não seções sempre visíveis competindo com o dado real da carteira — são ações que o usuário busca ocasionalmente, não status que ele checa toda vez.
- Cada investimento na lista já mostra rendimento do mês como badge colorido (sucesso/neutro), toque abre o histórico completo (modal já existe, `InvestmentsView.jsx:470-628` — manter o padrão, só re-estilizar).

**Risco/complexidade:** **Médio.** Muito da lógica de cálculo já existe e é reaproveitável; o trabalho é de reorganização de hierarquia + eliminar a duplicação mobile/desktop.

---

### 4.7 WishList / Conquistas (custo de oportunidade)

**Estado atual:** `WishListView.jsx` (202 linhas) — calculadora de "quantas horas de trabalho custam suas metas" no topo, formulário de nova meta, lista de metas com progresso. **Inacessível em mobile hoje** (achado da seção 3 — não há rota de navegação para essa tela quando `isMobileViewport` é true).

**Problemas:**
- Bloqueante: não existe no mobile. Qualquer redesign visual é secundário a resolver isso primeiro.
- Grid `md:grid-cols-3` (`WishListView.jsx:121`) mesmo padrão desktop-first das outras telas.
- Ações de excluir meta (`WishListView.jsx:188`, ícone com `hover:text-[#f08f9f]`) sem confirmação.

**Direção proposta:**
- Prioridade zero: entrar no rebalanceamento de navegação da seção 3 (Fase 2) para existir em mobile.
- Uma vez acessível: calculadora de esforço por hora vira um card de referência fixo no topo (colapsável, já que é consultado ocasionalmente), lista de metas com barra de progresso é o conteúdo primário, "adicionar meta" vira um botão de ação flutuante (FAB) ou item fixo no fim da lista em vez de formulário sempre expandido ocupando a tela toda antes mesmo de ter uma meta cadastrada.
- Confirmação leve (mesma abordagem de swipe + desfazer da seção 4.4) para exclusão.

**Risco/complexidade:** **Pequeno para o visual, mas depende da Fase 2 da seção 3 (navegação) para virar utilizável em mobile — sem isso, redesenhar essa tela não entrega valor ao usuário real (que é majoritariamente mobile).**

---

### 4.8 Manutenção Veicular

**Estado atual:** `VehicleView.jsx` (728 linhas) — cadastro de veículo, cards de resumo (total gasto, km atual, próxima revisão, status), histórico de manutenção em tabela, alerta de km para revisão. **Também inacessível em mobile hoje**, mesmo achado da seção 3.

**Problemas:**
- Mesmo bloqueante de acesso da seção 4.7.
- `grid-cols-1 md:grid-cols-4` para os 4 cards de resumo (`VehicleView.jsx:391`) — em mobile empilha 4 cards verticais antes de chegar no conteúdo principal (histórico), o que é muito scroll para chegar à informação acionável.
- Histórico em tabela (`fluxos-criticos-2026-05-25.md` já apontou falta de `caption`/`scope` — continua relevante, e tabela HTML tradicional é um padrão ruim para tela estreita, geralmente vira scroll horizontal ou colapso ilegível).

**Direção proposta:**
- Prioridade zero, mesma razão da seção 4.7: entrar na Fase 2 de navegação antes de qualquer redesign visual valer a pena.
- Os 4 cards de resumo colapsam para 2 KPIs primários visíveis (gasto total do veículo selecionado, próxima revisão/alerta de km) + 2 secundários atrás de "ver detalhes".
- Histórico de manutenção: trocar tabela por lista de cards (um por manutenção), cada card com data, tipo de serviço, valor, km — mesmo padrão de "linha de transação" da seção 4.4, reaproveitando o componente.
- Se houver mais de um veículo, seletor por abas/chips no topo (hoje não ficou claro no código lido se múltiplos veículos coexistem visualmente bem — vale confirmar no detalhamento de implementação).

**Risco/complexidade:** **Médio**, mesma ressalva de dependência da Fase 2 de navegação.

---

### 4.9 Login

**Estado atual:** `LoginView.jsx` — **já é a única tela do app inteiramente em light mode** (`bg-slate-50`, card branco, `focus:ring-emerald-500`, labels associadas corretamente com `htmlFor`/`id`). Simples: email, senha, botão de entrar, erro inline.

**Problemas:**
- Nenhum problema estrutural de light mode aqui — é o outlier positivo do app.
- Menor: não tem "esqueci minha senha" nem "lembrar-me", mas isso é decisão de produto, não achado de UX per se (app de uso pessoal/único usuário, então baixa prioridade).
- Botão emerald-500 destoa da paleta de acento proposta na seção 2 (indigo `--accent-600`) — pequeno ajuste de consistência, não um redesenho.

**Direção proposta:**
- Usar esta tela como **referência viva** dos tokens da seção 2: trocar `emerald-500` por `--accent-600`, `slate-*` pelos tokens novos de texto/borda. Como já está estruturalmente correta (labels, foco, contraste), é a tela mais barata para validar a paleta nova antes de aplicá-la em telas mais complexas.

**Risco/complexidade:** **Pequeno, puramente visual (CSS/Tailwind swap).** Bom candidato a "flagship screen" de baixo risco para a punch list (ver seção 5) — mas por já estar em light mode, tem menos impacto percebido pelo usuário que redesenhar o Dashboard Home.

---

### 4.10 Modal de Categorias (`CategoryManagerModal`)

**Estado atual:** Modal com toggle de tipo (Receita/Despesa), formulário de nova categoria (nome, orçamento, cor, ícone), lista de categorias existentes com edição/exclusão inline. Já tem `aria-live` para status (`CategoryManagerModal.jsx:279`) e `focus-visible:ring` em vários elementos — mais maduro em acessibilidade que outras telas.

**Problemas:**
- Cores hardcoded em hex (`bg-[#10152d]`, `text-[#dbe3ff]`, dezenas de ocorrências) — trabalho de find-and-replace por tokens, mas mecânico.
- Lista de categorias e formulário de criação competem por espaço na mesma tela de modal — em mobile (modal em tela cheia ou quase) isso significa scroll para ver as categorias existentes depois de abrir o formulário.

**Direção proposta:**
- Separar em duas "camadas" dentro do mesmo modal: lista de categorias como estado padrão ao abrir, "+ Nova categoria" como ação que expande um formulário (não formulário sempre visível no topo).
- Cor e ícone de categoria: seletor visual (grade de cores/emoji) em vez de input cru — já há um `<input type="color">` (linha 364, `h-11 p-1`), mas vale confirmar se o ícone é texto livre ou emoji picker; se for texto livre, considerar padronizar como emoji picker nativo do teclado mobile (não requer biblioteca nova).

**Risco/complexidade:** **Pequeno-médio.** Reestruturação de layout dentro do modal + swap de cor.

---

### 4.11 Modal de Transação (`TransactionModal`)

**Estado atual:** Modal mais complexo do app (651 linhas) — toggle Receita/Despesa, campos condicionais (categoria, veículo+km quando é gasto de veículo, vínculo com cartão de crédito, recorrência fixa com opções de tipo/período). Já tem foco/trap de teclado básico e mensagem de erro visível (`TransactionModal.jsx:356`).

**Problemas:**
- Muitos campos condicionais aparecem/desaparecem no mesmo formulário linear — em mobile, isso é a tela mais propensa a ficar "labiríntica" (o usuário rola, marca uma opção, novos campos aparecem, rola mais).
- `grid-cols-1 md:grid-cols-2` (`TransactionModal.jsx:361,456`) — campos lado a lado em desktop empilham em mobile, ordem de tab pode não seguir a ordem visual esperada depois de empilhar.
- Vínculo com cartão de crédito abre uma subseção com mais campos dentro do formulário (`TransactionModal.jsx:504-568`) — três níveis de aninhamento condicional (tipo → é gasto fixo? → é no cartão?) num único scroll vertical.

**Direção proposta:**
- Dividir mentalmente o formulário em "essencial" (nome, valor, data, tipo, categoria — sempre visível, cabe numa tela sem rolar em mobile) e "detalhes" (recorrência, cartão, veículo — atrás de uma seção expansível "Mais opções"), já que a maioria dos lançamentos do dia a dia não usa essas opções avançadas.
- Considerar (não obrigatório, é uma ideia de interação, não redesenho de dado): ação rápida de "+" na home (seção 4.1) abrir direto no modo essencial, com "mais opções" a um toque de distância, em vez de sempre abrir o formulário completo.

**Risco/complexidade:** **Médio.** É reorganização de um formulário já funcional, não reescrita de lógica — mas exige cuidado para não quebrar os fluxos condicionais existentes (testar cada combinação: gasto+cartão, gasto+veículo, receita+recorrente, etc.).

---

### 4.12 Modal de Exportação CSV (`ExportCsvModal`)

**Estado atual:** O componente mais recente e mais bem construído do ponto de vista de acessibilidade (commit `d5258fb`, achado já resolvido aqui em relação ao `fluxos-criticos-2026-05-25.md`): tem `dialogRef` com foco inicial e trap de teclado manual (`ExportCsvModal.jsx:15-75`), `role="alert"` na mensagem de erro. Formulário simples: data inicial, data final, botão exportar.

**Problemas:**
- Nenhum problema estrutural — é o componente mais próximo do "padrão de qualidade" que as outras telas deveriam seguir (foco, teclado, erro acessível).
- Só cor hardcoded em hex, mesmo padrão de swap mecânico das outras telas.

**Direção proposta:**
- Usar este componente como **template de referência de acessibilidade** para os outros modais (`CategoryManagerModal`, `TransactionModal`) durante a implementação — o trap de foco feito aqui devia ser extraído para um hook reutilizável (`useFocusTrap` ou similar) e aplicado nos outros dois modais, que hoje não têm o mesmo nível de tratamento.
- Visualmente, só precisa do swap de paleta (seção 2).

**Risco/complexidade:** **Pequeno, puramente visual.** Bônus: extrair o focus-trap daqui para um hook comum é pequeno e melhora as outras telas de graça.

---

## 5. Punch list priorizada (P0/P1/P2)

Sequenciado para side project solo: valor visível cedo, sem big-bang. P0 = próximo, P1 = na sequência, P2 = quando sobrar tempo/depois de validar P0-P1 com uso real.

### P0 — Fundação + primeiro impacto visível

1. **Tokens de light mode no `index.css`** (seção 2) — substituir `--uiux-*`/`--color-*`, criar as novas variáveis. Sem isso nada mais começa. *Visual/CSS, pequeno.*
2. **Corrigir acesso mobile a Wishlist e Veículos** (seção 3, Fase 2) — hoje são telas invisíveis no celular; é o bug de UX mais grave encontrado neste mapeamento, independente de redesign visual. *Estrutural, pequeno-médio — é rota de navegação, não redesenho de tela.*
3. **Login como flagship de validação de paleta** (seção 4.9) — já está em light mode estruturalmente, troca de tokens aqui é rápida e serve de prova visual antes de investir nas telas grandes. *Visual, pequeno.*
4. **Dashboard Home mobile-first** (seção 4.1) — é a tela mais usada; entregar ela em light mode + hierarquia nova é o que o PO vai perceber primeiro no dia a dia. *Estrutural, grande — mas é o item que justifica o projeto inteiro, não adiar.*

### P1 — Consolidação e telas de detalhe

5. Modal de Transação reorganizado em essencial/avançado (seção 4.11).
6. Slides de Cartões e Movimentações em light mode + interações novas (swipe entre cartões, accordion de transação, swipe-to-delete) (seções 4.3, 4.4).
7. Investimentos: eliminar duplicação mobile/desktop e reorganizar hierarquia (seção 4.6) — depende parcialmente da Fase 1 de componentização (seção 3).
8. Slide de Gráficos/Análise com abas em vez de tudo empilhado (seção 4.2).

### P2 — Polish, telas secundárias, consolidação arquitetural

9. WishList e Vehicle redesenhados visualmente (seções 4.7, 4.8) — acesso já corrigido no P0, aqui é só a qualidade visual/interação.
10. `CategoryManagerModal` reorganizado (lista vs. formulário) (seção 4.10).
11. Extrair focus-trap do `ExportCsvModal` como hook reutilizável e aplicar nos outros modais (seção 4.12).
12. Fase 3 da seção 3 (fusão real dos orquestradores de dashboard mobile/desktop em um componente responsivo único) — só entra aqui porque só compensa depois que a Fase 1 (componentização) já tiver reduzido a duplicação a ponto de a fusão ser trivial.

---

## Checklist resumido (para a sessão de implementação)

- [ ] Tokens `--bg-*`/`--text-*`/`--border-*`/`--accent-*`/`--success/danger/warning/info-*`/`--shadow-*` adicionados ao `index.css`
- [ ] `--uiux-*` e `--color-*-gradient/border/text` removidos ou marcados deprecated após migração
- [ ] Bloco `.dashboard-desktop-redesign article { ... !important }` removido (era override para dark, sem função em light mode)
- [ ] Navegação mobile dá acesso a Dashboard, Conquistas e Manutenção Veicular (paridade com desktop)
- [ ] `LoginView` migrado para os tokens novos (validação de paleta)
- [ ] Dashboard Home mobile redesenhado com hierarquia primário/secundário/progressive-disclosure definida na seção 4.1
- [ ] Cada tela testada em pelo menos 375px de largura antes de considerar "pronta"
