# Mapeamento estratégico de oportunidades — Finances

> Capturado em: 01/08/2026
> Escopo: exploração/proposta. Nenhum código de aplicação foi alterado neste documento.
> Persona: Rafael — único dev, PO e usuário do app.

---

## 1. Estado atual

Resumo por área, com os arquivos/use cases que sustentam cada uma hoje.

### Movimentações (entradas/saídas)

- Domínio: `Movimentacao` (abstrata) com `Entrada`/`Saida` (`server/Core/Domain/Movimentacao/`). Suporta categoria, vínculo a cartão, veículo (com `Km`), e vínculo a investimento.
- **Recorrência e parcelamento já existem e são gerados no ato da criação**: `CriarMovimentacaoUseCase` (`server/Core/UseCases/Movimentacao/CriarMovimentacaoUseCase.cs`) cria as N ocorrências de uma vez (mensal ou semanal) quando `Fixa = true`. `TipoMovimentacaoFixa.Parcelada` numera automaticamente `{título} i/N` (Ciclo 3); `RenumerarGrupoUseCase` permite renumerar grupos retroativos. **Não existe recorrência sem fim definido** — isso foi explicitamente adiado no briefing do Ciclo 3 ("próximo ciclo se houver demanda").
- CRUD completo, filtro por período, saldo acumulado, resumo mensal, comparativo de categorias mês-a-mês (`ObterComparativoCategoriaMensalUseCase`, 3 meses por padrão), exportação CSV (`ExportarMovimentacoesCsvUseCase`).
- Frontend: `TransactionModal.jsx` (formulário com seção avançada colapsada para fixa/parcelada/cartão/veículo), hooks `useDashboardFinancials.js` (totais, comparação mensal, dados de gráfico, ranking de categorias, próximos pagamentos/recebimentos), `useTransactionFilters.js` (busca + filtro por tipo/categoria/cartão — o filtro por cartão e categoria no slide de transações **já foi implementado**, resolvendo um gap que o `docs/ux-reviews/mapeamento-redesign-light-desktop-2026-07-31.md` ainda listava como pendente em 31/07).
- Existe também um fluxo de **simulação** (`useTransactionActions.js`, `handleSimulate`/`handleApplySimulation`): permite pré-visualizar transações hipotéticas antes de persistir — feature pouco óbvia mas já pronta.

### Cartão de crédito (manual, sem integração bancária)

- Domínio `CartaoManual` (`server/Core/Domain/Cartao/CartaoManual.cs`): nome, limite, dia de fechamento/vencimento, cor de tema, máximo de 3 cartões ativos por usuário. `CompetenciaFaturaCalculator` resolve corretamente ciclos que cruzam o mês.
- Casos de uso completos: cadastrar, editar, inativar, resumo, resumos (múltiplos cartões), previsão de fatura, e um fluxo de auditoria/backfill (preview/apply/rollback) para correção de competência em dados legados.
- Frontend: `useCardSummaries.js`, slide "Cartões" no dashboard desktop (`dashboard/CardsSlide.jsx`) e tela equivalente no mobile. **`client/src/components/CardViewerView.jsx` é um componente órfão** — não é importado por nenhum fluxo de produção (só aparece em teste), conforme já identificado no ux-review de 31/07.

### Investimentos

- Domínio `Investimento` (`server/Core/Domain/Investimento/Investimento.cs`): aportes/saques/atualização de saldo com histórico de transações (`TransacaoInvestimento`), tipo, rentabilidade, liquidez. Operações multi-escrita usam `ITransactionManager` (commit/rollback conjunto).
- CRUD completo + aportes/saques/atualização de saldo/remoção com estorno (`InvestimentosController`).
- Frontend: `InvestmentsView.jsx` (~670 linhas) com simulador de juros compostos e cadastro/ações inline. **Não é item de navegação de primeira classe** em nenhuma das duas superfícies — é acessível só como um "slide" dentro do Dashboard (`activeSlide === "investments"` no desktop, `activeScreen === "investments"` no mobile). A antiga rota morta `activeTab === "investments"` do `App.jsx` já foi removida (confirmado lendo o `App.jsx` atual — a sidebar só lista `dashboard`/`wishlist`/`vehicle`).

