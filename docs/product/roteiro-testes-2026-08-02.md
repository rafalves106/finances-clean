# Roteiro de testes — validação antes de promover para produção

> Escopo: cobre tudo que foi implementado nos Ciclos A/B/C do [mapeamento de features](mapeamento-features-2026-08-01.md), mais dois trabalhos que saíram fora do mapeamento original: contabilização de despesa de cartão por vencimento da fatura, e exclusão em massa de movimentações.
> Ambiente: HOMOL (`hml-finance.falveshub.com`), com dados clonados da produção.
> Como usar: vá marcando cada item. Se algo falhar, anote o que exatamente aconteceu (print, mensagem de erro) antes de seguir — ajuda a diagnosticar depois.

---

## 0. Preparação

- [ ] Login funciona normalmente (email + senha já cadastrados).
- [ ] Dashboard carrega sem erro no console do navegador (F12 → aba Console, sem erros vermelhos).
- [ ] Testar em **desktop** (tela larga) e em **mobile** (janela estreita ou celular de verdade) — o app tem duas interfaces bem diferentes, os dois precisam ser cobertos.

---

## 1. Movimentações — básico (CRUD)

- [ ] Criar uma nova receita (Entrada) simples — aparece na lista, soma em "Receitas".
- [ ] Criar uma nova despesa (Saída) simples, com categoria — aparece na lista, soma em "Despesas" e em "Gastos por Categoria".
- [ ] Editar uma movimentação existente (mudar valor, data ou categoria) — reflete em todos os totais.
- [ ] Excluir uma movimentação individual (botão "Excluir" de sempre, não o novo em massa) — some da lista, some dos totais.
- [ ] Trocar de mês (setas ‹ › ou seletor) — os dados mudam corretamente pro mês selecionado.

## 2. Movimentações — recorrência e parcelamento

- [ ] Criar uma movimentação **fixa/recorrente** (ex: "Internet", mensal, 3x) — confirme que aparecem 3 lançamentos, um por mês, com o mesmo título.
- [ ] Criar uma movimentação **parcelada** (ex: "Notebook", parcelado, 3x) — confirme que aparecem 3 lançamentos com título "Notebook 1/3", "Notebook 2/3", "Notebook 3/3".
- [ ] **Renovação de recorrência** (item 2.5, novo neste ciclo): ache (ou crie) um grupo recorrente cuja última parcela já passou. Deve aparecer um alerta na Central de Alertas (🔔) oferecendo renovar. Clique em renovar e confirme que novas parcelas foram criadas dando sequência ao grupo (sem duplicar nem quebrar a numeração se for parcelado).

## 3. Movimentações — exclusão em massa (NOVO)

- [ ] **Desktop**: abra o slide de Movimentações (ícone ↗ no card ou clique no card). Marque o checkbox de 2-3 linhas. Confirme que aparece a barra "N selecionadas · R$X" com o valor total correto.
- [ ] Clique em "Selecionar todas" no cabeçalho da tabela — todas as linhas visíveis (exceto o item "Fatura [cartão]", que não é selecionável) devem marcar.
- [ ] Clique em "Excluir selecionadas" → confirme no modal → as movimentações somem da lista e os totais atualizam.
- [ ] **Mobile**: toque em "Selecionar" no card de Movimentações. Toque em 2-3 itens (em vez de expandir, eles devem só marcar/desmarcar). Confirme a barra de contagem/total. Toque em "Excluir" → confirme no modal → itens somem.
- [ ] Teste o caso de cancelar: selecione alguns itens e clique em "Cancelar"/"Limpar seleção" — nada deve ser excluído.
- [ ] (Opcional, se você tiver algum aporte de investimento nas movimentações) Tente incluir uma movimentação vinculada a investimento numa seleção em massa — o app deve excluir as outras normalmente e avisar que essa específica não pôde ser removida (ela é gerenciada pela aba Investimentos).

## 4. Cartões de crédito

- [ ] Cadastrar/editar um cartão com dia de fechamento e vencimento diferentes (ex: fecha dia 29, vence dia 5) — confirme que salva certo.
- [ ] Fazer uma compra no cartão dentro do ciclo atual — confirme que aparece corretamente na "Fatura de [mês]" do card do cartão.
- [ ] Verificar a "previsão de faturas futuras" (as próximas 2-3 competências) no slide de Cartões — os valores batem com as compras já lançadas.

## 5. Despesa de cartão contabilizada no vencimento (NOVO — mais importante deste ciclo)

Este foi o pedido que você fez diretamente — vale um teste bem cuidadoso, é cálculo financeiro.

- [ ] Escolha um cartão seu com fechamento e vencimento em **meses diferentes** (ex: fecha dia 29, vence dia 5 do mês seguinte — como o Itaú CC nos dados de teste).
- [ ] Vá até o mês em que uma fatura desse cartão foi **fechada** (mês da compra) — confirme que o valor dessa fatura **NÃO** aparece em "Despesas do mês" nem em "Gastos por Categoria" nesse mês.
- [ ] Vá até o mês em que essa mesma fatura **vence** — confirme que:
  - [ ] O valor aparece em "Despesas do mês".
  - [ ] O valor aparece em "Gastos por Categoria", separado por categoria de cada compra (não como um bloco único sem categoria).
  - [ ] "Saldo do mês" reflete esse valor corretamente (Receitas − Despesas, incluindo a fatura).
  - [ ] Um item **"Fatura [nome do cartão]"** aparece na lista de Movimentações, datado no dia exato do vencimento (confirme que a data bate com o dia de vencimento configurado no cartão — esse foi um bug real que já corrigimos, vale reconferir).
  - [ ] Esse item de fatura **não tem botões de Editar/Excluir** (é só um resumo visual).
