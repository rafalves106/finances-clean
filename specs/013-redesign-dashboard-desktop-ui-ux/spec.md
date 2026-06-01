# Feature Specification: Redesign Dashboard Desktop UI/UX (Ciclo 13)

Feature Branch: 013-redesign-dashboard-desktop-ui-ux
Created: 2026-06-01
Status: Draft
Input: docs/briefings/redesign-dashboard-desktop-ui-ux-ciclo-13.md

## §0 Contexto de Negocio

- Persona: usuario unico (PO) com uso operacional diario no desktop.
- Dor real: dashboard atual com rolagem excessiva, baixa hierarquia visual e leitura confusa.
- Valor entregue: painel escaneavel com estrutura fixa, reduzindo esforco cognitivo e acelerando decisoes.
- KPI principal:
  - tempo maximo de localizacao das informacoes principais <= 30 segundos.
- KPI complementar:
  - reducao perceptivel de confusao visual e da dependencia de scroll global.
- Restricoes:
  - foco exclusivo desktop neste ciclo.
  - sem mudanca de regra de negocio.
  - sem refatoracao de APIs backend.
  - entrega 100% do escopo definido no ciclo.

## User Scenarios and Testing

### User Story 1 - Sidebar retratil e ganho de area util (Priority: P1)

Como usuario, quero mostrar/ocultar a sidebar para ampliar area util de analise no dashboard.

Why this priority: melhora uso diario do espaco sem alterar regra funcional.

Independent Test: alternar estado da sidebar e validar expansao/reducao da area principal.

Acceptance Scenarios:

1. Given dashboard desktop aberto, When usuario aciona toggle da sidebar, Then sidebar recolhe/expande sem quebrar layout.
2. Given sidebar recolhida, When usuario analisa o painel, Then area util principal aumenta perceptivelmente.

### User Story 2 - Dashboard desktop sem scroll global (Priority: P1)

Como usuario, quero painel com altura fixa no desktop para evitar navegacao vertical da pagina inteira.

Why this priority: combate dor principal de rolagem excessiva.

Independent Test: abrir dashboard em resolucoes desktop alvo e validar ausencia de scroll global na pagina do dashboard.

Acceptance Scenarios:

1. Given dashboard renderizado no desktop, When usuario navega na tela, Then pagina do dashboard nao apresenta scroll global.
2. Given bloco com conteudo excedente, When usuario interage, Then scroll ocorre internamente no bloco, nao na pagina inteira.

### User Story 3 - Layout horizontal em 3 secoes com proporcao 1/3 + 2/3 (Priority: P1)

Como usuario, quero distribuicao visual fixa por secoes para localizar informacoes com menos esforco.

Why this priority: aumenta hierarquia visual e previsibilidade de leitura.

Independent Test: validar composicao das tres secoes e proporcao 1/3 + 2/3 em desktop.

Acceptance Scenarios:

1. Given secao 1, When dashboard renderiza, Then 1/3 mostra cartoes e 2/3 mostra grafico mensal.
2. Given secao 2, When dashboard renderiza, Then 1/3 mostra proximos pagamentos e 2/3 mostra blocos de valores.
3. Given secao 3, When dashboard renderiza, Then 1/3 mostra categorias/orcamento e 2/3 mostra movimentacoes detalhadas.

### User Story 4 - Movimentacoes com entradas a direita e saidas a esquerda (Priority: P1)

Como usuario, quero padrao visual explicito na lista de movimentacoes para leitura mais rapida.

Why this priority: reduz confusao na interpretacao de fluxo de caixa.

Independent Test: inspecionar lista de movimentacoes e validar alinhamento correto por tipo.

Acceptance Scenarios:

1. Given lista de movimentacoes com entradas e saidas, When renderizada, Then entradas ficam visualmente a direita.
2. Given lista de movimentacoes com entradas e saidas, When renderizada, Then saidas ficam visualmente a esquerda.