### Metas / Wishlist ("Conquistas" — custo de oportunidade)

- Domínio `Meta` (`server/Core/Domain/Metas/Meta.cs`): descrição, valor, data-alvo, `Concluida` (toggle manual). **Sem nenhum vínculo com categoria, investimento ou saldo real** — é um registro isolado.
- `WishListView.jsx`: converte o preço do desejo em horas de trabalho necessárias (`hourlyRate` = renda mensal / horas de trabalho), permite marcar como concluída manualmente. Não há progresso automático.

### Veículos

- Domínio `Veiculo` (`server/Core/Domain/Veiculo/Veiculo.cs`): dados cadastrais + `AlertaKm`/`UltimoKmAlerta`. Alerta de revisão é local ao componente (`kmAtual - ultimoKmAlerta >= alertaKm`), calculado dentro de `VehicleView.jsx` a partir do maior `Km` das movimentações vinculadas ao veículo.
- Despesas de manutenção são `Movimentacao` comuns com `VeiculoId`/`Km` preenchidos — não há entidade própria de "manutenção".
- Tela standalone, sem qualquer sinal cruzado no Dashboard (o alerta de revisão só aparece dentro da própria aba Veículos).

### Categorias / Orçamento por categoria

- `Categoria` (por usuário, com `OrcamentoMensal` opcional) + `CategoriaOrcamentoUsuario` (permite ao usuário sobrescrever o orçamento de categorias **globais**, que são compartilhadas). Dois níveis de orçamento já modelados.
- **Achado relevante**: `ObterAlertasOrcamentoCategoriasUseCase` já calcula três estados por categoria — `Normal` / `Atencao` (≥80% do orçamento) / `Estourado` (≥100%) — exposto em `GET /api/v1/categorias/alertas-orcamento` (`CategoriasController.cs`). A constante do endpoint existe em `client/src/services/api.js` (`API_CATEGORIAS_ALERTAS_ORCAMENTO_URL`) **mas nunca é chamada por nenhum componente**. O Dashboard reimplementa uma versão mais pobre client-side em `useDashboardFinancials.js` (`exceededCategoryAlerts`), que só sabe "estourou ou não" — perde o estado intermediário "Atenção" que o backend já calcula.
- `CategoryManagerModal.jsx` já tem o formulário reorganizado (formulário acima da lista, botão pílula) — briefing `reorganizacao-formulario-categorias.md` já implementado.

### Autenticação

- JWT Bearer + BCrypt, registro por código de ativação (`AtivacaoDTO`/`ContaNaoAtivadaException`), rota `registro-publico` além de `registro`. Rate limiting em endpoints públicos (SEC-014, já hardened).

### Sistema visual

- Migração completa para light mode concluída recentemente (mobile e, em sequência, desktop — ver `docs/ux-reviews/mapeamento-redesign-light-mobile-2026-07-31.md` e `...-desktop-2026-07-31.md`). **Não há mecanismo de dark mode**: sem `prefers-color-scheme`, sem `data-theme`, tokens de cor fixos em `index.css`. Foi uma decisão de produto explícita, não um esquecimento.

---

## 2. Novas features

Priorizadas por impacto (Alto/Médio/Baixo) e esforço honesto (Pequeno/Médio/Grande) considerando o que já existe no domínio.

### 2.1 [Alto impacto / Esforço Pequeno] Ativar o alerta preventivo de orçamento (80%) que já existe no backend

Hoje o Dashboard só mostra "estourou o orçamento" (booleano, calculado client-side em `useDashboardFinancials.js`). O backend já calcula um estado intermediário "Atenção" a partir de 80% de consumo (`ObterAlertasOrcamentoCategoriasUseCase`), exposto em `/api/v1/categorias/alertas-orcamento`, e o endpoint já está referenciado (mas não chamado) em `api.js`. Trocar o cálculo client-side por uma chamada real a esse endpoint dá ao Rafael um aviso *antes* de estourar a categoria, não só depois — dor real de quem só descobre o estouro no fim do mês. Esforço: trocar uma função de `useDashboardFinancials.js` por um `fetch`, sem migration nem novo endpoint.

