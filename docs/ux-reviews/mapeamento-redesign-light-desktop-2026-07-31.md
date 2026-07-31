# Mapeamento de Redesign UI/UX — Light Mode, Desktop

> Por: 🎨 UI/UX Agent
> Data: 2026-07-31
> Escopo: client/src/index.css; client/src/components/DashboardDesktopRedesignView.jsx; client/src/components/dashboard/chartTooltips.jsx; client/src/util/cardTheme.js; client/src/util/dashboardFormatters.js; client/src/hooks/useViewportDensity.js, useDashboardFinancials.js, useCardSummaries.js, useTransactionFilters.js, useTransactionActions.js, useCsvExport.js; client/src/components/InvestmentsView.jsx; client/src/App.jsx
> Tipo: **Mapeamento/planejamento** — nenhum código de aplicação foi alterado. Este documento é insumo para uma sessão de implementação futura.
> Complementa: `docs/ux-reviews/mapeamento-redesign-light-mobile-2026-07-31.md` (mobile, já implementado em parte — tokens do §2 daquele documento já estão em produção em `index.css`)

---

## 0. Como ler este documento

O mapeamento mobile já definiu a paleta, os princípios e o vocabulário. Este documento não reabre nenhuma dessas decisões — ele aplica o mesmo sistema a uma superfície estrutural diferente:

1. **Não é um novo design system.** É migração de `DashboardDesktopRedesignView.jsx` (e do que ele monta) para os tokens que já existem em `index.css`. Se algo aqui parecer "estou inventando uma cor nova", é sinal de que devia estar reaproveitando um token do §2 do mapeamento mobile.
2. **Desktop é secundário no produto, mas é onde a tela mais densa vive.** Multi-coluna, hover, e quatro "slides" em tela cheia que não existem em mobile. A complexidade de informação é maior; a complexidade visual (paleta, sombra) deve ser a mesma.
3. **Mesmo formato por seção:** Estado atual → Problemas → Direção proposta → Risco/complexidade.
4. **Fase 3 do mapeamento mobile (fusão dos orquestradores mobile/desktop) permanece fora de escopo aqui**, pelo mesmo motivo de lá: só compensa depois que a Fase 1 (componentização) reduzir a duplicação a ponto de a fusão ser trivial. Este documento não propõe reabrir essa decisão.

---

## 1. Achado estrutural que muda o plano de execução

Dois achados, um bom e um que aumenta a estimativa:

**Bom:** a grade principal do dashboard (fora dos slides) já tem uma fatia migrada. O achado do mapeamento mobile — `<article>` com classes Tailwind claras (`bg-white`, `border-slate-200`, `text-slate-700/800`) sendo repintadas de escuro via `index.css:211-227` (`.dashboard-desktop-redesign article { background: var(--uiux-panel) !important; ... }`) — continua valendo e ainda não foi corrigido. Os quatro `<article>` que já nascem com classes claras no JSX estão em `DashboardDesktopRedesignView.jsx:1849` (bloco de KPIs Receitas/Despesas/Saldo), `:1958` (KPI de Investimentos), `:2030` (Gastos por Categoria) e `:2185` (Movimentações, resumo da home). Ou seja: **remover o bloco `!important` de `index.css:211-231` já destrava boa parte da home** sem tocar em uma linha de JSX.

**Ruim (e é a maior parte do trabalho real):** os quatro **slides em tela cheia** (`activeSlide === "investments" | "cards" | "transactions" | "charts"`, linhas 252–1412 do mesmo arquivo) não passam por esse mecanismo — usam cor hardcoded diretamente no JSX (`bg-[#1e2340]`, `border-[#2a3554]`, `text-[#dbe3ff]`, `text-[#b9bfd8]`, dezenas de gradientes `linear-gradient(145deg, rgba(18,24,40,...))` por seção) e exigem edição linha a linha. Contagem bruta: **116 ocorrências de cor hex** só neste arquivo (a maior concentração do projeto — mais que o dobro do segundo colocado, `InvestmentsView.jsx` com 53). Além disso:

