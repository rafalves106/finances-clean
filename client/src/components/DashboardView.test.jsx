import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

vi.mock("recharts", () => {
  const Mock = ({ children }) => <div>{children}</div>;

  const ResponsiveContainer = ({ children, width, height }) => (
    <div
      data-testid="recharts-responsive-container"
      data-width={String(width)}
      data-height={String(height)}
    >
      {children}
    </div>
  );

  const XAxis = ({ children, dataKey, axisLine, tickLine, tick }) => (
    <div
      data-testid="recharts-x-axis"
      data-datakey={dataKey}
      data-axis-line={String(axisLine)}
      data-tick-line={String(tickLine)}
      data-tick-font-size={String(tick?.fontSize)}
      data-tick-fill={tick?.fill}
    >
      {children}
    </div>
  );

  const YAxis = ({
    children,
    axisLine,
    tickLine,
    domain,
    ticks,
    tick,
    tickFormatter,
  }) => (
    <div
      data-testid="recharts-y-axis"
      data-axis-line={String(axisLine)}
      data-tick-line={String(tickLine)}
      data-domain={JSON.stringify(domain)}
      data-ticks={JSON.stringify(ticks)}
      data-tick-font-size={String(tick?.fontSize)}
      data-tick-fill={tick?.fill}
      data-format-10000={tickFormatter ? tickFormatter(10000) : ""}
      data-format-2500={tickFormatter ? tickFormatter(2500) : ""}
    >
      {children}
    </div>
  );

  const CartesianGrid = ({ children, vertical, stroke, strokeDasharray }) => (
    <div
      data-testid="recharts-grid"
      data-vertical={String(vertical)}
      data-stroke={stroke}
      data-dash={strokeDasharray}
    >
      {children}
    </div>
  );

  const Tooltip = ({ children, contentStyle, cursor }) => (
    <div
      data-testid="recharts-tooltip"
      data-bg={contentStyle?.background || ""}
      data-border={contentStyle?.border || ""}
      data-radius={contentStyle?.borderRadius || ""}
      data-cursor-dash={cursor?.strokeDasharray || ""}
      data-cursor-stroke={cursor?.stroke || ""}
    >
      {children}
    </div>
  );

  const Area = ({
    children,
    dataKey,
    type,
    stroke,
    strokeWidth,
    fill,
    dot,
    activeDot,
  }) => (
    <div
      data-testid="recharts-area"
      data-datakey={dataKey}
      data-type={type}
      data-stroke={stroke}
      data-stroke-width={String(strokeWidth)}
      data-fill={fill}
      data-dot={String(dot)}
      data-active-dot-radius={String(activeDot?.r || "")}
    >
      {children}
    </div>
  );

  return {
    ResponsiveContainer,
    AreaChart: Mock,
    Area,
    BarChart: Mock,
    Bar: Mock,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
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

describe("DashboardView ciclo 013 uiux group 14", () => {
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

  it("deve renderizar grafico com altura, eixos, areas e tooltip premium", async () => {
    render(
      <DashboardView
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
            titulo: "Salario",
            valor: 6200,
            tipo: "Entrada",
            data: "2026-01-01T12:00:00Z",
          },
        ]}
        expenses={[
          {
            id: "out-1",
            titulo: "Mercado",
            valor: 1200,
            tipo: "Saida",
            data: "2026-01-03T12:00:00Z",
          },
        ]}
        saldoAnterior={0}
      />,
    );

    await waitFor(() =>
      expect(screen.getByText("Controle Financeiro")).toBeTruthy(),
    );

    const container = screen.getByTestId("recharts-responsive-container");
    expect(container.getAttribute("data-height")).toBe("320");

    const yAxis = screen.getByTestId("recharts-y-axis");
    expect(yAxis.getAttribute("data-domain")).toBe("[0,10000]");
    expect(yAxis.getAttribute("data-ticks")).toBe(
      "[0,1000,2500,5000,7500,10000]",
    );
    expect(yAxis.getAttribute("data-format-10000")).toBe("10K");
    expect(yAxis.getAttribute("data-format-2500")).toBe("2.5K");

    const xAxis = screen.getByTestId("recharts-x-axis");
    expect(xAxis.getAttribute("data-datakey")).toBe("data");

    const grid = screen.getByTestId("recharts-grid");
    expect(grid.getAttribute("data-vertical")).toBe("false");
    expect(grid.getAttribute("data-dash")).toBe("4 10");
    expect(grid.getAttribute("data-stroke")).toBe("#2a2f52");

    const areas = screen.getAllByTestId("recharts-area");
    const entrada = areas.find(
      (item) => item.getAttribute("data-datakey") === "entrada",
    );
    const saida = areas.find(
      (item) => item.getAttribute("data-datakey") === "saida",
    );

    expect(entrada).toBeTruthy();
    expect(saida).toBeTruthy();
    expect(entrada?.getAttribute("data-fill")).toBe("url(#incomeFill)");
    expect(saida?.getAttribute("data-fill")).toBe("url(#expenseFill)");

    const tooltip = screen.getByTestId("recharts-tooltip");
    expect(tooltip.getAttribute("data-bg")).toBe("#15172a");
    expect(tooltip.getAttribute("data-border")).toBe("1px solid #32375e");
    expect(tooltip.getAttribute("data-cursor-dash")).toBe("6 6");
  });
});