### 2.2 [Alto impacto / Esforço Médio] Metas com progresso automático vinculado a categoria ou investimento

`Meta` hoje é só descrição + valor + prazo + conclusão manual — não sabe quanto já foi "guardado" de fato. Vincular uma meta a uma categoria de poupança (soma de entradas/saídas dessa categoria) ou a um `Investimento` (usar `SaldoAtual`) permite calcular progresso automaticamente e mostrar "faltam R$ X" sem o usuário precisar atualizar nada manualmente. Resolve a desconexão hoje existente entre "Conquistas" (aba isolada) e o dinheiro real. Esforço: campo nullable `CategoriaId`/`InvestimentoId` em `Meta` + migration + pequeno cálculo de progresso reaproveitando dados que `useDashboardFinancials`/`InvestimentosController` já expõem.

### 2.3 [Alto impacto / Esforço Médio] Central de alertas in-app (agregando sinais que já existem)

Hoje existem três sinais de alerta calculados em pontos diferentes e nenhum lugar central para vê-los juntos: orçamento estourado/atenção (`ObterAlertasOrcamentoCategoriasUseCase`), previsão de fatura de cartão (`ObterPrevisaoFaturaUseCase`), e revisão de veículo por km (calculado dentro de `VehicleView.jsx`, nem chega ao Dashboard). Uma central de notificações in-app (sino no header, sem necessidade de push/e-mail) que agrega esses três sinais já calculados resolve o "preciso abrir 3 telas pra saber se algo precisa de atenção". Esforço: majoritariamente frontend (um hook que agrega os três `fetch`s existentes); o único ganho de backend seria persistir "lida/não lida" por alerta, o que é opcional para uma v1.

### 2.4 [Médio impacto / Esforço Pequeno-Médio] Projeção de faturas futuras do cartão (parcelas em aberto)

`Movimentacao.CompetenciaFatura` e `TipoMovimentacaoFixa.Parcelada` já guardam, por lançamento, a que fatura ele pertence. Hoje `ObterPrevisaoFaturaUseCase` calcula a fatura atual; falta um "próximos N meses" que some as parcelas já comprometidas por competência futura, dando visibilidade real de comprometimento de limite antes de comprar algo novo. Esforço pequeno-médio: é uma consulta de agregação sobre dado que já existe, sem mudança de schema.

### 2.5 [Médio impacto / Esforço Pequeno] Renovação/aviso de recorrência fixa no fim do período

O briefing do Ciclo 3 já registrou como fora de escopo "recorrência verdadeiramente infinita" — hoje uma fixa criada com `Periodo = 12` simplesmente para de gerar depois do 12º mês, sem aviso. Um alerta simples ("Aluguel: última parcela gerada foi em MM/AAAA, deseja renovar por mais N meses?") reaproveita o mesmo `GrupoRecorrenciaId` e o mesmo `CriarMovimentacaoUseCase`, só precisa de uma consulta que detecte grupos cuja última ocorrência está no passado. Não é recorrência infinita de verdade — é uma ponte barata até que isso vire necessário.

### 2.6 [Médio impacto / Esforço Médio] Relatório mensal exportável além do CSV bruto

A exportação hoje é uma lista de lançamentos em CSV (`ExportarMovimentacoesCsvUseCase`). Falta um resumo "de leitura humana" do mês — receitas, despesas, saldo, top categorias, comparação com mês anterior — reaproveitando exatamente os dados que `ObterResumoMensalUseCase` e `ObterComparativoCategoriaMensalUseCase` já calculam. Útil pra Rafael arquivar/consultar fora do app sem reabrir a UI. Esforço médio: é composição de dado já existente em um novo formato (PDF ou HTML imprimível), não cálculo novo.