- `client/src/components/dashboard/chartTooltips.jsx` (compartilhado com o gráfico da home E dos slides) tem 3 tooltips com fundo hardcoded `#15172a`/`#32375e`/texto `#dbe3ff` — nenhuma migração aqui beneficia só desktop; mobile também usa este componente e hoje herda o mesmo dark hardcoded silenciosamente (o mapeamento mobile já sinalizou isso na seção 2.7, mas não foi corrigido ainda).
- O **shell fora do dashboard** — sidebar (`App.jsx:518-603`) e header de tabs não-dashboard (`App.jsx:609-621`) — está 100% fora do sistema de tokens, com cores hex e classes Tailwind escuras (`bg-[#1d2148]`, `text-[#ecefff]`, `border-[#2c315f]`). Isso não é parte de `DashboardDesktopRedesignView.jsx`, mas é a moldura permanente de toda navegação desktop — sem migrar isso, a tela nunca vai "parecer" light mode mesmo depois do dashboard estar pronto.
- Achado incidental, fora do escopo de redesign mas vale registrar: `App.jsx` mantém uma branch `activeTab === "investments"` (linhas 612, 616, 651-657) que renderiza `InvestmentsView` como tela standalone com header "Planejador de Futuro" — mas **não existe nenhum item de navegação que define `activeTab` como `"investments"`** (a sidebar só lista `dashboard`, `wishlist`, `vehicle`, `App.jsx:524-544`). É rota morta hoje; qualquer trabalho de sidebar deveria decidir se ela é removida ou se vira um destino real.
- Também incidental: existe um componente órfão, `client/src/components/CardViewerView.jsx` (11 ocorrências de hex), que não é importado por nenhum componente de produção — só aparece mockado em `App.test.jsx`. Não faz parte de nenhum fluxo hoje; não precisa de trabalho de redesign, só de uma decisão de limpeza em algum momento (fora do punch list abaixo, por não ser UX).

Isso não muda a paleta proposta nem os tokens, mas confirma que o esforço desktop se concentra quase todo nos **quatro slides + chartTooltips + shell de navegação**, não na grade da home.

---

## 2. Tokens de design — reaproveitamento e o que falta

### 2.1 O sistema do §2 do mapeamento mobile aplica-se sem alteração

Todos os tokens já estão em `index.css:6-45` (`--bg-app`, `--bg-surface`, `--bg-surface-sunken`, `--bg-inverse`, `--text-primary/secondary/tertiary/disabled/on-accent`, `--border-subtle/default/strong`, `--accent-600/500/100/50`, `--success/danger/warning/info-700/100/border`, `--shadow-xs/sm/md/lg/modal`). Nenhum token novo é necessário para cobrir o conteúdo de KPI, card, badge, tabela ou formulário do desktop — é o mesmo vocabulário visual, só em layouts com mais colunas e mais densidade.

O que falta **não é cor**, é comportamento de interação que mobile não precisa e desktop precisa:

### 2.2 Adição proposta: tokens de estado de hover

Mobile não tem hover (é touch). Desktop tem hover em praticamente todo elemento clicável do dashboard hoje (`<article role="button">` inteiros são clicáveis para abrir slides, linhas de tabela, botões de ação). Hoje esse hover é resolvido ad-hoc por classe Tailwind (`hover:bg-[#2a3554]`, `hover:bg-[#1e2340]`, `hover:bg-[#3a4558]`) sem nenhum padrão. Proposta: dois tokens novos, pequenos, que fecham essa lacuna sem duplicar o sistema:

| Token | Valor | Uso |
|---|---|---|
| `--bg-surface-hover` | `#F7F8FB` (= `--bg-app`, reaproveitado) | Hover de linha de tabela, item de lista, card não-elevado |
| `--border-hover` | igual a `--border-strong` (`#C4C9DA`), reaproveitado | Borda de card clicável em hover, sem token novo — só um nome semântico para deixar explícito no CSS que aquele uso é "hover", não "borda forte por design" |

Nenhum dos dois exige um valor novo — é dar nome semântico a valores que já existem, para o CSS de hover não reinventar `rgba()` a cada componente (ladder: já existe no sistema, só falta o alias).

### 2.3 Adição proposta: uma sombra a mais para painéis grandes

