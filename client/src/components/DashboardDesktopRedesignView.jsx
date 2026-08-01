import { useMemo, useRef, useState } from "react";
import {
  ChevronLeft,
  Download,
  Plus,
  Sparkles,
  X,
} from "lucide-react";
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
import { formatCurrency } from "../util/formatCurrency";
import { useViewportDensity } from "../hooks/useViewportDensity";
import { useDashboardFinancials } from "../hooks/useDashboardFinancials";
import { useCardSummaries } from "../hooks/useCardSummaries";
import { useTransactionFilters } from "../hooks/useTransactionFilters";
import { useTransactionActions } from "../hooks/useTransactionActions";
import { useCsvExport } from "../hooks/useCsvExport";
import { useKeyboardShortcuts } from "../hooks/useKeyboardShortcuts";
import {
  UPCOMING_ITEM_TITLE_MAX_LENGTH,
  formatDateLabel,
  formatVariationPercent,
  getMonthDateRange,
  truncateWithThreeDots,
} from "../util/dashboardFormatters";
import {
  DEFAULT_CARD_THEME,
  getBackLayerStyle,
  getCategoryStandardColor,
  getFrontLayerStyle,
  getThemePalette,
  normalizeCardTheme,
  toHsla,
  toRgba,
} from "../util/cardTheme";
import {
  CHART_THEME_COLORS,
  formatChartAxisTick,
  renderCategoryComparisonTooltip,
  renderCategoryPieIconLabel,
  renderCategoryPieTooltip,
  renderChartTooltip,
} from "./dashboard/chartTooltips";
import CardsSlide from "./dashboard/CardsSlide";
import ExportCsvModal from "./ExportCsvModal";
import TransactionModal from "./TransactionModal";
import InvestmentsView from "./InvestmentsView";
import { useFocusTrap } from "../hooks/useFocusTrap";

