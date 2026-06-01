import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import TransactionModal from "./TransactionModal";
import { API_CARTAO_URL } from "../services/api";

describe("TransactionModal tipoMovimentacaoFixa", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    globalThis.fetch = vi.fn().mockImplementation((url) => {
      if (String(url).startsWith(`${API_CARTAO_URL}/resumo`)) {
        return Promise.resolve({ ok: false, json: async () => ({}) });
      }

      return Promise.resolve({
        ok: true,
        clone: () => ({
          json: async () => ({ id: "mov-created" }),
        }),
      });
    });
  });

  it("deve enviar tipoMovimentacaoFixa no payload quando fixa parcelada", async () => {
    const onSuccess = vi.fn();
    const onClose = vi.fn();

    render(
      <TransactionModal
        isOpen={true}
        onClose={onClose}
        onSuccess={onSuccess}
        categorias={[]}
        veiculos={[]}
        editingItem={null}
        periodKey="2026-1"
      />,
    );

    fireEvent.change(screen.getByPlaceholderText("Título"), {
      target: { value: "Notebook" },
    });
    fireEvent.change(screen.getByPlaceholderText("Valor"), {
      target: { value: "4500" },
    });

    const inputs = document.querySelectorAll('input[type="date"]');
    fireEvent.change(inputs[0], { target: { value: "2026-01-10" } });

    fireEvent.click(screen.getByLabelText(/É uma movimentação recorrente\?/i));
    fireEvent.click(screen.getByLabelText("Parcelada"));

    fireEvent.change(screen.getByPlaceholderText("Duração (meses)"), {
      target: { value: "3" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Cancelar ação" }));

    await waitFor(() => expect(globalThis.fetch).toHaveBeenCalled());

    const postCall = globalThis.fetch.mock.calls.find(
      ([url, options]) =>
        String(url).includes("/api/v1/movimentacoes") &&
        options?.method === "POST",
    );

    expect(postCall).toBeTruthy();
    const request = postCall[1];
    const payload = JSON.parse(request.body);

    expect(payload.tipoMovimentacaoFixa).toBe("Parcelada");
    expect(payload.periodo).toBe(3);
    expect(payload.cartaoId).toBeNull();
    expect(onSuccess).toHaveBeenCalledWith({
      type: "create",
      id: "mov-created",
      payload: expect.objectContaining({
        titulo: "Notebook",
        valor: 4500,
        tipoMovimentacaoFixa: "Parcelada",
      }),
      requestPeriodKey: "2026-1",
    });
    expect(onClose).toHaveBeenCalled();
  });
});
