import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import CardViewerView from "./CardViewerView";
import { API_CARTAO_URL } from "../services/api";

describe("CardViewerView", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("deve exibir estado vazio guiado quando nao houver cartao", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      json: async () => ({}),
    });

    render(<CardViewerView />);

    await waitFor(() =>
      expect(globalThis.fetch).toHaveBeenCalledWith(
        `${API_CARTAO_URL}/resumo`,
        {
          headers: { "Content-Type": "application/json" },
        },
      ),
    );

    expect(
      screen.getByText(/você ainda não possui cartão ativo/i),
    ).toBeTruthy();
  });

  it("deve renderizar resumo de limite e previsao quando houver cartao ativo", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        cartao: {
          id: "c1",
          nome: "Cartão principal",
          limiteTotal: 5000,
          diaFechamento: 10,
          diaVencimento: 20,
        },
        limite: {
          utilizado: 1000,
          disponivel: 4000,
          percentualUso: 20,
        },
        previsaoFatura: {
          atual: 800,
          proxima: 200,
        },
      }),
    });

    render(<CardViewerView />);

    await waitFor(() =>
      expect(screen.getByText(/limite utilizado/i)).toBeTruthy(),
    );

    expect(screen.getByText(/fatura atual \/ próxima/i)).toBeTruthy();
    expect(screen.getByText(/20.00%/i)).toBeTruthy();
    expect(screen.getByDisplayValue("Cartão principal")).toBeTruthy();
  });
});
