# Plano Tecnico: Redesign Dashboard Desktop UI/UX (Ciclo 13)

Branch: 013-redesign-dashboard-desktop-ui-ux
Data: 2026-06-01
Spec: specs/013-redesign-dashboard-desktop-ui-ux/spec.md

## §0 Contexto de Negocio

- Persona: usuario unico com operacao diaria de analise no desktop.
- Dor: excesso de rolagem e baixa hierarquia visual no dashboard atual.
- Valor:
  - leitura mais rapida e previsivel.
  - menos esforco cognitivo e menor friccao operacional.
- KPI-alvo:
  - tempo maximo de localizacao das informacoes principais <= 30 segundos.
- Restricoes:
  - foco desktop only.
  - sem alteracao de regra de negocio.
  - sem refatoracao de API.
  - entrega integral do escopo do briefing.

## §1 Arquitetura

```mermaid
flowchart TB
  A[App Layout Desktop] --> B[Sidebar Retratil]
  A --> C[Dashboard Container Altura Fixa]
  C --> S1[Secao 1 - 1/3 Cartoes | 2/3 Grafico]
  C --> S2[Secao 2 - 1/3 Pagamentos | 2/3 Valores]
  C --> S3[Secao 3 - 1/3 Categorias | 2/3 Movimentacoes]
  S3 --> M[Entradas Direita | Saidas Esquerda]

  K1[KPI: localizacao <= 30s] --- C
  K2[KPI: menos scroll global] --- C
  K3[KPI: clareza visual] --- S1
```

Direcao arquitetural:

- Centralizar controle de altura fixa no container do dashboard desktop.
- Bloquear scroll global e delegar overflow para subblocos.
- Preservar fontes de dados e regras atuais, alterando apenas apresentacao e interacao visual.

## §2 Componentes

| Arquivo                                    | Estado atual                    | O que muda                                                                     | Responsabilidade                      | Impacto de negocio           |
| ------------------------------------------ | ------------------------------- | ------------------------------------------------------------------------------ | ------------------------------------- | ---------------------------- |
| client/src/components/DashboardView.jsx    | layout atual com scroll extenso | reorganizar para 3 secoes horizontais 1/3+2/3 e scroll interno por bloco       | composicao principal do dashboard     | reduzir tempo de localizacao |
| client/src/App.jsx                         | layout geral e navegacao        | integrar estado da sidebar retratil e area util desktop                        | orquestracao da shell da aplicacao    | ganho de area de analise     |
| client/src/index.css                       | estilos globais                 | definir regras de altura fixa desktop, overflow controlado e hierarquia visual | base visual e comportamento de scroll | previsibilidade de leitura   |
| client/src/components/TransactionModal.jsx | fluxo atual                     | sem mudanca de regra; apenas garantir compatibilidade visual pos-redesign      | integridade de fluxo existente        | evitar regressao             |

## §3 Fluxo de Dados (caminho feliz)

1. Usuario abre dashboard desktop.
2. Sidebar pode ser recolhida/expandida sem recarregar dados.
3. Container principal do dashboard fixa altura util e desabilita scroll global da pagina.
4. Secoes 1, 2 e 3 renderizam com ratio 1/3 + 2/3.
5. Blocos com excesso de conteudo usam scroll interno com cabecalho fixo.
6. Secao de movimentacoes exibe entradas a direita e saidas a esquerda.
7. Usuario encontra informacoes principais no painel sem navegar por rolagem global longa.

Pontos criticos:

- Controle de overflow deve evitar duplo scroll confuso.
- Em resolucoes desktop menores, manter legibilidade com limites de altura minima por bloco.
- Nenhum impacto nas regras de negocio e calculos financeiros.

## §4 Validacao e Erros

| Verificacao                | Resultado esperado                 | Prioridade | Justificativa de negocio         |
| -------------------------- | ---------------------------------- | ---------- | -------------------------------- |
| Toggle da sidebar          | recolhe/expande sem quebrar layout | alta       | ganho de area util               |
| Scroll global da pagina    | ausente no dashboard desktop       | alta       | reduzir friccao de navegacao     |
| Scroll interno por bloco   | presente apenas quando necessario  | alta       | legibilidade e foco por contexto |
| Composicao 1/3 + 2/3       | respeitada nas 3 secoes            | alta       | consistencia de leitura          |
| Entradas/saidas na secao 3 | entradas direita e saidas esquerda | media      | leitura rapida de fluxo          |
| Integridade funcional      | sem mudanca em regras e dados      | alta       | evitar regressao de negocio      |

