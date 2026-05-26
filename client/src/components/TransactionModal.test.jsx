import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import TransactionModal from "./TransactionModal";

describe("TransactionModal tipoMovimentacaoFixa", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true });
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

    const request = globalThis.fetch.mock.calls[0][1];
    const payload = JSON.parse(request.body);

    expect(payload.tipoMovimentacaoFixa).toBe("Parcelada");
    expect(payload.periodo).toBe(3);
    expect(onSuccess).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });
});
