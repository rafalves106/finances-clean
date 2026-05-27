import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import CategoryManagerModal from "./CategoryManagerModal";
import { API_CATEGORIAS_URL } from "../services/api";

describe("CategoryManagerModal orçamento", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({}),
    });
  });

  it("deve enviar orçamento mensal ao criar categoria", async () => {
    const onCategoriasChange = vi.fn();

    render(
      <CategoryManagerModal
        isOpen
        onClose={() => {}}
        categorias={[]}
        onCategoriasChange={onCategoriasChange}
      />,
    );

    fireEvent.change(screen.getByLabelText("Nome"), {
      target: { value: "Mercado" },
    });

    fireEvent.change(screen.getByLabelText("Ícone"), {
      target: { value: "🛒" },
    });

    fireEvent.change(screen.getByLabelText("Orçamento mensal"), {
      target: { value: "750" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Salvar" }));

    await waitFor(() => expect(globalThis.fetch).toHaveBeenCalled());

    const [, request] = globalThis.fetch.mock.calls[0];
    expect(globalThis.fetch).toHaveBeenCalledWith(API_CATEGORIAS_URL, request);

    const payload = JSON.parse(request.body);
    expect(payload.orcamentoMensal).toBe(750);

    expect(onCategoriasChange).toHaveBeenCalled();
  });

  it("deve permitir limpar orçamento mensal em categoria global", async () => {
    const onCategoriasChange = vi.fn();

    render(
      <CategoryManagerModal
        isOpen
        onClose={() => {}}
        categorias={[
          {
            id: "cat-global",
            nome: "Saúde",
            icone: "💊",
            cor: "#ef4444",
            isGlobal: true,
            orcamentoMensal: 200,
          },
        ]}
        onCategoriasChange={onCategoriasChange}
      />,
    );

    fireEvent.click(screen.getByLabelText("Editar categoria Saúde"));

    fireEvent.change(screen.getByLabelText("Orçamento mensal"), {
      target: { value: "" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Atualizar" }));

    await waitFor(() => expect(globalThis.fetch).toHaveBeenCalled());

    const [url, request] = globalThis.fetch.mock.calls[0];
    expect(url).toBe(`${API_CATEGORIAS_URL}/cat-global`);
    expect(request.method).toBe("PUT");

    const payload = JSON.parse(request.body);
    expect(payload.orcamentoMensal).toBeNull();

    expect(onCategoriasChange).toHaveBeenCalled();
  });
});