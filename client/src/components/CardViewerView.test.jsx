import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import CardViewerView from "./CardViewerView";

const buildCard = ({
  id,
  nome,
  limiteTotal = 3000,
  diaFechamento = 10,
  diaVencimento = 20,
  ativo = true,
  corTema = "#271815",
}) => ({
  id,
  nome,
  limiteTotal,
  diaFechamento,
  diaVencimento,
  ativo,
  corTema,
  createdAtUtc: "2026-06-01T10:00:00Z",
  updatedAtUtc: "2026-06-01T10:00:00Z",
});

const setupFetchMock = (initialCards) => {
  const cards = [...initialCards];
  const fetchMock = vi.fn().mockImplementation(async (url, init = {}) => {
    const path = String(url);
    const method = (init.method || "GET").toUpperCase();

    if (
      path.includes("/api/v1/cartao?incluirInativos=true") &&
      method === "GET"
    ) {
      return {
        ok: true,
        status: 200,
        json: async () => [...cards],
      };
    }

    if (path.includes("/api/v1/cartao/resumos") && method === "GET") {
      return {
        ok: true,
        status: 200,
        json: async () => [],
      };
    }

    if (path.endsWith("/api/v1/cartao") && method === "POST") {
      const payload = JSON.parse(init.body || "{}");
      const ativos = cards.filter((item) => item.ativo).length;

      if (ativos >= 3) {
        return {
          ok: false,
          status: 409,
          json: async () => ({
            error: {
              code: "CARTAO_LIMITE_ATIVOS_EXCEDIDO",
              message: "Usuário já possui 3 cartões ativos.",
            },
          }),
        };
      }

      const novo = buildCard({
        id: `card-${cards.length + 1}`,
        nome: payload.nome,
        limiteTotal: payload.limiteTotal,
        diaFechamento: payload.diaFechamento,
        diaVencimento: payload.diaVencimento,
        ativo: true,
        corTema: payload.corTema || "#271815",
      });

      cards.push(novo);

      return {
        ok: true,
        status: 201,
        json: async () => novo,
      };
    }

    if (path.includes("/api/v1/cartao/") && method === "PUT") {
      const payload = JSON.parse(init.body || "{}");
      const cardId = path.split("/").pop();
      const index = cards.findIndex((item) => item.id === cardId);

      if (index >= 0) {
        cards[index] = {
          ...cards[index],
          nome: payload.nome,
          limiteTotal: payload.limiteTotal,
          diaFechamento: payload.diaFechamento,
          diaVencimento: payload.diaVencimento,
          corTema: payload.corTema,
        };
      }

      return {
        ok: true,
        status: 204,
        json: async () => ({}),
      };
    }

    if (path.includes("/api/v1/cartao/") && method === "DELETE") {
      const cardId = path.split("/").pop();
      const index = cards.findIndex((item) => item.id === cardId);

      if (index >= 0) {
        cards[index] = {
          ...cards[index],
          ativo: false,
        };
      }

      return {
        ok: true,
        status: 204,
        json: async () => ({}),
      };
    }

    return {
      ok: false,
      status: 404,
      json: async () => ({}),
    };
  });

  globalThis.fetch = fetchMock;
  return { cards, fetchMock };
};

const openNewCardForm = () => {
  fireEvent.click(screen.getByRole("button", { name: /novo cartão/i }));
};

const fillCardForm = ({ nome, limiteTotal, diaFechamento, diaVencimento }) => {
  fireEvent.change(screen.getByLabelText(/nome do cartão/i), {
    target: { value: nome },
  });
  fireEvent.change(screen.getByLabelText(/limite total/i), {
    target: { value: String(limiteTotal) },
  });
  fireEvent.change(screen.getByLabelText(/dia de fechamento/i), {
    target: { value: String(diaFechamento) },
  });
  fireEvent.change(screen.getByLabelText(/dia de vencimento/i), {
    target: { value: String(diaVencimento) },
  });
};

