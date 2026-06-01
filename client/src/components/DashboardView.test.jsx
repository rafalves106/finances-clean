import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

vi.mock("recharts", () => {
  const Mock = ({ children }) => <div>{children}</div>;

  return {
    ResponsiveContainer: Mock,
    AreaChart: Mock,
    Area: Mock,
    BarChart: Mock,
    Bar: Mock,
    XAxis: Mock,
    YAxis: Mock,
    CartesianGrid: Mock,
    Tooltip: Mock,
    Line: Mock,
    Legend: Mock,
  };
});

import DashboardView from "./DashboardView";
import { API_URL } from "../services/api";
import { API_CATEGORIAS_ALERTAS_ORCAMENTO_URL } from "../services/api";

describe("DashboardView renumeracao de grupo", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [],
    });
    window.confirm = vi.fn(() => true);
    window.alert = vi.fn();
  });

  it("deve chamar endpoint de renumeracao com credentials include", async () => {
    const fetchData = vi.fn().mockResolvedValue(undefined);

    render(
      <DashboardView
        totalIncome={0}
        totalExpenses={100}
        finalBalance={-100}
        totalInvestmentsBalance={0}
        fetchData={fetchData}
        loading={false}
        selectedMes={1}
        selectedAno={2026}
        onChangeMonth={() => {}}
        categorias={[]}
        veiculos={[]}
        onOpenCategoryManager={() => {}}
        incomes={[]}
        expenses={[
          {
            id: "mov-1",
            titulo: "Notebook",
            descricao: "Compra",
            valor: 100,
            tipo: "Saida",
            data: "2026-01-10T00:00:00Z",
            grupoRecorrenciaId: "11111111-1111-1111-1111-111111111111",
          },
        ]}
        saldoAnterior={0}
      />,
    );

    fireEvent.click(screen.getByTitle("Renumerar grupo"));

    await waitFor(() =>
      expect(globalThis.fetch).toHaveBeenCalledWith(
        `${API_URL}/grupos/11111111-1111-1111-1111-111111111111/renumerar`,
        {
          method: "POST",
          credentials: "include",
        },
      ),
    );

    expect(fetchData).toHaveBeenCalled();
  });

  it("deve exibir badge de alertas quando totalCategoriasEmAlerta for maior que zero", async () => {
    globalThis.fetch = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, json: async () => [] })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          totalCategoriasEmAlerta: 2,
          categorias: [
            {
              categoriaId: "cat-1",
              nome: "Mercado",
              icone: "🛒",
              cor: "#22c55e",
              orcamentoMensal: 1000,
              totalDespesasMesAtual: 850,
              percentualConsumo: 85,
              estadoAlerta: "Atencao",
            },
          ],
        }),
      });

    render(
      <DashboardView
        totalIncome={0}
        totalExpenses={100}
        finalBalance={-100}
        totalInvestmentsBalance={0}
        fetchData={vi.fn()}
        loading={false}
        selectedMes={1}
        selectedAno={2026}
        onChangeMonth={() => {}}
        categorias={[]}
        veiculos={[]}
        onOpenCategoryManager={() => {}}
        incomes={[]}
        expenses={[]}
        saldoAnterior={0}
      />,
    );

    await waitFor(() =>
      expect(globalThis.fetch).toHaveBeenCalledWith(
        `${API_CATEGORIAS_ALERTAS_ORCAMENTO_URL}?mes=1&ano=2026`,
        {
          method: "GET",
          credentials: "include",
        },
      ),
    );

    expect(screen.getByText("2 alertas")).toBeTruthy();
  });

  it("deve ocultar badge de alertas quando totalCategoriasEmAlerta for zero", async () => {
    globalThis.fetch = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, json: async () => [] })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          totalCategoriasEmAlerta: 0,
          categorias: [],
        }),
      });

    render(
      <DashboardView
        totalIncome={0}
        totalExpenses={100}
        finalBalance={-100}
        totalInvestmentsBalance={0}
        fetchData={vi.fn()}
        loading={false}
        selectedMes={1}
        selectedAno={2026}
        onChangeMonth={() => {}}
        categorias={[]}
        veiculos={[]}
        onOpenCategoryManager={() => {}}
        incomes={[]}
        expenses={[]}
        saldoAnterior={0}
      />,
    );

    await waitFor(() =>
      expect(globalThis.fetch).toHaveBeenCalledWith(
        `${API_CATEGORIAS_ALERTAS_ORCAMENTO_URL}?mes=1&ano=2026`,
        {
          method: "GET",
          credentials: "include",
        },
      ),
    );

    expect(screen.queryByText(/\d+ alerta/i)).toBeNull();
  });
});

