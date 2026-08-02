import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useMonthlyReportExport } from "./useMonthlyReportExport";

describe("useMonthlyReportExport", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    globalThis.URL.createObjectURL = vi.fn(() => "blob:mock");
    globalThis.URL.revokeObjectURL = vi.fn();
  });

  it("baixa o relatorio mensal com o nome de arquivo do backend", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      headers: new Headers({
        "content-disposition": 'attachment; filename="relatorio_2026_08.html"',
      }),
      blob: async () => new Blob(["<html></html>"], { type: "text/html" }),
    });
    globalThis.fetch = fetchMock;

    const { result } = renderHook(() => useMonthlyReportExport());

    await result.current.handleExportRelatorioMensal(8, 2026);

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/relatorio-mensal?mes=8&ano=2026"),
      expect.objectContaining({ method: "GET", credentials: "include" }),
    );
    await waitFor(() => expect(result.current.isExportingReport).toBe(false));
  });

  it("mostra alerta quando a resposta falha", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      text: async () => "Erro ao gerar relatório.",
    });
    const alertMock = vi.spyOn(window, "alert").mockImplementation(() => {});

    const { result } = renderHook(() => useMonthlyReportExport());

    await result.current.handleExportRelatorioMensal(8, 2026);

    expect(alertMock).toHaveBeenCalledWith("Erro ao gerar relatório.");
  });
});
