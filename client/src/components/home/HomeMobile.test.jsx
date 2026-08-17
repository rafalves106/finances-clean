import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import HomeMobile from "./HomeMobile";
import { formatCurrency } from "../../util/formatCurrency";

vi.mock("../TransactionModal", () => ({
  default: ({ isOpen, editingItem }) =>
    isOpen ? <div data-testid="transaction-modal">{editingItem?.name || "novo"}</div> : null,
}));

vi.mock("../AssistenteMovimentacaoModal", () => ({
  default: () => null,
}));

const findByExactValue = (value) =>
  screen.getByText(
    (_, element) => element?.tagName === "P" && element.textContent === formatCurrency(value),
  );

const baseProps = {
  resumoMensal: { totalEntradas: 4000, totalSaidas: 1500, porCategoria: [] },
  faturasVencendo: [],
  incomes: [
    { id: "e1", name: "Salário", value: 4000, date: "2026-08-05", type: "Entrada", categoria: { nome: "Salário" } },
  ],
  expenses: [
    { id: "s1", name: "Mercado", value: 1500, date: "2026-08-10", type: "Saida", categoria: { nome: "Alimentação" } },
  ],
  loading: false,
  selectedMes: 8,
  selectedAno: 2026,
  onChangeMonth: vi.fn(),
  categorias: [],
  onOpenCategoryManager: vi.fn(),
};

describe("HomeMobile", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => [] });
  });

  it("mostra o saldo do mês a partir do resumo mensal", async () => {
    render(<HomeMobile {...baseProps} />);

    await waitFor(() => expect(findByExactValue(2500)).toBeTruthy());
  });

  it("abre o modal de edição ao tocar em uma movimentação recente", async () => {
    render(<HomeMobile {...baseProps} />);

    await waitFor(() => screen.getByText("Salário"));
    fireEvent.click(screen.getByText("Salário"));

    expect(screen.getByTestId("transaction-modal").textContent).toBe("Salário");
  });
});
