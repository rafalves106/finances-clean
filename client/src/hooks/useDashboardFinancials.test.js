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
