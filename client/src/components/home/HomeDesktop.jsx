import { lazy, Suspense, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowSquareOut,
  Bank,
  CalendarCheck,
  ChartLine,
  ChartLineUp,
  CreditCard,
  Download,
  FileText,
  Plus,
  ShieldCheck,
  Tag,
  TrendDown,
  TrendUp,
  Wallet,
  X,
} from "@phosphor-icons/react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  CartesianGrid,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCurrency } from "../../util/formatCurrency";
import { useDashboardFinancials } from "../../hooks/useDashboardFinancials";
import { useCardSummaries } from "../../hooks/useCardSummaries";
import { useTransactionFilters } from "../../hooks/useTransactionFilters";
import { useTransactionActions } from "../../hooks/useTransactionActions";
import { useCsvExport } from "../../hooks/useCsvExport";
import { useMonthlyReportExport } from "../../hooks/useMonthlyReportExport";
import { useKeyboardShortcuts } from "../../hooks/useKeyboardShortcuts";
import { useFocusTrap } from "../../hooks/useFocusTrap";
import {
  UPCOMING_ITEM_TITLE_MAX_LENGTH,
  formatDateLabel,
  formatVariationPercent,
  getMonthDateRange,
  truncateWithThreeDots,
} from "../../util/dashboardFormatters";
import {
  DEFAULT_CARD_THEME,
  getBackLayerStyle,
  getCategoryStandardColor,
  getFrontLayerStyle,
  normalizeCardTheme,
  toHsla,
} from "../../util/cardTheme";
import {
  CHART_THEME_COLORS,
  formatChartAxisTick,
  renderCategoryComparisonTooltip,
  renderCategoryPieIconLabel,
  renderCategoryPieTooltip,
  renderChartTooltip,
} from "../dashboard/chartTooltips";
import CardsSlide from "../dashboard/CardsSlide";
import CategorySpendBars from "../dashboard/CategorySpendBars";
import GrowthDial from "../dashboard/GrowthDial";
// Só entra no bundle quando o slide de investimentos abre de fato.
const InvestmentsView = lazy(() => import("../InvestmentsView"));
import ExportCsvModal from "../ExportCsvModal";
import BulkDeleteConfirmModal from "../BulkDeleteConfirmModal";
import TransactionModal from "../TransactionModal";
import AssistenteMovimentacaoModal from "../AssistenteMovimentacaoModal";
import Panel from "../ui/Panel";
import IconTile from "../ui/IconTile";
import AiAssistantChip from "../ui/AiAssistantChip";
import HamburgerButton from "../ui/HamburgerButton";

// Cabeçalho compartilhado pelos 4 "slides" de detalhe (cartões, investimentos,
// movimentações, análise gráfica) - um único lugar pro botão de voltar em vez
// de repetir o mesmo bloco 4x feito no arquivo antigo.
const SlideHeader = ({ title, onBack, action }) => (
  <div className="flex flex-shrink-0 items-center gap-3">
    <button
      type="button"
      onClick={onBack}
      aria-label="Voltar ao painel"
      className="ui-panel ui-panel-interactive flex h-9 w-9 items-center justify-center rounded-full"
    >
      <ArrowLeft size={16} style={{ color: "var(--text-secondary)" }} />
    </button>
    <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
      {title}
    </h2>
    {action ? <div className="ml-auto">{action}</div> : null}
  </div>
);

const TREND_TONE = {
  up: { icon: TrendUp, tag: "tag-positive", text: "text-positive" },
  down: { icon: TrendDown, tag: "tag-negative", text: "text-negative" },
};

