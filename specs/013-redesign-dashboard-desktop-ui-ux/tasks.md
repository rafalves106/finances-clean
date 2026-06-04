# Tasks: Redesign Dashboard Desktop UI/UX (Ciclo 13)

Input: specs/013-redesign-dashboard-desktop-ui-ux/spec.md
Input: specs/013-redesign-dashboard-desktop-ui-ux/plan.md

## Ordem de implementacao

1. Estrutura desktop e sidebar
2. Composicao das 3 secoes
3. Scroll interno e refinamento visual
4. Validacao KPI e regressao

### TASK-01 — Implementar shell desktop com sidebar retratil

O que fazer: adicionar comportamento de mostrar/ocultar sidebar e ajustar area util do dashboard no desktop, conforme Plan §2 e Plan §3.
Onde: client/src/App.jsx
Depende de: Nenhuma
Pode ser paralela com: TASK-02
Reusar: estrutura atual de navegacao/layout do app
Complexidade: M
Definition of Done:

- [ ] Toggle de sidebar funcional
- [ ] Layout principal se adapta ao estado expandido/recolhido
- [ ] Sem quebra de navegacao existente
- [ ] cd client && npm run lint passa
- [ ] cd client && npm run build passa

### TASK-02 — Definir altura fixa desktop e remover scroll global do dashboard

O que fazer: ajustar CSS/estrutura para dashboard desktop operar com altura fixa e sem rolagem global da pagina, conforme Plan §1.
Onde: client/src/index.css, client/src/components/DashboardView.jsx
Depende de: Nenhuma
Pode ser paralela com: TASK-01
Reusar: classes utilitarias e tokens visuais existentes
Complexidade: M
Definition of Done:

- [ ] Dashboard desktop sem scroll global
- [ ] Overflow global desativado apenas no contexto do dashboard
- [ ] Sem impacto colateral em outras telas
- [ ] cd client && npm run lint passa
- [ ] cd client && npm run build passa

### TASK-03 — Implementar secao 1 com proporcao 1/3 + 2/3

O que fazer: reorganizar secao 1 para 1/3 cartoes modernos e 2/3 grafico mensal (receita, despesas, saldo), conforme Spec FR-004.
Onde: client/src/components/DashboardView.jsx
Depende de: TASK-01, TASK-02
Pode ser paralela com: TASK-04
Reusar: cards e grafico mensal existentes
Complexidade: M
Definition of Done:

- [ ] Secao 1 respeita proporcao 1/3 + 2/3
- [ ] Cartoes mantem leitura clara e hierarquia visual
- [ ] Grafico mensal permanece funcional
- [ ] cd client && npm run lint passa
- [ ] cd client && npm run build passa

### TASK-04 — Implementar secao 2 com proporcao 1/3 + 2/3

O que fazer: organizar secao 2 com 1/3 proximos pagamentos e 2/3 blocos de valores (entradas, saidas, investimentos, saldo livre), conforme Spec FR-005.
Onde: client/src/components/DashboardView.jsx
Depende de: TASK-01, TASK-02
Pode ser paralela com: TASK-03
Reusar: blocos de pagamentos e indicadores financeiros existentes
Complexidade: M
Definition of Done:

- [ ] Secao 2 respeita proporcao 1/3 + 2/3
- [ ] Blocos de valores exibem informacoes corretas sem mudar semantica
- [ ] Densidade visual controlada
- [ ] cd client && npm run lint passa
- [ ] cd client && npm run build passa

### TASK-05 — Implementar secao 3 com proporcao 1/3 + 2/3 e orientacao de movimentacoes

O que fazer: organizar secao 3 com 1/3 categorias/orcamento e 2/3 movimentacoes detalhadas com entradas a direita e saidas a esquerda, conforme Spec FR-006 e FR-007.
Onde: client/src/components/DashboardView.jsx
Depende de: TASK-03, TASK-04
Pode ser paralela com: Nenhuma
Reusar: componentes de categorias/orcamento e lista de movimentacoes
Complexidade: L
Definition of Done:

- [ ] Secao 3 respeita proporcao 1/3 + 2/3
- [ ] Entradas alinhadas visualmente a direita
- [ ] Saidas alinhadas visualmente a esquerda
- [ ] cd client && npm run lint passa
- [ ] cd client && npm run build passa

### TASK-06 — Aplicar scroll interno controlado por bloco

O que fazer: adicionar overflow interno apenas em blocos excedentes com cabecalho fixo quando aplicavel, conforme Spec FR-003 e Plan §7.
Onde: client/src/components/DashboardView.jsx, client/src/index.css
Depende de: TASK-05
Pode ser paralela com: Nenhuma
Reusar: padroes de containers com overflow existentes
Complexidade: M
Definition of Done:

- [ ] Scroll ocorre apenas nos blocos com excesso
- [ ] Cabecalhos dos blocos permanecem visiveis em rolagem interna
- [ ] Nao reintroduz scroll global no dashboard
- [ ] cd client && npm run lint passa
- [ ] cd client && npm run build passa

### TASK-07 — Refinamento visual desktop e acessibilidade minima

O que fazer: ajustar espacamentos, tipografia, contraste e foco para elevar legibilidade e manter consistencia visual desktop, conforme NFR-002 e NFR-003.
Onde: client/src/components/DashboardView.jsx, client/src/index.css
Depende de: TASK-06
Pode ser paralela com: Nenhuma
Reusar: tokens e componentes atuais
Complexidade: S
Definition of Done:

- [ ] Hierarquia visual clara em todas as secoes
- [ ] Contraste e foco navegavel preservados
- [ ] Sem regressao visual em fluxos atuais
- [ ] cd client && npm run lint passa
- [ ] cd client && npm run build passa

### TASK-08 — Testes e validacao do KPI de localizacao (<= 30s)

O que fazer: executar validacao funcional do redesign com roteiro cronometrado e testes de regressao basicos, conforme Plan estrategia de validacao.
Onde: client/src/components/\*.test.jsx, evidencia operacional no ciclo
Depende de: TASK-07
Pode ser paralela com: Nenhuma
Reusar: infraestrutura Vitest existente
Complexidade: M
Definition of Done:

- [ ] Roteiro de 5 tarefas de localizacao executado com cronometro
- [ ] Validacao executada nos viewports baseline 1366x768 e 1920x1080
- [ ] Tempo maximo observado de localizacao das informacoes principais (pior caso) <= 30s
- [ ] Fluxos chave do dashboard permanecem funcionais
- [ ] cd client && npm test passa

### TASK-09 — Gate final e decisao go/no-go do ciclo

O que fazer: consolidar checklist, evidencias de quality gates e decisao final de release do redesign.
Onde: specs/013-redesign-dashboard-desktop-ui-ux/
Depende de: TASK-08
Pode ser paralela com: Nenhuma
Reusar: criterios do spec/plan
Complexidade: S
Definition of Done:

- [ ] Checklist funcional preenchido
- [ ] Evidencias de lint/build/test anexadas
- [ ] Decisao go/no-go registrada
- [ ] Sem violacao da constitution

## Quality gates obrigatorios

Frontend:

1. cd client && npm run lint
2. cd client && npm run build
3. cd client && npm test

## Checklist de validacao funcional

1. Sidebar e shell desktop
1. Validar toggle da sidebar (mostrar/ocultar).
1. Validar ganho de area util com sidebar recolhida.

1. Scroll e estrutura
1. Confirmar ausencia de scroll global no dashboard desktop.
1. Confirmar scroll interno apenas nos blocos excedentes.
1. Confirmar cabecalhos visiveis durante scroll interno.

1. Composicao de secoes
1. Confirmar secao 1 em 1/3 cartoes + 2/3 grafico.
1. Confirmar secao 2 em 1/3 pagamentos + 2/3 blocos de valores.
1. Confirmar secao 3 em 1/3 categorias + 2/3 movimentacoes.

1. Regra visual de movimentacoes
1. Validar entradas alinhadas a direita.
1. Validar saidas alinhadas a esquerda.

1. KPI de localizacao
1. Executar roteiro de localizacao com cronometro.
1. Executar validacao nos viewports 1366x768 e 1920x1080.
1. Confirmar tempo maximo <= 30s para informacoes principais.

## Criterio Go/No-Go

Go:

1. Escopo 100% entregue conforme briefing.
2. Dashboard desktop sem scroll global e com scroll interno controlado.
3. 3 secoes em 1/3 + 2/3 implementadas e validadas.
4. Entradas/saidas alinhadas corretamente na secao de movimentacoes.
5. KPI de localizacao com tempo maximo <= 30s validado nos viewports 1366x768 e 1920x1080.
6. Quality gates frontend aprovados.

No-Go:

1. Qualquer secao fora da composicao obrigatoria.
2. Scroll global ainda presente no dashboard desktop.
3. Regressao funcional relevante em fluxo existente.
4. Tempo maximo de localizacao > 30s em qualquer viewport baseline sem plano de mitigacao aprovado.
5. Falha em quality gates sem mitigacao aprovada.
