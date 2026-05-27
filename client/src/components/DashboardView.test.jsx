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

    expect(screen.queryByText(/alerta/i)).toBeNull();
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
