import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

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

import DashboardView from "./DashboardView";
import { API_URL } from "../services/api";

describe("DashboardView renumeracao de grupo", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true });
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
});