### 2.7 [Médio impacto / Esforço Médio] Busca global (Cmd+K)

Não existe busca cruzando entidades hoje — `useTransactionFilters.js` só busca dentro de movimentações já carregadas do período ativo, e cada tela (Veículos, Cartões) não é buscável. Uma busca global simples (transações + veículos + metas + cartões, com atalho de teclado) reduz a necessidade de trocar de aba manualmente pra achar algo. Esforço médio: não há endpoint de busca cross-entity no backend hoje; a v1 mais barata é client-side sobre o que já está carregado (sem novo endpoint), com uma versão server-side como evolução se o volume de dados crescer.

### 2.8 [Baixo-Médio impacto / Esforço Pequeno] Atalhos de teclado para captura rápida

App de uso diário e solo se beneficia desproporcionalmente de atalhos (`N` para nova transação, `←`/`→` para trocar de mês, `Esc` para fechar modal). A estrutura de estado já existe em `App.jsx` (`activeTab`, `selectedMes/Ano`) e nos handlers dos hooks — é só um `keydown` listener chamando funções que já existem. Baixo risco, ganho de fricção percebida alto para quem usa todo dia.

### 2.9 [Decisão de produto, não feature nova] Dark mode: manter fora por enquanto

O app acabou de sair de um redesign completo (mobile e desktop) migrando *de* dark hardcoded *para* light com tokens (`docs/ux-reviews/mapeamento-redesign-light-*-2026-07-31.md`). Reintroduzir dark mode como opção não é "ligar de novo o que existia" — a paleta antiga era hardcoded, não uma variante de tema; recriar um dark mode real exigiria duplicar todos os tokens de `index.css` num segundo conjunto e testar cada tela de novo. Dado o histórico recente (dois ciclos de redesign só pra sair do dark), a recomendação é **não reabrir isso agora** — só reconsiderar se o uso noturno do app virar uma dor relatada de verdade, não por printar bem em portfólio.

### 2.10 [Avaliado e descartado] Multi-conta / multi-moeda

Domínio inteiro assume um usuário com um caixa único (saldo acumulado global, sem conceito de "conta bancária" ou "carteira" separada). Para um app pessoal de usuário único sem operação em mais de uma moeda (nenhuma evidência disso em dados de teste, CHANGELOG ou briefings), isso é complexidade de SaaS multi-tenant travestida de feature pessoal — cada tela (resumo, gráficos, orçamento) teria que aprender a filtrar/agregar por conta. Não recomendado. Se um dia surgir a necessidade real (ex: separar "conta corrente" de "dinheiro em espécie"), o caminho mais barato é um campo `Origem`/`Conta` opcional em `Movimentacao`, não uma entidade nova — mas isso só quando a dor aparecer.

---

## 3. Reorganização de UX/IA

Propostas de reestruturação de navegação/agrupamento, sem funcionalidade nova.

### 3.1 Investimentos tem descoberta assimétrica entre mobile e desktop

No mobile, "Investimentos" é um item **persistente** da sub-navegação do Dashboard (`activeScreen`, bottom bar interna com `home`/`charts`/`cards`/`investments` — `DashboardMobileView.jsx`). No desktop, é acessível só clicando num card específico dentro da home (`activeSlide === "investments"`, sem nenhum item de navegação fixo apontando pra lá). Ou seja: no desktop, que é onde o usuário mais opera (conforme o próprio ux-review de 31/07: "desktop é secundário no produto, mas é onde a tela mais densa vive"), investimentos é *menos* descobrível do que no mobile. Não é necessariamente promovê-lo a item de nav de topo (`App.jsx` sidebar) — é alinhar a affordance: se mobile trata como destino persistente, desktop deveria ter, no mínimo, um atalho fixo equivalente (não só um card entre outros na home).

### 3.2 Navegação redundante para os slides "charts" e "transactions" no desktop (achado já registrado, ainda não resolvido)

