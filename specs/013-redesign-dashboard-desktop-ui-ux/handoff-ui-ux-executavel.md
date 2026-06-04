# Handoff UI/UX Executavel - Dashboard Desktop (Ciclo 013)

Data: 2026-06-01
Base: spec.md, plan.md, tasks.md, briefing do ciclo 13
Escopo: desktop-only, sem alterar regra de negocio

---

## 1) Objetivo de implementacao

Entregar um dashboard desktop escaneavel, com altura fixa, sem scroll global, mantendo semantica dos dados e fluxos atuais.

Obrigatorio neste handoff:

- Sidebar retratil com comportamento claro.
- Dashboard sem scroll global da pagina.
- Scroll apenas interno por bloco quando necessario.
- 3 secoes horizontais com proporcao 1/3 + 2/3.
- Movimentacoes: entradas a direita e saidas a esquerda.
- KPI de localizacao no pior caso <= 30s em 1366x768 e 1920x1080.

Fora de escopo:

- Mobile completo.
- Filtros avancados.
- Relatorios novos.
- Refatoracao de API.
- Mudanca de regra de negocio.

---

## 2) Mapa de layout por secao (hierarquia + spacing)

### 2.1 Shell desktop

- Estrutura base: app shell horizontal
- Sidebar: fixa a esquerda
- Main: coluna unica com 3 secoes empilhadas
- Altura visivel util do dashboard: 100vh menos header global
- Scroll global da pagina: proibido no contexto dashboard

### 2.2 Sidebar retratil

- Estado expandido: largura 240px
- Estado recolhido: largura 72px
- Transicao: 180-220ms, easing padrao (ease-in-out)
- Comportamento:
  - clique no toggle alterna estado
  - item ativo sempre visivel
  - em estado recolhido manter icone + tooltip no hover/focus

### 2.3 Main dashboard sem scroll global

- Container raiz do dashboard:
  - overflow-y: hidden
  - altura fixa ao viewport util
- Cada secao ocupa faixa horizontal dedicada
- Gap entre secoes: 12px em 1366x768, 16px em 1920x1080

Formula operacional obrigatoria (sem ambiguidade):

- H_util = 100vh - H_header_global - P_top_main - P_bottom_main
- H_conteudo = H_util - (2 x gap_secoes)
- H_secao_1 = floor(H_conteudo x 0.30)
- H_secao_2 = floor(H_conteudo x 0.28)
- H_secao_3 = H_conteudo - H_secao_1 - H_secao_2

Regras de implementacao:

- A soma final das 3 secoes + 2 gaps MUST ser exatamente H_util.
- Nao usar altura por ranges nesta implementacao.
- Em caso de excesso de conteudo, a rolagem ocorre apenas nos blocos internos definidos no item 2.7.

### 2.4 Secao 1 (topo)

- Layout: 1/3 esquerda + 2/3 direita
- Esquerda (1/3): cards de resumo prioritario
  - hierarquia: saldo livre > entradas/saidas > investimentos
  - densidade: compacta
- Direita (2/3): grafico mensal (receita, despesas, saldo)
- Altura da secao:
  - 30% de H_conteudo (formula do item 2.3)

### 2.5 Secao 2 (meio)

- Layout: 1/3 esquerda + 2/3 direita
- Esquerda (1/3): proximos pagamentos (lista)
- Direita (2/3): blocos de valores (entradas, saidas, investimentos, saldo livre)
- Altura da secao:
  - 28% de H_conteudo (formula do item 2.3)

### 2.6 Secao 3 (base)

- Layout: 1/3 esquerda + 2/3 direita
- Esquerda (1/3): categorias + orcamento
- Direita (2/3): movimentacoes detalhadas
- Regra obrigatoria de direcao visual:
  - saidas alinhadas a esquerda
  - entradas alinhadas a direita
- Altura da secao:
  - residual exato de H_conteudo apos secao 1 e secao 2 (equivalente a 42%)

### 2.7 Scroll interno por bloco

- Somente blocos listados podem rolar internamente:
  - proximos pagamentos
  - categorias/orcamento
  - movimentacoes
- Header do bloco deve permanecer fixo durante scroll interno.
- Scrollbar visivel e consistente.

---

## 3) Estados de interacao

### 3.1 Estados obrigatorios

- Normal
- Hover
- Focus (teclado)
- Active/Selected
- Disabled
- Loading
- Overflow interno
- Sidebar collapsed

### 3.2 Regras de estado por elemento

- Toggle da sidebar:
  - normal: icone padrao
  - hover/focus: contraste reforcado + outline visivel
  - collapsed: aria-expanded=false e tooltip ativo
- Blocos com lista:
  - loading: skeleton ou texto de carregando
  - empty: mensagem curta + acao recomendada quando cabivel
  - overflow: somente eixo y interno
- Itens de movimentacao:
  - entrada: ancora visual no lado direito
  - saida: ancora visual no lado esquerdo
  - hover: realce leve sem trocar semantica de cor

---

## 4) Guia de componentes e tokens

## 4.1 Tipografia

- Escala recomendada:
  - titulo de secao: 18/24 semibold
  - subtitulo/bloco: 14/20 semibold
  - corpo: 13/18 regular
  - legenda/helper: 12/16 regular
- Numeros de valor financeiro: semibold para destaque

## 4.2 Cores e contraste minimo

