import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";

vi.mock("recharts", () => {
  const Mock = ({ children }) => <div>{children}</div>;

  return {
    ResponsiveContainer: Mock,
    AreaChart: Mock,
    Area: Mock,
    PieChart: Mock,
    Pie: Mock,
    Cell: Mock,
    XAxis: Mock,
    YAxis: Mock,
    CartesianGrid: Mock,
    Tooltip: Mock,
    Line: Mock,
    Legend: Mock,
  };
});

const transactionModalMock = vi.fn(() => null);
vi.mock("./TransactionModal", () => ({
  default: (props) => transactionModalMock(props),
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
              limiteTotal: 3000,
              diaFechamento: 27,
              diaVencimento: 5,
            },
            limite: { utilizado: 1200, disponivel: 1800, percentualUso: 40 },
            previsaoFatura: { atual: 1200, proxima: 980 },
          },
          {
            cartao: { nome: "Cartao Secundario", limiteTotal: 2000 },
            limite: { utilizado: 300, disponivel: 1700, percentualUso: 15 },
            previsaoFatura: { atual: 300, proxima: 220 },
          },
          {
            cartao: { nome: "Cartao Reserva", limiteTotal: 1500 },
            limite: { utilizado: 300, disponivel: 1200, percentualUso: 20 },
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
          cartao: { nome: "Cartao Principal", limiteTotal: 3000 },
          limite: { utilizado: 1200, disponivel: 1800, percentualUso: 40 },
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
    expect(screen.getAllByText("Despesas").length).toBeGreaterThan(0);
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

  it("deve exibir movimentacoes em coluna unica com icones direcionais", () => {
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
      .find((card) => card?.className.includes("flex items-center"));

    const entradaCard = screen
      .getAllByText("Salario")
      .map((node) => node.closest(".rounded-lg"))
      .find((card) => card?.className.includes("flex items-center"));

    expect(saidaCard).toBeTruthy();
    expect(entradaCard).toBeTruthy();
    expect(screen.getByText("↑")).toBeTruthy();
    expect(screen.getByText("↓")).toBeTruthy();
  });

  it("deve exibir Despesas e Gastos por Categoria a partir do resumoMensal, nao do array bruto", () => {
    render(
      <DashboardDesktopRedesignView
        incomes={[]}
        expenses={[
          {
            id: "exp-cartao",
            name: "Compra no cartão (fatura ainda não venceu)",
            value: 99999,
            type: "Saida",
            date: "2026-06-10",
          },
        ]}
        resumoMensal={{
          totalEntradas: 5000,
          totalSaidas: 750,
          porCategoria: [
            {
              categoriaId: "cat-1",
              nome: "Eletrônicos",
              icone: "💻",
              cor: "#6366f1",
              totalSaidas: 750,
            },
          ],
        }}
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

    const despesasCard = screen
      .getAllByText("Despesas")
      .map((node) => node.closest(".rounded-lg"))
      .find((card) => card?.textContent.includes("Você gastou"));

    expect(despesasCard).toBeTruthy();
    expect(despesasCard.textContent).toMatch(/R\$\s*750,00/);

    expect(screen.getAllByText(/Eletrônicos/).length).toBeGreaterThan(0);
  });

  it("deve exibir a fatura vencendo como item na lista de Movimentacoes", async () => {
    render(
      <DashboardDesktopRedesignView
        incomes={[]}
        expenses={[
          {
            id: "exp-1",
            name: "Compra avulsa",
            value: 50,
            type: "Saida",
            date: "2026-06-05",
          },
        ]}
        faturasVencendo={[
          {
            cartaoId: "cartao-1",
            nomeCartao: "Itaú CC",
            valor: 1500,
            dataVencimento: "2026-06-05T00:00:00",
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

    expect(await screen.findByText("Fatura Itaú CC")).toBeTruthy();
  });

  it("deve selecionar movimentações e excluir em lote", async () => {
    const fetchMock = buildFetchMock();
    globalThis.fetch = vi.fn().mockImplementation(async (url, init) => {
      if (String(url).includes("/remover-em-lote")) {
        expect(init.method).toBe("POST");
        expect(JSON.parse(init.body).ids).toHaveLength(2);
        return {
          ok: true,
          status: 200,
          json: async () => ({
            totalSolicitado: 2,
            totalRemovido: 2,
            idsNaoEncontrados: [],
            idsBloqueados: [],
          }),
        };
      }
      return fetchMock(url, init);
    });

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
            name: "Aluguel",
            value: 1800,
            type: "Saida",
            date: "2026-06-10",
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

    fireEvent.click(
      screen.getAllByLabelText("Abrir slide de movimentações")[0],
    );

    const selectAll = await screen.findByLabelText(
      "Selecionar todas as movimentações",
    );
    fireEvent.click(selectAll);

    expect(screen.getByText(/2 selecionadas/)).toBeTruthy();

    fireEvent.click(screen.getByText("Excluir selecionadas"));

    const dialog = await screen.findByRole("dialog", {
      name: "Excluir movimentações",
    });
    fireEvent.click(within(dialog).getByRole("button", { name: "Excluir" }));

    await waitFor(() => {
      expect(screen.queryByText(/2 selecionadas/)).toBeNull();
    });
  });

  it("deve abrir o modal em modo clonagem, com id nulo, ao clicar em Clonar", async () => {
    transactionModalMock.mockClear();

    render(
      <DashboardDesktopRedesignView
        incomes={[]}
        expenses={[
          {
            id: "exp-1",
            name: "Aluguel",
            value: 1800,
            type: "Saida",
            date: "2026-06-10",
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

    fireEvent.click(
      screen.getAllByLabelText("Abrir slide de movimentações")[0],
    );

    fireEvent.click(await screen.findByText("Clonar"));

    await waitFor(() => {
      const cloneCall = transactionModalMock.mock.calls.find(
        ([props]) => props.editingItem?.name === "Aluguel",
      );
      expect(cloneCall).toBeTruthy();
      expect(cloneCall[0].isCloning).toBe(true);
      expect(cloneCall[0].editingItem).toEqual(
        expect.objectContaining({ id: null, name: "Aluguel" }),
      );
    });
  });
});
