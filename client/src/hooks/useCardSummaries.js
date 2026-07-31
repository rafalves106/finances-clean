import { useCallback, useEffect, useMemo, useState } from "react";
import { API_CARTAO_URL, extractApiErrorMessage } from "../services/api";
import { sortByDate } from "../util/dashboardFormatters";
import {
  DEFAULT_CARD_THEME,
  getThemePalette,
  normalizeCardTheme,
} from "../util/cardTheme";

export const useCardSummaries = ({ allTransactions, selectedMes, selectedAno }) => {
  const [cardSummaries, setCardSummaries] = useState([]);
  const [isCardSummaryLoading, setIsCardSummaryLoading] = useState(false);
  const [cardSummaryError, setCardSummaryError] = useState("");
  const [openCardFormId, setOpenCardFormId] = useState(null);
  const [cardFormById, setCardFormById] = useState({});
  const [cardFormStatusById, setCardFormStatusById] = useState({});
  const [isSavingCardById, setIsSavingCardById] = useState({});
  const [newCardFormBySlot, setNewCardFormBySlot] = useState({});
  const [newCardStatusBySlot, setNewCardStatusBySlot] = useState({});
  const [isCreatingCardBySlot, setIsCreatingCardBySlot] = useState({});

  const loadCardSummaries = useCallback(async () => {
    try {
      setIsCardSummaryLoading(true);
      setCardSummaryError("");

      const query =
        selectedMes && selectedAno
          ? `?${new URLSearchParams({ mes: selectedMes, ano: selectedAno })}`
          : "";

      const multiResponse = await fetch(`${API_CARTAO_URL}/resumos${query}`, {
        method: "GET",
        credentials: "include",
      });

      if (multiResponse.ok) {
        const multiData = await multiResponse.json();
        const summaries = Array.isArray(multiData)
          ? multiData
          : Array.isArray(multiData?.resumos)
            ? multiData.resumos
            : Array.isArray(multiData?.data)
              ? multiData.data
              : [];

        const validSummaries = summaries.filter((item) => item?.cartao);

        if (validSummaries.length > 0) {
          setCardSummaries(validSummaries.slice(0, 3));
          return;
        }

        setCardSummaries([]);
        return;
      }

      if (multiResponse.status !== 404 && multiResponse.status !== 405) {
        const message = await extractApiErrorMessage(
          multiResponse,
          "Não foi possível carregar o resumo do cartão.",
        );
        setCardSummaryError(message);
        setCardSummaries([]);
        return;
      }

      const response = await fetch(`${API_CARTAO_URL}/resumo${query}`, {
        method: "GET",
        credentials: "include",
      });

      if (response.status === 404) {
        setCardSummaries([]);
        return;
      }

      if (!response.ok) {
        const message = await extractApiErrorMessage(
          response,
          "Não foi possível carregar o resumo do cartão.",
        );
        setCardSummaryError(message);
        setCardSummaries([]);
        return;
      }

      const data = await response.json();
      if (data?.cartao) {
        setCardSummaries([data]);
      } else {
        setCardSummaries([]);
      }
    } catch (error) {
      console.error("Erro ao buscar resumo de cartão:", error);
      setCardSummaryError("Erro ao carregar resumo do cartão.");
      setCardSummaries([]);
    } finally {
      setIsCardSummaryLoading(false);
    }
  }, [selectedMes, selectedAno]);

  useEffect(() => {
    loadCardSummaries();
  }, [loadCardSummaries]);

  useEffect(() => {
    setCardFormById((current) => {
      const next = { ...current };

      cardSummaries.forEach((summary) => {
        const card = summary?.cartao;
        if (!card?.id) {
          return;
        }

        const cardId = String(card.id);
        if (next[cardId]) {
          return;
        }

        next[cardId] = {
          nome: card.nome || "",
          limiteTotal: String(card.limiteTotal ?? ""),
          diaFechamento: String(card.diaFechamento ?? ""),
          diaVencimento: String(card.diaVencimento ?? ""),
          corTema: normalizeCardTheme(card.corTema),
        };
      });

      return next;
    });
  }, [cardSummaries]);

  const cardTransactionsById = useMemo(() => {
    const grouped = new Map();

    sortByDate(allTransactions).forEach((item) => {
      if (!item?.cartaoId) {
        return;
      }

      const key = String(item.cartaoId);
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }

      grouped.get(key).push(item);
    });

    return grouped;
  }, [allTransactions]);

  const cardColumns = useMemo(
    () => Array.from({ length: 3 }, (_, index) => cardSummaries[index] || null),
    [cardSummaries],
  );

  const cardSummary = cardSummaries[0] || null;
  const backCardSummaries = cardSummaries.slice(1, 3);
  const activeCardTheme = normalizeCardTheme(cardSummary?.cartao?.corTema);
  const activeCardPalette = getThemePalette(activeCardTheme);
  const cardLimitTotal = Number(cardSummary?.cartao?.limiteTotal || 0);
  // Uso da fatura vem sempre do backend (ObterPrevisaoFatura), que soma por
  // CompetenciaFatura e cobre corretamente ciclos que cruzam o mes calendario.
  const cardLimitUsed = Number(cardSummary?.limite?.utilizado || 0);

  const cardUsagePercent =
    cardLimitTotal > 0
      ? Math.min(100, Math.max(0, (cardLimitUsed / cardLimitTotal) * 100))
      : 0;

  const handleBringCardToFront = (cardIndex) => {
    setCardSummaries((current) => {
      if (cardIndex <= 0 || cardIndex >= current.length) {
        return current;
      }

      const selected = current[cardIndex];
      return [selected, ...current.filter((_, index) => index !== cardIndex)];
    });
  };

  const handleCardFormChange = (cardId, field, value) => {
    setCardFormById((current) => ({
      ...current,
      [cardId]: {
        ...(current[cardId] || {}),
        [field]: value,
      },
    }));
  };

  const handleCardFormSubmit = async (event, cardId) => {
    event.preventDefault();

    const values = cardFormById[cardId];
    if (!values) {
      return;
    }

    const payload = {
      nome: values.nome?.trim() || "",
      limiteTotal: Number(values.limiteTotal || 0),
      diaFechamento: Number(values.diaFechamento || 0),
      diaVencimento: Number(values.diaVencimento || 0),
      corTema: values.corTema || DEFAULT_CARD_THEME,
    };

    try {
      setIsSavingCardById((current) => ({ ...current, [cardId]: true }));
      setCardFormStatusById((current) => ({ ...current, [cardId]: "" }));

      const response = await fetch(`${API_CARTAO_URL}/${cardId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const message = await extractApiErrorMessage(
          response,
          "Não foi possível salvar o cartão.",
        );
        setCardFormStatusById((current) => ({ ...current, [cardId]: message }));
        return;
      }

      setCardSummaries((current) =>
        current.map((summary) => {
          if (String(summary?.cartao?.id) !== cardId) {
            return summary;
          }

          return {
            ...summary,
            cartao: {
              ...summary.cartao,
              nome: payload.nome,
              limiteTotal: payload.limiteTotal,
              diaFechamento: payload.diaFechamento,
              diaVencimento: payload.diaVencimento,
              corTema: payload.corTema,
            },
          };
        }),
      );

      setCardFormStatusById((current) => ({
        ...current,
        [cardId]: "Cartão atualizado com sucesso.",
      }));
    } catch (error) {
      console.error("Error saving card:", error);
      setCardFormStatusById((current) => ({
        ...current,
        [cardId]: "Erro ao salvar cartão.",
      }));
    } finally {
      setIsSavingCardById((current) => ({ ...current, [cardId]: false }));
    }
  };

  const getInitialCardCreateForm = (slotIndex) => ({
    nome: `Cartão ${slotIndex + 1}`,
    limiteTotal: "",
    diaFechamento: "",
    diaVencimento: "",
    corTema: DEFAULT_CARD_THEME,
  });

  const handleCreateCardFormChange = (slotIndex, field, value) => {
    const slotKey = String(slotIndex);
    setNewCardFormBySlot((current) => ({
      ...current,
      [slotKey]: {
        ...(current[slotKey] || getInitialCardCreateForm(slotIndex)),
        [field]: value,
      },
    }));
  };

  const handleCreateCardFormSubmit = async (event, slotIndex) => {
    event.preventDefault();

    const slotKey = String(slotIndex);
    const values =
      newCardFormBySlot[slotKey] || getInitialCardCreateForm(slotIndex);

    const payload = {
      nome: values.nome?.trim() || "",
      limiteTotal: Number(values.limiteTotal || 0),
      diaFechamento: Number(values.diaFechamento || 0),
      diaVencimento: Number(values.diaVencimento || 0),
      corTema: values.corTema || DEFAULT_CARD_THEME,
    };

    try {
      setIsCreatingCardBySlot((current) => ({ ...current, [slotKey]: true }));
      setNewCardStatusBySlot((current) => ({ ...current, [slotKey]: "" }));

      const response = await fetch(API_CARTAO_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const message = await extractApiErrorMessage(
          response,
          "Não foi possível criar o cartão.",
        );
        setNewCardStatusBySlot((current) => ({
          ...current,
          [slotKey]: message,
        }));
        return;
      }

      await loadCardSummaries();
      setOpenCardFormId(null);
      setNewCardFormBySlot((current) => {
        const next = { ...current };
        delete next[slotKey];
        return next;
      });
      setNewCardStatusBySlot((current) => ({
        ...current,
        [slotKey]: "Cartão criado com sucesso.",
      }));
    } catch (error) {
      console.error("Error creating card:", error);
      setNewCardStatusBySlot((current) => ({
        ...current,
        [slotKey]: "Erro ao criar cartão.",
      }));
    } finally {
      setIsCreatingCardBySlot((current) => ({ ...current, [slotKey]: false }));
    }
  };

  return {
    cardSummaries,
    isCardSummaryLoading,
    cardSummaryError,
    loadCardSummaries,
    openCardFormId,
    setOpenCardFormId,
    cardFormById,
    cardFormStatusById,
    isSavingCardById,
    newCardFormBySlot,
    setNewCardFormBySlot,
    newCardStatusBySlot,
    isCreatingCardBySlot,
    cardTransactionsById,
    cardColumns,
    cardSummary,
    backCardSummaries,
    activeCardTheme,
    activeCardPalette,
    cardLimitTotal,
    cardLimitUsed,
    cardUsagePercent,
    handleBringCardToFront,
    handleCardFormChange,
    handleCardFormSubmit,
    getInitialCardCreateForm,
    handleCreateCardFormChange,
    handleCreateCardFormSubmit,
  };
};