const DashboardDesktopRedesignView = ({
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
  headerHeight = 96,
  budgetAlerts = [],
  metas = [],
}) => {
  const [simulatedTransactions, setSimulatedTransactions] = useState([]);
  const [homeWidgetTab, setHomeWidgetTab] = useState("despesas");
  const [activeSlide, setActiveSlide] = useState(null);
  const [chartsSlideTab, setChartsSlideTab] = useState("fluxo");
  const summaryRef = useRef(null);
  const planningRef = useRef(null);
  const reviewRef = useRef(null);

  const {
    dashboardGap,
    slideGap,
    slideBottomSafeArea,
    slideInnerPadding,
    sectionGap,
    sectionThreeMaxHeight,
    sectionThreeCardMinHeight,
    chartMargin,
    chartTickFontSize,
    chartYAxisWidth,
    hUtil,
    slideContentHeight,
    hSecao1,
    hSecao2,
    hSecao3,
    kpiTitleClassName,
    kpiValueClassName,
    kpiHelperClampClassName,
  } = useViewportDensity({ headerHeight });

  const currentMonthLabel = new Intl.DateTimeFormat("pt-BR", {
    month: "short",
    year: "2-digit",
  }).format(new Date(selectedAno, selectedMes - 1, 1));

  const handlePreviousMonth = () => {
    const previousDate = new Date(selectedAno, selectedMes - 2, 1);
    onChangeMonth(previousDate.getMonth() + 1, previousDate.getFullYear());
  };

  const handleNextMonth = () => {
    const nextDate = new Date(selectedAno, selectedMes, 1);
    onChangeMonth(nextDate.getMonth() + 1, nextDate.getFullYear());
  };

  const { isExportModalOpen, setIsExportModalOpen, handleExportCsv } =
    useCsvExport();

  const allTransactions = useMemo(
    () => [...incomes, ...expenses, ...simulatedTransactions],
    [expenses, incomes, simulatedTransactions],
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
    totalIncome,
    totalExpense,
    monthComparison,
    receitasTagClassName,
    despesasTagClassName,
    saldoTagClassName,
    investimentosTagClassName,
    receitasDiffColorClassName,
    despesasDiffColorClassName,
    saldoDiffColorClassName,
    investimentoDiffColorClassName,
    receitasDiffDirection,
    despesasDiffDirection,
    saldoDiffDirection,
    investimentoDiffDirection,
    chartData,
    chartYAxisMax,
    chartYTicks,
    upcomingPayments,
    upcomingReceipts,
    categoryRanking,
    slideCategoryRanking,
    slideCategoryLeftColumn,
    slideCategoryRightColumn,
    categoryComparisonData,
    currentMonthShortLabel,
    previousMonthShortLabel,
    categoryPieData,
    slideCategoryPieData,
    dashboardPiePaddingAngle,
    dashboardPieCornerRadius,
  } = useDashboardFinancials({
    allTransactions,
    incomes,
    expenses,
    categorias,
    selectedMes,
    selectedAno,
    saldoAnterior,
  });

  const {
    searchTerm,
    setSearchTerm,
    filterType,
    setFilterType,
    sortedMovimentacoes,
    slideTransactionSearch,
    setSlideTransactionSearch,
    slideTransactionFilter,
    setSlideTransactionFilter,
    slideTransactionCategoryFilter,
    setSlideTransactionCategoryFilter,
    slideTransactionCardFilter,
    setSlideTransactionCardFilter,
    slideTransactions,
  } = useTransactionFilters({ allTransactions });

  const {
    isModalOpen,
    setIsModalOpen,
    isSimulationModalOpen,
    setIsSimulationModalOpen,
    editingItem,
    openCardPurchaseMode,
    setOpenCardPurchaseMode,
    handleOpenSimulation,
    handleOpenNewTransaction,
    handleOpenEditTransaction,
    handleDeleteTransaction,
    handleSimulate,
    handleApplySimulation,
  } = useTransactionActions({
    categorias,
    fetchData,
    loadCardSummaries,
    simulatedTransactions,
    setSimulatedTransactions,
  });

  useKeyboardShortcuts({
    onNewTransaction: handleOpenNewTransaction,
    onPreviousMonth: handlePreviousMonth,
    onNextMonth: handleNextMonth,
  });

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-slate-500">
        Carregando informações...
      </div>
    );
  }

  const linkedGoals = metas
    .filter((meta) => meta.categoriaId || meta.investimentoId)
    .map((meta) => ({
      id: meta.id,
      nome: meta.descricao,
      valor: meta.valor,
      valorAcumulado: Number(meta.valorAcumulado || 0),
      percentual: Number(meta.percentualProgresso || 0),
    }))
    .sort((a, b) => b.percentual - a.percentual)
    .slice(0, 4);

  const vehicleInsights = veiculos.map((veiculo) => ({
    id: veiculo.id,
    nome: veiculo.nome,
    alertaPendente: Boolean(veiculo.alertaPendente),
    kmAtual: veiculo.kmAtual,
    kmRestante:
      veiculo.kmAtual != null
        ? Math.max(
            0,
            veiculo.alertaKm - (veiculo.kmAtual - veiculo.ultimoKmAlerta),
          )
        : null,
  }));

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
    <div
      className="dashboard-desktop-redesign overflow-hidden"
      style={{ height: `${hUtil}px`, maxHeight: `${hUtil}px` }}
    >
      {activeSlide === "investments" ? (
        <div
          className="h-full min-h-0 flex flex-col"
          style={{
            gap: `${slideGap}px`,
            paddingBottom: `${slideBottomSafeArea}px`,
          }}
        >
          <div className="flex items-center gap-3 flex-shrink-0">
            <button
              type="button"
              onClick={() => setActiveSlide(null)}
              className="flex items-center justify-center w-8 h-8 rounded-lg transition-colors"
              style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--border-default)",
                color: "var(--text-secondary)",
              }}
              aria-label="Voltar ao dashboard"
            >
              <ChevronLeft size={16} />
            </button>
            <h2
              className="text-sm font-semibold"
              style={{ color: "var(--text-primary)" }}
            >
              Investimentos
            </h2>
          </div>

          <section
            className="min-h-0 overflow-y-auto"
            style={{
              height: `${slideContentHeight}px`,
              padding: `${slideInnerPadding}px`,
            }}
          >
            <InvestmentsView
              investmentAmount={investmentAmount}
              investments={investments}
              fetchData={fetchData}
            />
          </section>
        </div>
      ) : activeSlide === "cards" ? (
        <CardsSlide
          slideGap={slideGap}
          slideBottomSafeArea={slideBottomSafeArea}
          onBack={() => setActiveSlide(null)}
          cardSummaryError={cardSummaryError}
          sectionGap={sectionGap}
          slideContentHeight={slideContentHeight}
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
        <div
          className="h-full min-h-0 flex flex-col"
          style={{
            gap: `${slideGap}px`,
            paddingBottom: `${slideBottomSafeArea}px`,
          }}
        >
          <div className="flex items-center gap-3 flex-shrink-0">
            <button
              type="button"
              onClick={() => setActiveSlide(null)}
              className="flex items-center justify-center w-8 h-8 rounded-lg transition-colors"
              style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--border-default)",
                color: "var(--text-secondary)",
              }}
              aria-label="Voltar ao dashboard"
            >
              <ChevronLeft size={16} />
            </button>
            <h2
              className="text-sm font-semibold"
              style={{ color: "var(--text-primary)" }}
            >
              Movimentações do Mês
            </h2>
            <button
              type="button"
              onClick={handleOpenNewTransaction}
              className="ml-auto inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition-colors"
              style={{
                background: "var(--accent-600)",
                color: "var(--text-on-accent)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--accent-500)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "var(--accent-600)";
              }}
            >
              <Plus size={14} /> Nova transação
            </button>
          </div>

          <section
            className="rounded-2xl shadow-sm min-h-0 overflow-hidden flex flex-col"
            style={{
              height: `${slideContentHeight}px`,
              padding: `${slideInnerPadding}px`,
              background: "var(--bg-surface)",
              border: "1px solid var(--border-default)",
            }}
          >
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <input
                type="search"
                value={slideTransactionSearch}
                onChange={(event) =>
                  setSlideTransactionSearch(event.target.value)
                }
                placeholder="Buscar movimentação"
                className="w-56 sm:w-72 px-2 py-1.5 rounded-md text-xs"
                style={{
                  border: "1px solid var(--border-default)",
                  color: "var(--text-primary)",
                }}
              />
              <div className="flex items-center gap-2 flex-wrap">
                <select
                  value={slideTransactionFilter}
                  onChange={(event) =>
                    setSlideTransactionFilter(event.target.value)
                  }
                  className="px-2 py-1.5 rounded-md text-xs"
                  style={{
                    border: "1px solid var(--border-default)",
                    color: "var(--text-secondary)",
                  }}
                >
                  <option value="todas">Todas</option>
                  <option value="entradas">Somente entradas</option>
                  <option value="saidas">Somente saídas</option>
                </select>
                <select
                  value={slideTransactionCategoryFilter}
                  onChange={(event) =>
                    setSlideTransactionCategoryFilter(event.target.value)
                  }
                  className="px-2 py-1.5 rounded-md text-xs"
                  style={{
                    border: "1px solid var(--border-default)",
                    color: "var(--text-secondary)",
                  }}
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
                  onChange={(event) =>
                    setSlideTransactionCardFilter(event.target.value)
                  }
                  className="px-2 py-1.5 rounded-md text-xs"
                  style={{
                    border: "1px solid var(--border-default)",
                    color: "var(--text-secondary)",
                  }}
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

            <div
              className="mt-3 flex-1 min-h-0 overflow-y-auto rounded-lg"
              style={{ border: "1px solid var(--border-default)" }}
            >
              {slideTransactions.length === 0 ? (
                <div className="h-full flex items-center justify-center px-6 text-center">
                  <p
                    className="text-sm"
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    Nenhuma movimentação cadastrada para os filtros aplicados.
                  </p>
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <caption className="sr-only">
                    Movimentações do mês, filtradas por tipo, categoria e
                    cartão
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
                      <th scope="col" className="p-3 font-bold">
                        Data
                      </th>
                      <th scope="col" className="p-3 font-bold">
                        Título
                      </th>
                      <th scope="col" className="p-3 font-bold">
                        Categoria
                      </th>
                      <th scope="col" className="p-3 font-bold">
                        Valor
                      </th>
                      <th scope="col" className="p-3 font-bold">
                        Tipo
                      </th>
                      <th scope="col" className="p-3 font-bold text-right">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-subtle)]">
                    {slideTransactions.map((item) => {
                      const itemType = item.type || item.tipo;
                      const isEntrada = itemType === "Entrada";

                      return (
                        <tr
                          key={item.id}
                          className="transition-colors"
                          style={{ background: "var(--bg-surface)" }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background =
                              "var(--bg-surface-hover)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background =
                              "var(--bg-surface)";
                          }}
                        >
                          <td
                            className="p-3 text-xs whitespace-nowrap"
                            style={{ color: "var(--text-secondary)" }}
                          >
                            {item.date || item.data
                              ? formatDateLabel(item.date || item.data)
                              : "--/--"}
                          </td>
                          <td className="p-3">
                            <p
                              className="text-sm font-semibold"
                              style={{ color: "var(--text-primary)" }}
                            >
                              {item.name || item.titulo || "Movimentação"}
                            </p>
                            <p
                              className="text-xs truncate max-w-[320px]"
                              style={{ color: "var(--text-tertiary)" }}
                            >
                              {item.description ||
                                item.descricao ||
                                "Sem descrição"}
                            </p>
                          </td>
                          <td
                            className="p-3 text-xs"
                            style={{ color: "var(--text-secondary)" }}
                          >
                            {item.categoria?.nome || "Sem categoria"}
                          </td>
                          <td
                            className="p-3 text-sm font-semibold whitespace-nowrap"
                            style={{
                              color: isEntrada
                                ? "var(--success-700)"
                                : "var(--danger-700)",
                            }}
                          >
                            {isEntrada ? "+" : "-"}
                            {formatCurrency(item.value || item.valor || 0)}
                          </td>
                          <td className="p-3">
                            <span
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold"
                              style={{
                                background: isEntrada
                                  ? "var(--success-100)"
                                  : "var(--danger-100)",
                                color: isEntrada
                                  ? "var(--success-700)"
                                  : "var(--danger-700)",
                              }}
                            >
                              {itemType}
                            </span>
                          </td>
                          <td className="p-3">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => handleOpenEditTransaction(item)}
                                className="text-xs font-medium rounded-md px-2 py-1 transition-colors"
                                style={{
                                  color: "var(--accent-600)",
                                  border: "1px solid var(--accent-100)",
                                }}
                              >
                                Editar
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteTransaction(item)}
                                className="text-xs font-medium rounded-md px-2 py-1 transition-colors"
                                style={{
                                  color: "var(--danger-700)",
                                  border: "1px solid var(--danger-border)",
                                }}
                              >
                                Excluir
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </section>
        </div>
      ) : activeSlide === "charts" ? (
        <div
          className="h-full min-h-0 flex flex-col"
          style={{
            gap: `${slideGap}px`,
            paddingBottom: `${slideBottomSafeArea}px`,
          }}
        >
          <div className="flex items-center gap-3 flex-shrink-0">
            <button
              type="button"
              onClick={() => setActiveSlide(null)}
              className="flex items-center justify-center w-8 h-8 rounded-lg transition-colors"
              style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--border-default)",
                color: "var(--text-secondary)",
              }}
              aria-label="Voltar ao dashboard"
            >
              <ChevronLeft size={16} />
            </button>
            <h2
              className="text-sm font-semibold"
              style={{ color: "var(--text-primary)" }}
            >
              Análise Gráfica
            </h2>
            <button
              type="button"
              onClick={(e) => onOpenCategoryManager(e.currentTarget)}
              className="ml-auto text-xs font-medium rounded-lg px-3 py-1.5 transition-colors"
              style={{
                color: "var(--text-secondary)",
                border: "1px solid var(--border-default)",
              }}
            >
              Gerenciar Categorias
            </button>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {[
              { id: "fluxo", label: "Fluxo" },
              { id: "categorias", label: "Categorias" },
              { id: "comparativo", label: "Comparativo" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setChartsSlideTab(tab.id)}
                className="rounded-full px-3 py-1.5 text-xs font-semibold transition-colors"
                style={
                  chartsSlideTab === tab.id
                    ? {
                        background: "var(--accent-50)",
                        color: "var(--accent-600)",
                        border: "1px solid var(--accent-100)",
                      }
                    : {
                        color: "var(--text-tertiary)",
                        border: "1px solid transparent",
                      }
                }
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div
            className="min-h-0 flex flex-col"
            style={{
              gap: `${sectionGap}px`,
              height: `${slideContentHeight}px`,
            }}
          >
            {chartsSlideTab === "fluxo" && (
            <section
              className="border rounded-2xl shadow-sm flex flex-col overflow-hidden"
              style={{
                flex: "1 1 0",
                minHeight: 0,
                padding: `${slideInnerPadding}px`,
                background: "var(--bg-surface)",
                borderColor: "var(--border-default)",
              }}
            >
              <div className="flex-1 min-h-0">
                {chartData.length === 0 ? (
                  <div
                    className="h-full rounded-xl border flex items-center justify-center px-6 text-center"
                    style={{
                      borderColor: "var(--border-default)",
                      background: "var(--bg-surface-sunken)",
                    }}
                  >
                    <p
                      className="text-sm"
                      style={{ color: "var(--text-tertiary)" }}
                    >
                      Ainda não há dados no período para montar o gráfico.
                    </p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={chartMargin}>
                      <defs>
                        <linearGradient
                          id="colorReceitaSlide"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="0%"
                            stopColor={CHART_THEME_COLORS.entrada.fill}
                            stopOpacity={0.28}
                          />
                          <stop
                            offset="100%"
                            stopColor={CHART_THEME_COLORS.entrada.fill}
                            stopOpacity={0.02}
                          />
                        </linearGradient>
                        <linearGradient
                          id="colorDespesaSlide"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="0%"
                            stopColor={CHART_THEME_COLORS.saida.fill}
                            stopOpacity={0.24}
                          />
                          <stop
                            offset="100%"
                            stopColor={CHART_THEME_COLORS.saida.fill}
                            stopOpacity={0.02}
                          />
                        </linearGradient>
                        <linearGradient
                          id="colorSaldoSlide"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor={CHART_THEME_COLORS.saldo.fill}
                            stopOpacity={0.1}
                          />
                          <stop
                            offset="95%"
                            stopColor={CHART_THEME_COLORS.saldo.fill}
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="4 10"
                        vertical={false}
                        stroke="#e7e9f0"
                      />
                      <XAxis
                        dataKey="data"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: chartTickFontSize, fill: "#767c93" }}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        domain={[0, chartYAxisMax]}
                        ticks={chartYTicks}
                        tickFormatter={formatChartAxisTick}
                        tick={{ fontSize: chartTickFontSize, fill: "#767c93" }}
                        width={chartYAxisWidth}
                      />
                      <Tooltip
                        content={renderChartTooltip}
                        cursor={{
                          stroke: "#c4c9da",
                          strokeWidth: 2,
                          strokeDasharray: "6 6",
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="entrada"
                        fill="url(#colorReceitaSlide)"
                        stroke="none"
                        isAnimationActive={false}
                        name="entrada"
                      />
                      <Area
                        type="monotone"
                        dataKey="saida"
                        fill="url(#colorDespesaSlide)"
                        stroke="none"
                        isAnimationActive={false}
                        name="saida"
                      />
                      <Area
                        type="monotone"
                        dataKey="saldo"
                        stroke="none"
                        fill="url(#colorSaldoSlide)"
                        isAnimationActive={false}
                        name="saldo"
                      />
                      <Line
                        type="monotone"
                        dataKey="entrada"
                        stroke={CHART_THEME_COLORS.entrada.fill}
                        strokeWidth={2}
                        dot={false}
                        activeDot={{
                          r: 5,
                          fill: CHART_THEME_COLORS.entrada.fill,
                          stroke: "#ffffff",
                          strokeWidth: 2,
                        }}
                        name="entrada"
                      />
                      <Line
                        type="monotone"
                        dataKey="saida"
                        stroke={CHART_THEME_COLORS.saida.fill}
                        strokeWidth={2}
                        dot={false}
                        activeDot={{
                          r: 5,
                          fill: CHART_THEME_COLORS.saida.fill,
                          stroke: "#ffffff",
                          strokeWidth: 2,
                        }}
                        name="saida"
                      />
                      <Line
                        type="monotone"
                        dataKey="saldo"
                        stroke={CHART_THEME_COLORS.saldo.fill}
                        strokeWidth={2}
                        dot={false}
                        name="saldo"
                        style={{ opacity: 0.6 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </section>
            )}

            {chartsSlideTab === "categorias" && (
            <section
              className="rounded-xl border shadow-sm flex flex-col overflow-hidden"
              style={{
                flex: "1 1 0",
                minHeight: 0,
                padding: `${Math.max(10, slideInnerPadding + 2)}px`,
                background: "var(--bg-surface)",
                borderColor: "var(--border-default)",
              }}
            >
              <div className="flex-1 min-h-0">
                {slideCategoryRanking.length === 0 ? (
                  <p
                    className="text-sm"
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    Nenhum gasto registrado neste mês
                  </p>
                ) : (
                  <div className="h-full grid grid-cols-2 gap-4 min-h-0">
                    <div className="min-h-0 flex flex-col gap-3">
                      <div className="grid grid-cols-2 gap-3 min-h-0 flex-1">
                        {[
                          slideCategoryLeftColumn,
                          slideCategoryRightColumn,
                        ].map((column, columnIndex) => (
                          <div
                            key={`slide-category-column-${columnIndex}`}
                            className="overflow-y-auto pr-1 space-y-4"
                          >
                            {column.length === 0 ? (
                              <p
                                className="text-xs"
                                style={{ color: "var(--text-tertiary)" }}
                              >
                                Sem categorias nesta coluna
                              </p>
                            ) : (
                              column.map((item) => {
                                const standardColor = getCategoryStandardColor(
                                  item.cor,
                                );
                                return (
                                  <div key={item.id} className="space-y-1.5">
                                    <div
                                      className="h-5 rounded-full border overflow-hidden"
                                      style={{
                                        borderColor: "var(--border-subtle)",
                                        background: "var(--bg-surface-sunken)",
                                      }}
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
                                    <div className="flex items-center justify-between text-xs gap-2">
                                      <div className="inline-flex items-center gap-2 min-w-0">
                                        <span
                                          className="font-semibold truncate"
                                          style={{ color: standardColor.text }}
                                        >
                                          {item.nome}
                                        </span>
                                        <span
                                          className="whitespace-nowrap"
                                          style={{ color: standardColor.text }}
                                        >
                                          {formatCurrency(item.total)}
                                        </span>
                                      </div>
                                      <span
                                        className="font-semibold whitespace-nowrap"
                                        style={{ color: "var(--text-tertiary)" }}
                                      >
                                        {formatCurrency(
                                          item.limite > 0
                                            ? item.limite
                                            : item.total,
                                        )}
                                      </span>
                                    </div>
                                  </div>
                                );
                              })
                            )}
                          </div>
                        ))}
                      </div>

                      <div className="grid grid-cols-2 gap-3 pt-1 flex-shrink-0">
                        {[budgetAlertsLeftColumn, budgetAlertsRightColumn].map(
                          (alertsColumn, columnIndex) => (
                            <div
                              key={`budget-alerts-column-${columnIndex}`}
                              className="space-y-2"
                            >
                              {alertsColumn.length === 0 ? (
                                columnIndex === 0 ? (
                                  <p
                                    className="text-xs"
                                    style={{ color: "var(--text-tertiary)" }}
                                  >
                                    Nenhum alerta de orçamento.
                                  </p>
                                ) : null
                              ) : (
                                alertsColumn.map((item) => {
                                  const alertColor =
                                    item.estado === "Estourado"
                                      ? "var(--danger-700)"
                                      : "var(--warning-700)";

                                  return (
                                    <p
                                      key={`alert-${item.id}`}
                                      className="text-xs font-medium"
                                      style={{ color: alertColor }}
                                    >
                                      {item.estado === "Estourado" ? (
                                        <>
                                          Limite da categoria {item.nome}{" "}
                                          excedido em{" "}
                                          <span className="font-semibold">
                                            {formatCurrency(
                                              item.total - item.limite,
                                            )}
                                          </span>
                                          .
                                        </>
                                      ) : (
                                        <>
                                          Categoria {item.nome} já consumiu{" "}
                                          <span className="font-semibold">
                                            {Math.round(item.percentual)}%
                                          </span>{" "}
                                          do orçamento ({formatCurrency(item.total)}{" "}
                                          de {formatCurrency(item.limite)}).
                                        </>
                                      )}
                                    </p>
                                  );
                                })
                              )}
                            </div>
                          ),
                        )}
                      </div>
                    </div>

                    <div className="min-h-0">
                      <div
                        className="min-h-0 h-full rounded-lg border p-2"
                        style={{
                          borderColor: "var(--border-subtle)",
                          background: "var(--bg-surface-sunken)",
                        }}
                      >
                        {slideCategoryPieData.length === 0 ? (
                          <p
                            className="text-xs text-center pt-8"
                            style={{ color: "var(--text-tertiary)" }}
                          >
                            Sem dados para gráfico
                          </p>
                        ) : (
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <defs>
                                {slideCategoryPieData.map((item) => {
                                  const standardColor =
                                    getCategoryStandardColor(item.cor);
                                  return (
                                    <linearGradient
                                      key={`slideGrad-${item.id}`}
                                      id={`slideGrad-${item.id}`}
                                      x1="0"
                                      y1="0"
                                      x2="0"
                                      y2="1"
                                    >
                                      <stop
                                        offset="0%"
                                        stopColor={toHsla(
                                          standardColor.gradient1,
                                          0.85,
                                        )}
                                      />
                                      <stop
                                        offset="100%"
                                        stopColor={toHsla(
                                          standardColor.gradient2,
                                          0.92,
                                        )}
                                      />
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
                                  const standardColor =
                                    getCategoryStandardColor(item.cor);
                                  return (
                                    <Cell
                                      key={item.id}
                                      fill={`url(#slideGrad-${item.id})`}
                                      stroke={standardColor.border}
                                      strokeWidth={1.5}
                                    />
                                  );
                                })}
                              </Pie>
                              <Tooltip
                                content={renderCategoryPieTooltip}
                                cursor={false}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </section>
            )}

            {chartsSlideTab === "comparativo" && (
            <section
              className="rounded-xl border shadow-sm flex flex-col overflow-hidden"
              style={{
                flex: "1 1 0",
                minHeight: 0,
                padding: `${Math.max(10, slideInnerPadding + 2)}px`,
                background: "var(--bg-surface)",
                borderColor: "var(--border-default)",
              }}
            >
              <div className="flex-1 min-h-0">
                {categoryComparisonData.length === 0 ? (
                  <p
                    className="text-sm text-center pt-8"
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    Sem histórico para comparar com {previousMonthShortLabel}
                  </p>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={categoryComparisonData}
                      margin={{ top: 12, right: 8, left: 0, bottom: 4 }}
                      barGap={2}
                    >
                      <CartesianGrid
                        strokeDasharray="4 10"
                        vertical={false}
                        stroke="#e7e9f0"
                      />
                      <XAxis
                        dataKey="shortName"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 11, fill: "#767c93" }}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={formatChartAxisTick}
                        tick={{ fontSize: 11, fill: "#767c93" }}
                        width={32}
                      />
                      <Tooltip
                        content={renderCategoryComparisonTooltip}
                        cursor={{
                          fill: "rgba(79, 70, 229, 0.06)",
                        }}
                      />
                      <Bar
                        dataKey="previousTotal"
                        name={`Mês anterior (${previousMonthShortLabel})`}
                        radius={[4, 4, 0, 0]}
                      >
                        {categoryComparisonData.map((item) => {
                          const standardColor = getCategoryStandardColor(
                            item.cor,
                          );
                          return (
                            <Cell
                              key={`previous-bar-${item.id}`}
                              fill={standardColor.gradient1}
                              stroke={standardColor.border}
                              strokeWidth={1}
                            />
                          );
                        })}
                      </Bar>
                      <Bar
                        dataKey="currentTotal"
                        name={`Mês atual (${currentMonthShortLabel})`}
                        radius={[4, 4, 0, 0]}
                      >
                        {categoryComparisonData.map((item) => {
                          const standardColor = getCategoryStandardColor(
                            item.cor,
                          );
                          return (
                            <Cell
                              key={`current-bar-${item.id}`}
                              fill={standardColor.border}
                              stroke={standardColor.text}
                              strokeWidth={1}
                            />
                          );
                        })}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </section>
            )}
          </div>
        </div>
      ) : (
        <div
          className="grid h-full"
          style={{
            rowGap: `${dashboardGap}px`,
            gridTemplateRows: `${hSecao1}px ${hSecao2}px ${hSecao3}px`,
          }}
        >
          <section
            ref={summaryRef}
            className="grid grid-cols-3 min-h-0"
            style={{ columnGap: `${sectionGap}px` }}
          >
            <article
              className="col-span-2 border rounded-2xl p-2 min-h-0 flex flex-col cursor-pointer"
              style={{
                background: "var(--bg-surface)",
                borderColor: "var(--border-default)",
                boxShadow: "var(--shadow-panel)",
              }}
              onClick={() => setActiveSlide("charts")}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setActiveSlide("charts");
                }
              }}
              aria-label="Ver análise gráfica detalhada"
            >
              <div className="flex-1 min-h-0 cursor-pointer">
                {chartData.length === 0 ? (
                  <div
                    className="h-full rounded-xl border flex items-center justify-center px-6 text-center"
                    style={{
                      borderColor: "var(--border-default)",
                      background: "var(--bg-surface-sunken)",
                    }}
                  >
                    <p
                      className="text-sm"
                      style={{ color: "var(--text-tertiary)" }}
                    >
                      Ainda não há dados no período para montar o gráfico de
                      monitoramento.
                    </p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={chartMargin}>
                      <defs>
                        <linearGradient
                          id="colorReceitaRedesign"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="0%"
                            stopColor={CHART_THEME_COLORS.entrada.fill}
                            stopOpacity={0.28}
                          />
                          <stop
                            offset="100%"
                            stopColor={CHART_THEME_COLORS.entrada.fill}
                            stopOpacity={0.02}
                          />
                        </linearGradient>
                        <linearGradient
                          id="colorDespesaRedesign"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="0%"
                            stopColor={CHART_THEME_COLORS.saida.fill}
                            stopOpacity={0.24}
                          />
                          <stop
                            offset="100%"
                            stopColor={CHART_THEME_COLORS.saida.fill}
                            stopOpacity={0.02}
                          />
                        </linearGradient>
                        <linearGradient
                          id="colorSaldoRedesign"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor={CHART_THEME_COLORS.saldo.fill}
                            stopOpacity={0.1}
                          />
                          <stop
                            offset="95%"
                            stopColor={CHART_THEME_COLORS.saldo.fill}
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="4 10"
                        vertical={false}
                        stroke="#e7e9f0"
                      />
                      <XAxis
                        dataKey="data"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: chartTickFontSize, fill: "#767c93" }}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        domain={[0, chartYAxisMax]}
                        ticks={chartYTicks}
                        tickFormatter={formatChartAxisTick}
                        tick={{ fontSize: chartTickFontSize, fill: "#767c93" }}
                        width={chartYAxisWidth}
                      />
                      <Tooltip
                        content={renderChartTooltip}
                        cursor={{
                          stroke: "#c4c9da",
                          strokeWidth: 2,
                          strokeDasharray: "6 6",
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="entrada"
                        fill="url(#colorReceitaRedesign)"
                        stroke="none"
                        isAnimationActive={false}
                        name="entrada"
                      />
                      <Area
                        type="monotone"
                        dataKey="saida"
                        fill="url(#colorDespesaRedesign)"
                        stroke="none"
                        isAnimationActive={false}
                        name="saida"
                      />
                      <Area
                        type="monotone"
                        dataKey="saldo"
                        stroke="none"
                        fill="url(#colorSaldoRedesign)"
                        isAnimationActive={false}
                        name="saldo"
                      />
                      <Line
                        type="monotone"
                        dataKey="entrada"
                        stroke={CHART_THEME_COLORS.entrada.fill}
                        strokeWidth={2}
                        dot={false}
                        activeDot={{
                          r: 5,
                          fill: CHART_THEME_COLORS.entrada.fill,
                          stroke: "#ffffff",
                          strokeWidth: 2,
                        }}
                        name="entrada"
                      />
                      <Line
                        type="monotone"
                        dataKey="saida"
                        stroke={CHART_THEME_COLORS.saida.fill}
                        strokeWidth={2}
                        dot={false}
                        activeDot={{
                          r: 5,
                          fill: CHART_THEME_COLORS.saida.fill,
                          stroke: "#ffffff",
                          strokeWidth: 2,
                        }}
                        name="saida"
                      />
                      <Line
                        type="monotone"
                        dataKey="saldo"
                        stroke={CHART_THEME_COLORS.saldo.fill}
                        strokeWidth={2}
                        dot={false}
                        name="saldo"
                        style={{ opacity: 0.6 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </article>

            <article
              className="col-span-1 rounded-xl border p-5 min-h-0 flex flex-col gap-3 cursor-pointer"
              style={{
                background: "var(--bg-surface)",
                borderColor: "var(--border-default)",
                boxShadow: "var(--shadow-panel)",
              }}
              onClick={() => setActiveSlide("cards")}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  setActiveSlide("cards");
                }
              }}
              role="button"
              tabIndex={0}
              aria-label="Abrir slide de gestão dos cartões"
            >
              <div className="uiux-card-premium-wrap flex-1">
                {isCardSummaryLoading ? (
                  <div
                    className="uiux-card-state-box"
                    role="status"
                    aria-live="polite"
                  >
                    <p
                      className="text-sm font-medium"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      Carregando cartão...
                    </p>
                  </div>
                ) : !cardSummary ? (
                  <div className="uiux-card-state-box">
                    <p
                      className="text-sm font-semibold"
                      style={{ color: "var(--text-primary)" }}
                    >
                      Nenhum cartão ativo encontrado.
                    </p>
                    <p
                      className="text-xs mt-1"
                      style={{ color: "var(--text-tertiary)" }}
                    >
                      Cadastre um cartão para visualizar limite, fechamento e
                      vencimento.
                    </p>
                  </div>
                ) : (
                  <div
                    className="uiux-card-stack"
                    aria-label="Resumo visual do cartão"
                  >
                    {backCardSummaries.map((item, index) => (
                      <button
                        key={
                          item?.cartao?.id ||
                          item?.cartao?.nome ||
                          `back-card-${index}`
                        }
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          handleBringCardToFront(index + 1);
                        }}
                        className={`uiux-card-layer uiux-card-layer-back-clickable ${index === 0 ? "uiux-card-layer-back-1" : "uiux-card-layer-back-2"}`}
                        aria-label={`Selecionar cartão ${item?.cartao?.nome || "secundário"}`}
                        style={getBackLayerStyle(
                          normalizeCardTheme(item?.cartao?.corTema),
                          index,
                        )}
                      >
                        <p
                          className="uiux-card-layer-back-name"
                          style={{
                            color: getThemePalette(
                              normalizeCardTheme(item?.cartao?.corTema),
                            ).backName,
                          }}
                        >
                          {item?.cartao?.nome || ""}
                        </p>
                      </button>
                    ))}

                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        setActiveSlide("cards");
                      }}
                      className="uiux-card-layer uiux-card-layer-front uiux-card-layer-front-clickable"
                      aria-label="Abrir gestão do cartão"
                      style={getFrontLayerStyle(activeCardTheme)}
                    >
                      <p
                        className="uiux-card-fatura-label"
                        style={{ color: activeCardPalette.usedText }}
                      >
                        Fatura de {currentMonthLabel}
                      </p>

                      <div className="uiux-card-top-row">
                        <p
                          className="uiux-card-value-used"
                          style={{ color: activeCardPalette.usedText }}
                        >
                          {formatCurrency(cardLimitUsed)}
                        </p>
                        <p className="uiux-card-value-limit">
                          {formatCurrency(cardLimitTotal)}
                        </p>
                      </div>

                      <div
                        className="uiux-card-progress-track"
                        role="progressbar"
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={Math.round(cardUsagePercent)}
                        aria-label="Uso do limite do cartão"
                        style={{
                          borderColor: activeCardPalette.progressTrackBorder,
                          background: `linear-gradient(90deg, ${activeCardPalette.progressTrackStart} 0%, ${activeCardPalette.progressTrackEnd} 100%)`,
                        }}
                      >
                        <div
                          className={`uiux-card-progress-fill ${cardUsagePercent <= 0 ? "uiux-card-progress-fill-empty" : ""}`}
                          style={{
                            width: `${cardUsagePercent}%`,
                            borderColor: activeCardPalette.progressFillBorder,
                            background: `linear-gradient(90deg, ${activeCardPalette.progressFillStart} 0%, ${activeCardPalette.progressFillEnd} 100%)`,
                          }}
                        />
                      </div>

                      <div className="uiux-card-footer-row">
                        <p
                          className="uiux-card-name"
                          style={{ color: activeCardPalette.cardName }}
                        >
                          {cardSummary.cartao?.nome || "Cartão"}
                        </p>
                        <div
                          className="uiux-card-cycle"
                          aria-label="Dados de fechamento e vencimento"
                        >
                          <p>
                            Fechamento{" "}
                            {String(
                              cardSummary.cartao?.diaFechamento || "-",
                            ).padStart(2, "0")}
                          </p>
                          <p>
                            Vencimento{" "}
                            {String(
                              cardSummary.cartao?.diaVencimento || "-",
                            ).padStart(2, "0")}
                          </p>
                        </div>
                      </div>
                    </button>
                  </div>
                )}
              </div>

              {cardSummaryError ? (
                <p
                  className="mt-1 text-xs"
                  style={{ color: "var(--danger-700)" }}
                >
                  {cardSummaryError}
                </p>
              ) : null}
            </article>
          </section>

          <section
            ref={planningRef}
            className="grid grid-cols-3 min-h-0"
            style={{ columnGap: `${sectionGap}px` }}
          >
            <article
              className="col-span-1 border rounded-2xl p-4 shadow-sm min-h-0 flex flex-col overflow-hidden"
              style={{
                background: "var(--bg-surface)",
                borderColor: "var(--border-default)",
              }}
            >
              <div className="flex items-center gap-1 flex-shrink-0 overflow-x-auto">
                {[
                  { id: "despesas", label: "Despesas" },
                  { id: "receitas", label: "Receitas" },
                  ...(linkedGoals.length > 0
                    ? [{ id: "metas", label: "Metas" }]
                    : []),
                  ...(vehicleInsights.length > 0
                    ? [{ id: "veiculo", label: "Veículo" }]
                    : []),
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setHomeWidgetTab(tab.id)}
                    className="rounded-full px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap transition-colors"
                    style={
                      homeWidgetTab === tab.id
                        ? {
                            background: "var(--accent-50)",
                            color: "var(--accent-600)",
                          }
                        : { color: "var(--text-tertiary)" }
                    }
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {(homeWidgetTab === "despesas" || homeWidgetTab === "receitas") && (
                <div className="flex-1 overflow-y-auto pt-2 space-y-2">
                  {(homeWidgetTab === "receitas"
                    ? upcomingReceipts
                    : upcomingPayments
                  ).length === 0 ? (
                    <p
                      className="text-xs text-center py-4"
                      style={{ color: "var(--text-tertiary)" }}
                    >
                      Nenhum item no período
                    </p>
                  ) : (
                    (homeWidgetTab === "receitas"
                      ? upcomingReceipts
                      : upcomingPayments
                    ).map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setActiveSlide("transactions")}
                        className="w-full rounded-lg flex items-center justify-between gap-2 text-left"
                      >
                        <div className="flex-1 min-w-0 flex items-center gap-2">
                          <span className="text-base">{item.icone}</span>
                          <span
                            className="text-sm font-semibold whitespace-nowrap"
                            style={{ color: "var(--text-primary)" }}
                          >
                            {formatCurrency(item.value)}
                          </span>
                          <span
                            className="text-xs truncate"
                            style={{ color: "var(--text-tertiary)" }}
                            title={item.title}
                          >
                            {truncateWithThreeDots(
                              item.title,
                              UPCOMING_ITEM_TITLE_MAX_LENGTH,
                            )}
                          </span>
                        </div>
                        <span
                          className="text-xs whitespace-nowrap"
                          style={{ color: "var(--text-secondary)" }}
                        >
                          {formatDateLabel(item.dueDate)}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              )}

              {homeWidgetTab === "metas" && (
                <div className="flex-1 overflow-y-auto pt-2 space-y-3">
                  {linkedGoals.map((goal) => (
                    <div key={goal.id}>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span
                          className="truncate"
                          style={{ color: "var(--text-primary)" }}
                        >
                          {goal.nome}
                        </span>
                        <span
                          className="font-semibold whitespace-nowrap"
                          style={{ color: "var(--text-secondary)" }}
                        >
                          {Math.round(goal.percentual)}%
                        </span>
                      </div>
                      <div
                        className="h-1.5 rounded-full overflow-hidden"
                        style={{ background: "var(--bg-surface-sunken)" }}
                      >
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${Math.min(100, goal.percentual)}%`,
                            background: "var(--accent-600)",
                          }}
                        />
                      </div>
                      <p
                        className="text-[11px] mt-1"
                        style={{ color: "var(--text-tertiary)" }}
                      >
                        Faltam{" "}
                        {formatCurrency(
                          Math.max(0, goal.valor - Math.max(0, goal.valorAcumulado)),
                        )}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {homeWidgetTab === "veiculo" && (
                <div className="flex-1 overflow-y-auto pt-2 space-y-3">
                  {vehicleInsights.map((veiculo) => (
                    <div key={veiculo.id}>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span
                          className="truncate"
                          style={{ color: "var(--text-primary)" }}
                        >
                          {veiculo.nome}
                        </span>
                        {veiculo.alertaPendente ? (
                          <span
                            className="font-semibold whitespace-nowrap"
                            style={{ color: "var(--danger-700)" }}
                          >
                            Revisão pendente
                          </span>
                        ) : null}
                      </div>
                      <p
                        className="text-[11px]"
                        style={{ color: "var(--text-tertiary)" }}
                      >
                        {veiculo.kmAtual != null
                          ? `${veiculo.kmAtual.toLocaleString("pt-BR")} km rodados`
                          : "Sem quilometragem registrada"}
                        {veiculo.kmRestante != null && !veiculo.alertaPendente
                          ? ` · faltam ${veiculo.kmRestante.toLocaleString("pt-BR")} km pra revisão`
                          : ""}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </article>

            <div
              className="col-span-2 grid grid-rows-[auto_auto] min-h-0"
              style={{ rowGap: `${sectionGap}px` }}
            >
              <article
                className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4 cursor-pointer"
                onClick={() => setActiveSlide("transactions")}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setActiveSlide("transactions");
                  }
                }}
                role="button"
                tabIndex={0}
                aria-label="Abrir slide de movimentações"
              >
                <div
                  className="grid grid-cols-3"
                  style={{ columnGap: `${sectionGap}px` }}
                >
                  <div className="rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <span
                        className={`${kpiTitleClassName} font-light text-[var(--text-primary)] leading-none`}
                      >
                        Receitas
                      </span>
                      <span
                        className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${receitasTagClassName}`}
                      >
                        {formatVariationPercent(monthComparison.incomePercent)}
                      </span>
                    </div>
                    <p
                      className={`text-xs text-slate-500 mt-1 ${kpiHelperClampClassName}`}
                    >
                      Você recebeu{" "}
                      <span
                        className={`font-semibold ${receitasDiffColorClassName}`}
                      >
                        {formatCurrency(Math.abs(monthComparison.incomeDiff))}
                      </span>{" "}
                      {receitasDiffDirection} este mês
                    </p>
                    <p
                      className={`${kpiValueClassName} font-bold text-[var(--text-primary)] mt-1`}
                    >
                      {formatCurrency(totalIncome)}
                    </p>
                  </div>
                  <div className="rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <span
                        className={`${kpiTitleClassName} font-light text-[var(--text-primary)] leading-none`}
                      >
                        Despesas
                      </span>
                      <span
                        className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${despesasTagClassName}`}
                      >
                        {formatVariationPercent(monthComparison.expensePercent)}
                      </span>
                    </div>
                    <p
                      className={`text-xs text-slate-500 mt-1 ${kpiHelperClampClassName}`}
                    >
                      Você gastou{" "}
                      <span
                        className={`font-semibold ${despesasDiffColorClassName}`}
                      >
                        {formatCurrency(Math.abs(monthComparison.expenseDiff))}
                      </span>{" "}
                      {despesasDiffDirection} este mês
                    </p>
                    <p
                      className={`${kpiValueClassName} font-bold text-[var(--text-primary)] mt-1`}
                    >
                      {formatCurrency(totalExpense)}
                    </p>
                  </div>
                  <div className="rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <span
                        className={`${kpiTitleClassName} font-light text-[var(--text-primary)] leading-none`}
                      >
                        Saldo do mês
                      </span>
                      <span
                        className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${saldoTagClassName}`}
                      >
                        {formatVariationPercent(monthComparison.balancePercent)}
                      </span>
                    </div>
                    <p
                      className={`text-xs text-slate-500 mt-1 ${kpiHelperClampClassName}`}
                    >
                      Seu saldo ficou{" "}
                      <span
                        className={`font-semibold ${saldoDiffColorClassName}`}
                      >
                        {formatCurrency(Math.abs(monthComparison.balanceDiff))}
                      </span>{" "}
                      {saldoDiffDirection} este mês
                    </p>
                    <p
                      className={`${kpiValueClassName} font-bold text-[var(--text-primary)] mt-1`}
                    >
                      {formatCurrency(monthComparison.currentBalance)}
                    </p>
                  </div>
                </div>
              </article>

              <article
                className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4 min-h-0 cursor-pointer"
                onClick={() => setActiveSlide("investments")}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setActiveSlide("investments");
                  }
                }}
                role="button"
                tabIndex={0}
                aria-label="Abrir slide de investimentos"
              >
                <div className="rounded-lg p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <div
                        className={`${kpiTitleClassName} font-light text-[var(--text-primary)] leading-none`}
                      >
                        Investimentos
                      </div>
                      <p
                        className={`${kpiValueClassName} font-bold text-slate-800 leading-none`}
                      >
                        {formatCurrency(totalInvestmentsBalance)}
                      </p>
                      <span
                        className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${investimentosTagClassName}`}
                      >
                        {formatVariationPercent(
                          monthComparison.investmentPercent,
                        )}
                      </span>
                    </div>

                    <div
                      className={`text-right text-xs text-slate-500 ${kpiHelperClampClassName}`}
                    >
                      {monthComparison.currentInvestment <= 0 ? (
                        <span
                          className="font-semibold"
                          style={{ color: "var(--danger-700)" }}
                        >
                          Você não investiu este mês
                        </span>
                      ) : (
                        <span>
                          Você investiu{" "}
                          <span
                            className={`font-semibold ${investimentoDiffColorClassName}`}
                          >
                            {formatCurrency(
                              Math.abs(monthComparison.investmentDiff),
                            )}
                          </span>{" "}
                          {investimentoDiffDirection} esse mês
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </article>
            </div>
          </section>

          <section
            ref={reviewRef}
            className="grid grid-cols-2 min-h-0 self-start"
            style={{ columnGap: `${sectionGap}px` }}
          >
            <div className="min-h-0 order-2">
              <article
                className="bg-white border border-slate-200 rounded-xl shadow-sm h-full overflow-hidden flex flex-col p-4 cursor-pointer"
                style={{
                  minHeight: `${sectionThreeCardMinHeight}px`,
                  maxHeight: `${sectionThreeMaxHeight}px`,
                }}
                onClick={() => setActiveSlide("charts")}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setActiveSlide("charts");
                  }
                }}
                role="button"
                tabIndex={0}
                aria-label="Ver análise de categorias detalhada"
              >
                <div className="sticky top-0 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                    Gastos por Categoria
                  </h3>
                </div>
                <div className="flex-1 min-h-0 grid grid-cols-2 gap-4 pt-2">
                  {categoryRanking.length === 0 ? (
                    <p className="text-sm text-slate-500 col-span-2">
                      Nenhum gasto registrado neste mês
                    </p>
                  ) : (
                    <>
                      <div className="overflow-y-auto pr-1 space-y-3">
                        {categoryRanking.map((item) => {
                          const standardColor = getCategoryStandardColor(
                            item.cor,
                          );
                          return (
                            <div key={item.id} className="rounded-lg space-y-1">
                              <span
                                className="text-xs font-medium block truncate"
                                style={{ color: "var(--text-primary)" }}
                              >
                                {item.icone ? `${item.icone} ` : ""}
                                {item.nome}
                              </span>
                              <div
                                className="h-5 rounded-full border overflow-hidden"
                                style={{
                                  borderColor: "var(--border-subtle)",
                                  background: `linear-gradient(180deg, ${toRgba(standardColor.gradient1, 0.2)} 0%, ${toRgba(
                                    standardColor.gradient2,
                                    0.75,
                                  )} 100%)`,
                                }}
                              >
                                <div
                                  className="h-full rounded-full border"
                                  style={{
                                    width: `${Math.min(
                                      100,
                                      (item.total /
                                        (item.limite > 0
                                          ? item.limite
                                          : item.total || 1)) *
                                        100,
                                    )}%`,
                                    borderColor: standardColor.border,
                                    background: `linear-gradient(180deg, ${standardColor.gradient1} 0%, ${standardColor.gradient2} 100%)`,
                                  }}
                                />
                              </div>
                              <div className="flex items-center justify-between text-xs">
                                <span style={{ color: standardColor.text }}>
                                  {formatCurrency(item.total)}
                                </span>
                                {item.limite > 0 ? (
                                  <span className="font-semibold text-[var(--text-tertiary)]">
                                    de {formatCurrency(item.limite)}
                                  </span>
                                ) : null}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <div className="min-h-0 flex items-center justify-center cursor-pointer">
                        {categoryPieData.length === 0 ? (
                          <p className="text-xs text-slate-500 text-center">
                            Sem dados para gráfico
                          </p>
                        ) : (
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={categoryPieData}
                                dataKey="total"
                                nameKey="nome"
                                innerRadius={40}
                                outerRadius={90}
                                paddingAngle={dashboardPiePaddingAngle}
                                cornerRadius={dashboardPieCornerRadius}
                                stroke="none"
                                label={renderCategoryPieIconLabel}
                                labelLine={false}
                              >
                                {categoryPieData.map((item) => {
                                  const standardColor =
                                    getCategoryStandardColor(item.cor);
                                  return (
                                    <Cell
                                      key={item.id}
                                      fill={`url(#categoriaGradient-${item.id})`}
                                      stroke={standardColor.border}
                                      strokeWidth={1.5}
                                    />
                                  );
                                })}
                              </Pie>
                              <Tooltip
                                content={renderCategoryPieTooltip}
                                cursor={false}
                              />
                              <defs>
                                {categoryPieData.map((item) => {
                                  const standardColor =
                                    getCategoryStandardColor(item.cor);
                                  return (
                                    <linearGradient
                                      key={`categoriaGradient-${item.id}`}
                                      id={`categoriaGradient-${item.id}`}
                                      x1="0"
                                      y1="0"
                                      x2="0"
                                      y2="1"
                                    >
                                      <stop
                                        offset="0%"
                                        stopColor={toHsla(
                                          standardColor.gradient1,
                                          0.85,
                                        )}
                                      />
                                      <stop
                                        offset="100%"
                                        stopColor={toHsla(
                                          standardColor.gradient2,
                                          0.92,
                                        )}
                                      />
                                    </linearGradient>
                                  );
                                })}
                              </defs>
                            </PieChart>
                          </ResponsiveContainer>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </article>
            </div>

            <article
              className="bg-white border border-slate-200 rounded-xl shadow-sm min-h-0 overflow-hidden order-1 flex flex-col p-4 cursor-pointer"
              style={{ maxHeight: `${sectionThreeMaxHeight}px` }}
              onClick={() => setActiveSlide("transactions")}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  setActiveSlide("transactions");
                }
              }}
              role="button"
              tabIndex={0}
              aria-label="Abrir slide de movimentações"
            >
              <div className="sticky top-0 flex items-center justify-between gap-2 flex-wrap">
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                  Movimentações
                </h3>
                <div className="flex items-center gap-2">
                  <input
                    type="search"
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    onClick={(event) => event.stopPropagation()}
                    placeholder="Buscar transação"
                    className="w-44 sm:w-56 px-2 py-1 rounded-md border border-[var(--border-default)] bg-transparent text-xs text-[var(--text-tertiary)] placeholder:text-[var(--text-tertiary)]"
                  />
                  <select
                    value={filterType}
                    onChange={(event) => setFilterType(event.target.value)}
                    onClick={(event) => event.stopPropagation()}
                    className="px-2 py-1 rounded-md border border-[var(--border-default)] bg-transparent text-xs text-[var(--text-tertiary)]"
                  >
                    <option value="todas">Todas</option>
                    <option value="entradas">Somente entradas</option>
                    <option value="saidas">Somente saídas</option>
                    <option value="simuladas">Somente simuladas</option>
                  </select>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto pt-2">
                <div className="space-y-3">
                  {sortedMovimentacoes.length === 0 ? (
                    <p className="text-sm text-slate-500">
                      Nenhuma movimentação encontrada.
                    </p>
                  ) : (
                    sortedMovimentacoes.map((item) => {
                      const isEntrada = (item.type || item.tipo) === "Entrada";
                      const iconClassName = isEntrada
                        ? "border border-[var(--success-border)] bg-[var(--success-100)] text-[var(--success-700)]"
                        : "border border-[var(--danger-border)] bg-[var(--danger-100)] text-[var(--danger-700)]";

                      return (
                        <div
                          key={item.id}
                          className="rounded-lg flex items-center justify-between gap-2"
                        >
                          <div className="flex-1 min-w-0 flex items-center gap-2">
                            <span
                              className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${iconClassName}`}
                            >
                              {isEntrada ? "↑" : "↓"}
                            </span>
                            <span className="text-base">
                              {item.categoria?.icone || "•"}
                            </span>
                            <span className="text-sm font-semibold text-[var(--text-primary)] whitespace-nowrap">
                              {formatCurrency(item.value || item.valor || 0)}
                            </span>
                            <span className="text-xs text-[var(--text-tertiary)] truncate">
                              {item.name || item.titulo}
                            </span>
                          </div>
                          <span className="text-xs text-[var(--text-secondary)] whitespace-nowrap">
                            {item.date || item.data
                              ? formatDateLabel(item.date || item.data)
                              : "--/--"}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </article>
          </section>
        </div>
      )}

      {simulatedTransactions.length > 0 ? (
        <div className="fixed bottom-4 left-4 z-40 bg-amber-50 border border-amber-300 rounded-xl px-3 py-2 flex items-center gap-2">
          <div className="text-xs font-medium text-amber-900">
            Simulação ativa — {simulatedTransactions.length} pendente(s)
          </div>
          <button
            type="button"
            onClick={() => setSimulatedTransactions([])}
            className="px-2 py-1 rounded-md bg-slate-200 text-slate-700 text-xs font-medium hover:bg-slate-300"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleApplySimulation}
            className="px-2 py-1 rounded-md bg-amber-500 text-white text-xs font-medium hover:bg-amber-600"
          >
            Aplicar tudo
          </button>
        </div>
      ) : null}

      <div className="fixed bottom-4 right-4 z-40 flex items-center gap-4">
        <button
          type="button"
          onClick={handlePreviousMonth}
          className="rounded-full w-12 h-12 shadow-lg flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2"
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border-default)",
            color: "var(--text-secondary)",
            "--tw-ring-color": "var(--accent-600)",
          }}
          aria-label="Mês anterior"
          title="Mês anterior"
        >
          <span className="text-xl leading-none">‹</span>
        </button>

        <div
          className="h-12 min-w-[84px] px-3 rounded-full shadow-lg flex items-center justify-center text-xs font-semibold uppercase tracking-[0.08em] pointer-events-none select-none"
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border-default)",
            color: "var(--text-secondary)",
          }}
        >
          {currentMonthLabel}
        </div>

        <button
          type="button"
          onClick={handleNextMonth}
          className="rounded-full w-12 h-12 shadow-lg flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2"
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border-default)",
            color: "var(--text-secondary)",
            "--tw-ring-color": "var(--accent-600)",
          }}
          aria-label="Próximo mês"
          title="Próximo mês"
        >
          <span className="text-xl leading-none">›</span>
        </button>

        <button
          type="button"
          onClick={handleOpenSimulation}
          className="rounded-full w-12 h-12 shadow-lg flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2"
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border-default)",
            color: "var(--text-secondary)",
            "--tw-ring-color": "var(--accent-600)",
          }}
          aria-label="Simular transação"
          title="Simular transação"
        >
          <Sparkles size={18} />
        </button>

        <button
          type="button"
          onClick={() => setIsExportModalOpen(true)}
          className="rounded-full w-12 h-12 shadow-lg flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2"
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border-default)",
            color: "var(--text-secondary)",
            "--tw-ring-color": "var(--accent-600)",
          }}
          aria-label="Exportar movimentações em CSV"
          title="Exportar CSV"
        >
          <Download size={18} />
        </button>

        <button
          type="button"
          onClick={handleOpenNewTransaction}
          className="rounded-full w-12 h-12 shadow-lg flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2"
          style={{
            background: "var(--accent-600)",
            color: "var(--text-on-accent)",
            "--tw-ring-color": "var(--accent-600)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "var(--accent-500)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "var(--accent-600)";
          }}
          aria-label="Adicionar nova transação"
        >
          <Plus size={20} />
        </button>
      </div>

      <ExportCsvModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        onConfirm={handleExportCsv}
        defaultStartDate={getMonthDateRange(selectedAno, selectedMes).startDate}
        defaultEndDate={getMonthDateRange(selectedAno, selectedMes).endDate}
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
        isSimulation={true}
      />

      {activeCardFormContext ? (
        <div className="fixed inset-0 z-50 bg-[rgba(18,20,28,0.55)] backdrop-blur-sm flex items-center justify-center p-4">
          <div
            ref={cardFormDialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="card-form-modal-title"
            tabIndex={-1}
            onKeyDown={handleCardFormDialogKeyDown}
            className="w-full max-w-md rounded-2xl p-6"
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border-default)",
              boxShadow: "var(--shadow-modal)",
            }}
          >
            <div className="flex items-center justify-between mb-5">
              <h2
                id="card-form-modal-title"
                className="text-lg font-semibold"
                style={{ color: "var(--text-primary)" }}
              >
                {activeCardFormContext.mode === "create"
                  ? "Novo cartão"
                  : `Editar ${activeCardFormContext.cardNome}`}
              </h2>
              <button
                type="button"
                onClick={() => setOpenCardFormId(null)}
                aria-label="Fechar"
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg transition-colors"
                style={{
                  border: "1px solid var(--border-default)",
                  color: "var(--text-tertiary)",
                }}
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
                    ? handleCreateCardFormChange(
                        activeCardFormContext.index,
                        "nome",
                        event.target.value,
                      )
                    : handleCardFormChange(
                        activeCardFormContext.cardId,
                        "nome",
                        event.target.value,
                      )
                }
                placeholder="Nome do cartão"
                className="col-span-2 px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2"
                style={{
                  border: "1px solid var(--border-default)",
                  color: "var(--text-primary)",
                  "--tw-ring-color": "var(--accent-600)",
                }}
                required
              />
              <input
                type="number"
                min="0"
                step="0.01"
                value={activeCardFormContext.values.limiteTotal}
                onChange={(event) =>
                  activeCardFormContext.mode === "create"
                    ? handleCreateCardFormChange(
                        activeCardFormContext.index,
                        "limiteTotal",
                        event.target.value,
                      )
                    : handleCardFormChange(
                        activeCardFormContext.cardId,
                        "limiteTotal",
                        event.target.value,
                      )
                }
                placeholder="Limite total"
                className="px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2"
                style={{
                  border: "1px solid var(--border-default)",
                  color: "var(--text-primary)",
                  "--tw-ring-color": "var(--accent-600)",
                }}
                required
              />
              <input
                type="color"
                value={activeCardFormContext.values.corTema || DEFAULT_CARD_THEME}
                onChange={(event) =>
                  activeCardFormContext.mode === "create"
                    ? handleCreateCardFormChange(
                        activeCardFormContext.index,
                        "corTema",
                        event.target.value,
                      )
                    : handleCardFormChange(
                        activeCardFormContext.cardId,
                        "corTema",
                        event.target.value,
                      )
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
                    ? handleCreateCardFormChange(
                        activeCardFormContext.index,
                        "diaFechamento",
                        event.target.value,
                      )
                    : handleCardFormChange(
                        activeCardFormContext.cardId,
                        "diaFechamento",
                        event.target.value,
                      )
                }
                placeholder="Dia fechamento"
                className="px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2"
                style={{
                  border: "1px solid var(--border-default)",
                  color: "var(--text-primary)",
                  "--tw-ring-color": "var(--accent-600)",
                }}
                required
              />
              <input
                type="number"
                min="1"
                max="31"
                value={activeCardFormContext.values.diaVencimento}
                onChange={(event) =>
                  activeCardFormContext.mode === "create"
                    ? handleCreateCardFormChange(
                        activeCardFormContext.index,
                        "diaVencimento",
                        event.target.value,
                      )
                    : handleCardFormChange(
                        activeCardFormContext.cardId,
                        "diaVencimento",
                        event.target.value,
                      )
                }
                placeholder="Dia vencimento"
                className="px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2"
                style={{
                  border: "1px solid var(--border-default)",
                  color: "var(--text-primary)",
                  "--tw-ring-color": "var(--accent-600)",
                }}
                required
              />

              {activeCardFormContext.statusMessage ? (
                <p
                  className="col-span-2 text-xs"
                  style={{
                    color: activeCardFormContext.statusMessage.includes(
                      "sucesso",
                    )
                      ? "var(--success-700)"
                      : "var(--danger-700)",
                  }}
                >
                  {activeCardFormContext.statusMessage}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={activeCardFormContext.isBusy}
                className="col-span-2 text-sm font-semibold rounded-lg px-4 py-2 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                style={{
                  background: "var(--accent-600)",
                  color: "var(--text-on-accent)",
                }}
              >
                {activeCardFormContext.isBusy
                  ? "Salvando..."
                  : activeCardFormContext.mode === "create"
                    ? "Salvar novo cartão"
                    : "Salvar alterações"}
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default DashboardDesktopRedesignView;
