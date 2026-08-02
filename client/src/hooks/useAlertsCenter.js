import { useMemo } from "react";
import { formatCurrency } from "../util/formatCurrency";

const formatMonthYear = (isoDate) => {
  const date = new Date(isoDate);
  const mes = String(date.getMonth() + 1).padStart(2, "0");
  return `${mes}/${date.getFullYear()}`;
};

export const useAlertsCenter = ({
  budgetAlerts = [],
  veiculos = [],
  recurringGroups = [],
  onRenewRecurringGroup = () => {},
}) => {
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

    const recorrenciaAlerts = recurringGroups.map((grupo) => ({
      id: `recorrencia-${grupo.grupoRecorrenciaId}`,
      type: "recorrencia",
      severity: "atencao",
      label: grupo.titulo,
      description: `Última parcela gerada em ${formatMonthYear(grupo.ultimaData)}`,
      action: {
        label: "Renovar +12 meses",
        onClick: () => onRenewRecurringGroup(grupo.grupoRecorrenciaId),
      },
    }));

    return [...orcamentoAlerts, ...veiculoAlerts, ...recorrenciaAlerts].sort(
      (a, b) => (a.severity === b.severity ? 0 : a.severity === "critico" ? -1 : 1),
    );
  }, [budgetAlerts, veiculos, recurringGroups, onRenewRecurringGroup]);

  return { alerts, count: alerts.length };
};