// Tile compacto de KPI (Receitas/Despesas/Saldo/Investimentos) - linha 1 da
// Home nova. Reaproveita os valores/percentuais já calculados por
// useDashboardFinancials, só a apresentação é nova.
const KpiTile = ({ label, value, percent, diffValue, diffLabel, tone, icon, onClick, ariaLabel }) => {
  const trend = percent >= 0 ? TREND_TONE.up : TREND_TONE.down;
  const TrendIcon = trend.icon;

  return (
    <Panel
      as={onClick ? "button" : "div"}
      interactive={Boolean(onClick)}
      onClick={onClick}
      aria-label={ariaLabel}
      className="flex min-w-0 flex-1 items-center gap-3 p-3.5 text-left"
    >
      <IconTile icon={icon} tone={tone} size={40} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p className="m-0 truncate text-[11px] font-medium" style={{ color: "var(--text-tertiary)" }}>
            {label}
          </p>
          <span className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${trend.tag}`}>
            <TrendIcon size={9} weight="bold" />
            {formatVariationPercent(percent)}
          </span>
        </div>
        <p className="m-0 truncate text-lg font-bold" style={{ color: "var(--text-primary)" }}>
          {formatCurrency(value)}
        </p>
        <p className="m-0 truncate text-[10px]" style={{ color: "var(--text-tertiary)" }}>
          {diffLabel}{" "}
          <span className={`font-semibold ${trend.text}`}>
            {formatCurrency(Math.abs(diffValue))}
          </span>
        </p>
      </div>
    </Panel>
  );
};

const HomeDesktop = ({
  onOpenNav,
  incomes = [],
  expenses = [],
  totalInvestmentsBalance = 0,
  investmentAmount = 0,
  investments = [],
  selectedMes,
  selectedAno,
  onChangeMonth = () => {},
  categorias = [],
  veiculos = [],
  fetchData,
  loading,
  saldoAnterior = 0,
  onOpenCategoryManager,
  budgetAlerts = [],
  faturasVencendo = [],
  resumoMensal = null,
  comparativoMensal = null,
  projecaoSaldo = null,
}) => {
  const [simulatedTransactions, setSimulatedTransactions] = useState([]);
  const [homeWidgetTab, setHomeWidgetTab] = useState("despesas");
  const [activeSlide, setActiveSlide] = useState(null);
  const [chartsSlideTab, setChartsSlideTab] = useState("fluxo");
  const [selectedTransactionIds, setSelectedTransactionIds] = useState(() => new Set());
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [isAssistenteOpen, setIsAssistenteOpen] = useState(false);

  const currentMonthLabel = new Intl.DateTimeFormat("pt-BR", {
    month: "short",
    year: "2-digit",
  }).format(new Date(selectedAno, selectedMes - 1, 1));

  // dataKeys em entrada/saida/saldo pra reaproveitar renderChartTooltip sem
  // criar um tooltip novo só pra esse gráfico.
  const projectionChartData = useMemo(
    () =>
      (projecaoSaldo ?? []).map((item) => ({
        data: new Intl.DateTimeFormat("pt-BR", { month: "short", year: "2-digit" }).format(
          new Date(item.ano, item.mes - 1, 1),
        ),
        entrada: item.totalEntradas,
        saida: item.totalSaidas,
        saldo: item.saldoAcumulado,
      })),
    [projecaoSaldo],
  );

  const handlePreviousMonth = () => {
    const previousDate = new Date(selectedAno, selectedMes - 2, 1);
    onChangeMonth(previousDate.getMonth() + 1, previousDate.getFullYear());
  };

  const handleNextMonth = () => {
    const nextDate = new Date(selectedAno, selectedMes, 1);
    onChangeMonth(nextDate.getMonth() + 1, nextDate.getFullYear());
  };

  const { isExportModalOpen, setIsExportModalOpen, handleExportCsv } = useCsvExport();
  const { isExportingReport, handleExportRelatorioMensal } = useMonthlyReportExport();

  const allTransactions = useMemo(
    () => [...incomes, ...expenses, ...simulatedTransactions],
    [expenses, incomes, simulatedTransactions],
  );

  const faturaTransactions = useMemo(
    () =>
      faturasVencendo.map((fatura) => ({
        id: `fatura-${fatura.cartaoId}`,
        name: `Fatura ${fatura.nomeCartao}`,
        value: fatura.valor,
        date: fatura.dataVencimento,
        type: "Saida",
        isFaturaResumo: true,
      })),
    [faturasVencendo],
  );

  const allTransactionsComFatura = useMemo(
    () => [...allTransactions, ...faturaTransactions],
    [allTransactions, faturaTransactions],
  );

  const {
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
    futureInvoicesByCardId,
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
  } = useCardSummaries({ allTransactions, selectedMes, selectedAno });

  const { dialogRef: cardFormDialogRef, handleDialogKeyDown: handleCardFormDialogKeyDown } =
    useFocusTrap(Boolean(openCardFormId), () => setOpenCardFormId(null));

  const budgetAlertsLeftColumn = budgetAlerts.slice(0, 4);
  const budgetAlertsRightColumn = budgetAlerts.slice(4, 8);

  const {
    monthComparison,
    chartData,
    chartYAxisMax,
    chartYTicks,
    upcomingPayments,
    upcomingReceipts,
    slideCategoryRanking,
    slideCategoryLeftColumn,
    slideCategoryRightColumn,
    categoryComparisonData,
    currentMonthShortLabel,
    previousMonthShortLabel,
    slideCategoryPieData,
  } = useDashboardFinancials({
    allTransactions,
    incomes,
    expenses,
    categorias,
    selectedMes,
    selectedAno,
    saldoAnterior,
    faturaTransactions,
    resumoMensal,
    comparativoMensal,
  });

  const totalIncomeExibido = resumoMensal?.totalEntradas ?? monthComparison.currentIncome;
  const totalExpenseExibido = resumoMensal?.totalSaidas ?? monthComparison.currentExpense;
  const saldoDoMesExibido = resumoMensal
    ? resumoMensal.totalEntradas - resumoMensal.totalSaidas
    : monthComparison.currentBalance;

  const categoriaGastosDoMes = useMemo(() => {
    const categoriaById = new Map(categorias.map((categoria) => [String(categoria.id), categoria]));

    return (resumoMensal?.porCategoria ?? [])
      .filter((item) => Number(item.totalSaidas || 0) > 0)
      .map((item) => {
        const categoriaRef = categoriaById.get(String(item.categoriaId));
        return {
          id: item.categoriaId || "sem-categoria",
          nome: item.nome || "Sem categoria",
          cor: item.cor || "#6A6785",
          total: Number(item.totalSaidas || 0),
          limite: Number(categoriaRef?.orcamentoMensal || 0),
        };
      })
      .sort((a, b) => b.total - a.total)
      .slice(0, 4);
  }, [resumoMensal, categorias]);

  const diasParaFechamento = useMemo(() => {
    const diaFechamento = cardSummary?.cartao?.diaFechamento;
    if (!diaFechamento) return null;

    const hoje = new Date();
    const fechamentoNoMes = new Date(hoje.getFullYear(), hoje.getMonth(), diaFechamento);
    if (fechamentoNoMes < hoje) {
      fechamentoNoMes.setMonth(fechamentoNoMes.getMonth() + 1);
    }
    return Math.max(0, Math.ceil((fechamentoNoMes - hoje) / (1000 * 60 * 60 * 24)));
  }, [cardSummary]);

  const percentualOrcamentoUsado = useMemo(() => {
    const comOrcamento = categoriaGastosDoMes.filter((item) => item.limite > 0);
    if (comOrcamento.length === 0) return 0;
    const totalGasto = comOrcamento.reduce((acc, item) => acc + item.total, 0);
    const totalOrcamento = comOrcamento.reduce((acc, item) => acc + item.limite, 0);
    return totalOrcamento > 0 ? (totalGasto / totalOrcamento) * 100 : 0;
  }, [categoriaGastosDoMes]);

  const existeCategoriaSemOrcamento = useMemo(
    () => categorias.some((categoria) => !(Number(categoria.orcamentoMensal) > 0)),
    [categorias],
  );

  const {
    sortedMovimentacoes: _sortedMovimentacoes,
    slideTransactionSearch,
    setSlideTransactionSearch,
    slideTransactionFilter,
    setSlideTransactionFilter,
    slideTransactionCategoryFilter,
    setSlideTransactionCategoryFilter,
    slideTransactionCardFilter,
    setSlideTransactionCardFilter,
    slideTransactions,
  } = useTransactionFilters({ allTransactions: allTransactionsComFatura });

  const {
    isModalOpen,
    setIsModalOpen,
    isSimulationModalOpen,
    setIsSimulationModalOpen,
    editingItem,
    isCloning,
    isAiDraft,
    openCardPurchaseMode,
    setOpenCardPurchaseMode,
    handleOpenNewTransaction,
    handleOpenEditTransaction,
    handleOpenCloneTransaction,
    handleOpenAssistantDraft,
    handleDeleteTransaction,
    handleBulkDelete,
    handleSimulate,
  } = useTransactionActions({
    categorias,
    fetchData,
    loadCardSummaries,
    simulatedTransactions,
    setSimulatedTransactions,
  });

  const selectableTransactionIds = useMemo(
    () => slideTransactions.filter((item) => !item.isFaturaResumo).map((item) => item.id),
    [slideTransactions],
  );

  const isAllTransactionsSelected =
    selectableTransactionIds.length > 0 &&
    selectableTransactionIds.every((id) => selectedTransactionIds.has(id));

  const toggleSelectTransaction = (id) => {
    setSelectedTransactionIds((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSelectAllTransactions = () => {
    setSelectedTransactionIds(
      isAllTransactionsSelected ? new Set() : new Set(selectableTransactionIds),
    );
  };

  const selectedTransactionsSummary = useMemo(() => {
    const selecionadas = slideTransactions.filter((item) => selectedTransactionIds.has(item.id));
    return {
      count: selecionadas.length,
      totalValue: selecionadas.reduce((acc, item) => acc + Number(item.value || item.valor || 0), 0),
    };
  }, [slideTransactions, selectedTransactionIds]);

  const handleConfirmBulkDelete = async () => {
    const resultado = await handleBulkDelete(Array.from(selectedTransactionIds));
    if (resultado.ok) {
      setSelectedTransactionIds(new Set());
    }
  };

  useKeyboardShortcuts({
    onNewTransaction: handleOpenNewTransaction,
    onPreviousMonth: handlePreviousMonth,
    onNextMonth: handleNextMonth,
  });

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center" style={{ color: "var(--text-tertiary)" }}>
        Carregando informações...
      </div>
    );
  }

  const activeCardFormContext = (() => {
    if (!openCardFormId) return null;

    if (openCardFormId.startsWith("new-")) {
      const slotKey = openCardFormId.replace("new-", "");
      const index = Number(slotKey);
      return {
        mode: "create",
        slotKey,
        index,
        values: newCardFormBySlot[slotKey] || getInitialCardCreateForm(index),
        statusMessage: newCardStatusBySlot[slotKey],
        isBusy: Boolean(isCreatingCardBySlot[slotKey]),
      };
    }

    const summary = cardColumns.find(
      (item) => item?.cartao?.id && String(item.cartao.id) === openCardFormId,
    );
    if (!summary) return null;

    const card = summary.cartao;
    return {
      mode: "edit",
      cardId: openCardFormId,
      cardNome: card.nome || "Cartão",
      values: cardFormById[openCardFormId] || {
        nome: card.nome || "",
        limiteTotal: String(card.limiteTotal || ""),
        diaFechamento: String(card.diaFechamento || ""),
        diaVencimento: String(card.diaVencimento || ""),
        corTema: normalizeCardTheme(card.corTema),
      },
      statusMessage: cardFormStatusById[openCardFormId],
      isBusy: Boolean(isSavingCardById[openCardFormId]),
    };
  })();

  return (
    <>
      <div className="flex h-full min-h-0 flex-col gap-3">
        {activeSlide === "investments" ? (
          <>
            <SlideHeader title="Investimentos" onBack={() => setActiveSlide(null)} />
            <section className="min-h-0 flex-1 overflow-y-auto rounded-2xl">
              <Suspense
                fallback={
                  <div className="flex h-40 items-center justify-center text-sm" style={{ color: "var(--text-tertiary)" }}>
                    Carregando...
                  </div>
                }
              >
                <InvestmentsView
                  investmentAmount={investmentAmount}
                  investments={investments}
                  fetchData={fetchData}
                />
              </Suspense>
            </section>
          </>
        ) : activeSlide === "cards" ? (
          <CardsSlide
            slideGap={12}
            slideBottomSafeArea={16}
            onBack={() => setActiveSlide(null)}
            cardSummaryError={cardSummaryError}
            sectionGap={12}
            cardColumns={cardColumns}
            cardTransactionsById={cardTransactionsById}
            futureInvoicesByCardId={futureInvoicesByCardId}
            onOpenCreateCard={(index) => {
              const slotKey = String(index);
              setOpenCardFormId(`new-${slotKey}`);
              setNewCardFormBySlot((current) => ({
                ...current,
                [slotKey]: current[slotKey] || getInitialCardCreateForm(index),
              }));
            }}
            onOpenEditCard={(cardId) => setOpenCardFormId(cardId)}
            onViewCardMovements={(cardId) => {
              setSlideTransactionCardFilter(cardId);
              setActiveSlide("transactions");
            }}
          />
        ) : activeSlide === "transactions" ? (
          <>
            <SlideHeader
              title="Movimentações do Mês"
              onBack={() => setActiveSlide(null)}
              action={
                <button
                  type="button"
                  onClick={handleOpenNewTransaction}
                  className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold transition-colors"
                  style={{ background: "var(--accent-600)", color: "var(--text-on-accent)" }}
                >
                  <Plus size={14} weight="bold" /> Nova transação
                </button>
              }
            />

            <Panel className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <input
                  type="search"
                  value={slideTransactionSearch}
                  onChange={(event) => setSlideTransactionSearch(event.target.value)}
                  placeholder="Buscar movimentação"
                  className="w-56 rounded-md px-2 py-1.5 text-xs sm:w-72"
                  style={{ border: "1px solid var(--border-default)", color: "var(--text-primary)" }}
                />
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={slideTransactionFilter}
                    onChange={(event) => setSlideTransactionFilter(event.target.value)}
                    className="rounded-md px-2 py-1.5 text-xs"
                    style={{ border: "1px solid var(--border-default)", color: "var(--text-secondary)" }}
                  >
                    <option value="todas">Todas</option>
                    <option value="entradas">Somente entradas</option>
                    <option value="saidas">Somente saídas</option>
                  </select>
                  <select
                    value={slideTransactionCategoryFilter}
                    onChange={(event) => setSlideTransactionCategoryFilter(event.target.value)}
                    className="rounded-md px-2 py-1.5 text-xs"
                    style={{ border: "1px solid var(--border-default)", color: "var(--text-secondary)" }}
                  >
                    <option value="todas">Todas as categorias</option>
                    {categorias.map((categoria) => (
                      <option key={categoria.id} value={categoria.id}>
                        {categoria.nome}
                      </option>
                    ))}
                  </select>
                  <select
                    value={slideTransactionCardFilter}
                    onChange={(event) => setSlideTransactionCardFilter(event.target.value)}
                    className="rounded-md px-2 py-1.5 text-xs"
                    style={{ border: "1px solid var(--border-default)", color: "var(--text-secondary)" }}
                  >
                    <option value="todas">Todos os cartões</option>
                    {cardColumns
                      .filter((summary) => summary?.cartao?.id)
                      .map((summary) => (
                        <option key={summary.cartao.id} value={summary.cartao.id}>
                          {summary.cartao.nome}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              {selectedTransactionsSummary.count > 0 ? (
                <div
                  className="mt-3 flex items-center justify-between gap-3 rounded-lg px-3 py-2"
                  style={{ background: "var(--danger-100)", border: "1px solid var(--danger-border)" }}
                >
                  <span className="text-xs font-medium" style={{ color: "var(--danger-700)" }}>
                    {selectedTransactionsSummary.count}{" "}
                    {selectedTransactionsSummary.count === 1 ? "selecionada" : "selecionadas"} ·{" "}
                    {formatCurrency(selectedTransactionsSummary.totalValue)}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedTransactionIds(new Set())}
                      className="rounded-md px-2 py-1 text-xs font-medium transition-colors"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      Limpar seleção
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsBulkDeleteModalOpen(true)}
                      className="rounded-md px-3 py-1.5 text-xs font-semibold transition-colors"
                      style={{ background: "var(--danger-700)", color: "white" }}
                    >
                      Excluir selecionadas
                    </button>
                  </div>
                </div>
              ) : null}

              <div
                className="mt-3 min-h-0 flex-1 overflow-y-auto rounded-lg"
                style={{ border: "1px solid var(--border-default)" }}
              >
                {slideTransactions.length === 0 ? (
                  <div className="flex h-full items-center justify-center px-6 text-center">
                    <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
                      Nenhuma movimentação cadastrada para os filtros aplicados.
                    </p>
                  </div>
                ) : (
                  <table className="w-full border-collapse text-left">
                    <caption className="sr-only">
                      Movimentações do mês, filtradas por tipo, categoria e cartão
                    </caption>
                    <thead>
                      <tr
                        className="text-[10px] uppercase tracking-wider"
                        style={{
                          background: "var(--bg-surface-sunken)",
                          color: "var(--text-tertiary)",
                          borderBottom: "1px solid var(--border-default)",
                        }}
                      >
                        <th scope="col" className="w-8 p-3 font-bold">
                          <input
                            type="checkbox"
                            aria-label="Selecionar todas as movimentações"
                            checked={isAllTransactionsSelected}
                            onChange={toggleSelectAllTransactions}
                            className="cursor-pointer"
                          />
                        </th>
                        <th scope="col" className="p-3 font-bold">Data</th>
                        <th scope="col" className="p-3 font-bold">Título</th>
                        <th scope="col" className="p-3 font-bold">Categoria</th>
                        <th scope="col" className="p-3 font-bold">Valor</th>
                        <th scope="col" className="p-3 font-bold">Tipo</th>
                        <th scope="col" className="p-3 text-right font-bold">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-subtle)]">
                      {slideTransactions.map((item) => {
                        const itemType = item.type || item.tipo;
                        const isEntrada = itemType === "Entrada";

                        return (
                          <tr key={item.id} style={{ background: "var(--bg-surface)" }}>
                            <td className="p-3">
                              {item.isFaturaResumo ? null : (
                                <input
                                  type="checkbox"
                                  aria-label={`Selecionar ${item.name || item.titulo || "movimentação"}`}
                                  checked={selectedTransactionIds.has(item.id)}
                                  onChange={() => toggleSelectTransaction(item.id)}
                                  className="cursor-pointer"
                                />
                              )}
                            </td>
                            <td className="whitespace-nowrap p-3 text-xs" style={{ color: "var(--text-secondary)" }}>
                              {item.date || item.data ? formatDateLabel(item.date || item.data) : "--/--"}
                            </td>
                            <td className="p-3">
                              <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                                {item.name || item.titulo || "Movimentação"}
                              </p>
                              <p className="max-w-[320px] truncate text-xs" style={{ color: "var(--text-tertiary)" }}>
                                {item.description || item.descricao || "Sem descrição"}
                              </p>
                            </td>
                            <td className="p-3 text-xs" style={{ color: "var(--text-secondary)" }}>
                              {item.isFaturaResumo ? "Fatura" : item.categoria?.nome || "Sem categoria"}
                            </td>
                            <td
                              className="whitespace-nowrap p-3 text-sm font-semibold"
                              style={{ color: isEntrada ? "var(--success-700)" : "var(--danger-700)" }}
                            >
                              {isEntrada ? "+" : "-"}
                              {formatCurrency(item.value || item.valor || 0)}
                            </td>
                            <td className="p-3">
                              <span
                                className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold"
                                style={{
                                  background: isEntrada ? "var(--success-100)" : "var(--danger-100)",
                                  color: isEntrada ? "var(--success-700)" : "var(--danger-700)",
                                }}
                              >
                                {itemType}
                              </span>
                            </td>
                            <td className="p-3">
                              {item.isFaturaResumo ? (
                                <span className="text-xs font-medium" style={{ color: "var(--text-tertiary)" }}>
                                  Resumo da fatura
                                </span>
                              ) : (
                                <div className="flex items-center justify-end gap-2">
                                  <button
                                    type="button"
                                    onClick={() => handleOpenEditTransaction(item)}
                                    className="rounded-md px-2 py-1 text-xs font-medium transition-colors"
                                    style={{ color: "var(--accent-600)", border: "1px solid var(--accent-100)" }}
                                  >
                                    Editar
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleOpenCloneTransaction(item)}
                                    className="rounded-md px-2 py-1 text-xs font-medium transition-colors"
                                    style={{ color: "var(--text-secondary)", border: "1px solid var(--border-default)" }}
                                  >
                                    Clonar
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteTransaction(item)}
                                    className="rounded-md px-2 py-1 text-xs font-medium transition-colors"
                                    style={{ color: "var(--danger-700)", border: "1px solid var(--danger-border)" }}
                                  >
                                    Excluir
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </Panel>
          </>
        ) : activeSlide === "charts" ? (
          <>
            <SlideHeader
              title="Análise Gráfica"
              onBack={() => setActiveSlide(null)}
              action={
                <button
                  type="button"
                  onClick={(e) => onOpenCategoryManager(e.currentTarget)}
                  className="rounded-full px-3 py-1.5 text-xs font-medium transition-colors"
                  style={{ color: "var(--text-secondary)", border: "1px solid var(--border-default)" }}
                >
                  Gerenciar Categorias
                </button>
              }
            />

            <div className="flex flex-shrink-0 items-center gap-2">
              {[
                { id: "fluxo", label: "Fluxo" },
                { id: "categorias", label: "Categorias" },
                { id: "comparativo", label: "Comparativo" },
                { id: "projecao", label: "Projeção" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setChartsSlideTab(tab.id)}
                  className="rounded-full px-3 py-1.5 text-xs font-semibold transition-colors"
                  style={
                    chartsSlideTab === tab.id
                      ? { background: "var(--accent-50)", color: "var(--accent-600)", border: "1px solid var(--accent-100)" }
                      : { color: "var(--text-tertiary)", border: "1px solid transparent" }
                  }
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {chartsSlideTab === "fluxo" && (
              <Panel className="min-h-0 flex-1 rounded-2xl p-4">
                {chartData.length === 0 ? (
                  <div
                    className="flex h-full items-center justify-center rounded-xl px-6 text-center"
                    style={{ border: "1px solid var(--border-default)", background: "var(--bg-surface-sunken)" }}
                  >
                    <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
                      Ainda não há dados no período para montar o gráfico.
                    </p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorReceitaSlide" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={CHART_THEME_COLORS.entrada.fill} stopOpacity={0.28} />
                          <stop offset="100%" stopColor={CHART_THEME_COLORS.entrada.fill} stopOpacity={0.02} />
                        </linearGradient>
                        <linearGradient id="colorDespesaSlide" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={CHART_THEME_COLORS.saida.fill} stopOpacity={0.24} />
                          <stop offset="100%" stopColor={CHART_THEME_COLORS.saida.fill} stopOpacity={0.02} />
                        </linearGradient>
                        <linearGradient id="colorSaldoSlide" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={CHART_THEME_COLORS.saldo.fill} stopOpacity={0.1} />
                          <stop offset="95%" stopColor={CHART_THEME_COLORS.saldo.fill} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="4 10" vertical={false} stroke="#e7e9f0" />
                      <XAxis dataKey="data" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#767c93" }} />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        domain={[0, chartYAxisMax]}
                        ticks={chartYTicks}
                        tickFormatter={formatChartAxisTick}
                        tick={{ fontSize: 11, fill: "#767c93" }}
                        width={48}
                      />
                      <Tooltip content={renderChartTooltip} cursor={{ stroke: "#c4c9da", strokeWidth: 2, strokeDasharray: "6 6" }} />
                      <Area type="monotone" dataKey="entrada" fill="url(#colorReceitaSlide)" stroke="none" isAnimationActive={false} name="entrada" />
                      <Area type="monotone" dataKey="saida" fill="url(#colorDespesaSlide)" stroke="none" isAnimationActive={false} name="saida" />
                      <Area type="monotone" dataKey="saldo" stroke="none" fill="url(#colorSaldoSlide)" isAnimationActive={false} name="saldo" />
                      <Line type="monotone" dataKey="entrada" stroke={CHART_THEME_COLORS.entrada.fill} strokeWidth={2} dot={false} activeDot={{ r: 5, fill: CHART_THEME_COLORS.entrada.fill, stroke: "#ffffff", strokeWidth: 2 }} name="entrada" />
                      <Line type="monotone" dataKey="saida" stroke={CHART_THEME_COLORS.saida.fill} strokeWidth={2} dot={false} activeDot={{ r: 5, fill: CHART_THEME_COLORS.saida.fill, stroke: "#ffffff", strokeWidth: 2 }} name="saida" />
                      <Line type="monotone" dataKey="saldo" stroke={CHART_THEME_COLORS.saldo.fill} strokeWidth={2} dot={false} name="saldo" style={{ opacity: 0.6 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </Panel>
            )}

            {chartsSlideTab === "categorias" && (
              <Panel className="min-h-0 flex-1 rounded-2xl p-4">
                {slideCategoryRanking.length === 0 ? (
                  <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>Nenhum gasto registrado neste mês</p>
                ) : (
                  <div className="grid h-full min-h-0 grid-cols-2 gap-4">
                    <div className="flex min-h-0 flex-col gap-3">
                      <div className="grid min-h-0 flex-1 grid-cols-2 gap-3">
                        {[slideCategoryLeftColumn, slideCategoryRightColumn].map((column, columnIndex) => (
                          <div key={`slide-category-column-${columnIndex}`} className="space-y-4 overflow-y-auto pr-1">
                            {column.length === 0 ? (
                              <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>Sem categorias nesta coluna</p>
                            ) : (
                              column.map((item) => {
                                const standardColor = getCategoryStandardColor(item.cor);
                                return (
                                  <div key={item.id} className="space-y-1.5">
                                    <div
                                      className="h-5 overflow-hidden rounded-full border"
                                      style={{ borderColor: "var(--border-subtle)", background: "var(--bg-surface-sunken)" }}
                                    >
                                      <div
                                        className="h-full rounded-full border"
                                        style={{
                                          width: `${Math.min(100, (item.total / (item.limite > 0 ? item.limite : item.total || 1)) * 100)}%`,
                                          borderColor: standardColor.border,
                                          background: `linear-gradient(180deg, ${standardColor.gradient1} 0%, ${standardColor.gradient2} 100%)`,
                                        }}
                                      />
                                    </div>
                                    <div className="flex items-center justify-between gap-2 text-xs">
                                      <div className="inline-flex min-w-0 items-center gap-2">
                                        <span className="truncate font-semibold" style={{ color: standardColor.text }}>{item.nome}</span>
                                        <span className="whitespace-nowrap" style={{ color: standardColor.text }}>{formatCurrency(item.total)}</span>
                                      </div>
                                      <span className="whitespace-nowrap font-semibold" style={{ color: "var(--text-tertiary)" }}>
                                        {formatCurrency(item.limite > 0 ? item.limite : item.total)}
                                      </span>
                                    </div>
                                  </div>
                                );
                              })
                            )}
                          </div>
                        ))}
                      </div>

                      <div className="grid flex-shrink-0 grid-cols-2 gap-3 pt-1">
                        {[budgetAlertsLeftColumn, budgetAlertsRightColumn].map((alertsColumn, columnIndex) => (
                          <div key={`budget-alerts-column-${columnIndex}`} className="space-y-2">
                            {alertsColumn.length === 0
                              ? columnIndex === 0
                                ? <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>Nenhum alerta de orçamento.</p>
                                : null
                              : alertsColumn.map((item) => {
                                  const alertColor = item.estado === "Estourado" ? "var(--danger-700)" : "var(--warning-700)";
                                  return (
                                    <p key={`alert-${item.id}`} className="text-xs font-medium" style={{ color: alertColor }}>
                                      {item.estado === "Estourado" ? (
                                        <>Limite da categoria {item.nome} excedido em <span className="font-semibold">{formatCurrency(item.total - item.limite)}</span>.</>
                                      ) : (
                                        <>Categoria {item.nome} já consumiu <span className="font-semibold">{Math.round(item.percentual)}%</span> do orçamento ({formatCurrency(item.total)} de {formatCurrency(item.limite)}).</>
                                      )}
                                    </p>
                                  );
                                })}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="min-h-0 rounded-lg p-2" style={{ background: "var(--bg-surface-sunken)" }}>
                      {slideCategoryPieData.length === 0 ? (
                        <p className="pt-8 text-center text-xs" style={{ color: "var(--text-tertiary)" }}>Sem dados para gráfico</p>
                      ) : (
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <defs>
                              {slideCategoryPieData.map((item) => {
                                const standardColor = getCategoryStandardColor(item.cor);
                                return (
                                  <linearGradient key={`slideGrad-${item.id}`} id={`slideGrad-${item.id}`} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor={toHsla(standardColor.gradient1, 0.85)} />
                                    <stop offset="100%" stopColor={toHsla(standardColor.gradient2, 0.92)} />
                                  </linearGradient>
                                );
                              })}
                            </defs>
                            <Pie
                              data={slideCategoryPieData}
                              dataKey="total"
                              nameKey="nome"
                              innerRadius="35%"
                              outerRadius="80%"
                              paddingAngle={8}
                              cornerRadius={16}
                              stroke="none"
                              label={renderCategoryPieIconLabel}
                              labelLine={false}
                            >
                              {slideCategoryPieData.map((item) => {
                                const standardColor = getCategoryStandardColor(item.cor);
                                return <Cell key={item.id} fill={`url(#slideGrad-${item.id})`} stroke={standardColor.border} strokeWidth={1.5} />;
                              })}
                            </Pie>
                            <Tooltip content={renderCategoryPieTooltip} cursor={false} />
                          </PieChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                  </div>
                )}
              </Panel>
            )}

            {chartsSlideTab === "comparativo" && (
              <Panel className="min-h-0 flex-1 rounded-2xl p-4">
                {categoryComparisonData.length === 0 ? (
                  <p className="pt-8 text-center text-sm" style={{ color: "var(--text-tertiary)" }}>
                    Sem histórico para comparar com {previousMonthShortLabel}
                  </p>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={categoryComparisonData} margin={{ top: 12, right: 8, left: 0, bottom: 4 }} barGap={2}>
                      <CartesianGrid strokeDasharray="4 10" vertical={false} stroke="#e7e9f0" />
                      <XAxis dataKey="shortName" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#767c93" }} />
                      <YAxis axisLine={false} tickLine={false} tickFormatter={formatChartAxisTick} tick={{ fontSize: 11, fill: "#767c93" }} width={32} />
                      <Tooltip content={renderCategoryComparisonTooltip} cursor={{ fill: "rgba(232, 98, 63, 0.06)" }} />
                      <Bar dataKey="previousTotal" name={`Mês anterior (${previousMonthShortLabel})`} radius={[4, 4, 0, 0]}>
                        {categoryComparisonData.map((item) => {
                          const standardColor = getCategoryStandardColor(item.cor);
                          return <Cell key={`previous-bar-${item.id}`} fill={standardColor.gradient1} stroke={standardColor.border} strokeWidth={1} />;
                        })}
                      </Bar>
                      <Bar dataKey="currentTotal" name={`Mês atual (${currentMonthShortLabel})`} radius={[4, 4, 0, 0]}>
                        {categoryComparisonData.map((item) => {
                          const standardColor = getCategoryStandardColor(item.cor);
                          return <Cell key={`current-bar-${item.id}`} fill={standardColor.border} stroke={standardColor.text} strokeWidth={1} />;
                        })}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </Panel>
            )}

            {chartsSlideTab === "projecao" && (
              <Panel className="min-h-0 flex-1 rounded-2xl p-4">
                {projectionChartData.length === 0 ? (
                  <p className="pt-8 text-center text-sm" style={{ color: "var(--text-tertiary)" }}>
                    Ainda não há dados suficientes pra projetar os próximos meses.
                  </p>
                ) : (
                  <div className="flex h-full min-h-0 flex-col gap-2">
                    <p className="m-0 flex-shrink-0 text-xs" style={{ color: "var(--text-tertiary)" }}>
                      Saldo acumulado projetado com base nas movimentações fixas e parceladas já lançadas -
                      não é uma simulação, é o que já está previsto pra entrar e sair.
                    </p>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={projectionChartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorSaldoProjecao" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={CHART_THEME_COLORS.saldo.fill} stopOpacity={0.22} />
                            <stop offset="100%" stopColor={CHART_THEME_COLORS.saldo.fill} stopOpacity={0.02} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="4 10" vertical={false} stroke="#e7e9f0" />
                        <XAxis dataKey="data" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#767c93" }} />
                        <YAxis
                          axisLine={false}
                          tickLine={false}
                          tickFormatter={formatChartAxisTick}
                          tick={{ fontSize: 11, fill: "#767c93" }}
                          width={48}
                        />
                        <Tooltip content={renderChartTooltip} cursor={{ stroke: "#c4c9da", strokeWidth: 2, strokeDasharray: "6 6" }} />
                        <Area type="monotone" dataKey="saldo" fill="url(#colorSaldoProjecao)" stroke={CHART_THEME_COLORS.saldo.fill} strokeWidth={2} isAnimationActive={false} name="saldo" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </Panel>
            )}
          </>
        ) : (
          <>
            {/* Linha 0: hambúrguer + navegação de mês + assistente de IA + ações rápidas, tudo na mesma altura */}
            <div className="flex flex-shrink-0 items-center gap-3">
              <HamburgerButton onClick={onOpenNav} />
              <div className="ui-panel flex items-center gap-1 rounded-full p-1">
                <button
                  type="button"
                  onClick={handlePreviousMonth}
                  aria-label="Mês anterior"
                  className="flex h-8 w-8 items-center justify-center rounded-full transition-colors"
                  style={{ color: "var(--text-secondary)" }}
                >
                  <ArrowLeft size={14} />
                </button>
                <span className="px-2 text-sm font-semibold capitalize" style={{ color: "var(--text-primary)" }}>
                  {currentMonthLabel}
                </span>
                <button
                  type="button"
                  onClick={handleNextMonth}
                  aria-label="Próximo mês"
                  className="flex h-8 w-8 items-center justify-center rounded-full transition-colors"
                  style={{ color: "var(--text-secondary)" }}
                >
                  <ArrowLeft size={14} style={{ transform: "rotate(180deg)" }} />
                </button>
              </div>

              <AiAssistantChip onClick={() => setIsAssistenteOpen(true)} />

              <div className="ui-panel flex items-center gap-1 rounded-full p-1">
                <button
                  type="button"
                  onClick={() => setActiveSlide("cards")}
                  aria-label="Atalho: Cartões"
                  title="Cartões"
                  className="flex h-8 w-8 items-center justify-center rounded-full transition-colors"
                  style={{ color: "var(--text-secondary)" }}
                >
                  <CreditCard size={15} />
                </button>
                <button
                  type="button"
                  onClick={(e) => onOpenCategoryManager(e.currentTarget)}
                  aria-label="Atalho: Categorias"
                  title="Categorias"
                  className="flex h-8 w-8 items-center justify-center rounded-full transition-colors"
                  style={{ color: "var(--text-secondary)" }}
                >
                  <Tag size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSlide("investments")}
                  aria-label="Atalho: Investimentos"
                  title="Investimentos"
                  className="flex h-8 w-8 items-center justify-center rounded-full transition-colors"
                  style={{ color: "var(--text-secondary)" }}
                >
                  <ChartLineUp size={15} />
                </button>
              </div>

              <div className="ml-auto flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleExportRelatorioMensal(selectedMes, selectedAno)}
                  disabled={isExportingReport}
                  aria-label="Gerar relatório mensal"
                  title="Relatório mensal"
                  className="ui-panel ui-panel-interactive flex h-10 w-10 items-center justify-center rounded-full disabled:opacity-60"
                >
                  <FileText size={16} style={{ color: "var(--text-secondary)" }} />
                </button>
                <button
                  type="button"
                  onClick={() => setIsExportModalOpen(true)}
                  aria-label="Exportar movimentações em CSV"
                  title="Exportar CSV"
                  className="ui-panel ui-panel-interactive flex h-10 w-10 items-center justify-center rounded-full"
                >
                  <Download size={16} style={{ color: "var(--text-secondary)" }} />
                </button>
                <button
                  type="button"
                  onClick={handleOpenNewTransaction}
                  className="flex h-10 items-center gap-2 rounded-full px-4 text-xs font-semibold transition-colors"
                  style={{ background: "var(--accent-600)", color: "var(--text-on-accent)" }}
                >
                  <Plus size={15} weight="bold" /> Nova transação
                </button>
              </div>
            </div>

            {/* Linha 1: KPIs compactos */}
            <div className="flex flex-shrink-0 gap-3 rise-in">
              <KpiTile
                label="Receitas"
                value={totalIncomeExibido}
                percent={monthComparison.incomePercent}
                diffValue={monthComparison.incomeDiff}
                diffLabel="Você recebeu"
                tone="success"
                icon={TrendUp}
              />
              <KpiTile
                label="Despesas"
                value={totalExpenseExibido}
                percent={monthComparison.expensePercent}
                diffValue={monthComparison.expenseDiff}
                diffLabel="Você gastou"
                tone="danger"
                icon={TrendDown}
              />
              <KpiTile
                label="Saldo do mês"
                value={saldoDoMesExibido}
                percent={monthComparison.balancePercent}
                diffValue={monthComparison.balanceDiff}
                diffLabel="Ficou"
                tone="accent"
                icon={Wallet}
              />
              <KpiTile
                label="Investimentos"
                value={totalInvestmentsBalance}
                percent={monthComparison.investmentPercent}
                diffValue={monthComparison.investmentDiff}
                diffLabel="Você investiu"
                tone="neutral"
                icon={Bank}
                onClick={() => setActiveSlide("investments")}
                ariaLabel="Abrir slide de investimentos"
              />
            </div>

            {/* Linha 2: fluxo (área principal) + cartão em destaque */}
            <div className="grid min-h-0 flex-1 grid-cols-3 gap-3">
              <Panel
                as="button"
                interactive
                animationClassName="rise-in stagger-1"
                onClick={() => setActiveSlide("charts")}
                aria-label="Ver análise gráfica detalhada"
                className="relative col-span-2 flex min-h-0 flex-col rounded-2xl p-4 text-left"
              >
                <div className="mb-2 flex items-center gap-2">
                  <IconTile icon={ChartLine} size={30} iconSize={15} />
                  <p className="m-0 text-xs font-semibold" style={{ color: "var(--text-primary)" }}>Fluxo do mês</p>
                  <ArrowSquareOut size={13} className="ml-auto" style={{ color: "var(--text-tertiary)" }} />
                </div>
                <div className="min-h-0 flex-1">
                  {chartData.length === 0 ? (
                    <div
                      className="flex h-full items-center justify-center rounded-xl px-6 text-center"
                      style={{ border: "1px solid var(--border-default)", background: "var(--bg-surface-sunken)" }}
                    >
                      <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
                        Ainda não há dados no período para montar o gráfico.
                      </p>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorReceitaHome" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={CHART_THEME_COLORS.entrada.fill} stopOpacity={0.28} />
                            <stop offset="100%" stopColor={CHART_THEME_COLORS.entrada.fill} stopOpacity={0.02} />
                          </linearGradient>
                          <linearGradient id="colorDespesaHome" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={CHART_THEME_COLORS.saida.fill} stopOpacity={0.24} />
                            <stop offset="100%" stopColor={CHART_THEME_COLORS.saida.fill} stopOpacity={0.02} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="4 10" vertical={false} stroke="#e7e9f0" />
                        <XAxis dataKey="data" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#767c93" }} />
                        <YAxis axisLine={false} tickLine={false} domain={[0, chartYAxisMax]} ticks={chartYTicks} tickFormatter={formatChartAxisTick} tick={{ fontSize: 10, fill: "#767c93" }} width={42} />
                        <Tooltip content={renderChartTooltip} cursor={{ stroke: "#c4c9da", strokeWidth: 2, strokeDasharray: "6 6" }} />
                        <Area type="monotone" dataKey="entrada" fill="url(#colorReceitaHome)" stroke={CHART_THEME_COLORS.entrada.fill} strokeWidth={2} isAnimationActive={false} name="entrada" />
                        <Area type="monotone" dataKey="saida" fill="url(#colorDespesaHome)" stroke={CHART_THEME_COLORS.saida.fill} strokeWidth={2} isAnimationActive={false} name="saida" />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </Panel>

              <Panel
                as="button"
                interactive
                animationClassName="rise-in stagger-2"
                onClick={() => setActiveSlide("cards")}
                aria-label="Abrir slide de gestão dos cartões"
                className="col-span-1 flex min-h-0 flex-col rounded-2xl p-4 text-left"
              >
                {isCardSummaryLoading ? (
                  <div className="flex flex-1 items-center justify-center">
                    <p className="text-sm font-medium" role="status" aria-live="polite" style={{ color: "var(--text-secondary)" }}>
                      Carregando cartão...
                    </p>
                  </div>
                ) : !cardSummary ? (
                  <div className="flex flex-1 flex-col items-center justify-center text-center">
                    <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Nenhum cartão ativo.</p>
                    <p className="mt-1 text-xs" style={{ color: "var(--text-tertiary)" }}>
                      Cadastre um cartão para ver limite, fechamento e vencimento.
                    </p>
                  </div>
                ) : (
                  <div className="flex min-h-0 flex-1 flex-col gap-2">
                    <div
                      className="flex flex-1 flex-col justify-between gap-2 rounded-xl p-3"
                      style={getFrontLayerStyle(activeCardTheme)}
                    >
                      <div>
                        <p
                          className="m-0 text-[10px] font-medium uppercase tracking-wide opacity-75"
                          style={{ color: activeCardPalette.usedText }}
                        >
                          Fatura de {currentMonthLabel}
                        </p>
                        <div className="mt-1 flex items-baseline justify-between gap-2">
                          <p className="m-0 text-base font-medium" style={{ color: activeCardPalette.usedText }}>
                            {formatCurrency(cardLimitUsed)}
                          </p>
                          <p className="m-0 text-sm font-bold" style={{ color: "var(--text-primary)" }}>
                            {formatCurrency(cardLimitTotal)}
                          </p>
                        </div>
                      </div>

                      <div
                        className="relative h-2.5 overflow-hidden rounded-full"
                        role="progressbar"
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={Math.round(cardUsagePercent)}
                        aria-label="Uso do limite do cartão"
                        style={{ background: activeCardPalette.progressTrackStart }}
                      >
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${cardUsagePercent}%`,
                            background: `linear-gradient(90deg, ${activeCardPalette.progressFillStart} 0%, ${activeCardPalette.progressFillEnd} 100%)`,
                          }}
                        />
                      </div>

                      <div className="flex items-end justify-between gap-2">
                        <p className="m-0 text-xs" style={{ color: activeCardPalette.cardName }}>
                          {cardSummary.cartao?.nome || "Cartão"}
                        </p>
                        <p className="m-0 text-right text-[11px] font-semibold" style={{ color: "var(--text-secondary)" }}>
                          Fecha dia {String(cardSummary.cartao?.diaFechamento || "-").padStart(2, "0")}
                        </p>
                      </div>
                    </div>

                    {backCardSummaries.length > 0 ? (
                      <div className="flex flex-shrink-0 gap-1.5">
                        {backCardSummaries.map((item, index) => (
                          <button
                            key={item?.cartao?.id || item?.cartao?.nome || `back-card-${index}`}
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              handleBringCardToFront(index + 1);
                            }}
                            className="flex-1 truncate rounded-lg px-2 py-1.5 text-[11px] font-medium transition-colors"
                            style={getBackLayerStyle(normalizeCardTheme(item?.cartao?.corTema), index)}
                          >
                            {item?.cartao?.nome || ""}
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                )}
                {cardSummaryError ? (
                  <p className="mt-1 text-xs" style={{ color: "var(--danger-700)" }}>{cardSummaryError}</p>
                ) : null}
              </Panel>
            </div>

            {/* Linha 3: próximos itens + categorias + orçamento/fechamento */}
            <div className="grid flex-shrink-0 grid-cols-3 gap-3" style={{ height: "182px" }}>
              <Panel className="flex min-h-0 flex-col rounded-2xl p-3 rise-in stagger-3">
                <div className="flex flex-shrink-0 items-center gap-1 overflow-x-auto">
                  {[
                    { id: "despesas", label: "Despesas" },
                    { id: "receitas", label: "Receitas" },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setHomeWidgetTab(tab.id)}
                      className="whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors"
                      style={
                        homeWidgetTab === tab.id
                          ? { background: "var(--accent-50)", color: "var(--accent-600)" }
                          : { color: "var(--text-tertiary)" }
                      }
                    >
                      {tab.label}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setActiveSlide("transactions")}
                    aria-label="Abrir slide de movimentações"
                    className="ml-auto whitespace-nowrap rounded-full px-2 py-1 text-[10px] font-medium"
                    style={{ color: "var(--accent-600)" }}
                  >
                    Ver todas
                  </button>
                </div>

                <div className="mt-2 min-h-0 flex-1 space-y-2 overflow-y-auto">
                  {(homeWidgetTab === "receitas" ? upcomingReceipts : upcomingPayments).length === 0 ? (
                    <p className="py-4 text-center text-xs" style={{ color: "var(--text-tertiary)" }}>Nenhum item no período</p>
                  ) : (
                    (homeWidgetTab === "receitas" ? upcomingReceipts : upcomingPayments).map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setActiveSlide("transactions")}
                        className="flex w-full items-center justify-between gap-2 rounded-lg text-left"
                      >
                        <div className="flex min-w-0 flex-1 items-center gap-2">
                          <span className="text-base">{item.icone}</span>
                          <span className="whitespace-nowrap text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                            {formatCurrency(item.value)}
                          </span>
                          <span className="truncate text-xs" style={{ color: "var(--text-tertiary)" }} title={item.title}>
                            {truncateWithThreeDots(item.title, UPCOMING_ITEM_TITLE_MAX_LENGTH)}
                          </span>
                        </div>
                        <span className="whitespace-nowrap text-xs" style={{ color: "var(--text-secondary)" }}>
                          {formatDateLabel(item.dueDate)}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              </Panel>

              <Panel
                as="button"
                interactive
                animationClassName="rise-in stagger-4"
                onClick={() => setActiveSlide("charts")}
                aria-label="Ver análise de categorias detalhada"
                className="flex min-h-0 flex-col rounded-2xl p-3 text-left"
              >
                <p className="m-0 flex-shrink-0 text-xs font-semibold" style={{ color: "var(--text-primary)" }}>Gastos por categoria</p>
                <div className="min-h-0 flex-1">
                  <CategorySpendBars
                    items={categoriaGastosDoMes.map((c) => ({ nome: c.nome, valor: c.total }))}
                    formatValue={formatCurrency}
                  />
                </div>
              </Panel>

              {existeCategoriaSemOrcamento ? (
                <Panel
                  as="button"
                  interactive
                  animationClassName="rise-in stagger-5"
                  onClick={(e) => onOpenCategoryManager(e.currentTarget)}
                  className="flex min-h-0 flex-col items-center justify-center gap-1.5 rounded-2xl p-3 text-center"
                  style={{ background: "var(--accent-50)", borderColor: "var(--accent-100)" }}
                >
                  <IconTile icon={ShieldCheck} tone="accent" size={34} />
                  <p className="m-0 text-xs font-semibold" style={{ color: "var(--text-primary)" }}>Configure um orçamento</p>
                  <p className="m-0 text-[10px]" style={{ color: "var(--text-tertiary)" }}>
                    Defina limites por categoria pra receber alertas.
                  </p>
                </Panel>
              ) : (
                <Panel className="flex min-h-0 flex-col items-center justify-center gap-2 rounded-2xl p-3 rise-in stagger-5">
                  <GrowthDial percent={percentualOrcamentoUsado} label="Orçamento usado" size={84} />
                  {diasParaFechamento !== null ? (
                    <p className="m-0 flex items-center gap-1 text-[11px]" style={{ color: "var(--text-tertiary)" }}>
                      <CalendarCheck size={12} />
                      {diasParaFechamento} {diasParaFechamento === 1 ? "dia" : "dias"} p/ fechar fatura
                    </p>
                  ) : null}
                </Panel>
              )}
            </div>
          </>
        )}
      </div>

      <ExportCsvModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        onConfirm={handleExportCsv}
        defaultStartDate={getMonthDateRange(selectedAno, selectedMes).startDate}
        defaultEndDate={getMonthDateRange(selectedAno, selectedMes).endDate}
      />

      <BulkDeleteConfirmModal
        isOpen={isBulkDeleteModalOpen}
        onClose={() => setIsBulkDeleteModalOpen(false)}
        onConfirm={handleConfirmBulkDelete}
        count={selectedTransactionsSummary.count}
        totalValue={selectedTransactionsSummary.totalValue}
      />

      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setOpenCardPurchaseMode(false);
        }}
        onSuccess={async () => {
          await fetchData();
          await loadCardSummaries();
        }}
        categorias={categorias}
        veiculos={veiculos}
        editingItem={editingItem}
        isCloning={isCloning}
        isAiDraft={isAiDraft}
        periodKey={`${selectedAno}-${selectedMes}`}
        initialCardPurchaseMode={openCardPurchaseMode}
      />

      <TransactionModal
        isOpen={isSimulationModalOpen}
        onClose={() => setIsSimulationModalOpen(false)}
        onSimulate={handleSimulate}
        categorias={categorias}
        veiculos={veiculos}
        editingItem={null}
        isSimulation
      />

      {activeCardFormContext ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(23,20,15,0.45)] p-4 backdrop-blur-sm">
          <div
            ref={cardFormDialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="card-form-modal-title"
            tabIndex={-1}
            onKeyDown={handleCardFormDialogKeyDown}
            className="pop-in w-full max-w-md rounded-2xl p-6"
            style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)", boxShadow: "var(--shadow-modal)" }}
          >
            <div className="mb-5 flex items-center justify-between">
              <h2 id="card-form-modal-title" className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
                {activeCardFormContext.mode === "create" ? "Novo cartão" : `Editar ${activeCardFormContext.cardNome}`}
              </h2>
              <button
                type="button"
                onClick={() => setOpenCardFormId(null)}
                aria-label="Fechar"
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg transition-colors"
                style={{ border: "1px solid var(--border-default)", color: "var(--text-tertiary)" }}
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={(event) =>
                activeCardFormContext.mode === "create"
                  ? handleCreateCardFormSubmit(event, activeCardFormContext.index)
                  : handleCardFormSubmit(event, activeCardFormContext.cardId)
              }
              className="grid grid-cols-2 gap-3"
            >
              <input
                type="text"
                value={activeCardFormContext.values.nome}
                onChange={(event) =>
                  activeCardFormContext.mode === "create"
                    ? handleCreateCardFormChange(activeCardFormContext.index, "nome", event.target.value)
                    : handleCardFormChange(activeCardFormContext.cardId, "nome", event.target.value)
                }
                placeholder="Nome do cartão"
                className="col-span-2 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2"
                style={{ border: "1px solid var(--border-default)", color: "var(--text-primary)", "--tw-ring-color": "var(--accent-600)" }}
                required
              />
              <input
                type="number"
                min="0"
                step="0.01"
                value={activeCardFormContext.values.limiteTotal}
                onChange={(event) =>
                  activeCardFormContext.mode === "create"
                    ? handleCreateCardFormChange(activeCardFormContext.index, "limiteTotal", event.target.value)
                    : handleCardFormChange(activeCardFormContext.cardId, "limiteTotal", event.target.value)
                }
                placeholder="Limite total"
                className="rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2"
                style={{ border: "1px solid var(--border-default)", color: "var(--text-primary)", "--tw-ring-color": "var(--accent-600)" }}
                required
              />
              <input
                type="color"
                value={activeCardFormContext.values.corTema || DEFAULT_CARD_THEME}
                onChange={(event) =>
                  activeCardFormContext.mode === "create"
                    ? handleCreateCardFormChange(activeCardFormContext.index, "corTema", event.target.value)
                    : handleCardFormChange(activeCardFormContext.cardId, "corTema", event.target.value)
                }
                className="h-10 rounded-lg"
                style={{ border: "1px solid var(--border-default)" }}
              />
              <input
                type="number"
                min="1"
                max="31"
                value={activeCardFormContext.values.diaFechamento}
                onChange={(event) =>
                  activeCardFormContext.mode === "create"
                    ? handleCreateCardFormChange(activeCardFormContext.index, "diaFechamento", event.target.value)
                    : handleCardFormChange(activeCardFormContext.cardId, "diaFechamento", event.target.value)
                }
                placeholder="Dia fechamento"
                className="rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2"
                style={{ border: "1px solid var(--border-default)", color: "var(--text-primary)", "--tw-ring-color": "var(--accent-600)" }}
                required
              />
              <input
                type="number"
                min="1"
                max="31"
                value={activeCardFormContext.values.diaVencimento}
                onChange={(event) =>
                  activeCardFormContext.mode === "create"
                    ? handleCreateCardFormChange(activeCardFormContext.index, "diaVencimento", event.target.value)
                    : handleCardFormChange(activeCardFormContext.cardId, "diaVencimento", event.target.value)
                }
                placeholder="Dia vencimento"
                className="rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2"
                style={{ border: "1px solid var(--border-default)", color: "var(--text-primary)", "--tw-ring-color": "var(--accent-600)" }}
                required
              />

              {activeCardFormContext.statusMessage ? (
                <p
                  className="col-span-2 text-xs"
                  style={{ color: activeCardFormContext.statusMessage.includes("sucesso") ? "var(--success-700)" : "var(--danger-700)" }}
                >
                  {activeCardFormContext.statusMessage}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={activeCardFormContext.isBusy}
                className="col-span-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60"
                style={{ background: "var(--accent-600)", color: "var(--text-on-accent)" }}
              >
                {activeCardFormContext.isBusy ? "Salvando..." : activeCardFormContext.mode === "create" ? "Salvar novo cartão" : "Salvar alterações"}
              </button>
            </form>
          </div>
        </div>
      ) : null}

      <AssistenteMovimentacaoModal
        isOpen={isAssistenteOpen}
        onClose={() => setIsAssistenteOpen(false)}
        allTransactions={allTransactions}
        onDraftReady={(draft) => {
          setIsAssistenteOpen(false);
          handleOpenAssistantDraft(draft);
        }}
        onCloneSuggestion={(transacao) => {
          setIsAssistenteOpen(false);
          handleOpenCloneTransaction(transacao);
        }}
      />
    </>
  );
};

export default HomeDesktop;