- Fundo app: neutro claro
- Cards/blocos: branco com borda suave
- Entradas: verde sem depender so da cor (usar label/texto)
- Saidas: vermelho sem depender so da cor (usar label/texto)
- Contraste minimo:
  - texto normal >= 4.5:1
  - texto grande >= 3:1
  - foco/contorno visivel >= 3:1 contra fundo adjacente

## 4.3 Densidade e espacamento

- Grid interno dos blocos: 8px (micro), 12px (padrao), 16px (macro)
- Padding interno de bloco:
  - 12px em 1366x768
  - 16px em 1920x1080
- Distancia entre elementos clicaveis: minimo 8px

## 4.4 Bordas e elevacao

- Radius bloco: 10-12px
- Borda: 1px neutra
- Sombra: baixa (sem competir com conteudo)

## 4.5 Alvos de clique

- Alvo minimo recomendado: 40x40px
- Preferivel para controles primarios: 44x44px

---

## 5) Checklist de acessibilidade minima (implementacao)

- Foco visivel em todos os controles interativos.
- Ordem de tab previsivel: sidebar -> secao 1 -> secao 2 -> secao 3.
- Navegacao por teclado completa sem mouse.
- Labels claros em botoes iconicos (aria-label quando necessario).
- Regioes de lista com titulo semantico e leitura coerente.
- Nao depender so de cor para distinguir entrada vs saida.
- Contraste minimo conforme item 4.2.
- Texto de estados (loading, vazio, erro) legivel e objetivo.

---

## 6) Criterios de aceite visuais objetivos (sem ambiguidade)

## 6.1 Sidebar

- Existe controle de toggle visivel.
- Ao recolher: largura muda para 72px e conteudo principal expande.
- Ao expandir: largura retorna para 240px sem quebra de layout.

## 6.2 Scroll global e interno

- Dashboard desktop nao apresenta scroll global da pagina.
- Somente blocos definidos no item 2.7 podem rolar internamente.
- Header dos blocos rolaveis permanece visivel.

## 6.3 Proporcao 1/3 + 2/3

- Secoes 1, 2 e 3 respeitam divisao horizontal 1/3 esquerda e 2/3 direita.
- Tolerancia visual maxima de variacao: +/- 2% por coluna.

## 6.4 Movimentacoes (direcao visual)

- Em qualquer viewport alvo:
  - saidas aparecem alinhadas ao lado esquerdo do container de lista
  - entradas aparecem alinhadas ao lado direito do container de lista
- Regra mantida em itens longos, curtos e com descricao quebrada.

## 6.5 KPI de localizacao <= 30s

- Executar roteiro guiado de 5 tarefas nos viewports 1366x768 e 1920x1080.
- Medir tempo por tarefa com cronometro.
- Aprovar somente se pior caso observado <= 30s.

Roteiro minimo sugerido de tarefa:

1. Localizar saldo livre.
2. Localizar valor de investimentos.
3. Localizar categoria com maior gasto no mes.
4. Localizar proximo pagamento relevante.
5. Localizar a ultima saida e a ultima entrada na lista.

Evidencia obrigatoria no PR (template):

| Tarefa                           | 1366x768 (s) | 1920x1080 (s) | Pior caso (s) | Resultado |
| -------------------------------- | -----------: | ------------: | ------------: | --------- |
| 1. Saldo livre                   |              |               |               |           |
| 2. Investimentos                 |              |               |               |           |
| 3. Maior gasto por categoria     |              |               |               |           |
| 4. Proximo pagamento             |              |               |               |           |
| 5. Ultima saida e ultima entrada |              |               |               |           |

Regra de aceite:

- Aprovado somente se todos os piores casos por tarefa forem <= 30s.

---

## 7) Riscos de UX antes da codificacao + mitigacao

1. Risco: duplo scroll confuso (global + interno)
   Mitigacao: travar overflow global no dashboard e auditar blocos rolaveis.

2. Risco: secao 3 ficar densa em 1366x768
   Mitigacao: limitar altura de listas + headers sticky + truncamento com tooltip.

3. Risco: alinhamento direita/esquerda perder clareza com textos longos
   Mitigacao: separar trilhas visuais por tipo e fixar ancora de alinhamento.

4. Risco: sidebar recolhida reduzir descoberta de navegacao
   Mitigacao: tooltip em hover/focus e icones semanticamente claros.

5. Risco: contraste insuficiente em estados secundarios
   Mitigacao: validar contraste minimo antes de merge.

6. Risco: regressao funcional por mudanca estrutural
   Mitigacao: manter dados/handlers existentes e alterar somente presentacao.

---

## 8) Sequencia de handoff para o Dev (execucao direta)

1. Implementar shell desktop e toggle da sidebar (sem tocar regras de negocio).
2. Aplicar altura fixa do dashboard e remover scroll global.
3. Montar secoes 1, 2 e 3 com ratio 1/3 + 2/3.
4. Configurar scroll interno apenas nos blocos definidos.
5. Ajustar movimentacoes com entradas direita e saidas esquerda.
6. Aplicar tokens de tipografia, espacamento e foco.
7. Rodar checklist de acessibilidade minima.
8. Executar KPI nos 2 viewports e registrar pior caso.

---

## 9) Definicao de pronto (UI/UX handoff)

Este handoff e considerado pronto quando:

- Todos os criterios do item 6 foram validados.
- Nenhum item fora de escopo foi implementado.
- Nao houve alteracao de semantica de dados ou regra de negocio.
- KPI <= 30s foi atingido em 1366x768 e 1920x1080.