## §5 Integracoes Externas

- nao ha novas integracoes.
- nao ha alteracao de backend.
- opcional: adocao de biblioteca UI/layout no frontend se acelerar execucao sem risco de regressao.

## §6 Constitution Check

| Principio                               | Resultado | Evidencia                                  |
| --------------------------------------- | --------- | ------------------------------------------ |
| I. Bounded Architecture                 | Conforme  | escopo concentrado no client               |
| II. Security by Default                 | Conforme  | sem alteracao de auth/segredos             |
| III. Quality Gates Executaveis          | Conforme  | lint/build/test frontend obrigatorios      |
| IV. Data Integrity                      | Conforme  | sem alteracao de calculos ou persistencia  |
| V. Operability e Observabilidade Segura | Conforme  | navegacao previsivel e estados controlados |

## §7 Trade-offs e Riscos

| Risco                                                      | Tipo    | Impacto                     | Mitigacao                                          |
| ---------------------------------------------------------- | ------- | --------------------------- | -------------------------------------------------- |
| Sem scroll global pode piorar experiencia em desktop menor | UX      | perda de usabilidade        | definir alturas minimas + scroll interno por bloco |
| Entrega em um dia pode reduzir refinamento visual          | Produto | ajuste pos-release          | priorizar estrutura e hierarquia first-pass        |
| Excesso de componentes pode poluir layout                  | UX      | queda na escaneabilidade    | limitar densidade e manter espacamento consistente |
| Mudanca de layout causar regressao interativa              | Tecnico | quebra em fluxos existentes | testes de regressao visual e funcional             |
| Inconsistencia de alinhamento entradas/saidas              | UX      | confusao de leitura         | regra visual unica com validacao manual dirigida   |

## §8 Decisoes Arquiteturais

### Decisao 1: Desktop com altura fixa e sem scroll global

- Alternativas consideradas: manter scroll global com pequenos ajustes.
- Justificativa tecnica: simplifica foco visual e reduz navegacao vertical.
- Justificativa de negocio: atende diretamente dor principal e KPI de 30s.
- Consequencias: necessidade de scroll interno controlado por bloco.

### Decisao 2: Layout em 3 secoes com ratio fixo 1/3 + 2/3

- Alternativas consideradas: grid livre sem proporcao fixa.
- Justificativa tecnica: aumenta previsibilidade de layout.
- Justificativa de negocio: acelera localizacao por padrao repetivel.
- Consequencias: exige priorizacao rigorosa de conteudo por secao.

### Decisao 3: Escopo sem backend e sem regra de negocio

- Alternativas consideradas: aproveitar ciclo para ajustes de regra/dados.
- Justificativa tecnica: reduz risco e tempo de entrega.
- Justificativa de negocio: garante foco na dor de UI/UX com prazo curto.
- Consequencias: melhorias de dados/relatorio ficam para ciclos futuros.

## Estratégia de validacao do KPI (<= 30s)

1. Definir roteiro de 5 tarefas de localizacao (ex.: encontrar saldo livre, fatura atual, proximo pagamento, categoria mais critica, ultimo movimento de saida).
2. Executar o roteiro nos viewports desktop baseline 1366x768 e 1920x1080.
3. Cronometrar tempo por tarefa com PO em cada viewport baseline.
4. Considerar aprovado quando o tempo maximo observado (pior caso) entre tarefas e viewports for <= 30s.
5. Registrar observacoes qualitativas de confusao visual e pontos de ajuste.

## Sequencia incremental

1. Shell desktop: toggle de sidebar e container com altura fixa.
2. Secao 1 (cartoes + grafico) com estrutura 1/3 + 2/3.
3. Secao 2 (pagamentos + blocos de valores) com estrutura 1/3 + 2/3.
4. Secao 3 (categorias + movimentacoes) com entradas/saidas em lados opostos.
5. Ajustes de overflow interno, headers fixos e refinamento visual.
6. Validacao KPI e regressao funcional.

## Criterio Go/No-Go

Go:

- sidebar retratil funcional.
- dashboard desktop sem scroll global.
- 3 secoes implementadas com 1/3 + 2/3 conforme briefing.
- movimentacoes com entradas a direita e saidas a esquerda.
- KPI de localizacao com tempo maximo <= 30s validado nos viewports 1366x768 e 1920x1080.
- quality gates frontend aprovados.

No-Go:

- scroll global ainda presente no dashboard desktop.
- qualquer secao fora da composicao obrigatoria.
- regressao funcional em fluxos existentes.
- falha de quality gates sem mitigacao aprovada.
