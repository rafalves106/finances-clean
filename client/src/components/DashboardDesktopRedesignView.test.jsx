import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

vi.mock("recharts", () => {
  const Mock = ({ children }) => <div>{children}</div>;

  return {
    ResponsiveContainer: Mock,
    AreaChart: Mock,
    Area: Mock,
    XAxis: Mock,
    YAxis: Mock,
    CartesianGrid: Mock,
    Tooltip: Mock,
    Line: Mock,
    Legend: Mock,
  };
});

vi.mock("./TransactionModal", () => ({
  default: () => null,
}));

import DashboardDesktopRedesignView from "./DashboardDesktopRedesignView";

const buildFetchMock = () =>
  vi.fn().mockImplementation(async (url) => {
    const path = String(url);

    if (path.includes("/api/v1/cartao/resumos")) {
      return {
        ok: true,
        status: 200,
        json: async () => [
          {
            cartao: {
              nome: "Cartao Principal",
              diaFechamento: 27,
              diaVencimento: 5,
            },
            limite: {
              limiteTotal: 3000,
              limiteDisponivel: 1800,
              limiteUtilizado: 1200,
            },
            previsaoFatura: { atual: 1200, proxima: 980 },
          },
          {
            cartao: { nome: "Cartao Secundario" },
            limite: {
              limiteTotal: 2000,
              limiteDisponivel: 1700,
              limiteUtilizado: 300,
            },
            previsaoFatura: { atual: 300, proxima: 220 },
          },
          {
            cartao: { nome: "Cartao Reserva" },
            limite: {
              limiteTotal: 1500,
              limiteDisponivel: 1200,
              limiteUtilizado: 300,
            },
            previsaoFatura: { atual: 300, proxima: 150 },
          },
        ],
      };
    }

    if (path.includes("/api/v1/cartao/resumo")) {
      return {
        ok: true,
        status: 200,
        json: async () => ({
          cartao: { nome: "Cartao Principal" },
          limite: {
            limiteTotal: 3000,
            limiteDisponivel: 1800,
            limiteUtilizado: 1200,
          },
          previsaoFatura: { atual: 1200, proxima: 980 },
        }),
      };
    }

    return {
      ok: true,
      status: 200,
      json: async () => [],
    };
  });

describe("DashboardDesktopRedesignView", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    globalThis.fetch = buildFetchMock();
    Object.defineProperty(window, "innerHeight", {
      value: 1080,
      writable: true,
      configurable: true,
    });
  });

  it("deve renderizar as secoes principais e aplicar altura calculada", async () => {
    const { container } = render(
      <DashboardDesktopRedesignView
        incomes={[
          {
            id: "inc-1",
            name: "Salario",
            value: 5000,
            type: "Entrada",
            date: "2026-06-05",
          },
        ]}
        expenses={[
          {
            id: "exp-1",
            name: "Aluguel",
            value: 1800,
            type: "Saida",
            date: "2026-06-10",
            categoria: { nome: "Moradia" },
          },
        ]}
        totalInvestmentsBalance={2500}
        selectedMes={6}
        selectedAno={2026}
        onChangeMonth={vi.fn()}
        categorias={[]}
        veiculos={[]}
        fetchData={vi.fn()}
        loading={false}
        saldoAnterior={500}
        onOpenCategoryManager={vi.fn()}
        onOpenCardManagement={vi.fn()}
        headerHeight={100}
      />,
    );

    expect(screen.getByText("Investimentos")).toBeTruthy();
    expect(screen.getByText("Próximas despesas")).toBeTruthy();
    expect(screen.getByText("Movimentações")).toBeTruthy();

    const root = container.querySelector(".dashboard-desktop-redesign");
    expect(root).toBeTruthy();
    expect(root.style.height).toBe("948px");

    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/v1/cartao/resumos"),
      expect.objectContaining({ credentials: "include", method: "GET" }),
    );
  });

  it("deve exibir o nome dos dois cartoes de tras", async () => {
    render(
      <DashboardDesktopRedesignView
        incomes={[]}
        expenses={[]}
        totalInvestmentsBalance={0}
        selectedMes={6}
        selectedAno={2026}
        onChangeMonth={vi.fn()}
        categorias={[]}
        veiculos={[]}
        fetchData={vi.fn()}
        loading={false}
        saldoAnterior={0}
        onOpenCategoryManager={vi.fn()}
        onOpenCardManagement={vi.fn()}
        headerHeight={96}
      />,
    );

    expect(await screen.findByText("Cartao Secundario")).toBeTruthy();
    expect(screen.getByText("Cartao Reserva")).toBeTruthy();
  });

  it("deve trocar o cartao ativo ao clicar em um cartao de tras", async () => {
    render(
      <DashboardDesktopRedesignView
        incomes={[]}
        expenses={[]}
        totalInvestmentsBalance={0}
        selectedMes={6}
        selectedAno={2026}
        onChangeMonth={vi.fn()}
        categorias={[]}
        veiculos={[]}
        fetchData={vi.fn()}
        loading={false}
        saldoAnterior={0}
        onOpenCategoryManager={vi.fn()}
        onOpenCardManagement={vi.fn()}
        headerHeight={96}
      />,
    );

    const backCard = await screen.findByLabelText(
      "Selecionar cartão Cartao Secundario",
    );
    fireEvent.click(backCard);

    expect(screen.getByText("Cartao Secundario")).toBeTruthy();
    const activeButton = screen.getByLabelText("Abrir gestão do cartão");
    expect(activeButton.textContent).toContain("Cartao Secundario");
  });

  it("deve manter saidas a esquerda e entradas a direita na secao de movimentacoes", () => {
    render(
      <DashboardDesktopRedesignView
        incomes={[
          {
            id: "inc-1",
            name: "Salario",
            value: 5000,
            type: "Entrada",
            date: "2026-06-05",
          },
        ]}
        expenses={[
          {
            id: "exp-1",
            name: "Conta de luz",
            value: 220,
            type: "Saida",
            date: "2026-06-07",
          },
        ]}
        totalInvestmentsBalance={0}
        selectedMes={6}
        selectedAno={2026}
        onChangeMonth={vi.fn()}
        categorias={[]}
        veiculos={[]}
        fetchData={vi.fn()}
        loading={false}
        saldoAnterior={0}
        onOpenCategoryManager={vi.fn()}
        onOpenCardManagement={vi.fn()}
        headerHeight={96}
      />,
    );

    const saidaCard = screen
      .getAllByText("Conta de luz")
      .map((node) => node.closest(".rounded-lg"))
      .find((card) => card?.className.includes("text-left"));

    const entradaCard = screen
      .getAllByText("Salario")
      .map((node) => node.closest(".rounded-lg"))
      .find((card) => card?.className.includes("text-right"));

    expect(saidaCard).toBeTruthy();
    expect(entradaCard).toBeTruthy();
    expect(saidaCard.className).toContain("text-left");
    expect(entradaCard.className).toContain("text-right");
  });
});