O ux-review de 31/07 já documentou que dois cards diferentes da home levam ao mesmo slide "charts" (gráfico grande + "Gastos por Categoria") e dois levam a "transactions" (resumo de KPI + "Movimentações"), sem nenhuma pista visual de que são atalhos pro mesmo lugar. A recomendação de lá (adicionar ícone de affordance) resolve a confusão, mas vale uma camada adicional: dado que já existem 4 pontos de entrada pra 2 destinos, considerar se a home não deveria ter só **um** card por destino (ex.: fundir "resumo de KPI" e "Movimentações" num único card com dois níveis de detalhe) em vez de manter os dois e só sinalizar que são iguais.

### 3.3 Veículos vive isolado do dinheiro — alerta de revisão nunca aparece fora da própria aba

O alerta de km-para-revisão é calculado só dentro de `VehicleView.jsx`. Um usuário que não abre a aba Veículos periodicamente nunca vê esse alerta — mesmo problema estrutural do item 2.3 (central de alertas), mas vale como reorganização por si só: o Dashboard já tem um bloco de "Próximos pagamentos" (`upcomingPayments`, de `useDashboardFinancials.js`) que trata só de despesas datadas; um alerta de veículo é orientado a evento (km), não a data, então não cabe no mesmo componente sem adaptação — mas merece aparecer em algum lugar do fluxo principal, não só dentro da aba isolada.

### 3.4 "Conquistas" (Wishlist) é uma ilha sem referência ao saldo real

A aba mostra custo em horas de trabalho, mas nunca cruza com quanto dinheiro está de fato disponível hoje (saldo do mês, saldo acumulado, ou investimentos). Ligada à proposta 2.2 (progresso automático), a reorganização equivalente é: se uma meta for vinculada a uma categoria/investimento, ela deveria aparecer também no contexto do Dashboard (não só na aba própria) — ex. como um card de "faltam R$X pra sua próxima meta" perto do resumo financeiro, do mesmo jeito que "próximos pagamentos" já aparece ali.

### 3.5 Housekeeping: `CardViewerView.jsx` órfão

Não é uma questão de IA, mas de higiene que afeta quem navega o código: o componente não é usado em nenhum fluxo de produção (só em teste) desde antes do redesign de 31/07, que já sinalizou isso e recomendou remoção ou decisão explícita. Vale resolver antes de qualquer novo ciclo tocar em cartões, pra não confundir "qual componente de cartão é o real" durante uma feature nova.

---

## 4. Backend/dados necessários para sustentar as seções 2 e 3

| Proposta | Mudança de dado/API necessária |
|---|---|
| 2.1 Alerta 80% no dashboard | Nenhuma — só o frontend passar a chamar `GET /api/v1/categorias/alertas-orcamento` que já existe. |
| 2.2 Metas com progresso automático | Novos campos nullable em `Meta`: `CategoriaId` (FK opcional) e/ou `InvestimentoId` (FK opcional). Migration nova. Pequeno ajuste em `MetaDTO`/`ListarMetasUseCase` pra incluir progresso calculado (reaproveita queries que já existem em `MovimentacaoRepository`/`InvestimentoRepository`, não precisa de agregação nova). |
| 2.3 Central de alertas | Nenhum endpoint novo obrigatório — reaproveita `/categorias/alertas-orcamento`, `/cartao/previsao`, e precisaria de um endpoint leve pro alerta de veículo (`VeiculosController` já tem os dados, só falta expor "km atual vs. alertaKm" agregado, hoje calculado só no frontend). Se quiser persistir "lida/não lida": nova tabela simples `AlertaLido(UsuarioId, ChaveAlerta, LidoEmUtc)`. |
| 2.4 Projeção de faturas futuras | Novo método no `ICartaoRepository`/novo use case que agrega `Movimentacao` por `CompetenciaFatura` futura (dado já existe no schema, é só uma nova consulta agregada). Endpoint novo, ex. `GET /api/v1/cartao/{id}/previsao-futura?meses=3`. |
| 2.5 Renovação de recorrência | Novo use case (`RenovarGrupoRecorrenciaUseCase`) que detecta grupos com última ocorrência no passado e cria N novas a partir do padrão já existente em `CriarMovimentacaoUseCase`. Endpoint novo `POST /api/v1/movimentacoes/grupos/{grupoRecorrenciaId}/renovar`. Sem migration. |
| 2.6 Relatório mensal exportável | Novo use case que compõe `ObterResumoMensalUseCase` + `ObterComparativoCategoriaMensalUseCase` num formato de saída diferente (PDF/HTML). Endpoint novo `GET /api/v1/movimentacoes/relatorio-mensal?mes=&ano=`. Sem migration — é apresentação de dado já calculado. |
| 2.7 Busca global | v1 sem backend novo (busca sobre dados já carregados no cliente). Se evoluir para busca server-side: endpoint novo `GET /api/v1/busca?q=` cruzando `MovimentacaoRepository`/`ICategoriaRepository`/`IVeiculoRepository`/`ICartaoRepository`. |
| 2.8 Atalhos de teclado | Nenhuma mudança de backend. |
| 3.1–3.4 Reorganizações de IA | Nenhuma mudança de schema — são recomposição de telas com dados já expostos pelas APIs atuais. |