describe("DashboardView ciclo 008", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    window.alert = vi.fn();
    window.confirm = vi.fn(() => true);

    globalThis.fetch = vi.fn().mockImplementation((url, options = {}) => {
      if (String(url).includes("comparativo-categorias")) {
        return Promise.resolve({ ok: true, json: async () => [] });
      }

      if (String(url).includes("alertas-orcamento")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ totalCategoriasEmAlerta: 0, categorias: [] }),
        });
      }

      if (options.method === "DELETE") {
        return Promise.resolve({ ok: true });
      }

      return Promise.resolve({ ok: true, json: async () => [] });
    });
  });

  it("deve revalidar silenciosamente apos excluir sem fallback global", async () => {
    const fetchData = vi.fn().mockResolvedValue({ discarded: false });

    render(
      <DashboardView
        totalIncome={0}
        totalExpenses={120}
        finalBalance={-120}
        totalInvestmentsBalance={0}
        fetchData={fetchData}
        loading={false}
        selectedMes={1}
        selectedAno={2026}
        onChangeMonth={() => {}}
        categorias={[]}
        veiculos={[]}
        onOpenCategoryManager={() => {}}
        incomes={[]}
        expenses={[
          {
            id: "mov-remove",
            titulo: "Mercado",
            descricao: "Compra",
            valor: 120,
            tipo: "Saida",
            data: "2026-01-10T00:00:00Z",
          },
        ]}
        saldoAnterior={0}
      />,
    );

    fireEvent.click(screen.getByLabelText("Excluir saída Mercado"));

    await waitFor(() =>
      expect(fetchData).toHaveBeenCalledWith(
        expect.objectContaining({
          silent: true,
          periodKey: "2026-1",
          mutationToken: expect.any(Number),
        }),
      ),
    );

    expect(fetchData).not.toHaveBeenCalledWith();
  });
});

