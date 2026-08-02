import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useRecurringRenewals } from "./useRecurringRenewals";

const buildFetchMock = (payload) =>
  vi.fn().mockImplementation(async (url) => {
    if (String(url).includes("/grupos/expirados")) {
      return { ok: true, status: 200, json: async () => payload };
    }

    return { ok: true, status: 200, json: async () => ({}) };
  });

describe("useRecurringRenewals", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("carrega os grupos de recorrencia expirados", async () => {
    globalThis.fetch = buildFetchMock([
      {
        grupoRecorrenciaId: "grupo-1",
        titulo: "Aluguel",
        ultimaData: "2026-06-01T00:00:00",
        tipoRecorrencia: 0,
      },
    ]);

    const { result } = renderHook(() => useRecurringRenewals());

    await waitFor(() => expect(result.current.expiredGroups).toHaveLength(1));
    expect(result.current.expiredGroups[0]).toMatchObject({
      grupoRecorrenciaId: "grupo-1",
      titulo: "Aluguel",
    });
  });

  it("nao busca quando desabilitado", async () => {
    const fetchMock = vi.fn();
    globalThis.fetch = fetchMock;

    renderHook(() => useRecurringRenewals({ enabled: false }));

    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("renovarGrupo faz POST e recarrega a lista em caso de sucesso", async () => {
    const fetchMock = vi.fn().mockImplementation(async (url, init) => {
      if (String(url).includes("/renovar")) {
        expect(init.method).toBe("POST");
        expect(JSON.parse(init.body)).toEqual({ meses: 12 });
        return { ok: true, status: 200, json: async () => ({}) };
      }

      return { ok: true, status: 200, json: async () => [] };
    });
    globalThis.fetch = fetchMock;

    const { result } = renderHook(() => useRecurringRenewals());
    await waitFor(() => expect(result.current.expiredGroups).toEqual([]));

    const resultado = await result.current.renovarGrupo("grupo-1", 12);

    expect(resultado).toEqual({ ok: true });
  });

  it("renovarGrupo retorna erro quando a resposta falha", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ error: { message: "Grupo inválido" } }),
    });

    const { result } = renderHook(() => useRecurringRenewals());

    const resultado = await result.current.renovarGrupo("grupo-1", 12);

    expect(resultado).toEqual({ ok: false, message: "Grupo inválido" });
  });
});
