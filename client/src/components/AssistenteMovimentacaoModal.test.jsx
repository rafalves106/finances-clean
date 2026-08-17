import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import AssistenteMovimentacaoModal from "./AssistenteMovimentacaoModal";
import { API_ASSISTENTE_URL } from "../services/api";

describe("AssistenteMovimentacaoModal", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("ao entender o texto, chama onDraftReady com id null e nao salva nada sozinho", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        entendido: true,
        titulo: "Uber",
        valor: 45,
        data: "2026-08-16T00:00:00",
        tipo: "Saida",
        categoriaId: "cat-transporte",
        observacao: null,
      }),
    });

    const onDraftReady = vi.fn();
    const onClose = vi.fn();

    render(
      <AssistenteMovimentacaoModal isOpen={true} onClose={onClose} onDraftReady={onDraftReady} />,
    );

    fireEvent.change(screen.getByPlaceholderText("Descreva a movimentação..."), {
      target: { value: "gastei 45 reais de uber ontem" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Analisar" }));

    await waitFor(() => expect(onDraftReady).toHaveBeenCalled());

    expect(globalThis.fetch).toHaveBeenCalledWith(
      `${API_ASSISTENTE_URL}/interpretar-movimentacao`,
      expect.objectContaining({ method: "POST" }),
    );
    // Confirma que so o endpoint de interpretacao foi chamado - nada foi
    // criado/salvo a partir deste componente.
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);

    expect(onDraftReady).toHaveBeenCalledWith({
      id: null,
      titulo: "Uber",
      valor: 45,
      data: "2026-08-16T00:00:00",
      tipo: "Saida",
      categoriaId: "cat-transporte",
    });
  });

  it("quando a IA nao entende, mostra a observacao e nao chama onDraftReady", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        entendido: false,
        observacao: "Não ficou claro o valor da movimentação.",
      }),
    });

    const onDraftReady = vi.fn();

    render(
      <AssistenteMovimentacaoModal isOpen={true} onClose={vi.fn()} onDraftReady={onDraftReady} />,
    );

    fireEvent.change(screen.getByPlaceholderText("Descreva a movimentação..."), {
      target: { value: "oi" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Analisar" }));

    expect(
      await screen.findByText("Não ficou claro o valor da movimentação."),
    ).toBeTruthy();
    expect(onDraftReady).not.toHaveBeenCalled();
  });

  it("quando a API falha, mostra erro amigavel e nao quebra", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: false });

    render(
      <AssistenteMovimentacaoModal isOpen={true} onClose={vi.fn()} onDraftReady={vi.fn()} />,
    );

    fireEvent.change(screen.getByPlaceholderText("Descreva a movimentação..."), {
      target: { value: "mercado 50" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Analisar" }));

    expect(
      await screen.findByText(/Não consegui falar com o assistente/),
    ).toBeTruthy();
  });
});
