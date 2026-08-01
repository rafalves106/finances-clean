import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useBudgetAlerts } from "./useBudgetAlerts";

const buildFetchMock = (payload) =>
  vi.fn().mockImplementation(async (url) => {
    if (String(url).includes("/alertas-orcamento")) {
      return { ok: true, status: 200, json: async () => payload };
    }

    return { ok: true, status: 200, json: async () => [] };
  });

describe("useBudgetAlerts", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("filtra categorias em estado Normal, mantendo Atencao e Estourado", async () => {
    globalThis.fetch = buildFetchMock({
      mes: 8,
      ano: 2026,
      totalCategoriasEmAlerta: 2,
      categorias: [
        {
          categoriaId: "cat-1",
          nome: "Alimentação",
          icone: "🍔",
          cor: "#ff0000",
          orcamentoMensal: 500,
          totalDespesasMesAtual: 600,
          percentualConsumo: 120,
          estadoAlerta: "Estourado",
        },
        {
          categoriaId: "cat-2",
          nome: "Lazer",
          icone: "🎮",
          cor: "#00ff00",
          orcamentoMensal: 200,
          totalDespesasMesAtual: 170,
          percentualConsumo: 85,
          estadoAlerta: "Atencao",
        },
        {
          categoriaId: "cat-3",
          nome: "Educação",
          icone: "📚",
          cor: "#0000ff",
          orcamentoMensal: 300,
          totalDespesasMesAtual: 50,
          percentualConsumo: 16.67,
          estadoAlerta: "Normal",
        },
      ],
    });

    const { result } = renderHook(() =>
      useBudgetAlerts({ selectedMes: 8, selectedAno: 2026 }),
    );

    await waitFor(() => expect(result.current.budgetAlerts).toHaveLength(2));

    expect(result.current.budgetAlerts.map((item) => item.estado)).toEqual([
      "Estourado",
      "Atencao",
    ]);
    expect(result.current.budgetAlerts[0]).toMatchObject({
      id: "cat-1",
      nome: "Alimentação",
      limite: 500,
      total: 600,
      percentual: 120,
    });
  });

  it("define mensagem de erro quando a resposta falha", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ message: "Período inválido" }),
    });

    const { result } = renderHook(() =>
      useBudgetAlerts({ selectedMes: 8, selectedAno: 2026 }),
    );

    await waitFor(() =>
      expect(result.current.budgetAlertsError).not.toBe(""),
    );
    expect(result.current.budgetAlerts).toEqual([]);
  });

  it("nao busca quando mes/ano nao estao definidos", async () => {
    const fetchMock = vi.fn();
    globalThis.fetch = fetchMock;

    renderHook(() => useBudgetAlerts({ selectedMes: null, selectedAno: null }));

    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