describe("CardViewerView", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.stubGlobal(
      "confirm",
      vi.fn(() => true),
    );
  });

  it("deve renderizar lista de cartões ativos e inativos", async () => {
    setupFetchMock([
      buildCard({ id: "a", nome: "Cartão A", ativo: true }),
      buildCard({ id: "b", nome: "Cartão B", ativo: false }),
    ]);

    render(<CardViewerView />);

    expect(await screen.findByText("Cartão A")).toBeTruthy();
    expect(screen.getByText("Cartão B")).toBeTruthy();
    expect(screen.getByText(/cartões inativos/i)).toBeTruthy();
  });

  it("deve criar cartão", async () => {
    const { fetchMock } = setupFetchMock([
      buildCard({ id: "a", nome: "Cartão A", ativo: true }),
    ]);

    render(<CardViewerView />);
    await screen.findByText("Cartão A");

    openNewCardForm();
    fillCardForm({
      nome: "Cartão Novo",
      limiteTotal: 4500,
      diaFechamento: 12,
      diaVencimento: 22,
    });

    fireEvent.click(screen.getByRole("button", { name: /cadastrar cartão/i }));

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining("/api/v1/cartao"),
        expect.objectContaining({ method: "POST" }),
      ),
    );

    expect(await screen.findByText("Cartão Novo")).toBeTruthy();
  });

  it("deve editar cartão", async () => {
    setupFetchMock([buildCard({ id: "a", nome: "Cartão A", ativo: true })]);

    render(<CardViewerView />);
    await screen.findByText("Cartão A");

    fireEvent.click(screen.getByRole("button", { name: /editar/i }));
    fillCardForm({
      nome: "Cartão A Editado",
      limiteTotal: 5000,
      diaFechamento: 15,
      diaVencimento: 25,
    });

    fireEvent.click(screen.getByRole("button", { name: /salvar alterações/i }));

    expect(await screen.findByText("Cartão A Editado")).toBeTruthy();
  });

  it("deve inativar cartão", async () => {
    setupFetchMock([buildCard({ id: "a", nome: "Cartão A", ativo: true })]);

    render(<CardViewerView />);
    await screen.findByText("Cartão A");

    fireEvent.click(screen.getByRole("button", { name: /inativar/i }));

    expect(
      await screen.findByText(/cartão inativado com sucesso/i),
    ).toBeTruthy();
    expect(screen.getByText(/cartões inativos/i)).toBeTruthy();
  });

  it("deve alterar cor tema do cartão", async () => {
    const { fetchMock } = setupFetchMock([
      buildCard({ id: "a", nome: "Cartão A", ativo: true, corTema: "#271815" }),
    ]);

    render(<CardViewerView />);
    await screen.findByText("Cartão A");

    fireEvent.click(screen.getByRole("button", { name: /editar/i }));
    fireEvent.click(
      screen.getByRole("button", { name: /selecionar cor #0F766E/i }),
    );
    fireEvent.click(screen.getByRole("button", { name: /salvar alterações/i }));

    await waitFor(() => {
      const putCall = fetchMock.mock.calls.find(
        ([, init]) => init?.method === "PUT",
      );

      expect(putCall).toBeTruthy();
      const body = JSON.parse(putCall[1].body);
      expect(body.corTema).toBe("#0F766E");
    });
  });

  it("deve bloquear tentativa de 4º cartão ativo", async () => {
    setupFetchMock([
      buildCard({ id: "a", nome: "Cartão A", ativo: true }),
      buildCard({ id: "b", nome: "Cartão B", ativo: true }),
      buildCard({ id: "c", nome: "Cartão C", ativo: true }),
    ]);

    render(<CardViewerView />);
    await screen.findByText("Cartão A");

    openNewCardForm();
    fillCardForm({
      nome: "Cartão D",
      limiteTotal: 3200,
      diaFechamento: 14,
      diaVencimento: 24,
    });

    fireEvent.click(screen.getByRole("button", { name: /cadastrar cartão/i }));

    expect(await screen.findByText(/já possui 3 cartões ativos/i)).toBeTruthy();
  });
});