`--shadow-md`/`--shadow-lg` (definidos para cards de mobile, tipicamente < 400px de largura) funcionam bem para os `<article>` de KPI da home desktop, que têm dimensão parecida. Mas os **slides em tela cheia** (`section` de até ~1200px de largura, ocupando quase toda viewport) usam hoje um `box-shadow` bem mais suave e difuso — sombra "de card pequeno" em um painel desse tamanho fica sem peso visual, e sombra "de card pequeno" ampliada 3x fica exagerada perto das bordas. Proposta: um token adicional:

| Token | Valor | Uso |
|---|---|---|
| `--shadow-panel` | `0 8px 32px rgba(16, 24, 40, 0.06), 0 2px 8px rgba(16, 24, 40, 0.03)` | Painéis de largura total (slides do desktop) — mais difusa e mais sutil que `--shadow-lg`, porque a área de contato com o fundo é maior |

Esse é o único valor genuinamente novo deste documento; os outros doze itens do sistema mobile bastam.

### 2.4 Tooltips de gráfico (`chartTooltips.jsx`) — mesma direção do mapeamento mobile, ainda pendente

Nenhuma mudança de direção: seção 2.7 do mapeamento mobile já resolveu isso — `--bg-inverse` (`#12121A`) como fundo do tooltip, texto branco. É compartilhado por home e slides, mobile e desktop, então corrigir uma vez resolve nos dois lugares. Fica registrado aqui de novo porque, sem essa correção, o slide "Análise Gráfica" (seção 4.3) fica com um retângulo escuro flutuando sobre um fundo claro sem nenhuma outra referência escura na tela — pior contraste de composição do que hoje, quando tudo ao redor já é escuro.

---

## 3. Sidebar e header (moldura fora do dashboard)

**Estado atual:** sidebar retrátil (`App.jsx:518-603`, expande em hover via `isSidebarHovered`) com fundo em gradiente escuro (`.uiux-sidebar`, `index.css:151-165`), item ativo com glow roxo (`shadow-[0_0_25px_rgba(89,102,192,0.35)]`) e cores hex diretas por item de nav. O header de tabs não-dashboard (Conquistas/Veículos/Investimentos-morto) é só um `<h1>` com fundo transparente e blur.

**Problemas:**
- É a única superfície do app que nunca "sabe" que existe um modo light — não depende de nenhum token, então nem vai quebrar visualmente nem vai ganhar nada até ser tocada de propósito.
- Glow/shadow de item ativo (`shadow-[0_0_25px_rgba(89,102,192,0.35)]`) é um efeito desenhado para contraste sobre fundo escuro — sobre fundo claro isso lê como uma mancha, não como destaque.
- Rota `activeTab === "investments"` morta (seção 1) — se a sidebar for redesenhada, é o momento óbvio de decidir: vira um 4º item de nav real ou é removida (o InvestmentsView já é acessível via slide dentro do dashboard, então pode ser redundante ter os dois).

**Direção proposta:**
- Fundo: `--bg-surface` com `border-right: 1px solid var(--border-subtle)` (sidebar) e `--bg-app` transparente com blur leve para o header — mesma lógica de "fundo branco, hierarquia por sombra e borda" do resto do sistema.
- Item ativo: `background: var(--accent-50)`, `color: var(--accent-600)`, sem glow — consistente com o que a nav mobile já faz hoje (`App.jsx:428-435`, que já está migrada e é a referência viva mais próxima).
- Item inativo: `color: var(--text-tertiary)`, hover `color: var(--text-secondary)` + `background: var(--bg-surface-hover)` (token da seção 2.2).
- Header de tab: título em `--text-primary`, remover o `border-b border-[#2c315f]` condicional só para a tab investments (sem função clara — se mantida, vira `border-[var(--border-subtle)]` para todas as tabs, por consistência).
- Decidir o destino da rota `investments` morta antes ou durante esse trabalho — é barato resolver junto já que a sidebar está sendo tocada de qualquer forma.

**Risco/complexidade:** **Pequeno-médio.** Puramente visual + uma decisão de produto pequena (rota morta). Bom candidato a ir junto com o P0 de tokens, é rápido e melhora a percepção do app inteiro (a sidebar aparece em toda tela desktop).

---

## 4. Slides e tela principal de `DashboardDesktopRedesignView.jsx`