describe("DashboardView ciclo 009 sprint 2", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    window.alert = vi.fn();
    window.confirm = vi.fn(() => true);

    globalThis.fetch = vi.fn().mockImplementation((url) => {
      if (String(url).includes("comparativo-categorias")) {
        return Promise.resolve({ ok: true, json: async () => [] });
      }

      if (String(url).includes("alertas-orcamento")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ totalCategoriasEmAlerta: 0, categorias: [] }),
        });
      }

      return Promise.resolve({ ok: true, json: async () => [] });
    });
  });

  it("deve exibir card de proximos pagamentos com total previsto", async () => {
    render(
      <DashboardView
        totalIncome={0}
        totalExpenses={0}
        finalBalance={0}
        totalInvestmentsBalance={0}
        fetchData={vi.fn()}
        loading={false}
        selectedMes={1}
        selectedAno={2026}
        onChangeMonth={() => {}}
        categorias={[]}
        veiculos={[]}
        onOpenCategoryManager={() => {}}
        incomes={[]}
        expenses={[
          {
            id: "pag-1",
            titulo: "Aluguel",
            valor: 1200,
            tipo: "Saida",
            data: "2026-01-10T00:00:00Z",
            categoria: { nome: "Moradia" },
          },
          {
            id: "pag-2",
            titulo: "Energia",
            valor: 250,
            tipo: "Saida",
            data: "2026-01-20T00:00:00Z",
            categoria: { nome: "Casa" },
          },
        ]}
        saldoAnterior={0}
      />,
    );

    await waitFor(() =>
      expect(screen.getByText("Próximos pagamentos")).toBeTruthy(),
    );

    expect(screen.getAllByText("Aluguel").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Energia").length).toBeGreaterThan(0);
    expect(screen.getByText("Total previsto")).toBeTruthy();
  });

  it("deve renderizar estados vazios guiados e acionar CTA de insight", async () => {
    render(
      <DashboardView
        totalIncome={0}
        totalExpenses={0}
        finalBalance={0}
        totalInvestmentsBalance={0}
        fetchData={vi.fn()}
        loading={false}
        selectedMes={1}
        selectedAno={2026}
        onChangeMonth={() => {}}
        categorias={[]}
        veiculos={[]}
        onOpenCategoryManager={() => {}}
        incomes={[]}
        expenses={[]}
        saldoAnterior={-100}
      />,
    );

    expect(
      screen.getByText("Nenhum pagamento pendente no restante do período."),
    ).toBeTruthy();
    expect(screen.getByText("Insights acionáveis")).toBeTruthy();
    expect(screen.getByText("Saldo do mês está negativo")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Simular ajuste" }));

    await waitFor(() =>
      expect(screen.getByText("Simular Transação")).toBeTruthy(),
    );
  });
});

describe("DashboardView ciclo 009 sprint 3", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    window.alert = vi.fn();
    window.confirm = vi.fn(() => true);
    Element.prototype.scrollIntoView = vi.fn();

    globalThis.fetch = vi.fn().mockImplementation((url) => {
      if (String(url).includes("comparativo-categorias")) {
        return Promise.resolve({ ok: true, json: async () => [] });
      }

      if (String(url).includes("alertas-orcamento")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ totalCategoriasEmAlerta: 0, categorias: [] }),
        });
      }

      return Promise.resolve({ ok: true, json: async () => [] });
    });
  });

  it("deve navegar por intenção para seção de planejamento", () => {
    render(
      <DashboardView
        totalIncome={0}
        totalExpenses={0}
        finalBalance={0}
        totalInvestmentsBalance={0}
        fetchData={vi.fn()}
        loading={false}
        selectedMes={1}
        selectedAno={2026}
        onChangeMonth={() => {}}
        categorias={[]}
        veiculos={[]}
        onOpenCategoryManager={() => {}}
        incomes={[]}
        expenses={[]}
        saldoAnterior={0}
      />,
    );

    fireEvent.click(screen.getByRole("tab", { name: "Planejar mês" }));

    expect(
      screen
        .getByRole("tab", { name: "Planejar mês" })
        .getAttribute("aria-selected"),
    ).toBe("true");
    expect(Element.prototype.scrollIntoView).toHaveBeenCalled();
  });

  it("deve filtrar lista de transações por busca", async () => {
    render(
      <DashboardView
        totalIncome={0}
        totalExpenses={0}
        finalBalance={0}
        totalInvestmentsBalance={0}
        fetchData={vi.fn()}
        loading={false}
        selectedMes={1}
        selectedAno={2026}
        onChangeMonth={() => {}}
        categorias={[]}
        veiculos={[]}
        onOpenCategoryManager={() => {}}
        incomes={[
          {
            id: "in-1",
            titulo: "Alpha Receita",
            valor: 100,
            tipo: "Entrada",
            data: "2026-01-12T00:00:00Z",
          },
          {
            id: "in-2",
            titulo: "Beta Receita",
            valor: 150,
            tipo: "Entrada",
            data: "2026-01-13T00:00:00Z",
          },
        ]}
        expenses={[]}
        saldoAnterior={0}
      />,
    );

    fireEvent.change(screen.getByPlaceholderText("Buscar transação"), {
      target: { value: "Alpha" },
    });

    await waitFor(() =>
      expect(screen.getAllByText("Alpha Receita").length).toBeGreaterThan(0),
    );
    expect(screen.queryByText("Beta Receita")).toBeNull();
  });
});

