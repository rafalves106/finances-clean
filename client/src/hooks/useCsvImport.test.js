import { act } from "react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useCsvImport } from "./useCsvImport";

const buildFileEvent = (file) => ({ target: { files: [file], value: "" } });

describe("useCsvImport", () => {
  beforeEach(() => {
    vi.stubGlobal("alert", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("importa com sucesso, avisa o resumo e chama o callback de refresh", async () => {
    const resultado = { totalLinhas: 3, importadas: 3, erros: [] };
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => resultado,
    });
    const onImported = vi.fn();

    const { result } = renderHook(() => useCsvImport(onImported));
    const arquivo = new File(["Data;Titulo;Tipo;Categoria;Valor;Veiculo"], "movs.csv", { type: "text/csv" });

    await act(async () => {
      await result.current.handleFileSelected(buildFileEvent(arquivo));
    });

    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/importar-csv"),
      expect.objectContaining({ method: "POST" }),
    );
    expect(globalThis.alert).toHaveBeenCalledWith(
      expect.stringContaining("3 de 3 movimentações importadas"),
    );
    expect(onImported).toHaveBeenCalledTimes(1);
  });

  it("lista os erros por linha e não chama o callback quando nada foi importado", async () => {
    const resultado = {
      totalLinhas: 1,
      importadas: 0,
      erros: [{ linha: 1, motivo: "Valor inválido" }],
    };
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => resultado,
    });
    const onImported = vi.fn();

    const { result } = renderHook(() => useCsvImport(onImported));
    const arquivo = new File(["ruim"], "movs.csv", { type: "text/csv" });

    await act(async () => {
      await result.current.handleFileSelected(buildFileEvent(arquivo));
    });

    expect(globalThis.alert).toHaveBeenCalledWith(expect.stringContaining("Linha 1: Valor inválido"));
    expect(onImported).not.toHaveBeenCalled();
  });

  it("avisa o erro e não quebra quando a resposta falha", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      text: async () => "Arquivo inválido.",
    });
    const onImported = vi.fn();

    const { result } = renderHook(() => useCsvImport(onImported));
    const arquivo = new File(["ruim"], "movs.csv", { type: "text/csv" });

    await act(async () => {
      await result.current.handleFileSelected(buildFileEvent(arquivo));
    });

    expect(globalThis.alert).toHaveBeenCalledWith("Arquivo inválido.");
    expect(onImported).not.toHaveBeenCalled();
  });

  it("não faz nada quando nenhum arquivo é selecionado", async () => {
    globalThis.fetch = vi.fn();
    const { result } = renderHook(() => useCsvImport());

    await act(async () => {
      await result.current.handleFileSelected({ target: { files: [], value: "" } });
    });

    expect(globalThis.fetch).not.toHaveBeenCalled();
  });
});