- [ ] Se você tiver uma categoria com orçamento mensal configurado e uma compra de cartão que estoura esse orçamento: confirme que o alerta de orçamento (🔔 Central de Alertas) só aparece no mês de **vencimento**, não no mês da compra.
- [ ] Confira o "Saldo atual" (mobile) / saldo acumulado — o valor da fatura só deve ser descontado do saldo a partir do mês em que ela vence, não antes.
- [ ] **Relatório mensal exportável** (ver seção 10): gere o relatório do mês de vencimento e confirme que os números batem com o que a tela mostra.

## 6. Orçamento por categoria / Alertas em 3 estados

- [ ] Configure o orçamento mensal de uma categoria (ex: R$500).
- [ ] Lance despesas nessa categoria até passar de 80% do orçamento — confirme que ela entra em estado "Atenção" (cor/badge amarelo) na tela e na Central de Alertas.
- [ ] Passe de 100% — confirme que muda pra "Estourado" (vermelho).
- [ ] Fique abaixo de 80% — confirme que fica "Normal" (sem alerta).

## 7. Central de alertas (🔔)

- [ ] Ícone de sino aparece no header (mobile) e no rodapé da sidebar (desktop), com contador de pendentes.
- [ ] Clicar abre o painel com todos os alertas juntos: orçamento estourado/atenção, veículo com revisão pendente, recorrência expirada.
- [ ] Clicar fora do painel fecha ele.

## 8. Metas ("Conquistas") com progresso automático

- [ ] Criar uma meta **sem vínculo** — funciona como antes (custo em horas de trabalho, conclusão manual).
- [ ] Criar uma meta **vinculada a uma categoria** — confirme que a barra de progresso e "faltam R$X" refletem automaticamente as movimentações daquela categoria (sem precisar atualizar manualmente).
- [ ] Criar uma meta **vinculada a um investimento** — confirme que o progresso usa o saldo atual do investimento.
- [ ] Confirme que uma meta vinculada aparece também no Dashboard (não só na aba Conquistas) — mobile: card "Metas" na home; desktop: aba "Metas" no widget da home.

## 9. Veículos

- [ ] Cadastrar/editar um veículo, lançar uma despesa de manutenção vinculada a ele (com Km).
- [ ] Forçar o alerta de revisão por Km (lançar Km suficiente pra estourar o `alertaKm`) — confirme que aparece na Central de Alertas e também um card dedicado no Dashboard (não só dentro da aba Veículos).

## 10. Relatório mensal exportável (NOVO neste ciclo)

- [ ] No dashboard desktop, clique no ícone de relatório (perto do botão de exportar CSV) → baixa um arquivo HTML.
- [ ] Abra o arquivo baixado no navegador — confirme que mostra: receitas, despesas, saldo do mês, top categorias de despesa, e comparação com o mês anterior por categoria.
- [ ] Os números batem com o que o Dashboard mostra pro mesmo mês (incluindo a contabilização de fatura por vencimento, se aplicável).

## 11. Busca global — Cmd+K (NOVO neste ciclo)

- [ ] Aperte `Cmd+K` (Mac) ou `Ctrl+K` — abre a busca. Também testar clicando no ícone de lupa na navegação.
- [ ] Buscar o nome de uma transação do mês atual — aparece no resultado.
- [ ] Buscar o nome de um veículo — aparece, e clicar leva pra aba Veículos.
- [ ] Buscar o nome de uma meta — aparece, e clicar leva pra aba Conquistas.
- [ ] Testar navegação por teclado (setas + Enter) além do clique do mouse.

## 12. Exportação CSV

- [ ] Exportar CSV de um período — arquivo baixa, abre certo no Excel/Planilhas, valores batem com o período escolhido.

## 13. Investimentos

- [ ] Fazer um aporte e um saque num investimento — saldo atualiza corretamente.
- [ ] Confirme que o valor investido não é contado como "Despesa" no resumo do mês (regra antiga, só reconferir que não quebrou com as mudanças deste ciclo).

## 14. Atalhos de teclado

- [ ] `N` abre nova transação (fora de um campo de texto).
- [ ] `←`/`→` trocam de mês.
- [ ] `Esc` fecha modal aberto.

## 15. Visual / responsividade

- [ ] Sem textos cortados ou sobrepostos em telas pequenas (celular) e médias (tablet).
- [ ] Cursor vira "pointer" ao passar em botões clicáveis (checar em alguns pontos aleatórios).
- [ ] Os 4 cards da home desktop que levam a "Despesas"/"Gastos por Categoria" (gráfico grande, resumo KPI, Gastos por Categoria, Movimentações) mostram o ícone de seta indicando que são clicáveis.

---

## Checklist final antes de promover `develop` → `main` (produção)

- [ ] Todos os itens acima passaram em HOMOL.
- [ ] Nenhum erro no console do navegador durante o teste.
- [ ] `gh pr checks` verde em todos os PRs deste ciclo (já confirmado no momento do merge, mas vale reconferir se algo foi re-aberto).
- [ ] Backup/confiança de que o clone semanal do HOMOL (segunda-feira) não deixa dados de teste "vazarem" pra produção — a promoção `develop → main` é só código, não leva dados, mas vale ter isso em mente.
- [ ] Depois de promover: repetir uma verificação rápida (login + Dashboard + uma exclusão em massa de teste) direto em produção.
