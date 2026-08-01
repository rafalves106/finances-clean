import { useMemo } from "react";
import { formatCurrency } from "../util/formatCurrency";

export const useAlertsCenter = ({ budgetAlerts = [], veiculos = [] }) => {
  const alerts = useMemo(() => {
    const orcamentoAlerts = budgetAlerts.map((item) => ({
      id: `orcamento-${item.id}`,
      type: "orcamento",
      severity: item.estado === "Estourado" ? "critico" : "atencao",
      label: `${item.icone ? `${item.icone} ` : ""}${item.nome}`,
      description: `${formatCurrency(item.total)} de ${formatCurrency(item.limite)} (${Math.round(item.percentual)}%)`,
    }));

    const veiculoAlerts = veiculos
      .filter((veiculo) => veiculo.alertaPendente)
      .map((veiculo) => ({
        id: `veiculo-${veiculo.id}`,
        type: "veiculo",
        severity: "atencao",
        label: veiculo.nome,
        description: "Revisão pendente por quilometragem",
      }));

    return [...orcamentoAlerts, ...veiculoAlerts].sort((a, b) =>
      a.severity === b.severity ? 0 : a.severity === "critico" ? -1 : 1,
    );
  }, [budgetAlerts, veiculos]);

  return { alerts, count: alerts.length };
};
