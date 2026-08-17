import { describe, expect, it } from "vitest";
import { renderHook } from "@testing-library/react";
import { useDashboardFinancials } from "./useDashboardFinancials";

// Bug real encontrado em producao: a compra no cartao (data 15/07, vencimento
// 05/08) aparecia no grafico do dia 15/07 - o mesmo mes que o resumo mensal
// (KPI "Despesas do mes") ja excluia corretamente. O grafico tinha sua propria
// leitura direto de allTransactions, sem passar pela regra de vencimento.
describe("useDashboardFinancials - chartData e compras no cartao", () => {
  const cardPurchase = {
    id: "compra-cartao-1",
    type: "Saida",
    value: 1691.96,
    date: "2026-07-15T12:00:00",
    cartaoId: "cartao-itau",
  };

  const faturaTransactions = [
    {
      id: "fatura-cartao-itau",
      name: "Fatura Itaú CC",
      value: 1691.96,
      date: "2026-08-05T00:00:00",
      type: "Saida",
      isFaturaResumo: true,
    },
  ];

  it("nao lanca a compra no cartao no dia da compra (mes de fechamento)", () => {
    const { result } = renderHook(() =>
      useDashboardFinancials({
        allTransactions: [cardPurchase],
        incomes: [],
        expenses: [cardPurchase],
        categorias: [],
        selectedMes: 7,
        selectedAno: 2026,
        saldoAnterior: 0,
        faturaTransactions: [],
      }),
    );

    const diaDaCompra = result.current.chartData.find(
      (item) => item.data === "15/07",
    );

    expect(diaDaCompra).toBeUndefined();
  });

  it("lanca o valor da fatura no dia do vencimento (mes de vencimento)", () => {
    const { result } = renderHook(() =>
      useDashboardFinancials({
        allTransactions: [],
        incomes: [],
        expenses: [],
        categorias: [],
        selectedMes: 8,
        selectedAno: 2026,
        saldoAnterior: 0,
        faturaTransactions,
      }),
    );

    const diaDoVencimento = result.current.chartData.find(
      (item) => item.data === "05/08",
    );

    expect(diaDoVencimento).toBeDefined();
    expect(diaDoVencimento.saida).toBe(1691.96);
  });
});

// Bug real encontrado em HOMOL: o card "Despesas" mostrava um total (do
// /resumo, competência de fatura correta) mas o texto "Você gastou X a
// mais/menos" vinha de allTransactions filtrado client-side - que só tem o
// mês selecionado (o fetch já chega filtrado por mês), então "mês anterior"
// sempre dava 0, e pra compras no cartão a base de data também não batia
// com a competência de vencimento que o /resumo usa.
describe("useDashboardFinancials - monthComparison com resumo/comparativo do backend", () => {
  const baseArgs = {
    allTransactions: [],
    incomes: [],
    expenses: [],
    categorias: [],
    selectedMes: 8,
    selectedAno: 2026,
    saldoAnterior: 0,
  };

  it("usa resumoMensal (não allTransactions) como total do mês atual", () => {
    const { result } = renderHook(() =>
      useDashboardFinancials({
        ...baseArgs,
        resumoMensal: { totalEntradas: 4300, totalSaidas: 4202.6 },
        comparativoMensal: [],
      }),
    );

    expect(result.current.monthComparison.currentIncome).toBe(4300);
    expect(result.current.monthComparison.currentExpense).toBe(4202.6);
  });

  it("usa comparativoMensal (não allTransactions) como total do mês anterior", () => {
    const { result } = renderHook(() =>
      useDashboardFinancials({
        ...baseArgs,
        resumoMensal: { totalEntradas: 4300, totalSaidas: 4202.6 },
        comparativoMensal: [
          { mes: 7, ano: 2026, categoria: "Transporte", totalEntradas: 250, totalSaidas: 998 },
          { mes: 7, ano: 2026, categoria: "Salário", totalEntradas: 2346.53, totalSaidas: 0 },
        ],
      }),
    );

    expect(result.current.monthComparison.expenseDiff).toBeCloseTo(4202.6 - 998, 5);
    expect(result.current.monthComparison.incomeDiff).toBeCloseTo(4300 - 2596.53, 5);
  });

  it("sem resumo/comparativo, cai de volta pro cálculo a partir de allTransactions", () => {
    const { result } = renderHook(() =>
      useDashboardFinancials({
        ...baseArgs,
        allTransactions: [
          { type: "Entrada", value: 100, date: "2026-08-01T12:00:00" },
          { type: "Saida", value: 40, date: "2026-08-02T12:00:00" },
        ],
      }),
    );

    expect(result.current.monthComparison.currentIncome).toBe(100);
    expect(result.current.monthComparison.currentExpense).toBe(40);
  });
});
