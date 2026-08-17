import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import HomeDesktop from "./HomeDesktop";
import { formatCurrency } from "../../util/formatCurrency";

vi.mock("../TransactionModal", () => ({
  default: ({ isOpen, isCloning, isAiDraft }) =>
    isOpen ? (
      <div data-testid="transaction-modal">
        {isCloning ? "clonando" : isAiDraft ? "ia" : "novo"}
      </div>
    ) : null,
}));

vi.mock("../AssistenteMovimentacaoModal", () => ({
  default: () => null,
}));

vi.mock("../InvestmentsView", () => ({
  default: () => <div>Investments View</div>,
}));

const resumoMensal = {
  totalEntradas: 5000,
  totalSaidas: 3200,
  porCategoria: [
    { categoriaId: 1, nome: "Alimentação", cor: "#e8623f", totalSaidas: 800 },
  ],
};

const buildFetchMock = () =>
  vi.fn().mockImplementation(async (url) => {
    const path = String(url);

    if (path.includes("/api/v1/cartao/resumos")) {
      return { ok: true, status: 200, json: async () => [] };
    }

    if (path.includes("/remover-em-lote")) {
      return { ok: true, status: 200, json: async () => ({ removidos: 1 }) };
    }

    return { ok: true, status: 200, json: async () => [] };
  });

const baseProps = {
  incomes: [
    { id: "e1", name: "Salário", value: 5000, date: "2026-08-05", type: "Entrada", categoria: { nome: "Salário" } },
  ],
  expenses: [
    { id: "s1", name: "Mercado", value: 800, date: "2026-08-10", type: "Saida", categoria: { nome: "Alimentação" } },
  ],
  categorias: [{ id: 1, nome: "Alimentação", orcamentoMensal: 1000 }],
  selectedMes: 8,
  selectedAno: 2026,
  onChangeMonth: vi.fn(),
  fetchData: vi.fn().mockResolvedValue({ discarded: false }),
  loading: false,
  resumoMensal,
  onOpenCategoryManager: vi.fn(),
};

// screen.getByText normaliza o texto do DOM (colapsa espaco nao-quebravel
// para espaco comum) mas nao normaliza a string do matcher - formatCurrency
// usa NBSP entre "R$" e o valor, entao a comparacao exata direta nunca bate.
// Comparar contra o textContent bruto do proprio elemento evita a pegadinha.
const findByExactValue = (value) =>
  screen.getByText(
    (_, element) => element?.tagName === "P" && element.textContent === formatCurrency(value),
  );

describe("HomeDesktop", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    globalThis.fetch = buildFetchMock();
  });

  it("mostra receitas, despesas e saldo do resumo mensal", async () => {
    render(<HomeDesktop {...baseProps} />);

    await waitFor(() => {
      expect(findByExactValue(5000)).toBeTruthy();
    });
    expect(findByExactValue(3200)).toBeTruthy();
    expect(findByExactValue(1800)).toBeTruthy();
  });

  it("abre o slide de cartões ao clicar no card em destaque", async () => {
    render(<HomeDesktop {...baseProps} />);

    await waitFor(() => screen.getByLabelText("Abrir slide de gestão dos cartões"));
    fireEvent.click(screen.getByLabelText("Abrir slide de gestão dos cartões"));

    expect(screen.getByText("Gestão dos Cartões")).toBeTruthy();
  });

  it("abre o slide de análise gráfica ao clicar no painel de fluxo", async () => {
    render(<HomeDesktop {...baseProps} />);

    await waitFor(() => screen.getByLabelText("Ver análise gráfica detalhada"));
    fireEvent.click(screen.getByLabelText("Ver análise gráfica detalhada"));

    expect(screen.getByText("Análise Gráfica")).toBeTruthy();
  });

  it("abre o modal em modo clonagem, com id nulo, ao clicar em Clonar", async () => {
    render(<HomeDesktop {...baseProps} />);

    await waitFor(() => screen.getByLabelText("Abrir slide de movimentações"));
    fireEvent.click(screen.getByLabelText("Abrir slide de movimentações"));

    await waitFor(() => screen.getByText("Movimentações do Mês"));
    fireEvent.click(screen.getAllByText("Clonar")[0]);

    expect(screen.getByTestId("transaction-modal").textContent).toBe("clonando");
  });

  // Regressão: o tile de Investimentos virou um KpiTile não-clicável na
  // reescrita e o slide de investimentos ficou sem nenhum jeito de abrir.
  it("abre o slide de investimentos ao clicar no tile de Investimentos", async () => {
    render(<HomeDesktop {...baseProps} />);

    await waitFor(() => screen.getByLabelText("Abrir slide de investimentos"));
    fireEvent.click(screen.getByLabelText("Abrir slide de investimentos"));

    await waitFor(() => expect(screen.getByText("Investments View")).toBeTruthy());
  });
});
