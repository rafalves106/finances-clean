import { describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useAlertsCenter } from "./useAlertsCenter";

describe("useAlertsCenter", () => {
  it("combina alertas de orcamento e veiculo, priorizando estado critico", () => {
    const budgetAlerts = [
      {
        id: "cat-1",
        nome: "Lazer",
        icone: "🎮",
        limite: 200,
        total: 170,
        percentual: 85,
        estado: "Atencao",
      },
      {
        id: "cat-2",
        nome: "Alimentação",
        icone: "🍔",
        limite: 500,
        total: 600,
        percentual: 120,
        estado: "Estourado",
      },
    ];
    const veiculos = [
      { id: "v1", nome: "Civic", alertaPendente: true },
      { id: "v2", nome: "Onix", alertaPendente: false },
    ];

    const { result } = renderHook(() =>
      useAlertsCenter({ budgetAlerts, veiculos }),
    );

    expect(result.current.count).toBe(3);
    expect(result.current.alerts[0].severity).toBe("critico");
    expect(result.current.alerts.map((a) => a.type)).toEqual(
      expect.arrayContaining(["orcamento", "orcamento", "veiculo"]),
    );
    expect(result.current.alerts.find((a) => a.type === "veiculo").label).toBe(
      "Civic",
    );
  });

  it("retorna lista vazia quando nao ha alertas", () => {
    const { result } = renderHook(() =>
      useAlertsCenter({ budgetAlerts: [], veiculos: [] }),
    );

    expect(result.current.alerts).toEqual([]);
    expect(result.current.count).toBe(0);
  });

  it("inclui alerta de grupo de recorrencia expirado com acao de renovacao", () => {
    const recurringGroups = [
      {
        grupoRecorrenciaId: "grupo-1",
        titulo: "Aluguel",
        ultimaData: "2026-06-01T00:00:00",
      },
    ];
    const onRenewRecurringGroup = vi.fn();

    const { result } = renderHook(() =>
      useAlertsCenter({ recurringGroups, onRenewRecurringGroup }),
    );

    expect(result.current.count).toBe(1);
    const alert = result.current.alerts[0];
    expect(alert.type).toBe("recorrencia");
    expect(alert.label).toBe("Aluguel");
    expect(alert.description).toContain("06/2026");

    alert.action.onClick();
    expect(onRenewRecurringGroup).toHaveBeenCalledWith("grupo-1");
  });
});