describe("DashboardView ciclo 011", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    window.alert = vi.fn();
    window.confirm = vi.fn(() => true);

    globalThis.fetch = vi.fn().mockImplementation((url) => {
      if (String(url).includes("/api/v1/cartao/resumo")) {
        return Promise.resolve({
          ok: false,
          status: 404,
          json: async () => ({}),
        });
      }

      if (String(url).includes("comparativo-categorias")) {
        return Promise.resolve({ ok: true, json: async () => [] });
      }

      if (String(url).includes("alertas-orcamento")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ totalCategoriasEmAlerta: 0, categorias: [] }),
        });
      }

      return Promise.resolve({ ok: true, json: async () => [] });
    });
  });

  it("deve exibir estado vazio guiado do cartão quando não houver cartão ativo", async () => {
    render(
      <DashboardView
        totalIncome={0}
        totalExpenses={0}
        finalBalance={0}
        totalInvestmentsBalance={0}
        fetchData={vi.fn()}
        loading={false}
        selectedMes={1}
        selectedAno={2026}
        onChangeMonth={() => {}}
        categorias={[]}
        veiculos={[]}
        onOpenCategoryManager={() => {}}
        onOpenCardManagement={() => {}}
        incomes={[]}
        expenses={[]}
        saldoAnterior={0}
      />,
    );

    await waitFor(() =>
      expect(screen.getByText("Nenhum cartão ativo encontrado.")).toBeTruthy(),
    );
  });

  it("deve abrir modal de nova compra no cartão e acionar gestão dedicada", async () => {
    const onOpenCardManagement = vi.fn();

    globalThis.fetch = vi.fn().mockImplementation((url) => {
      if (String(url).includes("/api/v1/cartao/resumo")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            cartao: {
              id: "card-1",
              nome: "Cartão principal",
              limiteTotal: 5000,
              diaFechamento: 10,
              diaVencimento: 20,
            },
            limite: { utilizado: 500, disponivel: 4500, percentualUso: 10 },
            previsaoFatura: { atual: 350, proxima: 150 },
          }),
        });
      }

      if (String(url).includes("comparativo-categorias")) {
        return Promise.resolve({ ok: true, json: async () => [] });
      }

      if (String(url).includes("alertas-orcamento")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ totalCategoriasEmAlerta: 0, categorias: [] }),
        });
      }

      return Promise.resolve({ ok: true, json: async () => [] });
    });

    render(
      <DashboardView
        totalIncome={0}
        totalExpenses={0}
        finalBalance={0}
        totalInvestmentsBalance={0}
        fetchData={vi.fn()}
        loading={false}
        selectedMes={1}
        selectedAno={2026}
        onChangeMonth={() => {}}
        categorias={[]}
        veiculos={[]}
        onOpenCategoryManager={() => {}}
        onOpenCardManagement={onOpenCardManagement}
        incomes={[]}
        expenses={[]}
        saldoAnterior={0}
      />,
    );

    await waitFor(() =>
      expect(screen.getByText("Nova compra no cartão")).toBeTruthy(),
    );

    fireEvent.click(screen.getByRole("button", { name: "Abrir gestão" }));
    expect(onOpenCardManagement).toHaveBeenCalled();

    fireEvent.click(
      screen.getByRole("button", { name: "Nova compra no cartão" }),
    );

    await waitFor(() =>
      expect(screen.getByText("Nova Transação")).toBeTruthy(),
    );

    expect(
      screen.getByLabelText("Marcar como compra no cartão ativo").checked,
    ).toBe(true);
  });
});