### 4.1 Dashboard Home (grade sem slide ativo)

**Estado atual:** grade de 3 "seções" com altura calculada em pixels (`useViewportDensity`, `hSecao1/2/3` como percentual de `hUtil = viewportHeight - headerHeight - paddings`, `hooks/useViewportDensity.js:102-116`) — a mesma crítica de "desktop-fixo-first" já registrada no mapeamento mobile (seção 4.1 de lá) se aplica aqui tal como está: densidade calibrada para breakpoints específicos (`index.css:549-679`, blocos dedicados a 1440×900 e 1366×768). Os `<article>` de KPI/categoria/movimentações já usam classes claras (achado da seção 1), mas o gráfico de área e o card de cartão de crédito na mesma seção ainda são 100% dark hardcoded.

**Problemas:**
- Card de gráfico (linhas 1427-1605) e card de cartão de crédito (linhas 1607-1767) ficam na mesma `<section className="grid grid-cols-3">` que nada mais na tela — quando migrados para light, vão destoar visualmente dos vizinhos claros até serem corrigidos; não dá para fazer "meio a meio" sem a tela ficar visivelmente inconsistente por um tempo. Isso é argumento para migrar a seção 1 inteira (gráfico + cartão) numa tacada, não célula por célula.
- Cinco elementos clicáveis nessa grade inteira (gráfico → slide charts, cartão → slide cards, KPI-resumo → slide transactions, investimentos → slide investments, categoria → slide charts de novo, movimentações → slide transactions de novo) — **dois caminhos diferentes levam ao mesmo slide de "charts"** (o card de gráfico grande e o card de "Gastos por Categoria" mais abaixo) e **dois levam a "transactions"** (o card de resumo de KPI e o card de "Movimentações"). Isso não é um problema visual, é navegação redundante: o usuário pode não perceber que dois cliques diferentes abrem a mesma tela, e visualmente não há nenhuma pista de que são "atalhos para o mesmo lugar" (sem badge, ícone ou texto compartilhado entre eles).
- Botões de ação flutuantes fixos no canto inferior direito (linhas 2297-2350: mês anterior/próximo em `slate-700`, simular em `amber-500`, exportar CSV em `sky-500`, nova transação em `emerald-500`) usam **quatro cores Tailwind default diferentes**, nenhuma delas `--accent-600`. Não há hierarquia entre elas (a ação mais comum do dia a dia, "nova transação", tem o mesmo peso visual que "simular", uma ação ocasional) e, mais importante para light mode: botões circulares sólidos sobre fundo branco vão precisar de sombra para não se misturarem com o restante da tela — hoje a sombra (`shadow-lg` do Tailwind) foi calibrada para flutuar sobre fundo escuro.

**Direção proposta:**
- Migrar a seção 1 completa (gráfico + card de cartão) num único passo — reaproveitar o `--shadow-panel` (seção 2.3) para o painel de gráfico e o mesmo tratamento de "cartão físico" já elogiado no mapeamento mobile (seção 4.3 de lá) para o card de cartão, só trocando os hex do `cardTheme.js` de mistura-com-branco para mistura-com-preto (mesma troca já especificada na seção 2.7 do doc mobile, `mixWithWhite` → `mixWithBlack`).
- Cluster de botões flutuantes: reduzir para uma paleta de duas cores — `--accent-600` para a ação primária (nova transação) e `--text-secondary`/`--bg-surface` com borda para as ações secundárias (mês anterior/próximo, simular, exportar), todas com `--shadow-lg`. Isso não muda a interação, só a hierarquia visual — hoje as 4 cores competem por atenção igual.
- Navegação redundante (dois caminhos para "charts", dois para "transactions"): não recomendo remover nenhum caminho — os pontos de entrada fazem sentido em contextos diferentes (ver gráfico grande vs. ver ranking de categoria). A correção é só de **affordance**: adicionar um ícone pequeno consistente (ex.: seta ou "ver mais") nos cards clicáveis, para o usuário perceber "isto abre outra tela" em vez de "isto é só leitura" — hoje só o `cursor-pointer` no CSS comunica clicabilidade, invisível ao passar o olho.

