import { useMemo } from "react";
import {
  calculateVariationPercent,
  getMonthYearFromValue,
  isInvestmentExpense,
  sortByDate,
  truncateWithThreeDots,
} from "../util/dashboardFormatters";

export const useDashboardFinancials = ({
  allTransactions,
  incomes,
  expenses,
  categorias,
  selectedMes,
  selectedAno,
  saldoAnterior,
  faturaTransactions = [],
  resumoMensal = null,
  comparativoMensal = null,
}) => {
  // Totais do mês anterior via /comparativo-categorias (backend), que usa a
  // mesma regra de competência de fatura do /resumo - achamos em produção que
  // o cálculo antigo (filtrar allTransactions, que só tem o mês selecionado,
  // por mês anterior) nunca via dados reais do mês anterior (sempre 0, porque
  // o fetch só traz o mês corrente) e, pra compras no cartão, comparava bases
  // diferentes (data da compra vs. competência de vencimento do /resumo).
  const previousResumoFromComparativo = useMemo(() => {
    if (!Array.isArray(comparativoMensal)) return null;

    const previousRef = new Date(selectedAno, selectedMes - 2, 1);
    const previousMonth = previousRef.getMonth() + 1;
    const previousYear = previousRef.getFullYear();

    const linhas = comparativoMensal.filter(
      (item) => item.mes === previousMonth && item.ano === previousYear,
    );

    if (linhas.length === 0) return null;

    return linhas.reduce(
      (acc, item) => ({
        totalEntradas: acc.totalEntradas + Number(item.totalEntradas || 0),
        totalSaidas: acc.totalSaidas + Number(item.totalSaidas || 0),
      }),
      { totalEntradas: 0, totalSaidas: 0 },
    );
  }, [comparativoMensal, selectedMes, selectedAno]);

  const monthComparison = useMemo(() => {
    const previousRef = new Date(selectedAno, selectedMes - 2, 1);
    const previousMonth = previousRef.getMonth() + 1;
    const previousYear = previousRef.getFullYear();

    const sumByTypeAndPeriod = (type, month, year) =>
      allTransactions
        .filter((item) => (item.type || item.tipo) === type)
        .reduce((acc, item) => {
          const dateInfo = getMonthYearFromValue(item.date || item.data);
          if (!dateInfo) {
            return acc;
          }

          if (dateInfo.month !== month || dateInfo.year !== year) {
            return acc;
          }

          return acc + Number(item.value || item.valor || 0);
        }, 0);

    // Preferência: resumo/comparativo do backend (competência de fatura
    // correta, e o mês anterior de verdade - allTransactions só tem o mês
    // selecionado). Cai pro cálculo client-side só quando essa informação
    // ainda não chegou (ex.: primeira renderização antes do fetch).
    const currentIncome = resumoMensal
      ? Number(resumoMensal.totalEntradas || 0)
      : sumByTypeAndPeriod("Entrada", selectedMes, selectedAno);
    const previousIncome = previousResumoFromComparativo
      ? previousResumoFromComparativo.totalEntradas
      : sumByTypeAndPeriod("Entrada", previousMonth, previousYear);

    const currentExpense = resumoMensal
      ? Number(resumoMensal.totalSaidas || 0)
      : sumByTypeAndPeriod("Saida", selectedMes, selectedAno);
    const previousExpense = previousResumoFromComparativo
      ? previousResumoFromComparativo.totalSaidas
      : sumByTypeAndPeriod("Saida", previousMonth, previousYear);

    const sumInvestmentsByPeriod = (month, year) =>
      allTransactions.filter(isInvestmentExpense).reduce((acc, item) => {
        const dateInfo = getMonthYearFromValue(item.date || item.data);
        if (!dateInfo) {
          return acc;
        }

        if (dateInfo.month !== month || dateInfo.year !== year) {
          return acc;
        }

        return acc + Number(item.value || item.valor || 0);
      }, 0);

    const currentInvestment = sumInvestmentsByPeriod(selectedMes, selectedAno);
    const previousInvestment = sumInvestmentsByPeriod(
      previousMonth,
      previousYear,
    );

    return {
      incomePercent: calculateVariationPercent(currentIncome, previousIncome),
      expensePercent: calculateVariationPercent(
        currentExpense,
        previousExpense,
      ),
      balancePercent: calculateVariationPercent(
        currentIncome - currentExpense,
        previousIncome - previousExpense,
      ),
      incomeDiff: currentIncome - previousIncome,
      expenseDiff: currentExpense - previousExpense,
      balanceDiff:
        currentIncome - currentExpense - (previousIncome - previousExpense),
      currentIncome,
      currentExpense,
      currentBalance: currentIncome - currentExpense,
      investmentPercent: calculateVariationPercent(
        currentInvestment,
        previousInvestment,
      ),
      investmentDiff: currentInvestment - previousInvestment,
      currentInvestment,
    };
  }, [
    allTransactions,
    selectedAno,
    selectedMes,
    resumoMensal,
    previousResumoFromComparativo,
  ]);

  const receitasTrendIsPositive = monthComparison.incomePercent >= 0;
  const despesasTrendIsPositive = monthComparison.expensePercent <= 0;
  const saldoTrendIsPositive = monthComparison.balancePercent >= 0;
  const investmentTrendIsPositive = monthComparison.investmentDiff > 0;

  const receitasTagClassName = receitasTrendIsPositive
    ? "tag-positive"
    : "tag-negative";
  const despesasTagClassName = despesasTrendIsPositive
    ? "tag-positive"
    : "tag-negative";
  const saldoTagClassName = saldoTrendIsPositive
    ? "tag-positive"
    : "tag-negative";
  const investimentosTagClassName = investmentTrendIsPositive
    ? "tag-positive"
    : "tag-negative";

  const receitasDiffColorClassName = receitasTrendIsPositive
    ? "text-positive"
    : "text-negative";
  const despesasDiffColorClassName = despesasTrendIsPositive
    ? "text-positive"
    : "text-negative";
  const saldoDiffColorClassName = saldoTrendIsPositive
    ? "text-positive"
    : "text-negative";
  const investimentoDiffColorClassName = investmentTrendIsPositive
    ? "text-positive"
    : "text-negative";

  const receitasDiffDirection =
    monthComparison.incomeDiff >= 0 ? "a mais" : "a menos";
  const despesasDiffDirection =
    monthComparison.expenseDiff >= 0 ? "a mais" : "a menos";
  const saldoDiffDirection =
    monthComparison.balanceDiff >= 0 ? "a mais" : "a menos";
  const investimentoDiffDirection =
    monthComparison.investmentDiff >= 0 ? "a mais" : "a menos";

  const chartData = useMemo(() => {
    // Compras no cartão contam no dia do vencimento da fatura, não no dia da
    // compra (mesma regra do resumo mensal) - senão o gráfico duplica/desloca
    // o valor pro mês errado.
    const effectiveTransactions = [
      ...allTransactions.filter((item) => !item.cartaoId),
      ...faturaTransactions,
    ];

    const grouped = effectiveTransactions.reduce((acc, item) => {
      const iso = (item.date || item.data || "").split("T")[0];
      if (!iso) return acc;
      if (!acc[iso]) {
        acc[iso] = { entrada: 0, saida: 0 };
      }
      if ((item.type || item.tipo) === "Entrada") {
        acc[iso].entrada += Number(item.value || item.valor || 0);
      } else {
        acc[iso].saida += Number(item.value || item.valor || 0);
      }
      return acc;
    }, {});

    return Object.entries(grouped)
      .sort((a, b) => new Date(a[0]) - new Date(b[0]))
      .reduce((acc, [iso, values], index) => {
        const previous = index > 0 ? acc[index - 1].saldo : saldoAnterior;
        const [, month, day] = iso.split("-");
        acc.push({
          data: `${day}/${month}`,
          entrada: values.entrada,
          saida: values.saida,
          saldo: previous + values.entrada - values.saida,
        });
        return acc;
      }, []);
  }, [allTransactions, faturaTransactions, saldoAnterior]);

  const chartYAxisMax = useMemo(() => {
    const maxSaldo = chartData.reduce(
      (max, item) => Math.max(max, Number(item.saldo || 0)),
      0,
    );

    const paddedMax = maxSaldo + 1000;
    return Math.max(1000, Math.ceil(paddedMax / 1000) * 1000);
  }, [chartData]);

  const chartYTicks = useMemo(() => {
    const ticks = [];

    for (let tick = 0; tick < chartYAxisMax; tick += 1000) {
      ticks.push(tick);
    }

    if (ticks[ticks.length - 1] !== chartYAxisMax) {
      ticks.push(chartYAxisMax);
    }

    return ticks;
  }, [chartYAxisMax]);

  const upcomingPayments = useMemo(() => {
    const now = new Date();
    const monthStart = new Date(selectedAno, selectedMes - 1, 1, 0, 0, 0, 0);
    const monthEnd = new Date(selectedAno, selectedMes, 0, 23, 59, 59, 999);
    const start =
      selectedMes === now.getMonth() + 1 && selectedAno === now.getFullYear()
        ? new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0)
        : monthStart;

    return sortByDate(expenses)
      .filter((item) => {
        const dueDate = new Date(item.date || item.data);
        return dueDate >= start && dueDate <= monthEnd;
      })
      .slice(0, 5)
      .map((item) => ({
        id: item.id,
        title: item.name || item.titulo || "Despesa",
        value: Number(item.value || item.valor || 0),
        categoria: item.categoria?.nome || "Sem categoria",
        icone: item.categoria?.icone || "•",
        dueDate: new Date(item.date || item.data),
        isParcela: Boolean(item.fixa) && item.tipoMovimentacaoFixa === "Parcelada",
        isRecorrente: Boolean(item.fixa) && item.tipoMovimentacaoFixa === "RecorrenteFixa",
      }));
  }, [expenses, selectedAno, selectedMes]);

  const upcomingReceipts = useMemo(() => {
    const now = new Date();
    const monthStart = new Date(selectedAno, selectedMes - 1, 1, 0, 0, 0, 0);
    const monthEnd = new Date(selectedAno, selectedMes, 0, 23, 59, 59, 999);
    const start =
      selectedMes === now.getMonth() + 1 && selectedAno === now.getFullYear()
        ? new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0)
        : monthStart;

    return sortByDate(incomes)
      .filter((item) => {
        const dueDate = new Date(item.date || item.data);
        return dueDate >= start && dueDate <= monthEnd;
      })
      .slice(0, 5)
      .map((item) => ({
        id: item.id,
        title: item.name || item.titulo || "Receita",
        value: Number(item.value || item.valor || 0),
        categoria: item.categoria?.nome || "Sem categoria",
        icone: item.categoria?.icone || "•",
        dueDate: new Date(item.date || item.data),
        isParcela: Boolean(item.fixa) && item.tipoMovimentacaoFixa === "Parcelada",
        isRecorrente: Boolean(item.fixa) && item.tipoMovimentacaoFixa === "RecorrenteFixa",
      }));
  }, [incomes, selectedAno, selectedMes]);

  const categoryRankingAll = useMemo(() => {
    const categoriaById = new Map(
      categorias.map((categoria) => [String(categoria.id), categoria]),
    );

    // resumoMensal.porCategoria já vem com a competência de fatura correta
    // (mesma fonte usada pelo card "Despesas do mês") - prioriza isso sobre
    // recalcular a partir de expenses (que agrupa por data da compra, não
    // por vencimento da fatura).
    if (resumoMensal?.porCategoria) {
      return resumoMensal.porCategoria
        .filter((item) => Number(item.totalSaidas || 0) > 0)
        .map((item) => {
          const categoriaRef = categoriaById.get(String(item.categoriaId));
          return {
            id: item.categoriaId || "sem-categoria",
            nome: item.nome || "Sem categoria",
            icone: item.icone || "",
            cor: item.cor || "#6A6785",
            limite: Number(categoriaRef?.orcamentoMensal || 0),
            total: Number(item.totalSaidas || 0),
          };
        })
        .sort((a, b) => b.total - a.total);
    }

    const grouped = expenses.reduce((acc, item) => {
      const key = item.categoriaId || "sem-categoria";
      const categoriaRef = categoriaById.get(String(key));
      const nome =
        item.categoria?.nome || categoriaRef?.nome || "Sem categoria";
      const icone = item.categoria?.icone || categoriaRef?.icone || "";
      const cor = item.categoria?.cor || categoriaRef?.cor || "#6A6785";
      const limite = Number(
        item.categoria?.orcamentoMensal ||
          categoriaRef?.orcamentoMensal ||
          item.categoria?.limiteMensal ||
          categoriaRef?.limiteMensal ||
          0,
      );

      if (!acc[key]) {
        acc[key] = { id: key, nome, icone, cor, limite, total: 0 };
      }
      acc[key].total += Number(item.value || item.valor || 0);
      return acc;
    }, {});

    return Object.values(grouped).sort((a, b) => b.total - a.total);
  }, [categorias, expenses, resumoMensal]);

  const categoryRanking = useMemo(
    () => categoryRankingAll.slice(0, 4),
    [categoryRankingAll],
  );

  const slideCategoryRanking = useMemo(
    () => categoryRankingAll.slice(0, 8),
    [categoryRankingAll],
  );

  const slideCategoryLeftColumn = useMemo(
    () => slideCategoryRanking.slice(0, 4),
    [slideCategoryRanking],
  );

  const slideCategoryRightColumn = useMemo(
    () => slideCategoryRanking.slice(4, 8),
    [slideCategoryRanking],
  );

  const categoryComparisonData = useMemo(() => {
    const previousRef = new Date(selectedAno, selectedMes - 2, 1);
    const previousMonth = previousRef.getMonth() + 1;
    const previousYear = previousRef.getFullYear();

    // Mesma fonte do resumo mensal (competência de fatura correta) pro mês
    // atual, e do /comparativo-categorias pro mês anterior. O DTO do backend
    // não traz categoriaId no comparativo, só o nome - junta por nome mesmo,
    // é a única chave em comum entre as duas fontes.
    if (resumoMensal?.porCategoria && Array.isArray(comparativoMensal)) {
      const previousByName = new Map();
      comparativoMensal
        .filter((item) => item.mes === previousMonth && item.ano === previousYear)
        .forEach((item) => {
          const key = String(item.categoria || "Sem categoria").toLowerCase();
          previousByName.set(
            key,
            (previousByName.get(key) || 0) + Number(item.totalSaidas || 0),
          );
        });

      const linhas = resumoMensal.porCategoria
        .filter((item) => Number(item.totalSaidas || 0) > 0)
        .map((item) => {
          const nome = item.nome || "Sem categoria";
          const previousTotal = previousByName.get(nome.toLowerCase()) || 0;
          previousByName.delete(nome.toLowerCase());
          return {
            id: item.categoriaId || nome,
            nome,
            cor: item.cor || "#6A6785",
            currentTotal: Number(item.totalSaidas || 0),
            previousTotal,
          };
        });

      // Categorias que só tiveram gasto no mês anterior (zeradas agora) -
      // ainda vale mostrar a queda pra zero no comparativo.
      previousByName.forEach((previousTotal, nomeLower) => {
        if (previousTotal <= 0) return;

        linhas.push({
          id: nomeLower,
          nome: nomeLower,
          cor: "#6A6785",
          currentTotal: 0,
          previousTotal,
        });
      });

      return linhas
        .sort((a, b) => {
          if (b.currentTotal !== a.currentTotal) {
            return b.currentTotal - a.currentTotal;
          }
          return b.previousTotal - a.previousTotal;
        })
        .slice(0, 8)
        .map((item) => ({
          ...item,
          shortName: truncateWithThreeDots(item.nome, 10),
        }));
    }

    const categoriaById = new Map(
      categorias.map((categoria) => [String(categoria.id), categoria]),
    );

    const grouped = allTransactions.reduce((acc, item) => {
      if ((item.type || item.tipo) !== "Saida") {
        return acc;
      }

      const dateInfo = getMonthYearFromValue(item.date || item.data);
      if (!dateInfo) {
        return acc;
      }

      const isCurrentPeriod =
        dateInfo.month === selectedMes && dateInfo.year === selectedAno;
      const isPreviousPeriod =
        dateInfo.month === previousMonth && dateInfo.year === previousYear;

      if (!isCurrentPeriod && !isPreviousPeriod) {
        return acc;
      }

      const key = String(
        item.categoriaId || item.categoria?.id || "sem-categoria",
      );
      const categoriaRef = categoriaById.get(key);
      const nome =
        item.categoria?.nome || categoriaRef?.nome || "Sem categoria";
      const cor = item.categoria?.cor || categoriaRef?.cor || "#6A6785";

      if (!acc[key]) {
        acc[key] = {
          id: key,
          nome,
          cor,
          currentTotal: 0,
          previousTotal: 0,
        };
      }

      const value = Number(item.value || item.valor || 0);
      if (isCurrentPeriod) {
        acc[key].currentTotal += value;
      }
      if (isPreviousPeriod) {
        acc[key].previousTotal += value;
      }

      return acc;
    }, {});

    return Object.values(grouped)
      .filter((item) => item.currentTotal > 0 || item.previousTotal > 0)
      .sort((a, b) => {
        if (b.currentTotal !== a.currentTotal) {
          return b.currentTotal - a.currentTotal;
        }

        return b.previousTotal - a.previousTotal;
      })
      .slice(0, 8)
      .map((item) => ({
        ...item,
        shortName: truncateWithThreeDots(item.nome, 10),
      }));
  }, [
    allTransactions,
    categorias,
    selectedAno,
    selectedMes,
    resumoMensal,
    comparativoMensal,
  ]);

  const currentMonthShortLabel = new Intl.DateTimeFormat("pt-BR", {
    month: "short",
  }).format(new Date(selectedAno, selectedMes - 1, 1));

  const previousMonthShortLabel = new Intl.DateTimeFormat("pt-BR", {
    month: "short",
  }).format(new Date(selectedAno, selectedMes - 2, 1));

  const categoryPieData = useMemo(
    () => categoryRankingAll.filter((item) => item.total > 0),
    [categoryRankingAll],
  );

  const slideCategoryPieData = useMemo(
    () => slideCategoryRanking.filter((item) => item.total > 0),
    [slideCategoryRanking],
  );

  const dashboardPiePaddingAngle = categoryPieData.length > 8 ? 2 : 6;
  const dashboardPieCornerRadius = categoryPieData.length > 8 ? 8 : 14;

  return {
    monthComparison,
    receitasTrendIsPositive,
    despesasTrendIsPositive,
    saldoTrendIsPositive,
    investmentTrendIsPositive,
    receitasTagClassName,
    despesasTagClassName,
    saldoTagClassName,
    investimentosTagClassName,
    receitasDiffColorClassName,
    despesasDiffColorClassName,
    saldoDiffColorClassName,
    investimentoDiffColorClassName,
    receitasDiffDirection,
    despesasDiffDirection,
    saldoDiffDirection,
    investimentoDiffDirection,
    chartData,
    chartYAxisMax,
    chartYTicks,
    upcomingPayments,
    upcomingReceipts,
    categoryRankingAll,
    categoryRanking,
    slideCategoryRanking,
    slideCategoryLeftColumn,
    slideCategoryRightColumn,
    categoryComparisonData,
    currentMonthShortLabel,
    previousMonthShortLabel,
    categoryPieData,
    slideCategoryPieData,
    dashboardPiePaddingAngle,
    dashboardPieCornerRadius,
  };
};
