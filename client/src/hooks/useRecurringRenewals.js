import { useCallback, useEffect, useState } from "react";
import { API_URL, extractApiErrorMessage } from "../services/api";

export const useRecurringRenewals = ({ enabled = true } = {}) => {
  const [expiredGroups, setExpiredGroups] = useState([]);

  const loadExpiredGroups = useCallback(async () => {
    if (!enabled) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/grupos/expirados`, {
        method: "GET",
      });

      if (!response.ok) {
        setExpiredGroups([]);
        return;
      }

      const data = await response.json();

      setExpiredGroups(
        (Array.isArray(data) ? data : []).map((item) => ({
          grupoRecorrenciaId: item.grupoRecorrenciaId,
          titulo: item.titulo,
          ultimaData: item.ultimaData,
        })),
      );
    } catch (error) {
      console.error("Erro ao buscar grupos de recorrência expirados:", error);
      setExpiredGroups([]);
    }
  }, [enabled]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadExpiredGroups();
  }, [loadExpiredGroups]);

  const renovarGrupo = useCallback(
    async (grupoRecorrenciaId, meses) => {
      try {
        const response = await fetch(
          `${API_URL}/grupos/${grupoRecorrenciaId}/renovar`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ meses }),
          },
        );

        if (!response.ok) {
          const message = await extractApiErrorMessage(
            response,
            "Não foi possível renovar a recorrência.",
          );
          return { ok: false, message };
        }

        await loadExpiredGroups();
        return { ok: true };
      } catch (error) {
        console.error("Erro ao renovar grupo de recorrência:", error);
        return { ok: false, message: "Erro ao renovar recorrência." };
      }
    },
    [loadExpiredGroups],
  );

  return { expiredGroups, renovarGrupo };
};
