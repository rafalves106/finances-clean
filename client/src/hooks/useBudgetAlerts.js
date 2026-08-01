import { useCallback, useEffect, useState } from "react";
import {
  API_CATEGORIAS_ALERTAS_ORCAMENTO_URL,
  extractApiErrorMessage,
} from "../services/api";

export const useBudgetAlerts = ({ selectedMes, selectedAno }) => {
  const [budgetAlerts, setBudgetAlerts] = useState([]);
  const [budgetAlertsError, setBudgetAlertsError] = useState("");

  const loadBudgetAlerts = useCallback(async () => {
    if (!selectedMes || !selectedAno) {
      return;
    }

    try {
      setBudgetAlertsError("");

      const query = new URLSearchParams({
        mes: selectedMes,
        ano: selectedAno,
      });

      const response = await fetch(
        `${API_CATEGORIAS_ALERTAS_ORCAMENTO_URL}?${query}`,
        { method: "GET", credentials: "include" },
      );

      if (!response.ok) {
        const message = await extractApiErrorMessage(
          response,
          "Não foi possível carregar os alertas de orçamento.",
        );
        setBudgetAlertsError(message);
        setBudgetAlerts([]);
        return;
      }

      const data = await response.json();
      const categorias = Array.isArray(data?.categorias) ? data.categorias : [];

      setBudgetAlerts(
        categorias
          .filter((item) => item.estadoAlerta !== "Normal")
          .map((item) => ({
            id: item.categoriaId,
            nome: item.nome,
            icone: item.icone,
            cor: item.cor,
            limite: Number(item.orcamentoMensal || 0),
            total: Number(item.totalDespesasMesAtual || 0),
            percentual: Number(item.percentualConsumo || 0),
            estado: item.estadoAlerta,
          })),
      );
    } catch (error) {
      console.error("Erro ao buscar alertas de orçamento:", error);
      setBudgetAlertsError("Erro ao carregar alertas de orçamento.");
      setBudgetAlerts([]);
    }
  }, [selectedMes, selectedAno]);

  useEffect(() => {
    // Busca de dados sincronizada com selectedMes/selectedAno (padrão valido
    // de useEffect segundo a doc do React). react-hooks/set-state-in-effect
    // so nao acusa isso em useCardSummaries por acaso (o load de la tem uma
    // segunda chamada fora de efeito); aqui o load e so disparado no mount/
    // troca de mes, entao o lint nao reconhece o padrao.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadBudgetAlerts();
  }, [loadBudgetAlerts]);

  return { budgetAlerts, budgetAlertsError, loadBudgetAlerts };
};