---

## 5. Recomendação de sequenciamento

Seguindo o mesmo padrão de ciclos incrementais que o `CHANGELOG.md` já evidencia (ex.: Ciclo 3 parcelamento → Ciclo 4 release notes → ciclos de cartão → ciclos de redesign), a sugestão é:

**Ciclo A — Fechar o que já está pago (maior retorno, menor esforço, zero dependência nova)**
- 2.1 Alerta de orçamento em 3 estados (já existe no backend, só falta consumir).
- 2.4 Projeção de faturas futuras (dado já existe, é consulta nova).
- 2.8 Atalhos de teclado.
- 3.5 Remover/decidir o destino do `CardViewerView.jsx` órfão (housekeeping barato, evita confusão em ciclos futuros de cartão).

Justificativa: nenhum item aqui depende de migration ou de decisão de produto em aberto — é o "juntar o troco" do que os últimos ciclos já construíram e não terminaram de aproveitar.

**Ciclo B — Conectar dinheiro real a metas e alertas (depende parcialmente do Ciclo A)**
- 2.2 Metas com progresso automático (depende de nada do Ciclo A, mas se beneficia do endpoint de orçamento já estar em uso — mesmo padrão de "puxar dado calculado" fica consistente).
- 2.3 Central de alertas in-app (reaproveita diretamente o alerta de orçamento do Ciclo A, mais fácil de justificar o esforço de UI nova depois que o dado já está sendo consumido).
- 3.3 e 3.4 (Veículo e Wishlist aparecendo no fluxo principal) — são a contrapartida de UX do que 2.2/2.3 tornam possível; faz sentido entregar junto.
- 3.1 Decisão sobre affordance de Investimentos no desktop — pequeno, mas symbolic: mesmo momento de "revisar o que aparece no fluxo principal".

**Ciclo C — Fechar lacunas de retenção de dado ao longo do tempo**
- 2.5 Renovação de recorrência fixa (só faz sentido depois que existir uso real acumulado de grupos recorrentes vencendo — não é urgente, mas cresce em valor com o tempo de uso do app).
- 2.6 Relatório mensal exportável (natural depois que o Ciclo B já consolidou "visão do que importa" na tela — o relatório vira a versão portátil da mesma síntese).
- 2.7 Busca global (só compensa quando o volume de dados acumulado começar a doer; com poucos meses de uso, os filtros existentes ainda resolvem).
- 3.2 Consolidação dos cards redundantes da home desktop — é um retrabalho visual que só vale a pena depois que o conteúdo da home (Ciclo B) já estiver estável, para não redesenhar duas vezes a mesma área.

2.9 (dark mode) e 2.10 (multi-conta) ficam de fora de qualquer ciclo — são decisões de "não fazer agora", não trabalho pendente.
