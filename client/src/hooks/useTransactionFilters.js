import { useMemo, useState } from "react";
import { sortByDate } from "../util/dashboardFormatters";

export const useTransactionFilters = ({ allTransactions }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("todas");
  const [slideTransactionSearch, setSlideTransactionSearch] = useState("");
  const [slideTransactionFilter, setSlideTransactionFilter] =
    useState("todas");

  const filteredTransactions = useMemo(() => {
    const normalized = searchTerm.trim().toLowerCase();
    return allTransactions.filter((item) => {
      const isMatchFilter =
        filterType === "todas" ||
        (filterType === "entradas" && (item.type || item.tipo) === "Entrada") ||
        (filterType === "saidas" && (item.type || item.tipo) === "Saida") ||
        (filterType === "simuladas" && item.isSimulated);

      if (!isMatchFilter) return false;
      if (!normalized) return true;

      const title = (item.name || item.titulo || "").toLowerCase();
      const description = (
        item.description ||
        item.descricao ||
        ""
      ).toLowerCase();
      const category = (item.categoria?.nome || "").toLowerCase();

      return (
        title.includes(normalized) ||
        description.includes(normalized) ||
        category.includes(normalized)
      );
    });
  }, [allTransactions, filterType, searchTerm]);

  const sortedMovimentacoes = useMemo(
    () => sortByDate(filteredTransactions).slice(0, 5),
    [filteredTransactions],
  );

  const slideTransactions = useMemo(() => {
    const normalized = slideTransactionSearch.trim().toLowerCase();

    return sortByDate(allTransactions)
      .filter((item) => !item.isSimulated)
      .filter((item) => {
        const itemType = item.type || item.tipo;
        const byType =
          slideTransactionFilter === "todas" ||
          (slideTransactionFilter === "entradas" && itemType === "Entrada") ||
          (slideTransactionFilter === "saidas" && itemType === "Saida");

        if (!byType) {
          return false;
        }

        if (!normalized) {
          return true;
        }

        const title = String(item.name || item.titulo || "").toLowerCase();
        const description = String(
          item.description || item.descricao || "",
        ).toLowerCase();
        const category = String(item.categoria?.nome || "").toLowerCase();

        return (
          title.includes(normalized) ||
          description.includes(normalized) ||
          category.includes(normalized)
        );
      });
  }, [allTransactions, slideTransactionFilter, slideTransactionSearch]);

  return {
    searchTerm,
    setSearchTerm,
    filterType,
    setFilterType,
    filteredTransactions,
    sortedMovimentacoes,
    slideTransactionSearch,
    setSlideTransactionSearch,
    slideTransactionFilter,
    setSlideTransactionFilter,
    slideTransactions,
  };
};