**Risco/complexidade:** **Grande.** Mesmo argumento do mapeamento mobile: é a tela mais usada e a que mistura mais cálculo de layout com apresentação. A diferença aqui é que o cálculo de densidade por pixel (`useViewportDensity`) não precisa ser removido como no mobile (scroll natural não é o padrão esperado numa tela desktop de "dashboard que cabe na tela") — só a paleta muda, a arquitetura de layout por densidade pode ficar.

---

### 4.2 Slide de Cartões (`activeSlide === "cards"`)

**Estado atual:** `DashboardDesktopRedesignView.jsx:311-745`. Três colunas fixas (`grid-cols-3`, `cardColumns`) — cada coluna é ou um cartão existente (com "cartão físico" via `cardTheme.js`, movimentações do cartão, botão editar) ou um slot vazio com formulário de criação inline.

**Problemas:**
- **Grade de 3 colunas fixas independente de quantos cartões existem.** Se o usuário tem 1 cartão, vê 1 cartão real + 2 slots vazios de "criar novo cartão" ocupando o mesmo peso visual — a tela parece incompleta/quebrada em vez de "há espaço para mais". Isso é diferente do carrossel de cartões proposto no mapeamento mobile (seção 4.3 de lá, "um cartão por vez, swipe") — aqui a proposta é outra porque a densidade desktop permite ver vários ao mesmo tempo, mas 3 colunas fixas força os slots vazios a competir por atenção com dado real.
- Formulário de criação/edição de cartão é inline dentro da própria coluna (linhas 385-474 para criar, 640-727 para editar) — em uma coluna de ~350px de largura, um formulário `grid-cols-2` de 5 campos fica apertado; é o mesmo problema "formulário embutido sem foco" já identificado no mapeamento mobile (seção 4.3), só que em vez de "empurra a tela para baixo" aqui é "aperta a coluna".
- Movimentações do cartão mostram até 8 itens sempre expandidos (`.slice(0, 8)`, linha 515) sem link para "ver todas" — para ver a 9ª transação daquele cartão, o único caminho é abrir o slide de "Movimentações" (seção 4.4) e filtrar manualmente, já que não há filtro por cartão lá (mesmo gap apontado no mapeamento mobile seção 4.4: "não há filtro por cartão ou categoria na lista de transações").

**Direção proposta:**
- Grade responsiva ao número real de cartões: `N` cartões reais em colunas, com **um único** slot de "+ criar novo cartão" ao final (não N vazios) — se não houver nenhum cartão, um estado vazio central em vez de 3 colunas fantasmas.
- Criar/editar cartão vira modal (reaproveitar o padrão de foco/trap que `ExportCsvModal.jsx` já implementa bem, conforme o mapeamento mobile seção 4.12 recomendou extrair como hook) em vez de formulário inline — resolve o aperto de coluna e, de brinde, já usa o componente de acessibilidade mais maduro do projeto como base.
- Movimentações do cartão: mostrar 4-5 + "ver todas as movimentações deste cartão" que abre o slide de transações **já filtrado por aquele cartão** — isso exige adicionar filtro por cartão em `useTransactionFilters` (mesmo hook, não um novo), que também resolve o gap equivalente do mapeamento mobile.

**Risco/complexidade:** **Médio.** Reaproveita `cardTheme.js` e `useCardSummaries` quase sem alteração de lógica; o trabalho novo é o modal (se o hook de focus-trap da seção 4.12 do mobile já existir, isso é rápido) e o filtro por cartão no hook de filtros (pequeno, mesmo padrão que já existe para tipo).

---

### 4.3 Slide de Movimentações (`activeSlide === "transactions"`)

**Estado atual:** `DashboardDesktopRedesignView.jsx:746-900`. Tabela HTML (`<table>`) com busca textual e filtro por tipo, colunas Data/Título/Categoria/Valor/Tipo/Ações.