## Edge Cases

- Resolucao desktop menor pode reduzir area visivel; blocos precisam manter headers fixos com scroll interno controlado.
- Conteudo volumoso em movimentacoes/categorias nao pode reativar scroll global da pagina.
- Recolhimento da sidebar nao pode sobrepor conteudo principal.
- Mudancas visuais nao podem alterar dados nem semantica de calculos existentes.

## Requirements

### Functional Requirements

- FR-001: sistema MUST oferecer sidebar retratil no dashboard desktop com toggle de mostrar/ocultar.
- FR-002: sistema MUST manter altura fixa do dashboard desktop sem scroll global da pagina do dashboard.
- FR-003: sistema MUST permitir scroll apenas interno nos blocos que excederem espaco disponivel.
- FR-004: sistema MUST renderizar secao 1 com composicao 1/3 cartoes e 2/3 grafico mensal (receita, despesas, saldo).
- FR-005: sistema MUST renderizar secao 2 com composicao 1/3 proximos pagamentos e 2/3 blocos de valores (entradas, saidas, investimentos, saldo livre).
- FR-006: sistema MUST renderizar secao 3 com composicao 1/3 categorias/orcamento e 2/3 movimentacoes detalhadas.
- FR-007: sistema MUST alinhar visualmente entradas a direita e saidas a esquerda na secao de movimentacoes.
- FR-008: sistema MUST manter tela dedicada e fluxos atuais sem alteracao de regra de negocio.
- FR-009: sistema MUST entregar 100% do escopo UI/UX definido no briefing neste ciclo.
- FR-010: sistema MUST manter desktop como alvo principal deste ciclo, sem compromisso de responsividade mobile completa.

### Non-Functional Requirements

- NFR-001: tempo maximo de localizacao dos blocos principais MUST ser <= 30 segundos no teste guiado com PO.
- NFR-002: interface desktop MUST ter hierarquia visual clara (blocos, titulos e densidade controlada).
- NFR-003: componentes novos MUST manter acessibilidade minima (foco, contraste, labels).
- NFR-004: validacao do KPI MUST ser executada nos viewports desktop baseline 1366x768 e 1920x1080.

### Constitution Alignment

- CA-001 (Bounded Architecture): alteracoes concentradas no client, sem acoplamento indevido em backend.
- CA-002 (Security by Default): nenhuma mudanca de auth, token ou dados sensiveis.
- CA-003 (Quality Gates Executaveis): lint/build/test frontend devem passar antes do go-live.
- CA-004 (Data Integrity): sem alteracao de calculos financeiros e sem mudanca de semantica dos dados.
- CA-005 (Operability): estados visuais devem ser previsiveis, sem bloqueio de navegacao.

## Key Entities

- DashboardDesktopLayout:
  - sidebarState (expanded|collapsed)
  - viewportHeight
  - globalScrollEnabled (false)
- DashboardSection:
  - sectionId (1|2|3)
  - leftPaneRatio (1/3)
  - rightPaneRatio (2/3)
  - internalScrollPolicy

## Success Criteria

- SC-001: dashboard desktop opera sem scroll global da pagina em cenarios de teste definidos.
- SC-002: estrutura de 3 secoes com 1/3 + 2/3 aplicada conforme briefing.
- SC-003: entradas/saidas em movimentacoes respeitam orientacao visual direita/esquerda.
- SC-004: tempo maximo observado de localizacao das informacoes principais (pior caso) e <= 30 segundos no teste guiado.
- SC-005: quality gates de frontend aprovados.

## Assumptions

- foco do ciclo e exclusivamente desktop.
- dados e regras existentes sao suficientes para suportar o redesign sem alteracao de backend.

## Out of Scope

- Mobile/responsividade completa.
- Filtros avancados.
- Novos relatorios.
- Refatoracao de APIs backend.
- Mudancas de regra de negocio.
