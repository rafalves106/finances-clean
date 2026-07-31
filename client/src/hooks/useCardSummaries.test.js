import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { useCardSummaries } from "./useCardSummaries";

const buildFetchMock = (resumos) =>
  vi.fn().mockImplementation(async (url) => {
    if (String(url).includes("/api/v1/cartao/resumos")) {
      return { ok: true, status: 200, json: async () => resumos };
    }

    return { ok: true, status: 200, json: async () => [] };
  });

describe("useCardSummaries", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("usa o utilizado calculado pelo backend, nao um recalculo local a partir das transacoes carregadas", async () => {
    // O backend soma a fatura por CompetenciaFatura (cruza mes calendario
    // corretamente). allTransactions aqui representa so o mes selecionado na
    // tela e NAO contem as compras do inicio do ciclo (mes anterior) -
    // exatamente o cenario que o calculo local antigo deixava de fora.
    globalThis.fetch = buildFetchMock([
      {
        cartao: {
          id: "cartao-1",
          nome: "Cartao Principal",
          limiteTotal: 3000,
          diaFechamento: 27,
          diaVencimento: 5,
        },
        limite: { utilizado: 1850, disponivel: 1150, percentualUso: 61.67 },
        previsaoFatura: { atual: 1850, proxima: 0 },
      },
    ]);

    const { result } = renderHook(() =>
      useCardSummaries({ allTransactions: [] }),
    );

    await waitFor(() => expect(result.current.cardSummary).not.toBeNull());

    expect(result.current.cardLimitTotal).toBe(3000);
    expect(result.current.cardLimitUsed).toBe(1850);
    expect(result.current.cardUsagePercent).toBeCloseTo(61.67, 1);
  });

  it("recalcula o utilizado a partir do resumo mais recente apos recarregar", async () => {
    const fetchMock = buildFetchMock([
      {
        cartao: { id: "cartao-1", nome: "Cartao Principal", limiteTotal: 2000 },
        limite: { utilizado: 500, disponivel: 1500, percentualUso: 25 },
        previsaoFatura: { atual: 500, proxima: 0 },
      },
    ]);
    globalThis.fetch = fetchMock;

    const { result } = renderHook(() =>
      useCardSummaries({ allTransactions: [] }),
    );

    await waitFor(() => expect(result.current.cardLimitUsed).toBe(500));

    fetchMock.mockImplementation(
      buildFetchMock([
        {
          cartao: {
            id: "cartao-1",
            nome: "Cartao Principal",
            limiteTotal: 2000,
          },
          limite: { utilizado: 800, disponivel: 1200, percentualUso: 40 },
          previsaoFatura: { atual: 800, proxima: 0 },
        },
      ]),
    );

    await act(async () => {
      await result.current.loadCardSummaries();
    });

    expect(result.current.cardLimitUsed).toBe(800);
  });

  it("busca a fatura do mes/ano selecionado e refaz o fetch quando eles mudam", async () => {
    const fetchMock = buildFetchMock([
      {
        cartao: { id: "cartao-1", nome: "Cartao Principal", limiteTotal: 2000 },
        limite: { utilizado: 300, disponivel: 1700, percentualUso: 15 },
        previsaoFatura: { atual: 300, proxima: 0 },
      },
    ]);
    globalThis.fetch = fetchMock;

    const { result, rerender } = renderHook(
      ({ selectedMes, selectedAno }) =>
        useCardSummaries({ allTransactions: [], selectedMes, selectedAno }),
      { initialProps: { selectedMes: 5, selectedAno: 2026 } },
    );

    await waitFor(() => expect(result.current.cardLimitUsed).toBe(300));

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("mes=5"),
      expect.anything(),
    );
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("ano=2026"),
      expect.anything(),
    );

    fetchMock.mockClear();
    fetchMock.mockImplementation(
      buildFetchMock([
        {
          cartao: {
            id: "cartao-1",
            nome: "Cartao Principal",
            limiteTotal: 2000,
          },
          limite: { utilizado: 0, disponivel: 2000, percentualUso: 0 },
          previsaoFatura: { atual: 0, proxima: 0 },
        },
      ]),
    );

    rerender({ selectedMes: 6, selectedAno: 2026 });

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining("mes=6"),
        expect.anything(),
      ),
    );
    await waitFor(() => expect(result.current.cardLimitUsed).toBe(0));
  });
});