**Problemas:**
- Mesma tabela HTML tradicional criticada no mapeamento mobile para `VehicleView` (seção 4.8 de lá) — aqui funciona melhor porque desktop tem largura de sobra, mas ainda carece de `<caption>`/`scope` nos `<th>` (mesmo achado de acessibilidade, ainda não resolvido).
- Filtro só por tipo + busca textual — mesmo gap do slide equivalente em mobile: sem filtro por categoria ou cartão. Diferente de mobile, aqui **há espaço de sobra na tela** para adicionar esses filtros como chips ou selects adicionais sem briga de espaço — é uma correção mais barata no desktop do que seria no mobile.
- Exclusão sem confirmação nem desfazer (`handleDeleteTransaction` chamado direto no clique do botão "Excluir", linha 885) — mesmo achado já registrado em `fluxos-criticos-2026-05-25.md` e no mapeamento mobile, ainda válido, ainda não corrigido em nenhuma das duas superfícies.
- Badge de tipo (`bg-emerald-100 text-emerald-700` / `bg-rose-100 text-rose-700`, linhas 867-869) já usa uma paleta clara-ish, mas não é `--success-100`/`--danger-100` — é uma pequena inconsistência que só aparece ao comparar lado a lado com os tokens novos.

**Direção proposta:**
- Adicionar filtro por categoria e por cartão (dropdowns adicionais ao lado do filtro de tipo já existente) — mesma extensão de `useTransactionFilters` mencionada na seção 4.2 acima, um único ponto de mudança no hook resolve os dois slides.
- Confirmação de exclusão: modal de confirmação simples (não precisa ser swipe-to-delete como no mobile — em desktop, um `window.confirm` nativo ou um modal pequeno de "tem certeza?" já resolve, é uma decisão de UX mais barata aqui do que em touch).
- Badge de tipo: trocar para `--success-100`/`--success-700` e `--danger-100`/`--danger-700`.

**Risco/complexidade:** **Pequeno-médio.** Maior parte é swap de paleta na tabela; o filtro por categoria/cartão é a única peça de lógica nova, e é compartilhada com o slide de cartões (seção 4.2), então o custo é pago uma vez só.

---

### 4.4 Slide de Análise Gráfica (`activeSlide === "charts"`)

**Estado atual:** `DashboardDesktopRedesignView.jsx:901-1412`. Gráfico de área (Recharts `AreaChart`) + ranking de categorias em duas colunas + alertas de limite excedido em duas colunas + pizza de categorias + comparativo mês atual vs. anterior em barras — tudo empilhado verticalmente, sem abas.

**Problemas:**
- Mesma crítica do mapeamento mobile (seção 4.2 de lá) se aplica quase sem alteração: 4 visualizações diferentes na mesma tela sem hierarquia. Em desktop o espaço horizontal permite mostrar mais coisas ao mesmo tempo sem rolar, mas isso não resolve a sobrecarga cognitiva — só evita o scroll.
- Ranking em duas colunas (`slideCategoryLeftColumn`/`slideCategoryRightColumn`, linhas 1130-1142) — em desktop faz mais sentido do que em mobile (há largura para isso), mas ainda assim é leitura em zigue-zague quando comparado a uma lista única ordenada por valor.
- Ranking é somente leitura — clicar numa categoria não faz nada. Mesmo gap do mapeamento mobile ("toque numa categoria já filtra a lista de transações").
- Gráfico de pizza e gráfico de comparativo dividem a mesma linha (`grid-cols-2`, linha 1249) em caixas pequenas (~metade da largura da metade direita da tela) — para uma tela que já é "a tela de detalhe", esses dois gráficos ficam menores que o necessário para ler os rótulos com conforto.

**Direção proposta:**
- Mesma direção do mapeamento mobile: abas dentro do slide (Fluxo / Categorias / Comparativo) em vez de tudo empilhado. Diferente de mobile, em desktop a aba "Categorias" pode mostrar ranking + pizza lado a lado (há largura), mas o comparativo mês-a-mês fica em aba própria em vez de dividir espaço com a pizza.
- Ranking: lista única ordenada por valor com barra de progresso (mesma direção do mapeamento mobile) — em telas largas, listar em 2 colunas de leitura vertical (não zigue-zague: primeira metade dos itens na coluna esquerda de cima a baixo, segunda metade na direita) resolve tanto o aproveitamento de espaço quanto a ordem de leitura.
- Clique numa categoria do ranking abre o slide de transações filtrado por aquela categoria (mesmo hook de filtro da seção 4.3).
- Alertas de limite excedido (linhas 1195-1246, hoje em bloco separado com a mesma lógica de duas colunas) sobem para o topo da lista de categorias, junto com a mesma recomendação já feita no mapeamento mobile (seção 4.5 de lá).

