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
        fixa: false,
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
      fixa: false,
    });
  });

  it("quando a IA detecta parcelamento, repassa fixa/periodo/tipoMovimentacaoFixa no draft", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        entendido: true,
        titulo: "Notebook",
        valor: 300,
        data: "2026-08-16T00:00:00",
        tipo: "Saida",
        categoriaId: null,
        observacao: null,
        fixa: true,
        periodo: 10,
        tipoRecorrencia: null,
        tipoMovimentacaoFixa: "Parcelada",
      }),
    });

    const onDraftReady = vi.fn();

    render(<AssistenteMovimentacaoModal isOpen={true} onClose={vi.fn()} onDraftReady={onDraftReady} />);

    fireEvent.change(screen.getByPlaceholderText("Descreva a movimentação..."), {
      target: { value: "notebook de 3000 em 10x" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Analisar" }));

    await waitFor(() => expect(onDraftReady).toHaveBeenCalled());

    const draft = onDraftReady.mock.calls[0][0];
    expect(draft.fixa).toBe(true);
    expect(draft.periodo).toBe(10);
    expect(draft.tipoMovimentacaoFixa).toBe("Parcelada");
    expect(draft.valor).toBe(300);
  });

  it("quando a IA detecta recorrência, repassa fixa/tipoRecorrencia no draft", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        entendido: true,
        titulo: "Netflix",
        valor: 39.9,
        data: "2026-08-16T00:00:00",
        tipo: "Saida",
        categoriaId: null,
        observacao: null,
        fixa: true,
        periodo: 12,
        tipoRecorrencia: "Mensal",
        tipoMovimentacaoFixa: "RecorrenteFixa",
      }),
    });

    const onDraftReady = vi.fn();

    render(<AssistenteMovimentacaoModal isOpen={true} onClose={vi.fn()} onDraftReady={onDraftReady} />);

    fireEvent.change(screen.getByPlaceholderText("Descreva a movimentação..."), {
      target: { value: "netflix 39,90 todo mês" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Analisar" }));

    await waitFor(() => expect(onDraftReady).toHaveBeenCalled());

    const draft = onDraftReady.mock.calls[0][0];
    expect(draft.fixa).toBe(true);
    expect(draft.tipoRecorrencia).toBe("Mensal");
    expect(draft.tipoMovimentacaoFixa).toBe("RecorrenteFixa");
  });

  it("quando existe transação parecida (mesmo tipo, título similar), oferece clonar em vez de criar", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        entendido: true,
        titulo: "Uber",
        valor: 32,
        data: "2026-08-16T00:00:00",
        tipo: "Saida",
        categoriaId: "cat-transporte",
        observacao: null,
        fixa: false,
      }),
    });

    const onDraftReady = vi.fn();
    const onCloneSuggestion = vi.fn();
    const allTransactions = [
      { id: "t1", name: "Uber Viagem SP", type: "Saida", value: 28, date: "2026-08-10" },
      { id: "t2", name: "Uber Viagem SP", type: "Saida", value: 25, date: "2026-08-01" },
    ];

    render(
      <AssistenteMovimentacaoModal
        isOpen={true}
        onClose={vi.fn()}
        onDraftReady={onDraftReady}
        onCloneSuggestion={onCloneSuggestion}
        allTransactions={allTransactions}
      />,
    );

    fireEvent.change(screen.getByPlaceholderText("Descreva a movimentação..."), {
      target: { value: "gastei 32 reais de uber" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Analisar" }));

    // Mostra a sugestão em vez de criar direto - a mais recente das parecidas.
    expect(await screen.findByText("Uber Viagem SP")).toBeTruthy();
    expect(onDraftReady).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: /Clonar a parecida/ }));

    expect(onCloneSuggestion).toHaveBeenCalledWith(
      expect.objectContaining({ id: "t1", date: "2026-08-10" }),
    );
  });

  it("na sugestão de clonar, 'Criar nova' segue com o draft normalmente", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        entendido: true,
        titulo: "Uber",
        valor: 32,
        data: "2026-08-16T00:00:00",
        tipo: "Saida",
        categoriaId: null,
        observacao: null,
        fixa: false,
      }),
    });

    const onDraftReady = vi.fn();
    const allTransactions = [
      { id: "t1", name: "Uber Corrida", type: "Saida", value: 28, date: "2026-08-10" },
    ];

    render(
      <AssistenteMovimentacaoModal
        isOpen={true}
        onClose={vi.fn()}
        onDraftReady={onDraftReady}
        onCloneSuggestion={vi.fn()}
        allTransactions={allTransactions}
      />,
    );

    fireEvent.change(screen.getByPlaceholderText("Descreva a movimentação..."), {
      target: { value: "gastei 32 reais de uber" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Analisar" }));

    fireEvent.click(await screen.findByRole("button", { name: /Criar nova/ }));

    expect(onDraftReady).toHaveBeenCalledWith(
      expect.objectContaining({ titulo: "Uber", valor: 32 }),
    );
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
