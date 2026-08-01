import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  ChevronDown,
  ChevronUp,
  CreditCard,
  Home,
  PieChart,
  Plus,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Cell,
  Pie,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  PieChart as RechartsPieChart,
} from "recharts";

import {
  API_CARTAO_URL,
  API_URL,
  extractApiErrorMessage,
} from "../services/api";
import { formatCurrency } from "../util/formatCurrency";
import { useDashboardFinancials } from "../hooks/useDashboardFinancials";
import { useBudgetAlerts } from "../hooks/useBudgetAlerts";
import { useKeyboardShortcuts } from "../hooks/useKeyboardShortcuts";
import TransactionModal from "./TransactionModal";
import InvestmentsView from "./InvestmentsView";

const sortByDate = (list) =>
  [...list].sort(
    (a, b) => new Date(b.date || b.data) - new Date(a.date || a.data),
  );

const formatDateLabel = (dateInput) => {
  const date = new Date(dateInput);
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
  });
};

const CHART_COLORS = ["#3b82f6", "#06b6d4", "#10b981", "#f59e0b", "#ef4444"];
const MOBILE_SCREEN_LABELS = {
  home: "Home",
  charts: "Gráficos",
  cards: "Cartões",
  investments: "Investimentos",
};

const DashboardMobileView = ({
  totalInvestmentsBalance = 0,
  investmentAmount = 0,
  incomes = [],
  expenses = [],
  investments = [],
  selectedMes,
  selectedAno,
  onChangeMonth,
  categorias = [],
  veiculos = [],
  fetchData,
  saldoAnterior = 0,
  onOpenCategoryManager,
}) => {
  const [activeScreen, setActiveScreen] = useState("home");
  const [viewportWidth, setViewportWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 390,
  );
  const [cardSummaries, setCardSummaries] = useState([]);
  const [cardSummaryError, setCardSummaryError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [openCardPurchaseMode, setOpenCardPurchaseMode] = useState(false);
  const [expandedCardId, setExpandedCardId] = useState(null);
  const [chartsTab, setChartsTab] = useState("fluxo");
  const [expandedTransactionId, setExpandedTransactionId] = useState(null);
  const [transactionCategoryFilter, setTransactionCategoryFilter] =
    useState(null);
  const [pendingDeleteIds, setPendingDeleteIds] = useState(new Set());
  const pendingDeleteTimersRef = useRef(new Map());

  useEffect(() => {
    const timers = pendingDeleteTimersRef.current;
    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, []);

  const mobileTier =
    viewportWidth >= 412 ? "lg" : viewportWidth >= 390 ? "md" : "sm";
  const tokens =
    mobileTier === "lg"
      ? {
          shellPadding: 14,
          sectionGap: 12,
          cardPadding: 14,
          cardRadius: 18,
          bottomNavHeight: 72,
          headerHeight: 60,
          chartMinHeight: 240,
          kpiHelperClassName: "text-xs",
        }
      : mobileTier === "md"
        ? {
            shellPadding: 12,
            sectionGap: 10,
            cardPadding: 12,
            cardRadius: 16,
            bottomNavHeight: 68,
            headerHeight: 58,
            chartMinHeight: 210,
            kpiHelperClassName: "text-xs",
          }
        : {
            shellPadding: 10,
            sectionGap: 8,
            cardPadding: 10,
            cardRadius: 14,
            bottomNavHeight: 64,
            headerHeight: 56,
            chartMinHeight: 180,
            kpiHelperClassName: "text-[11px]",
          };

  const {
    shellPadding,
    sectionGap,
    cardPadding,
    cardRadius,
    bottomNavHeight,
    headerHeight,
    chartMinHeight,
    kpiHelperClassName,
  } = tokens;

  const loadCardSummaries = useCallback(async () => {
    try {
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
    }
  }, [selectedMes, selectedAno]);

  useEffect(() => {
    const onResize = () => {
      setViewportWidth(window.innerWidth);
    };

    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadCardSummaries();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadCardSummaries, selectedAno, selectedMes]);

  const allTransactions = useMemo(
    () => sortByDate([...incomes, ...expenses]),
    [expenses, incomes],
  );

  const {
    slideCategoryRanking: categoryRanking,
    categoryComparisonData,
    currentMonthShortLabel,
    previousMonthShortLabel,
  } = useDashboardFinancials({
    allTransactions,
    incomes,
    expenses,
    categorias,
    selectedMes,
    selectedAno,
    saldoAnterior,
  });

  const { budgetAlerts } = useBudgetAlerts({ selectedMes, selectedAno });

  const totalIncome = useMemo(
    () => incomes.reduce((acc, item) => acc + Number(item.value || 0), 0),
    [incomes],
  );

  const totalExpenses = useMemo(
    () => expenses.reduce((acc, item) => acc + Number(item.value || 0), 0),
    [expenses],
  );

  const finalBalance = saldoAnterior + totalIncome - totalExpenses;

  const upcomingItems = useMemo(() => {
    const startToday = new Date();
    startToday.setHours(0, 0, 0, 0);

    return [...allTransactions]
      .filter((item) => {
        const date = new Date(item.date || item.data);
        return !Number.isNaN(date.getTime()) && date >= startToday;
      })
      .sort((a, b) => new Date(a.date || a.data) - new Date(b.date || b.data))
      .slice(0, 3);
  }, [allTransactions]);

  const categoriesTop = useMemo(() => {
    const byCategory = new Map();

    expenses.forEach((item) => {
      const key = String(item.categoriaId || item.categoria?.id || "sem");
      const current = byCategory.get(key) || {
        id: key,
        nome: item.categoria?.nome || "Sem categoria",
        icone: item.categoria?.icone || "",
        total: 0,
      };

      current.total += Number(item.value || 0);
      byCategory.set(key, current);
    });

    return Array.from(byCategory.values())
      .sort((a, b) => b.total - a.total)
      .slice(0, 4);
  }, [expenses]);

  const listedTransactions = useMemo(() => {
    return allTransactions.filter((item) => {
      if (pendingDeleteIds.has(item.id)) {
        return false;
      }

      if (!transactionCategoryFilter) {
        return true;
      }

      const itemCategoryId = String(
        item.categoriaId || item.categoria?.id || "sem",
      );
      return itemCategoryId === transactionCategoryFilter;
    });
  }, [allTransactions, pendingDeleteIds, transactionCategoryFilter]);

  const pendingDeleteItems = useMemo(
    () => allTransactions.filter((item) => pendingDeleteIds.has(item.id)),
    [allTransactions, pendingDeleteIds],
  );

  const chartSeriesData = useMemo(() => {
    const keyToData = new Map();

    [...incomes, ...expenses].forEach((item) => {
      const rawDate = item.date || item.data;
      if (!rawDate) {
        return;
      }

      const date = new Date(rawDate);
      if (Number.isNaN(date.getTime())) {
        return;
      }

      const day = String(date.getDate()).padStart(2, "0");
      const current = keyToData.get(day) || {
        day,
        entrada: 0,
        saida: 0,
      };

      const value = Number(item.value || item.valor || 0);
      const itemType = item.type || item.tipo;

      if (itemType === "Entrada") {
        current.entrada += value;
      } else {
        current.saida += value;
      }

      keyToData.set(day, current);
    });

    const sorted = Array.from(keyToData.values()).sort(
      (a, b) => Number(a.day) - Number(b.day),
    );

    return sorted.map((item, index) => {
      const saldo =
        saldoAnterior +
        sorted
          .slice(0, index + 1)
          .reduce((acc, row) => acc + row.entrada - row.saida, 0);

      return {
        ...item,
        saldo,
      };
    });
  }, [expenses, incomes, saldoAnterior]);

  const categorySpendChartData = useMemo(() => {
    const byCategory = new Map();

    expenses.forEach((item) => {
      const key = String(item.categoriaId || item.categoria?.id || "sem");
      const current = byCategory.get(key) || {
        id: key,
        nome: item.categoria?.nome || "Sem categoria",
        total: 0,
      };

      current.total += Number(item.value || 0);
      byCategory.set(key, current);
    });

    return Array.from(byCategory.values())
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [expenses]);

  const activeCardSummary = cardSummaries[0] || null;
  const activeCardName = activeCardSummary?.cartao?.nome || "Sem cartão ativo";
  const activeCardLimit = Number(activeCardSummary?.cartao?.limiteTotal || 0);
  const activeCardUsed = Number(activeCardSummary?.limite?.utilizado || 0);

  const handlePreviousMonth = () => {
    const previousDate = new Date(selectedAno, selectedMes - 2, 1);
    onChangeMonth(previousDate.getMonth() + 1, previousDate.getFullYear());
  };

  const handleNextMonth = () => {
    const nextDate = new Date(selectedAno, selectedMes, 1);
    onChangeMonth(nextDate.getMonth() + 1, nextDate.getFullYear());
  };

  const currentMonthLabel = new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
  }).format(new Date(selectedAno, selectedMes - 1, 1));

  const handleOpenNewTransaction = () => {
    setEditingItem(null);
    setOpenCardPurchaseMode(false);
    setIsModalOpen(true);
  };

  useKeyboardShortcuts({
    onNewTransaction: handleOpenNewTransaction,
    onPreviousMonth: handlePreviousMonth,
    onNextMonth: handleNextMonth,
  });

  const handleOpenEditTransaction = (transaction) => {
    setEditingItem(transaction);
    setOpenCardPurchaseMode(false);
    setIsModalOpen(true);
  };

  const DELETE_UNDO_WINDOW_MS = 5000;

  const executeDelete = async (transactionId) => {
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
        setPendingDeleteIds((current) => {
          const next = new Set(current);
          next.delete(transactionId);
          return next;
        });
        return;
      }

      await fetchData?.({ silent: true });
    } catch (error) {
      console.error("Erro ao excluir transação:", error);
      alert("Erro ao excluir transação. Verifique o console.");
    } finally {
      pendingDeleteTimersRef.current.delete(transactionId);
    }
  };

  // ponytail: exclusao via toque + desfazer em vez de swipe fisico, mais
  // seguro pra evitar exclusao acidental num app financeiro; swipe real
  // pode entrar depois com uma lib de gesto se fizer falta.
  const handleDeleteTransaction = (transaction) => {
    const transactionId = transaction?.id;
    if (!transactionId) {
      return;
    }

    setPendingDeleteIds((current) => new Set(current).add(transactionId));

    const timer = window.setTimeout(() => {
      executeDelete(transactionId);
    }, DELETE_UNDO_WINDOW_MS);

    pendingDeleteTimersRef.current.set(transactionId, timer);
  };

  const handleUndoDelete = (transactionId) => {
    const timer = pendingDeleteTimersRef.current.get(transactionId);
    if (timer) {
      window.clearTimeout(timer);
      pendingDeleteTimersRef.current.delete(transactionId);
    }

    setPendingDeleteIds((current) => {
      const next = new Set(current);
      next.delete(transactionId);
      return next;
    });
  };

  const screenMinHeight = `calc(100dvh - ${headerHeight}px - ${bottomNavHeight}px - env(safe-area-inset-top) - env(safe-area-inset-bottom))`;

  const renderHomeScreen = () => (
    <div className="flex flex-col" style={{ gap: `${sectionGap}px` }}>
      <section
        style={{
          borderRadius: `${cardRadius}px`,
          padding: `${cardPadding}px`,
          background: "var(--bg-surface)",
          border: "1px solid var(--border-default)",
          boxShadow: "var(--shadow-sm)",
        }}
      >
        <p
          className="text-[11px] uppercase tracking-wide m-0"
          style={{ color: "var(--text-tertiary)" }}
        >
          Saldo atual
        </p>
        <p
          className="text-[26px] font-semibold m-0 mt-1"
          style={{ color: "var(--text-primary)" }}
        >
          {formatCurrency(finalBalance)}
        </p>
        <p
          className={`m-0 mt-1 ${kpiHelperClassName}`}
          style={{ color: "var(--text-secondary)" }}
        >
          Receitas {formatCurrency(totalIncome)} · Despesas{" "}
          {formatCurrency(totalExpenses)}
        </p>
      </section>

      <section className="grid grid-cols-3 gap-2">
        <article
          style={{
            borderRadius: `${cardRadius - 2}px`,
            padding: `${cardPadding - 2}px`,
            background: "var(--bg-surface)",
            border: "1px solid var(--border-default)",
            borderLeft: "3px solid var(--success-700)",
          }}
        >
          <p className="m-0 text-[11px]" style={{ color: "var(--text-tertiary)" }}>
            Receitas
          </p>
          <p
            className="m-0 mt-1 text-sm font-semibold"
            style={{ color: "var(--success-700)" }}
          >
            {formatCurrency(totalIncome)}
          </p>
        </article>
        <article
          style={{
            borderRadius: `${cardRadius - 2}px`,
            padding: `${cardPadding - 2}px`,
            background: "var(--bg-surface)",
            border: "1px solid var(--border-default)",
            borderLeft: "3px solid var(--danger-700)",
          }}
        >
          <p className="m-0 text-[11px]" style={{ color: "var(--text-tertiary)" }}>
            Despesas
          </p>
          <p
            className="m-0 mt-1 text-sm font-semibold"
            style={{ color: "var(--danger-700)" }}
          >
            {formatCurrency(totalExpenses)}
          </p>
        </article>
        <article
          style={{
            borderRadius: `${cardRadius - 2}px`,
            padding: `${cardPadding - 2}px`,
            background: "var(--bg-surface)",
            border: "1px solid var(--border-default)",
            borderLeft: "3px solid var(--accent-600)",
          }}
        >
          <p className="m-0 text-[11px]" style={{ color: "var(--text-tertiary)" }}>
            Investimentos
          </p>
          <p
            className="m-0 mt-1 text-sm font-semibold"
            style={{ color: "var(--accent-600)" }}
          >
            {formatCurrency(totalInvestmentsBalance)}
          </p>
          <p
            className="m-0 mt-0.5 text-[11px]"
            style={{ color: "var(--text-tertiary)" }}
          >
            {investments.length} ativos
          </p>
        </article>
      </section>

      <section
        style={{
          borderRadius: `${cardRadius}px`,
          padding: `${cardPadding}px`,
          background: "var(--bg-surface)",
          border: "1px solid var(--border-default)",
          boxShadow: "var(--shadow-xs)",
        }}
      >
        <p
          className="m-0 text-xs font-semibold"
          style={{ color: "var(--text-primary)" }}
        >
          Fatura de {currentMonthLabel}
        </p>
        <p className="m-0 mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
          {activeCardName}
        </p>
        <p
          className={`m-0 mt-1 ${kpiHelperClassName}`}
          style={{ color: "var(--text-tertiary)" }}
        >
          Limite {formatCurrency(activeCardLimit)} · Utilizado{" "}
          {formatCurrency(activeCardUsed)}
        </p>
        {cardSummaryError ? (
          <p
            className="m-0 mt-1 text-[11px]"
            style={{ color: "var(--danger-700)" }}
          >
            {cardSummaryError}
          </p>
        ) : null}
      </section>

      <section
        style={{
          borderRadius: `${cardRadius}px`,
          padding: `${cardPadding}px`,
          background: "var(--bg-surface)",
          border: "1px solid var(--border-default)",
          boxShadow: "var(--shadow-xs)",
        }}
      >
        <p
          className="m-0 text-xs font-semibold"
          style={{ color: "var(--text-primary)" }}
        >
          Próximos itens
        </p>
        <div className="mt-2 space-y-2">
          {upcomingItems.length === 0 ? (
            <p
              className={`m-0 ${kpiHelperClassName}`}
              style={{ color: "var(--text-tertiary)" }}
            >
              Sem próximas movimentações.
            </p>
          ) : (
            upcomingItems.map((item) => {
              const itemType = item.type || item.tipo;
              const isEntrada = itemType === "Entrada";
              return (
                <article
                  key={item.id}
                  className="flex items-center justify-between rounded-xl px-3 py-2"
                  style={{
                    background: "var(--bg-surface-sunken)",
                    border: "1px solid var(--border-subtle)",
                  }}
                >
                  <div>
                    <p
                      className="m-0 text-xs"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {item.name || item.titulo || "Movimentação"}
                    </p>
                    <p
                      className="m-0 text-[11px]"
                      style={{ color: "var(--text-tertiary)" }}
                    >
                      {formatDateLabel(item.date || item.data)}
                    </p>
                  </div>
                  <p
                    className="m-0 text-xs font-semibold"
                    style={{
                      color: isEntrada
                        ? "var(--success-700)"
                        : "var(--danger-700)",
                    }}
                  >
                    {isEntrada ? "+" : "-"}
                    {formatCurrency(item.value || item.valor || 0)}
                  </p>
                </article>
              );
            })
          )}
        </div>
      </section>

      <section
        style={{
          borderRadius: `${cardRadius}px`,
          padding: `${cardPadding}px`,
          background: "var(--bg-surface)",
          border: "1px solid var(--border-default)",
          boxShadow: "var(--shadow-xs)",
        }}
      >
        <p
          className="m-0 text-xs font-semibold"
          style={{ color: "var(--text-primary)" }}
        >
          Categorias
        </p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {categoriesTop.length === 0 ? (
            <p
              className={`m-0 ${kpiHelperClassName}`}
              style={{ color: "var(--text-tertiary)" }}
            >
              Sem categorias no período.
            </p>
          ) : (
            categoriesTop.map((category) => (
              <article
                key={category.id}
                className="rounded-xl px-2.5 py-2"
                style={{
                  background: "var(--bg-surface-sunken)",
                  border: "1px solid var(--border-subtle)",
                }}
              >
                <p
                  className="m-0 text-xs"
                  style={{ color: "var(--text-primary)" }}
                >
                  {category.icone ? `${category.icone} ` : ""}
                  {category.nome}
                </p>
                <p
                  className="m-0 mt-1 text-[11px]"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {formatCurrency(category.total)}
                </p>
              </article>
            ))
          )}
        </div>
      </section>

      <section
        style={{
          borderRadius: `${cardRadius}px`,
          padding: `${cardPadding}px`,
          background: "var(--bg-surface)",
          border: "1px solid var(--border-default)",
          boxShadow: "var(--shadow-xs)",
        }}
      >
        <p
          className="m-0 text-xs font-semibold"
          style={{ color: "var(--text-primary)" }}
        >
          Movimentações
        </p>

        {pendingDeleteItems.length > 0 && (
          <div className="mt-2 space-y-1.5">
            {pendingDeleteItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-xs"
                style={{
                  background: "var(--warning-100)",
                  border: "1px solid var(--warning-border)",
                  color: "var(--warning-700)",
                }}
              >
                <span>
                  {item.name || item.titulo || "Movimentação"} excluída
                </span>
                <button
                  type="button"
                  onClick={() => handleUndoDelete(item.id)}
                  className="font-semibold underline"
                >
                  Desfazer
                </button>
              </div>
            ))}
          </div>
        )}

        {categoriesTop.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => setTransactionCategoryFilter(null)}
              className="rounded-full px-3 py-1 text-[11px] font-semibold"
              style={{
                background: !transactionCategoryFilter
                  ? "var(--accent-600)"
                  : "var(--bg-surface-sunken)",
                color: !transactionCategoryFilter
                  ? "var(--text-on-accent)"
                  : "var(--text-secondary)",
              }}
            >
              Todas
            </button>
            {categoriesTop.map((categoria) => (
              <button
                key={categoria.id}
                type="button"
                onClick={() =>
                  setTransactionCategoryFilter((current) =>
                    current === categoria.id ? null : categoria.id,
                  )
                }
                className="rounded-full px-3 py-1 text-[11px] font-semibold"
                style={{
                  background:
                    transactionCategoryFilter === categoria.id
                      ? "var(--accent-600)"
                      : "var(--bg-surface-sunken)",
                  color:
                    transactionCategoryFilter === categoria.id
                      ? "var(--text-on-accent)"
                      : "var(--text-secondary)",
                }}
              >
                {categoria.nome}
              </button>
            ))}
          </div>
        )}

        <div className="mt-2 space-y-2">
          {listedTransactions.length === 0 ? (
            <p
              className={`m-0 ${kpiHelperClassName}`}
              style={{ color: "var(--text-tertiary)" }}
            >
              Sem movimentações cadastradas.
            </p>
          ) : (
            listedTransactions.map((item) => {
              const itemType = item.type || item.tipo;
              const isEntrada = itemType === "Entrada";
              const isExpanded = expandedTransactionId === item.id;
              return (
                <article
                  key={item.id}
                  className="rounded-xl px-3 py-2"
                  style={{
                    background: "var(--bg-surface-sunken)",
                    border: "1px solid var(--border-subtle)",
                  }}
                >
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedTransactionId((current) =>
                        current === item.id ? null : item.id,
                      )
                    }
                    className="flex w-full items-center justify-between gap-2 text-left"
                  >
                    <div className="flex items-center gap-2">
                      <span style={{ color: "var(--text-tertiary)" }}>
                        {isEntrada ? (
                          <ArrowUpRight size={14} />
                        ) : (
                          <ArrowDownRight size={14} />
                        )}
                      </span>
                      <div>
                        <p
                          className="m-0 text-xs"
                          style={{ color: "var(--text-primary)" }}
                        >
                          {item.name || item.titulo || "Movimentação"}
                        </p>
                        <p
                          className="m-0 text-[11px]"
                          style={{ color: "var(--text-tertiary)" }}
                        >
                          {formatDateLabel(item.date || item.data)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <p
                        className="m-0 text-xs font-semibold whitespace-nowrap"
                        style={{
                          color: isEntrada
                            ? "var(--success-700)"
                            : "var(--danger-700)",
                        }}
                      >
                        {isEntrada ? "+" : "-"}
                        {formatCurrency(item.value || item.valor || 0)}
                      </p>
                      <ChevronDown
                        size={14}
                        style={{
                          color: "var(--text-tertiary)",
                          transform: isExpanded ? "rotate(180deg)" : "none",
                          transition: "transform 0.15s ease",
                        }}
                      />
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenEditTransaction(item)}
                        className="h-11 rounded-lg text-xs font-semibold"
                        style={{
                          border: "1px solid var(--accent-600)",
                          color: "var(--accent-600)",
                        }}
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteTransaction(item)}
                        className="h-11 rounded-lg text-xs font-semibold"
                        style={{
                          border: "1px solid var(--danger-border)",
                          color: "var(--danger-700)",
                        }}
                      >
                        Excluir
                      </button>
                    </div>
                  )}
                </article>
              );
            })
          )}
        </div>
      </section>
    </div>
  );

  const chartsTabs = [
    { id: "fluxo", label: "Fluxo" },
    { id: "categorias", label: "Categorias" },
    { id: "comparativo", label: "Comparativo" },
  ];

  const chartTooltipStyle = {
    background: "var(--bg-inverse)",
    border: "none",
    borderRadius: "10px",
    color: "#fff",
    fontSize: "12px",
  };

  const rankingMaxTotal = Math.max(
    1,
    ...categoryRanking.map((item) => Number(item.total || 0)),
  );

  const renderChartsScreen = () => (
    <div className="flex flex-col" style={{ gap: `${sectionGap}px` }}>
      <div
        className="grid grid-cols-3 gap-1 p-1 rounded-xl"
        style={{ background: "var(--bg-surface-sunken)" }}
        role="tablist"
        aria-label="Visualizações de análise"
      >
        {chartsTabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={chartsTab === tab.id}
            onClick={() => setChartsTab(tab.id)}
            className="h-9 rounded-lg text-xs font-semibold transition-colors"
            style={
              chartsTab === tab.id
                ? { background: "var(--bg-surface)", color: "var(--accent-600)", boxShadow: "var(--shadow-xs)" }
                : { color: "var(--text-tertiary)" }
            }
          >
            {tab.label}
          </button>
        ))}
      </div>

      {chartsTab === "fluxo" && (
        <section
          style={{
            borderRadius: `${cardRadius}px`,
            padding: `${cardPadding}px`,
            background: "var(--bg-surface)",
            border: "1px solid var(--border-default)",
          }}
        >
          <h2
            className="m-0 text-sm font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            Fluxo do mês
          </h2>
          <div style={{ height: `${chartMinHeight}px` }} className="mt-2">
            {chartSeriesData.length === 0 ? (
              <div
                className="h-full flex items-center justify-center text-xs"
                style={{ color: "var(--text-tertiary)" }}
              >
                Sem dados para o período.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartSeriesData}>
                  <XAxis dataKey="day" stroke="#767c93" fontSize={10} />
                  <YAxis stroke="#767c93" fontSize={10} width={36} />
                  <Tooltip
                    formatter={(value) => formatCurrency(Number(value || 0))}
                    contentStyle={chartTooltipStyle}
                  />
                  <Area
                    type="monotone"
                    dataKey="entrada"
                    stroke="#059669"
                    fill="rgba(5,150,105,0.18)"
                  />
                  <Area
                    type="monotone"
                    dataKey="saida"
                    stroke="#E11D48"
                    fill="rgba(225,29,72,0.14)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </section>
      )}

      {chartsTab === "categorias" && (
        <>
          <section
            style={{
              borderRadius: `${cardRadius}px`,
              padding: `${cardPadding}px`,
              background: "var(--bg-surface)",
              border: "1px solid var(--border-default)",
            }}
          >
            <div className="flex items-center justify-between gap-2">
              <h2
                className="m-0 text-sm font-semibold"
                style={{ color: "var(--text-primary)" }}
              >
                Despesas por categoria
              </h2>
              <button
                type="button"
                onClick={(event) => onOpenCategoryManager(event.currentTarget)}
                className="rounded-lg px-2.5 py-1 text-[11px] font-medium"
                style={{
                  border: "1px solid var(--border-default)",
                  color: "var(--text-tertiary)",
                }}
              >
                Gerenciar categorias
              </button>
            </div>
            <div style={{ height: `${chartMinHeight}px` }} className="mt-2">
              {categorySpendChartData.length === 0 ? (
                <div
                  className="h-full flex items-center justify-center text-xs"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  Sem dados para o período.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={categorySpendChartData}
                      dataKey="total"
                      nameKey="nome"
                      innerRadius={38}
                      outerRadius={72}
                      paddingAngle={3}
                    >
                      {categorySpendChartData.map((entry, index) => (
                        <Cell
                          key={entry.id}
                          fill={CHART_COLORS[index % CHART_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => formatCurrency(Number(value || 0))}
                      contentStyle={chartTooltipStyle}
                    />
                  </RechartsPieChart>
                </ResponsiveContainer>
              )}
            </div>
          </section>

          {budgetAlerts.length > 0 && (
            <section
              style={{
                borderRadius: `${cardRadius}px`,
                padding: `${cardPadding}px`,
                background: "var(--warning-100)",
                border: "1px solid var(--warning-700)",
              }}
            >
              <h2
                className="m-0 text-sm font-semibold"
                style={{ color: "var(--warning-700)" }}
              >
                Alertas de orçamento
              </h2>
              <div className="mt-2 space-y-1.5">
                {budgetAlerts.map((item) => {
                  const alertColor =
                    item.estado === "Estourado"
                      ? "var(--danger-700)"
                      : "var(--warning-700)";

                  return (
                    <div
                      key={item.id}
                      className="flex items-center justify-between text-xs"
                      style={{ color: alertColor }}
                    >
                      <span>
                        {item.icone ? `${item.icone} ` : ""}
                        {item.nome}
                      </span>
                      <span className="font-semibold">
                        {formatCurrency(item.total)} / {formatCurrency(item.limite)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          <section
            style={{
              borderRadius: `${cardRadius}px`,
              padding: `${cardPadding}px`,
              background: "var(--bg-surface)",
              border: "1px solid var(--border-default)",
            }}
          >
            <h2
              className="m-0 text-sm font-semibold"
              style={{ color: "var(--text-primary)" }}
            >
              Ranking de categorias
            </h2>
            <div className="mt-2 space-y-2">
              {categoryRanking.length === 0 ? (
                <p
                  className="m-0 text-xs"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  Sem categorias no período.
                </p>
              ) : (
                categoryRanking.map((item) => (
                  <div key={item.id}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span style={{ color: "var(--text-primary)" }}>
                        {item.icone ? `${item.icone} ` : ""}
                        {item.nome}
                      </span>
                      <span
                        className="font-semibold"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        {formatCurrency(item.total)}
                      </span>
                    </div>
                    <div
                      className="h-1.5 rounded-full overflow-hidden"
                      style={{ background: "var(--bg-surface-sunken)" }}
                    >
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.max(4, (Number(item.total || 0) / rankingMaxTotal) * 100)}%`,
                          background: "var(--accent-600)",
                        }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </>
      )}

      {chartsTab === "comparativo" && (
        <section
          style={{
            borderRadius: `${cardRadius}px`,
            padding: `${cardPadding}px`,
            background: "var(--bg-surface)",
            border: "1px solid var(--border-default)",
          }}
        >
          <h2
            className="m-0 text-sm font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            {currentMonthShortLabel} vs. {previousMonthShortLabel}
          </h2>
          <div className="mt-3 space-y-3">
            {categoryComparisonData.length === 0 ? (
              <p
                className="m-0 text-xs"
                style={{ color: "var(--text-tertiary)" }}
              >
                Sem dados para comparar no período.
              </p>
            ) : (
              categoryComparisonData.map((item) => {
                const maxValue = Math.max(
                  1,
                  item.currentTotal,
                  item.previousTotal,
                );
                return (
                  <div key={item.id}>
                    <p
                      className="m-0 text-xs font-medium mb-1"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {item.nome}
                    </p>
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className="text-[10px] w-14 shrink-0"
                        style={{ color: "var(--text-tertiary)" }}
                      >
                        {currentMonthShortLabel}
                      </span>
                      <div
                        className="h-2 flex-1 rounded-full overflow-hidden"
                        style={{ background: "var(--bg-surface-sunken)" }}
                      >
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${(item.currentTotal / maxValue) * 100}%`,
                            background: "var(--accent-600)",
                          }}
                        />
                      </div>
                      <span
                        className="text-[10px] w-16 shrink-0 text-right"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        {formatCurrency(item.currentTotal)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className="text-[10px] w-14 shrink-0"
                        style={{ color: "var(--text-tertiary)" }}
                      >
                        {previousMonthShortLabel}
                      </span>
                      <div
                        className="h-2 flex-1 rounded-full overflow-hidden"
                        style={{ background: "var(--bg-surface-sunken)" }}
                      >
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${(item.previousTotal / maxValue) * 100}%`,
                            background: "var(--border-strong)",
                          }}
                        />
                      </div>
                      <span
                        className="text-[10px] w-16 shrink-0 text-right"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        {formatCurrency(item.previousTotal)}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      )}
    </div>
  );

  const renderCardsScreen = () => (
    <div className="flex flex-col" style={{ gap: `${sectionGap}px` }}>
      <section
        style={{
          borderRadius: `${cardRadius}px`,
          padding: `${cardPadding}px`,
          background: "var(--bg-surface)",
          border: "1px solid var(--border-default)",
          boxShadow: "var(--shadow-xs)",
        }}
      >
        <div className="flex items-center justify-between mb-2">
          <h2
            className="m-0 text-sm font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            Cartões
          </h2>
          <p className="m-0 text-[11px]" style={{ color: "var(--text-tertiary)" }}>
            Deslize para o lado
          </p>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory">
          {(cardSummaries.length > 0 ? cardSummaries : [null]).map(
            (summary, index) => {
              const cardId = String(summary?.cartao?.id || `empty-${index}`);
              const cardName = summary?.cartao?.nome || "Sem cartão";
              const cardLimitTotal = Number(summary?.cartao?.limiteTotal || 0);
              const cardLimitUsed = Number(summary?.limite?.utilizado || 0);

              return (
                <article
                  key={cardId}
                  className="min-w-[280px] max-w-[300px] rounded-2xl p-3 snap-center"
                  style={{
                    border: "1px solid var(--border-default)",
                    background: "var(--bg-surface-sunken)",
                  }}
                >
                  <p
                    className="m-0 text-xs font-semibold"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {cardName}
                  </p>
                  <p
                    className="m-0 mt-1 text-[11px]"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    Limite {formatCurrency(cardLimitTotal)}
                  </p>
                  <p
                    className="m-0 mt-0.5 text-[11px]"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    Utilizado {formatCurrency(cardLimitUsed)}
                  </p>
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedCardId((current) =>
                        current === cardId ? null : cardId,
                      )
                    }
                    className="mt-3 h-11 w-full rounded-xl text-sm font-medium flex items-center justify-center gap-1"
                    style={{
                      border: "1px solid var(--border-default)",
                      color: "var(--text-primary)",
                    }}
                  >
                    Ações
                    {expandedCardId === cardId ? (
                      <ChevronUp size={14} />
                    ) : (
                      <ChevronDown size={14} />
                    )}
                  </button>
                  {expandedCardId === cardId ? (
                    <div
                      className="mt-2 space-y-2 rounded-xl p-2"
                      style={{
                        border: "1px solid var(--border-subtle)",
                        background: "var(--bg-surface)",
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setOpenCardPurchaseMode(true);
                          setIsModalOpen(true);
                        }}
                        className="h-11 w-full rounded-lg text-xs font-semibold"
                        style={{
                          border: "1px solid var(--success-border)",
                          color: "var(--success-700)",
                        }}
                      >
                        Nova compra no cartão
                      </button>
                      <p
                        className="m-0 text-[11px]"
                        style={{ color: "var(--text-tertiary)" }}
                      >
                        A compra será vinculada ao cartão ativo no lançamento.
                      </p>
                    </div>
                  ) : null}
                </article>
              );
            },
          )}
        </div>
      </section>
    </div>
  );

  const renderInvestmentsScreen = () => (
    <InvestmentsView
      investmentAmount={investmentAmount}
      investments={investments}
      fetchData={fetchData}
    />
  );

  const renderActiveScreen = () => {
    if (activeScreen === "home") {
      return renderHomeScreen();
    }

    if (activeScreen === "charts") {
      return renderChartsScreen();
    }

    if (activeScreen === "cards") {
      return renderCardsScreen();
    }

    return renderInvestmentsScreen();
  };

  const navButtonStyle = (isActive) =>
    isActive
      ? {
          color: "var(--accent-600)",
          background: "var(--accent-50)",
          border: "1px solid var(--accent-100)",
        }
      : {
          color: "var(--text-tertiary)",
          border: "1px solid transparent",
        };

  return (
    <div
      className="min-h-[100dvh] flex flex-col"
      style={{ background: "var(--bg-app)" }}
    >
      <header
        className="px-3 flex items-center justify-between"
        style={{
          height: `${headerHeight}px`,
          paddingTop: "max(8px, env(safe-area-inset-top))",
          background: "var(--bg-surface)",
          borderBottom: "1px solid var(--border-subtle)",
        }}
      >
        <button
          type="button"
          onClick={handlePreviousMonth}
          className="h-11 min-w-11 px-3 rounded-lg text-sm"
          style={{
            border: "1px solid var(--border-default)",
            color: "var(--text-secondary)",
          }}
        >
          Mes -
        </button>
        <p
          className="text-sm font-semibold capitalize"
          style={{ color: "var(--text-primary)" }}
        >
          {currentMonthLabel}
        </p>
        <button
          type="button"
          onClick={handleNextMonth}
          className="h-11 min-w-11 px-3 rounded-lg text-sm"
          style={{
            border: "1px solid var(--border-default)",
            color: "var(--text-secondary)",
          }}
        >
          Mes +
        </button>
      </header>

      <main
        className="overflow-y-auto"
        style={{
          minHeight: screenMinHeight,
          padding: `${shellPadding}px`,
          paddingBottom: `${shellPadding + bottomNavHeight + 10}px`,
        }}
      >
        <div className="mb-2 px-1">
          <p
            className="m-0 text-[11px] tracking-wide uppercase"
            style={{ color: "var(--text-tertiary)" }}
          >
            {MOBILE_SCREEN_LABELS[activeScreen]}
          </p>
        </div>
        <div className="transition-opacity duration-200 ease-out opacity-100">
          {renderActiveScreen()}
        </div>
      </main>

      <nav
        className="fixed left-0 right-0 bottom-0 z-20 backdrop-blur-md px-3 pt-2 pb-[calc(8px+env(safe-area-inset-bottom))]"
        style={{
          minHeight: `${bottomNavHeight}px`,
          background: "var(--bg-surface)",
          borderTop: "1px solid var(--border-subtle)",
        }}
      >
        <div className="grid grid-cols-5 items-center gap-2">
          <button
            type="button"
            className="h-11 rounded-xl flex items-center justify-center"
            style={navButtonStyle(activeScreen === "home")}
            aria-label="Home"
            onClick={() => setActiveScreen("home")}
          >
            <span className="flex flex-col items-center leading-none gap-0.5">
              <Home size={16} />
              <span className="text-[10px]">Home</span>
            </span>
          </button>
          <button
            type="button"
            className="h-11 rounded-xl flex items-center justify-center"
            style={navButtonStyle(activeScreen === "charts")}
            aria-label="Gráficos"
            onClick={() => setActiveScreen("charts")}
          >
            <span className="flex flex-col items-center leading-none gap-0.5">
              <BarChart3 size={16} />
              <span className="text-[10px]">Charts</span>
            </span>
          </button>
          <button
            type="button"
            className="h-11 rounded-xl flex items-center justify-center"
            style={{
              color: "var(--text-on-accent)",
              background: "var(--accent-600)",
            }}
            aria-label="Nova movimentação"
            onClick={handleOpenNewTransaction}
          >
            <Plus size={18} />
          </button>
          <button
            type="button"
            className="h-11 rounded-xl flex items-center justify-center"
            style={navButtonStyle(activeScreen === "cards")}
            aria-label="Cartões"
            onClick={() => setActiveScreen("cards")}
          >
            <span className="flex flex-col items-center leading-none gap-0.5">
              <CreditCard size={16} />
              <span className="text-[10px]">Cards</span>
            </span>
          </button>
          <button
            type="button"
            className="h-11 rounded-xl flex items-center justify-center"
            style={navButtonStyle(activeScreen === "investments")}
            aria-label="Investimentos"
            onClick={() => setActiveScreen("investments")}
          >
            <span className="flex flex-col items-center leading-none gap-0.5">
              <PieChart size={16} />
              <span className="text-[10px]">Invest</span>
            </span>
          </button>
        </div>
      </nav>

      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingItem(null);
          setOpenCardPurchaseMode(false);
        }}
        onSuccess={async () => {
          await fetchData?.({ silent: true });
          await loadCardSummaries();
          setIsModalOpen(false);
          setEditingItem(null);
          setOpenCardPurchaseMode(false);
        }}
        categorias={categorias}
        veiculos={veiculos}
        editingItem={editingItem}
        initialCardPurchaseMode={openCardPurchaseMode}
      />
    </div>
  );
};

export default DashboardMobileView;