**Risco/complexidade:** **Médio.** Os dados já vêm prontos de `useDashboardFinancials`; o trabalho é composição visual (abas) + o mesmo contrato de interação cruzada (filtro por clique) que os slides de cartões e transações também precisam — vale desenhar esse contrato uma vez e reutilizar nos três lugares.

---

### 4.5 Slide de Investimentos (`activeSlide === "investments"`) e a prop `isRedesign`

**Estado atual:** o slide (`DashboardDesktopRedesignView.jsx:252-310`) é só uma casca (header + botões "Nova aplicação"/"Novo aporte") que monta `InvestmentsView` inteiro com `isRedesign` (linha 306). `InvestmentsView.jsx` (~1061 linhas) usa a prop em pelo menos 20 pontos (`isRedesign ? ... : ...`, linhas 26, 197-312, 646-1042) para alternar entre duas paletas **nenhuma das duas usando o sistema de tokens novo**:
- `isRedesign = true` (usado só pelo slide desktop hoje): paleta dark hardcoded (`text-[#dbe3ff]`, `bg-[#10152d]`, `border-[#2a3554]`, etc.) — a mesma família de hex do resto do arquivo.
- `isRedesign = false` (default, usado pela rota morta `activeTab === "investments"` da seção 1 e por nenhum outro lugar hoje já que mobile não usa este componente, conforme o mapeamento mobile já registrou): paleta "legado claro" com `slate-*` do Tailwind (`text-slate-800`, `bg-slate-50`, `text-slate-500`) — **parece light mode mas não é o light mode novo**, é uma paleta slate anterior ao sistema de tokens, sem nenhuma relação com `--text-primary`/`--bg-surface`/etc.

**Problemas:**
- Duas paletas mortas para migrar, nenhuma reaproveitável como está. Continuar mantendo o branching por `isRedesign` sem convergência é o pior dos cenários: dois lugares para manter cor, nenhum correto.
- Como a rota `false` só é usada pela tab morta (seção 1), na prática **hoje 100% do tráfego real deste componente passa por `isRedesign = true`** (o slide desktop). Isso significa que a paleta "legado claro" pode ser descartada sem medo de regressão visível — não há uso real dela hoje.
- `panelClass`, `inputClass`, `labelClass`, `sectionTitleClass`, `portfolioCardClass` (linhas 285-307) são só pares de string condicionais — não é lógica de negócio, é puro CSS disfarçado de JS.

**Direção proposta — decisão explícita pedida pelo escopo deste documento:**
`isRedesign` deveria parar de significar "dark redesign vs. legado" e passar a significar **"use os tokens light novos"**, sempre `true` na prática (ou, melhor ainda, remover a prop e deletar o branch `false` inteiro, já que nada a usa em produção). Trocar as ~20 ocorrências de string condicional por classes fixas usando os tokens (`text-[var(--text-primary)]`, ou preferencialmente promover essas 5 combinações para classes utilitárias em `index.css` se o padrão se repetir muito). Isso não é "manter os dois branches e trocar as cores dos dois" — é **eliminar um branch inteiro**, porque ele nunca é exercitado.

**Risco/complexidade:** **Médio, mas com uma economia embutida.** É reescrita mecânica de props de classe, sem lógica de cálculo nova (o simulador de esforço/juros compostos não muda). O risco fica menor do que parece porque a decisão de eliminar o branch morto reduz a superfície de teste pela metade — só precisa validar visualmente um caminho, não dois.

---

## 5. Punch list priorizada (P0/P1/P2)

Sequenciado para side project solo, mesma filosofia do mapeamento mobile: valor visível cedo, sem big-bang. P0 = próximo, P1 = na sequência, P2 = quando sobrar tempo.

### P0 — Fundação + primeiro impacto visível

