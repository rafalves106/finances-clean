import { useState } from "react";
import { API_URL, extractApiErrorMessage } from "../services/api";

export const useTransactionActions = ({
  categorias,
  fetchData,
  loadCardSummaries,
  simulatedTransactions,
  setSimulatedTransactions,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSimulationModalOpen, setIsSimulationModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [openCardPurchaseMode, setOpenCardPurchaseMode] = useState(false);

  const handleOpenSimulation = () => {
    setIsSimulationModalOpen(true);
  };

  const handleOpenNewTransaction = () => {
    setEditingItem(null);
    setOpenCardPurchaseMode(false);
    setIsModalOpen(true);
  };

  const handleOpenEditTransaction = (transaction) => {
    setEditingItem(transaction);
    setOpenCardPurchaseMode(false);
    setIsModalOpen(true);
  };

  const handleDeleteTransaction = async (transaction) => {
    const transactionId = transaction?.id;
    if (!transactionId) {
      return;
    }

    const title = transaction.name || transaction.titulo || "esta transação";
    if (!window.confirm(`Deseja excluir ${title}?`)) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/${transactionId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        const message = await extractApiErrorMessage(
          response,
          "Não foi possível excluir a transação.",
        );
        alert(message);
        return;
      }

      await fetchData();
      await loadCardSummaries();
    } catch (error) {
      console.error("Erro ao excluir transação:", error);
      alert("Erro ao excluir transação. Verifique o console.");
    }
  };

  const handleSimulate = (formData) => {
    const categoria =
      categorias.find((item) => item.id === formData.categoryId) || null;

    setSimulatedTransactions((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        name: formData.name,
        description: formData.description,
        value: Number(formData.value),
        type: formData.tipo,
        date: new Date(`${formData.date}T12:00:00Z`).toISOString(),
        categoria,
        categoriaId: formData.categoryId || null,
        veiculoId: formData.veiculoId || null,
        km: formData.km ? Number(formData.km) : null,
        isSimulated: true,
      },
    ]);

    setIsSimulationModalOpen(false);
  };

  const handleApplySimulation = async () => {
    if (simulatedTransactions.length === 0) return;

    try {
      for (const item of simulatedTransactions) {
        const payload = {
          titulo: item.name,
          descricao: item.description,
          valor: item.value,
          tipo: item.type,
          data: item.date,
          fixa: false,
          periodo: 0,
          tipoRecorrencia: "Mensal",
          tipoMovimentacaoFixa: "RecorrenteFixa",
          categoriaId: item.categoriaId || null,
          veiculoId: item.veiculoId || null,
          km: item.km || null,
        };

        await fetch("/api/v1/movimentacoes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        });
      }
      setSimulatedTransactions([]);
      await fetchData();
      await loadCardSummaries();
    } catch (error) {
      console.error("Erro ao aplicar simulação:", error);
      alert("Erro ao aplicar as transações simuladas. Verifique o console.");
    }
  };

  return {
    isModalOpen,
    setIsModalOpen,
    isSimulationModalOpen,
    setIsSimulationModalOpen,
    editingItem,
    openCardPurchaseMode,
    setOpenCardPurchaseMode,
    simulatedTransactions,
    handleOpenSimulation,
    handleOpenNewTransaction,
    handleOpenEditTransaction,
    handleDeleteTransaction,
    handleSimulate,
    handleApplySimulation,
  };
};
