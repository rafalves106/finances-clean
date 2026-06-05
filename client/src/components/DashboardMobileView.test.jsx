import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

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
    expect(screen.getByText("Investimentos ativos")).toBeTruthy();
  });
});