1. **Remover o bloco `.dashboard-desktop-redesign article { ... !important }`** (`index.css:211-231`) — os 4 `<article>` da home (linhas ~1849, 1958, 2030, 2185) já têm classes claras no JSX; isso é deletar CSS, não escrever nada novo, e já muda visivelmente a home. *Visual/CSS, muito pequeno.*
2. **Adicionar os 2 tokens de hover e o `--shadow-panel`** (seção 2.2 e 2.3) ao `index.css` — pré-requisito barato para tudo que vem depois. *CSS, pequeno.*
3. **Sidebar e header migrados para tokens** (seção 3) — é a moldura permanente de toda navegação desktop; sem isso, mesmo com a home clara, o app inteiro ainda "parece" dark ao redor. *Visual, pequeno-médio.*
4. **Migrar seção 1 da home (gráfico + card de cartão) para tokens** (seção 4.1) — fecha o "meio a meio" visual que sobra depois do item 1 desta lista.

### P1 — Slides de maior tráfego

5. **Convergir `InvestmentsView` para um único branch de token** e remover o branch `isRedesign = false` morto (seção 4.5) — desbloqueia o slide de investimentos inteiro numa mudança concentrada.
6. **Slide de Movimentações em tokens + filtro por categoria/cartão + confirmação de exclusão** (seção 4.3) — o filtro por cartão/categoria no hook `useTransactionFilters` é reaproveitado pelo item 7 abaixo.
7. **Slide de Cartões em tokens + grade responsiva ao número de cartões + modal de criar/editar** (seção 4.2).
8. **`chartTooltips.jsx` migrado para `--bg-inverse`** (seção 2.4) — pequeno, mas necessário antes do item 9, senão o slide de gráficos fica com tooltip escuro flutuando isolado.

### P2 — Polish e telas de detalhe

9. **Slide de Análise Gráfica com abas** (seção 4.4) — depende dos itens 6 e 7 se quiser reaproveitar o contrato de "clique filtra" already desenhado ali.
10. **Cluster de botões flutuantes (mês/simular/exportar/nova transação) com paleta consistente** (`--accent-600` para primário, seção 4.1) — puramente visual, baixo risco, mas só vale depois da home estar migrada (senão fica um botão claro isolado sobre fundo escuro).
11. **Decidir o destino da rota `investments` morta** (`App.jsx:612,616,651-657`) — remover ou promover a item de nav real. Pequena decisão de produto, sem dependência técnica de nenhum outro item.
12. Limpeza de `CardViewerView.jsx` órfão (seção 1) — não é UX, é housekeeping; não bloqueia nada, fica de bônus se sobrar tempo.

**Fora de escopo, mesma decisão do mapeamento mobile:** fusão dos orquestradores `DashboardMobileView`/`DashboardDesktopRedesignView` em um componente único responsivo. Só reconsiderar depois que a Fase 1 de componentização (mapeamento mobile, seção 3) já tiver reduzido a duplicação visual entre os dois o suficiente para a fusão ser trivial.

---

## Checklist resumido (para a sessão de implementação)

- [ ] `--bg-surface-hover`, `--border-hover`, `--shadow-panel` adicionados ao `index.css`
- [ ] Bloco `.dashboard-desktop-redesign article { ... !important }` removido de `index.css:211-231`
- [ ] Sidebar (`App.jsx:518-603`) e header de tabs não-dashboard migrados para tokens
- [ ] Seção 1 da home (gráfico + card de cartão, `DashboardDesktopRedesignView.jsx:1427-1767`) migrada
- [ ] Os 4 slides (`investments`/`cards`/`transactions`/`charts`, linhas 252-1412) migrados um a um, cada um testado isoladamente antes de passar ao próximo
- [ ] `InvestmentsView.jsx`: branch `isRedesign = false` removido, branch único migrado para tokens
- [ ] `chartTooltips.jsx` migrado para `--bg-inverse` (beneficia mobile e desktop)
- [ ] Filtro por categoria e por cartão adicionado a `useTransactionFilters`, usado nos slides de transações e de cartões
- [ ] Cluster de botões flutuantes reduzido a paleta `--accent-600` + secundário neutro
- [ ] Decisão tomada sobre a rota morta `activeTab === "investments"` em `App.jsx`
- [ ] Cada tela testada em pelo menos 1366×768 (menor breakpoint desktop suportado hoje) antes de considerar "pronta"
