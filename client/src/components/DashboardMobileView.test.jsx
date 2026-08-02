import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";

import DashboardMobileView from "./DashboardMobileView";

vi.mock("./TransactionModal", () => ({
  default: () => null,
}));

const baseProps = {
  totalInvestmentsBalance: 0,
  incomes: [],
  expenses: [],
  investments: [],
  selectedMes: 6,
  selectedAno: 2026,
  onChangeMonth: vi.fn(),
  categorias: [],
  veiculos: [],
  fetchData: vi.fn(),
  saldoAnterior: 0,
};

const setViewport = (width, height) => {
  Object.defineProperty(window, "innerWidth", {
    configurable: true,
    writable: true,
    value: width,
  });

  Object.defineProperty(window, "innerHeight", {
    configurable: true,
    writable: true,
    value: height,
  });

  window.dispatchEvent(new Event("resize"));
};

describe("DashboardMobileView", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => [],
    });
  });

  it.each([
    [360, 800],
    [390, 844],
    [412, 915],
  ])(
    "deve renderizar home mobile e bottom nav em %ix%i",
    async (width, height) => {
      setViewport(width, height);

      render(<DashboardMobileView {...baseProps} />);

      await waitFor(() => {
        expect(screen.getByText("Saldo atual")).toBeTruthy();
      });

      expect(screen.getByLabelText("Home")).toBeTruthy();
      expect(screen.getByLabelText("Gráficos")).toBeTruthy();
      expect(screen.getByLabelText("Cartões")).toBeTruthy();
      expect(screen.getByLabelText("Investimentos")).toBeTruthy();
      expect(screen.getByText("Movimentações")).toBeTruthy();
    },
  );

  it("deve navegar entre as telas mobile pelo bottom nav", async () => {
    setViewport(390, 844);

    render(<DashboardMobileView {...baseProps} />);

    await waitFor(() => {
      expect(screen.getByText("Saldo atual")).toBeTruthy();
    });

    fireEvent.click(screen.getByLabelText("Gráficos"));
    expect(screen.getByText("Fluxo do mês")).toBeTruthy();

    fireEvent.click(screen.getByLabelText("Cartões"));
    expect(screen.getAllByText("Cartões").length).toBeGreaterThan(0);

    fireEvent.click(screen.getByLabelText("Investimentos"));
    expect(screen.getByText("Simulador de Juros Compostos")).toBeTruthy();
  });

  it("deve exibir Despesas e Categorias a partir do resumoMensal, nao do array bruto de movimentacoes", async () => {
    setViewport(390, 844);

    const resumoMensal = {
      totalEntradas: 5000,
      totalSaidas: 800,
      porCategoria: [
        { categoriaId: "cat-1", nome: "Notebook", icone: "💻", totalSaidas: 800 },
      ],
    };

    render(
      <DashboardMobileView
        {...baseProps}
        expenses={[
          {
            id: "exp-cartao",
            name: "Compra no cartão (fatura ainda não venceu)",
            value: 99999,
            date: "2026-06-10",
            type: "Saida",
          },
        ]}
        resumoMensal={resumoMensal}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("Saldo atual")).toBeTruthy();
    });

    expect(screen.getByText(/Despesas R\$\s*800,00/)).toBeTruthy();
    expect(screen.getAllByText(/Notebook/).length).toBeGreaterThan(0);
  });

  it("deve selecionar movimentacoes e excluir em lote", async () => {
    setViewport(390, 844);

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
      return { ok: true, status: 200, json: async () => [] };
    });

    render(
      <DashboardMobileView
        {...baseProps}
        incomes={[
          {
            id: "inc-1",
            name: "Salário",
            value: 1200,
            date: "2026-06-30",
            type: "Entrada",
          },
        ]}
        expenses={[
          {
            id: "exp-1",
            name: "Mercado",
            value: 200,
            date: "2026-06-10",
            type: "Saida",
          },
        ]}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("Saldo atual")).toBeTruthy();
    });

    fireEvent.click(screen.getByText("Selecionar"));
    fireEvent.click(screen.getByText("Salário"));
    fireEvent.click(screen.getByText("Mercado"));

    expect(screen.getByText(/2 selecionadas/)).toBeTruthy();

    fireEvent.click(screen.getByText("Excluir"));

    const dialog = await screen.findByRole("dialog", {
      name: "Excluir movimentações",
    });
    fireEvent.click(within(dialog).getByRole("button", { name: "Excluir" }));

    await waitFor(() => {
      expect(screen.queryByText(/2 selecionadas/)).toBeNull();
    });
  });

  it("deve exibir a fatura vencendo como item na lista de Movimentacoes", async () => {
    setViewport(390, 844);

    render(
      <DashboardMobileView
        {...baseProps}
        expenses={[
          {
            id: "exp-1",
            name: "Compra avulsa",
            value: 50,
            date: "2026-06-05",
            type: "Saida",
          },
        ]}
        resumoMensal={{ totalEntradas: 0, totalSaidas: 50, porCategoria: [] }}
        faturasVencendo={[
          {
            cartaoId: "cartao-1",
            nomeCartao: "Itaú CC",
            valor: 1500,
            dataVencimento: "2026-06-05T00:00:00",
          },
        ]}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("Saldo atual")).toBeTruthy();
    });

    expect(screen.getByText("Fatura Itaú CC")).toBeTruthy();
    expect(screen.getByText(/1\.500,00/)).toBeTruthy();
  });
});
