import { useMemo, useRef, useState } from "react";
import {
  ChevronLeft,
  Download,
  Plus,
  RefreshCw,
  Sparkles,
  TrendingUp,
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
import ExportCsvModal from "./ExportCsvModal";
import TransactionModal from "./TransactionModal";
import InvestmentsView from "./InvestmentsView";

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
}) => {
  const [simulatedTransactions, setSimulatedTransactions] = useState([]);
  const [showUpcomingReceipts, setShowUpcomingReceipts] = useState(false);
  const [activeSlide, setActiveSlide] = useState(null);
  const [investmentSlideActions, setInvestmentSlideActions] = useState(null);
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
    exceededAlertsLeftColumn,
    exceededAlertsRightColumn,
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

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-slate-500">
        Carregando informações...
      </div>
    );
  }

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
          <div className="flex items-center justify-between gap-3 flex-shrink-0">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setActiveSlide(null)}
                className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#1e2340] border border-[#2a3554] text-[#b9bfd8] hover:bg-[#2a3554] transition-colors"
                aria-label="Voltar ao dashboard"
              >
                <ChevronLeft size={16} />
              </button>
              <h2 className="text-sm font-semibold text-[#b9bfd8]">
                Investimentos
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => investmentSlideActions?.openInvestmentModal?.()}
                className="inline-flex items-center gap-2 rounded-lg border border-[#26513f] bg-[#143325] px-3 py-2 text-sm font-semibold text-[#8ef0c6] hover:bg-[#194130] transition-colors"
              >
                <Plus size={14} /> Nova aplicação
              </button>
              <button
                type="button"
                onClick={() => investmentSlideActions?.openAporteModal?.()}
                disabled={!investmentSlideActions?.hasInvestments}
                className="inline-flex items-center gap-2 rounded-lg border border-[#2f4566] bg-[#151f34] px-3 py-2 text-sm font-semibold text-[#9ec2ff] hover:bg-[#1a2842] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <TrendingUp size={14} /> Novo aporte
              </button>
            </div>
          </div>

          <section
            className="min-h-0 grid grid-cols-1 xl:grid-cols-3 overflow-hidden rounded-2xl border border-[#33457a] bg-[radial-gradient(circle_at_12%_8%,rgba(90,118,199,0.2)_0%,rgba(33,44,78,0.16)_36%,rgba(16,23,44,0.88)_100%)] shadow-[inset_0_1px_0_rgba(163,182,255,0.05)]"
            style={{
              height: `${slideContentHeight}px`,
              gap: `${sectionGap}px`,
              padding: `${slideInnerPadding}px`,
            }}
          >
            <InvestmentsView
              investmentAmount={investmentAmount}
              investments={investments}
              fetchData={fetchData}
              isRedesign
              onRegisterActions={setInvestmentSlideActions}
            />
          </section>
        </div>
      ) : activeSlide === "cards" ? (
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
              className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#1e2340] border border-[#2a3554] text-[#b9bfd8] hover:bg-[#2a3554] transition-colors"
              aria-label="Voltar ao dashboard"
            >
              <ChevronLeft size={16} />
            </button>
            <h2 className="text-sm font-semibold text-[#b9bfd8]">
              Gestão dos Cartões
            </h2>
          </div>

          {cardSummaryError ? (
            <p
              className="text-xs"
              style={{ color: "var(--color-vermelho-text)" }}
            >
              {cardSummaryError}
            </p>
          ) : null}

          <section
            className="grid grid-cols-3 min-h-0 items-stretch overflow-hidden"
            style={{
              gap: `${sectionGap}px`,
              height: `${slideContentHeight}px`,
            }}
          >
            {cardColumns.map((summary, index) => {
              if (!summary?.cartao?.id) {
                const slotKey = String(index);
                const createFormId = `new-${slotKey}`;
                const isCreateOpen = openCardFormId === createFormId;
                const createFormValues =
                  newCardFormBySlot[slotKey] || getInitialCardCreateForm(index);
                const createStatusMessage = newCardStatusBySlot[slotKey];
                const isCreating = Boolean(isCreatingCardBySlot[slotKey]);

                return (
                  <article
                    key={`empty-card-column-${index}`}
                    className="rounded-xl border border-dashed border-[#324066] bg-[radial-gradient(circle_at_20%_0%,rgba(64,89,145,0.22)_0%,rgba(18,24,40,0.95)_45%),linear-gradient(145deg,rgba(18,24,40,0.98)_0%,rgba(17,22,38,0.95)_55%,rgba(14,19,34,0.98)_100%)] p-4 min-h-0 max-h-full overflow-y-auto flex flex-col items-center justify-center gap-3 shadow-[0_16px_30px_rgba(6,10,22,0.38)]"
                  >
                    <p className="text-sm text-[#9f9cb9] text-center">
                      Sem cartão nesta coluna.
                    </p>

                    <button
                      type="button"
                      onClick={() => {
                        setOpenCardFormId((current) =>
                          current === createFormId ? null : createFormId,
                        );
                        setNewCardFormBySlot((current) => ({
                          ...current,
                          [slotKey]:
                            current[slotKey] || getInitialCardCreateForm(index),
                        }));
                      }}
                      className="text-xs font-semibold text-[#8ef0c6] border border-[#26513f] rounded-lg px-3 py-2 bg-[#143325] hover:bg-[#194130] transition-colors"
                    >
                      {isCreateOpen ? "Fechar criação" : "Criar novo cartão"}
                    </button>

                    {isCreateOpen ? (
                      <form
                        onSubmit={(event) =>
                          handleCreateCardFormSubmit(event, index)
                        }
                        className="w-full rounded-xl border border-[#2a3554] bg-[linear-gradient(180deg,rgba(20,26,44,0.9)_0%,rgba(16,21,37,0.92)_100%)] p-3 grid grid-cols-2 gap-2"
                      >
                        <input
                          type="text"
                          value={createFormValues.nome}
                          onChange={(event) =>
                            handleCreateCardFormChange(
                              index,
                              "nome",
                              event.target.value,
                            )
                          }
                          placeholder="Nome do cartão"
                          className="col-span-2 px-2 py-1.5 rounded-md border border-[#2a3554] bg-transparent text-xs text-[#dbe3ff]"
                          required
                        />
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={createFormValues.limiteTotal}
                          onChange={(event) =>
                            handleCreateCardFormChange(
                              index,
                              "limiteTotal",
                              event.target.value,
                            )
                          }
                          placeholder="Limite total"
                          className="px-2 py-1.5 rounded-md border border-[#2a3554] bg-transparent text-xs text-[#dbe3ff]"
                          required
                        />
                        <input
                          type="color"
                          value={createFormValues.corTema || DEFAULT_CARD_THEME}
                          onChange={(event) =>
                            handleCreateCardFormChange(
                              index,
                              "corTema",
                              event.target.value,
                            )
                          }
                          className="h-8 rounded-md border border-[#2a3554] bg-transparent"
                        />
                        <input
                          type="number"
                          min="1"
                          max="31"
                          value={createFormValues.diaFechamento}
                          onChange={(event) =>
                            handleCreateCardFormChange(
                              index,
                              "diaFechamento",
                              event.target.value,
                            )
                          }
                          placeholder="Dia fechamento"
                          className="px-2 py-1.5 rounded-md border border-[#2a3554] bg-transparent text-xs text-[#dbe3ff]"
                          required
                        />
                        <input
                          type="number"
                          min="1"
                          max="31"
                          value={createFormValues.diaVencimento}
                          onChange={(event) =>
                            handleCreateCardFormChange(
                              index,
                              "diaVencimento",
                              event.target.value,
                            )
                          }
                          placeholder="Dia vencimento"
                          className="px-2 py-1.5 rounded-md border border-[#2a3554] bg-transparent text-xs text-[#dbe3ff]"
                          required
                        />
                        <button
                          type="submit"
                          disabled={isCreating}
                          className="col-span-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 disabled:cursor-not-allowed rounded-lg px-3 py-2"
                        >
                          {isCreating ? "Criando..." : "Salvar novo cartão"}
                        </button>
                      </form>
                    ) : null}

                    {createStatusMessage ? (
                      <p
                        className="text-xs text-center"
                        style={{
                          color: createStatusMessage.includes("sucesso")
                            ? "var(--color-verde-text)"
                            : "var(--color-vermelho-text)",
                        }}
                      >
                        {createStatusMessage}
                      </p>
                    ) : null}
                  </article>
                );
              }

              const card = summary.cartao;
              const cardId = String(card.id);
              const themeColor = normalizeCardTheme(card.corTema);
              const palette = getThemePalette(themeColor);
              const cardLimitTotal = Number(
                summary?.limite?.limiteTotal || card.limiteTotal || 0,
              );
              const cardLimitUsed = Number(
                summary?.limite?.limiteUtilizado ||
                  summary?.limite?.utilizado ||
                  summary?.limite?.Utilizado ||
                  0,
              );
              const cardUsagePercent =
                cardLimitTotal > 0
                  ? Math.min(
                      100,
                      Math.max(0, (cardLimitUsed / cardLimitTotal) * 100),
                    )
                  : 0;

              const cardMovements = (
                cardTransactionsById.get(cardId) || []
              ).slice(0, 8);

              const formValues = cardFormById[cardId] || {
                nome: card.nome || "",
                limiteTotal: String(card.limiteTotal || ""),
                diaFechamento: String(card.diaFechamento || ""),
                diaVencimento: String(card.diaVencimento || ""),
                corTema: normalizeCardTheme(card.corTema),
              };

              const statusMessage = cardFormStatusById[cardId];
              const isSaving = Boolean(isSavingCardById[cardId]);

              return (
                <article
                  key={cardId}
                  className="rounded-xl border border-[#324066] shadow-[0_16px_30px_rgba(6,10,22,0.45)] p-3 min-h-0 max-h-full overflow-y-auto flex flex-col gap-3 bg-[radial-gradient(circle_at_20%_0%,rgba(64,89,145,0.24)_0%,rgba(18,24,40,0.92)_42%),linear-gradient(145deg,rgba(18,24,40,0.98)_0%,rgba(17,22,38,0.95)_55%,rgba(14,19,34,0.98)_100%)]"
                >
                  <div
                    className="rounded-xl border p-3 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]"
                    style={getFrontLayerStyle(themeColor)}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p
                        className="text-sm font-semibold truncate"
                        style={{ color: palette.cardName }}
                      >
                        {card.nome || "Cartão"}
                      </p>
                      <span
                        className="text-xs font-medium"
                        style={{ color: palette.usedText }}
                      >
                        {Math.round(cardUsagePercent)}%
                      </span>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-xs">
                      <span style={{ color: palette.usedText }}>
                        Utilizado {formatCurrency(cardLimitUsed)}
                      </span>
                      <span style={{ color: palette.usedText }}>
                        Limite {formatCurrency(cardLimitTotal)}
                      </span>
                    </div>
                    <div className="mt-2 h-2 rounded-full border border-[#2a3554] overflow-hidden">
                      <div
                        className="h-full"
                        style={{
                          width: `${cardUsagePercent}%`,
                          background: `linear-gradient(90deg, ${palette.progressFillStart} 0%, ${palette.progressFillEnd} 100%)`,
                        }}
                      />
                    </div>
                    <div className="mt-2 flex items-center justify-between text-xs text-[#9f9cb9]">
                      <span>
                        Fechamento {String(card.diaFechamento).padStart(2, "0")}
                      </span>
                      <span>
                        Vencimento {String(card.diaVencimento).padStart(2, "0")}
                      </span>
                    </div>
                  </div>

                  <div className="rounded-xl border border-[#2a3554] bg-[linear-gradient(180deg,rgba(20,26,44,0.88)_0%,rgba(15,20,36,0.9)_100%)] p-3 min-h-0 flex-1 flex flex-col">
                    <h3 className="text-xs font-semibold text-[#b9bfd8] mb-2">
                      Movimentações do Cartão
                    </h3>
                    <div className="flex-1 min-h-0 overflow-y-auto space-y-2">
                      {cardMovements.length === 0 ? (
                        <p className="text-xs text-[#7f84a8]">
                          Nenhuma movimentação vinculada.
                        </p>
                      ) : (
                        cardMovements.map((item) => {
                          const isEntrada =
                            (item.type || item.tipo) === "Entrada";
                          return (
                            <div
                              key={item.id}
                              className="flex items-center justify-between gap-2"
                            >
                              <div className="min-w-0">
                                <p className="text-xs text-[#dbe3ff] truncate">
                                  {item.name || item.titulo || "Movimentação"}
                                </p>
                                <p className="text-[11px] text-[#7f84a8]">
                                  {item.date || item.data
                                    ? formatDateLabel(item.date || item.data)
                                    : "--/--"}
                                </p>
                              </div>
                              <span
                                className="text-xs font-semibold whitespace-nowrap"
                                style={{
                                  color: isEntrada
                                    ? "var(--color-verde-text)"
                                    : "var(--color-vermelho-text)",
                                }}
                              >
                                {isEntrada ? "+" : "-"}
                                {formatCurrency(item.value || item.valor || 0)}
                              </span>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setOpenCardFormId((current) =>
                          current === cardId ? null : cardId,
                        )
                      }
                      className="w-full text-xs font-medium text-[#cfd5f3] border border-[#2a3554] rounded-lg px-3 py-2 hover:bg-[#1e2340] transition-colors"
                    >
                      {openCardFormId === cardId
                        ? "Fechar Formulário"
                        : "Editar Cartão"}
                    </button>
                  </div>

                  {openCardFormId === cardId ? (
                    <form
                      onSubmit={(event) => handleCardFormSubmit(event, cardId)}
                      className="rounded-xl border border-[#2a3554] bg-[linear-gradient(180deg,rgba(20,26,44,0.9)_0%,rgba(16,21,37,0.92)_100%)] p-3 grid grid-cols-2 gap-2"
                    >
                      <input
                        type="text"
                        value={formValues.nome}
                        onChange={(event) =>
                          handleCardFormChange(
                            cardId,
                            "nome",
                            event.target.value,
                          )
                        }
                        placeholder="Nome do cartão"
                        className="col-span-2 px-2 py-1.5 rounded-md border border-[#2a3554] bg-transparent text-xs text-[#dbe3ff]"
                        required
                      />
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formValues.limiteTotal}
                        onChange={(event) =>
                          handleCardFormChange(
                            cardId,
                            "limiteTotal",
                            event.target.value,
                          )
                        }
                        placeholder="Limite total"
                        className="px-2 py-1.5 rounded-md border border-[#2a3554] bg-transparent text-xs text-[#dbe3ff]"
                        required
                      />
                      <input
                        type="color"
                        value={formValues.corTema || DEFAULT_CARD_THEME}
                        onChange={(event) =>
                          handleCardFormChange(
                            cardId,
                            "corTema",
                            event.target.value,
                          )
                        }
                        className="h-8 rounded-md border border-[#2a3554] bg-transparent"
                      />
                      <input
                        type="number"
                        min="1"
                        max="31"
                        value={formValues.diaFechamento}
                        onChange={(event) =>
                          handleCardFormChange(
                            cardId,
                            "diaFechamento",
                            event.target.value,
                          )
                        }
                        placeholder="Dia fechamento"
                        className="px-2 py-1.5 rounded-md border border-[#2a3554] bg-transparent text-xs text-[#dbe3ff]"
                        required
                      />
                      <input
                        type="number"
                        min="1"
                        max="31"
                        value={formValues.diaVencimento}
                        onChange={(event) =>
                          handleCardFormChange(
                            cardId,
                            "diaVencimento",
                            event.target.value,
                          )
                        }
                        placeholder="Dia vencimento"
                        className="px-2 py-1.5 rounded-md border border-[#2a3554] bg-transparent text-xs text-[#dbe3ff]"
                        required
                      />
                      <button
                        type="submit"
                        disabled={isSaving}
                        className="col-span-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 disabled:cursor-not-allowed rounded-lg px-3 py-2"
                      >
                        {isSaving ? "Salvando..." : "Salvar alterações"}
                      </button>
                    </form>
                  ) : null}

                  {statusMessage ? (
                    <p
                      className="text-xs"
                      style={{
                        color: statusMessage.includes("sucesso")
                          ? "var(--color-verde-text)"
                          : "var(--color-vermelho-text)",
                      }}
                    >
                      {statusMessage}
                    </p>
                  ) : null}
                </article>
              );
            })}
          </section>
        </div>
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
              className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#1e2340] border border-[#2a3554] text-[#b9bfd8] hover:bg-[#2a3554] transition-colors"
              aria-label="Voltar ao dashboard"
            >
              <ChevronLeft size={16} />
            </button>
            <h2 className="text-sm font-semibold text-[#b9bfd8]">
              Movimentações do Mês
            </h2>
            <button
              type="button"
              onClick={handleOpenNewTransaction}
              className="ml-auto inline-flex items-center gap-2 rounded-lg border border-[#26513f] bg-[#143325] px-3 py-2 text-xs font-semibold text-[#8ef0c6] hover:bg-[#194130] transition-colors"
            >
              <Plus size={14} /> Nova transação
            </button>
          </div>

          <section
            className="rounded-2xl border border-[#2a3554] bg-[linear-gradient(145deg,rgba(18,24,40,0.98)_0%,rgba(17,22,38,0.95)_55%,rgba(14,19,34,0.98)_100%)] shadow-sm min-h-0 overflow-hidden flex flex-col"
            style={{
              height: `${slideContentHeight}px`,
              padding: `${slideInnerPadding}px`,
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
                className="w-56 sm:w-72 px-2 py-1.5 rounded-md border border-[#6A6785] bg-transparent text-xs text-[#9f9cb9] placeholder:text-[#7f84a8]"
              />
              <select
                value={slideTransactionFilter}
                onChange={(event) =>
                  setSlideTransactionFilter(event.target.value)
                }
                className="px-2 py-1.5 rounded-md border border-[#6A6785] bg-transparent text-xs text-[#9f9cb9]"
              >
                <option value="todas">Todas</option>
                <option value="entradas">Somente entradas</option>
                <option value="saidas">Somente saídas</option>
              </select>
            </div>

            <div className="mt-3 flex-1 min-h-0 overflow-y-auto rounded-lg border border-[#2a3554]">
              {slideTransactions.length === 0 ? (
                <div className="h-full flex items-center justify-center px-6 text-center">
                  <p className="text-sm text-[#7f84a8]">
                    Nenhuma movimentação cadastrada para os filtros aplicados.
                  </p>
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#131a33] text-[10px] uppercase tracking-wider text-[#8f94b4] border-b border-[#2a3554]">
                      <th className="p-3 font-bold">Data</th>
                      <th className="p-3 font-bold">Título</th>
                      <th className="p-3 font-bold">Categoria</th>
                      <th className="p-3 font-bold">Valor</th>
                      <th className="p-3 font-bold">Tipo</th>
                      <th className="p-3 font-bold text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#202a4a]">
                    {slideTransactions.map((item) => {
                      const itemType = item.type || item.tipo;
                      const isEntrada = itemType === "Entrada";

                      return (
                        <tr
                          key={item.id}
                          className="hover:bg-[#141d36] transition-colors"
                        >
                          <td className="p-3 text-xs text-[#9f9cb9] whitespace-nowrap">
                            {item.date || item.data
                              ? formatDateLabel(item.date || item.data)
                              : "--/--"}
                          </td>
                          <td className="p-3">
                            <p className="text-sm font-semibold text-[#dbe3ff]">
                              {item.name || item.titulo || "Movimentação"}
                            </p>
                            <p className="text-xs text-[#7f84a8] truncate max-w-[320px]">
                              {item.description ||
                                item.descricao ||
                                "Sem descrição"}
                            </p>
                          </td>
                          <td className="p-3 text-xs text-[#9f9cb9]">
                            {item.categoria?.nome || "Sem categoria"}
                          </td>
                          <td
                            className="p-3 text-sm font-semibold whitespace-nowrap"
                            style={{
                              color: isEntrada
                                ? "var(--color-verde-text)"
                                : "var(--color-vermelho-text)",
                            }}
                          >
                            {isEntrada ? "+" : "-"}
                            {formatCurrency(item.value || item.valor || 0)}
                          </td>
                          <td className="p-3">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                isEntrada
                                  ? "bg-emerald-100 text-emerald-700"
                                  : "bg-rose-100 text-rose-700"
                              }`}
                            >
                              {itemType}
                            </span>
                          </td>
                          <td className="p-3">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => handleOpenEditTransaction(item)}
                                className="text-xs font-medium text-[#9ec2ff] border border-[#2f4566] rounded-md px-2 py-1 hover:bg-[#1a2842] transition-colors"
                              >
                                Editar
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteTransaction(item)}
                                className="text-xs font-medium text-[#f08f9f] border border-[#6b3040] rounded-md px-2 py-1 hover:bg-[#351e2a] transition-colors"
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
              className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#1e2340] border border-[#2a3554] text-[#b9bfd8] hover:bg-[#2a3554] transition-colors"
              aria-label="Voltar ao dashboard"
            >
              <ChevronLeft size={16} />
            </button>
            <h2 className="text-sm font-semibold text-[#b9bfd8]">
              Análise Gráfica
            </h2>
            <button
              type="button"
              onClick={(e) => onOpenCategoryManager(e.currentTarget)}
              className="ml-auto text-xs font-medium text-[#7f84a8] border border-[#2a3554] rounded-lg px-3 py-1.5 hover:bg-[#1e2340] transition-colors"
            >
              Gerenciar Categorias
            </button>
          </div>

          <div
            className="min-h-0 flex flex-col"
            style={{
              gap: `${sectionGap}px`,
              height: `${slideContentHeight}px`,
            }}
          >
            <section
              className="border rounded-2xl shadow-sm flex flex-col bg-[linear-gradient(145deg,rgba(18,24,40,0.98)_0%,rgba(17,22,38,0.95)_55%,rgba(14,19,34,0.98)_100%)] border-[#2a3554] overflow-hidden"
              style={{
                flex: "1 1 0",
                minHeight: 0,
                padding: `${slideInnerPadding}px`,
              }}
            >
              <div className="flex-1 min-h-0">
                {chartData.length === 0 ? (
                  <div className="h-full rounded-xl border border-[#2f3b5d] bg-[linear-gradient(160deg,rgba(17,23,39,0.82)_0%,rgba(15,20,36,0.9)_100%)] flex items-center justify-center px-6 text-center">
                    <p className="text-sm text-[#9fb0d3]">
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
                        stroke="#2a2f52"
                      />
                      <XAxis
                        dataKey="data"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: chartTickFontSize, fill: "#7f84a8" }}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        domain={[0, chartYAxisMax]}
                        ticks={chartYTicks}
                        tickFormatter={formatChartAxisTick}
                        tick={{ fontSize: chartTickFontSize, fill: "#7f84a8" }}
                        width={chartYAxisWidth}
                      />
                      <Tooltip
                        content={renderChartTooltip}
                        cursor={{
                          stroke: "#b9bfd8",
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
                        stroke={CHART_THEME_COLORS.entrada.line}
                        strokeWidth={2}
                        dot={false}
                        activeDot={{
                          r: 7,
                          fill: "#7aa8ff",
                          stroke: "#cfd5ff",
                          strokeWidth: 2,
                        }}
                        name="entrada"
                        style={{
                          filter: `drop-shadow(0 0 4px ${CHART_THEME_COLORS.entrada.glow})`,
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="saida"
                        stroke={CHART_THEME_COLORS.saida.line}
                        strokeWidth={2}
                        dot={false}
                        activeDot={{
                          r: 7,
                          fill: "#7aa8ff",
                          stroke: "#cfd5ff",
                          strokeWidth: 2,
                        }}
                        name="saida"
                        style={{
                          filter: `drop-shadow(0 0 4px ${CHART_THEME_COLORS.saida.glow})`,
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="saldo"
                        stroke={CHART_THEME_COLORS.saldo.line}
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

            <section
              className="rounded-xl border shadow-sm flex flex-col overflow-hidden bg-[linear-gradient(145deg,rgba(18,24,40,0.98)_0%,rgba(17,22,38,0.95)_55%,rgba(14,19,34,0.98)_100%)] border-[#2a3554]"
              style={{
                flex: "1 1 0",
                minHeight: 0,
                padding: `${Math.max(10, slideInnerPadding + 2)}px`,
              }}
            >
              <div className="flex-1 min-h-0">
                {slideCategoryRanking.length === 0 ? (
                  <p className="text-sm text-[#7f84a8]">
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
                              <p className="text-xs text-[#7f84a8]">
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
                                        borderColor: "#2F2C46",
                                        background: `linear-gradient(180deg, ${toRgba(standardColor.gradient1, 0.2)} 0%, ${toRgba(standardColor.gradient2, 0.75)} 100%)`,
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
                                      <span className="font-semibold text-[#6A6785] whitespace-nowrap">
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
                        {[
                          exceededAlertsLeftColumn,
                          exceededAlertsRightColumn,
                        ].map((alertsColumn, columnIndex) => (
                          <div
                            key={`exceeded-alerts-column-${columnIndex}`}
                            className="space-y-2"
                          >
                            {alertsColumn.length === 0 ? (
                              columnIndex === 0 ? (
                                <p className="text-xs text-[#7f84a8]">
                                  Nenhum limite excedido.
                                </p>
                              ) : null
                            ) : (
                              alertsColumn.map((item) => (
                                <p
                                  key={`alert-${item.id}`}
                                  className="text-xs font-medium"
                                  style={{
                                    color: "var(--color-vermelho-text)",
                                  }}
                                >
                                  <span
                                    style={{
                                      color: "var(--color-vermelho-text)",
                                    }}
                                  >
                                    Limite da categoria {item.nome} excedido em
                                  </span>{" "}
                                  <span
                                    className="font-semibold"
                                    style={{
                                      color: "var(--color-vermelho-text)",
                                    }}
                                  >
                                    {formatCurrency(item.total - item.limite)}
                                  </span>
                                  <span
                                    style={{
                                      color: "var(--color-vermelho-text)",
                                    }}
                                  >
                                    .
                                  </span>
                                </p>
                              ))
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="min-h-0 grid grid-cols-2 gap-3">
                      <div className="min-h-0 rounded-lg border border-[#2F2C46] bg-[linear-gradient(145deg,rgba(17,22,38,0.95)_0%,rgba(14,19,34,0.98)_100%)] p-2">
                        {slideCategoryPieData.length === 0 ? (
                          <p className="text-xs text-[#7f84a8] text-center pt-8">
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

                      <div className="min-h-0 rounded-lg border border-[#2F2C46] bg-[linear-gradient(145deg,rgba(17,22,38,0.95)_0%,rgba(14,19,34,0.98)_100%)] p-2">
                        {categoryComparisonData.length === 0 ? (
                          <p className="text-xs text-[#7f84a8] text-center pt-8">
                            Sem histórico para comparar com{" "}
                            {previousMonthShortLabel}
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
                                stroke="#2a2f52"
                              />
                              <XAxis
                                dataKey="shortName"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 9, fill: "#7f84a8" }}
                              />
                              <YAxis
                                axisLine={false}
                                tickLine={false}
                                tickFormatter={formatChartAxisTick}
                                tick={{ fontSize: 9, fill: "#7f84a8" }}
                                width={26}
                              />
                              <Tooltip
                                content={renderCategoryComparisonTooltip}
                                cursor={{
                                  fill: "rgba(185, 191, 216, 0.12)",
                                }}
                              />
                              <Bar
                                dataKey="previousTotal"
                                name={`Mês anterior (${previousMonthShortLabel})`}
                                radius={[4, 4, 0, 0]}
                              >
                                {categoryComparisonData.map((item) => {
                                  const standardColor =
                                    getCategoryStandardColor(item.cor);
                                  return (
                                    <Cell
                                      key={`previous-bar-${item.id}`}
                                      fill={toHsla(
                                        standardColor.gradient2,
                                        0.95,
                                      )}
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
                                  const standardColor =
                                    getCategoryStandardColor(item.cor);
                                  return (
                                    <Cell
                                      key={`current-bar-${item.id}`}
                                      fill={toHsla(
                                        standardColor.gradient1,
                                        0.95,
                                      )}
                                      stroke={standardColor.border}
                                      strokeWidth={1}
                                    />
                                  );
                                })}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </section>
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
              className="col-span-1 border rounded-2xl p-4 shadow-sm min-h-0 flex flex-col overflow-hidden bg-[linear-gradient(145deg,rgba(18,24,40,0.98)_0%,rgba(17,22,38,0.95)_55%,rgba(14,19,34,0.98)_100%)] border-[#2a3554] cursor-pointer"
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
              <div className="sticky top-0 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-[#b9bfd8]">
                  {showUpcomingReceipts
                    ? "Próximas receitas"
                    : "Próximas despesas"}
                </h3>
                <button
                  onClick={(event) => {
                    event.stopPropagation();
                    setShowUpcomingReceipts(!showUpcomingReceipts);
                  }}
                  className="hover:bg-[#3a4558] rounded-lg transition-colors duration-200"
                  title={showUpcomingReceipts ? "Ver despesas" : "Ver receitas"}
                >
                  <RefreshCw size={16} className="text-[#7f84a8]" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto pt-2 space-y-2">
                {(showUpcomingReceipts ? upcomingReceipts : upcomingPayments)
                  .length === 0 ? (
                  <p className="text-xs text-[#7f84a8] text-center py-4">
                    Nenhum item no período
                  </p>
                ) : (
                  (showUpcomingReceipts
                    ? upcomingReceipts
                    : upcomingPayments
                  ).map((item) => (
                    <div
                      key={item.id}
                      className="rounded-lg flex items-center justify-between gap-2"
                    >
                      <div className="flex-1 min-w-0 flex items-center gap-2">
                        <span className="text-base">{item.icone}</span>
                        <span className="text-sm font-semibold text-[#dbe3ff] whitespace-nowrap">
                          {formatCurrency(item.value)}
                        </span>
                        <span
                          className="text-xs text-[#7f84a8] truncate"
                          title={item.title}
                        >
                          {truncateWithThreeDots(
                            item.title,
                            UPCOMING_ITEM_TITLE_MAX_LENGTH,
                          )}
                        </span>
                      </div>
                      <span className="text-xs text-[#9f9cb9] whitespace-nowrap">
                        {formatDateLabel(item.dueDate)}
                      </span>
                    </div>
                  ))
                )}
              </div>
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
                        className={`${kpiTitleClassName} font-light text-[#b9bfd8] leading-none`}
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
                      className={`${kpiValueClassName} font-bold text-[#ABA8C2] mt-1`}
                    >
                      {formatCurrency(totalIncome)}
                    </p>
                  </div>
                  <div className="rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <span
                        className={`${kpiTitleClassName} font-light text-[#b9bfd8] leading-none`}
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
                      className={`${kpiValueClassName} font-bold text-[#ABA8C2] mt-1`}
                    >
                      {formatCurrency(totalExpense)}
                    </p>
                  </div>
                  <div className="rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <span
                        className={`${kpiTitleClassName} font-light text-[#b9bfd8] leading-none`}
                      >
                        Saldo total
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
                      className={`${kpiValueClassName} font-bold text-[#ABA8C2] mt-1`}
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
                        className={`${kpiTitleClassName} font-light text-[#b9bfd8] leading-none`}
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
                          style={{ color: "var(--color-vermelho-text)" }}
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
                  <h3 className="text-sm font-semibold text-[#b9bfd8]">
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
                              <div
                                className="h-5 rounded-full border overflow-hidden"
                                style={{
                                  borderColor: "#2F2C46",
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
                                <span className="font-semibold text-[#6A6785]">
                                  {formatCurrency(
                                    item.limite > 0 ? item.limite : item.total,
                                  )}
                                </span>
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
                <h3 className="text-sm font-semibold text-[#b9bfd8]">
                  Movimentações
                </h3>
                <div className="flex items-center gap-2">
                  <input
                    type="search"
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    onClick={(event) => event.stopPropagation()}
                    placeholder="Buscar transação"
                    className="w-44 sm:w-56 px-2 py-1 rounded-md border border-[#6A6785] bg-transparent text-xs text-[#6A6785] placeholder:text-[#6A6785]"
                  />
                  <select
                    value={filterType}
                    onChange={(event) => setFilterType(event.target.value)}
                    onClick={(event) => event.stopPropagation()}
                    className="px-2 py-1 rounded-md border border-[#6A6785] bg-transparent text-xs text-[#6A6785]"
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
                        ? "border border-[#4A7750] bg-[linear-gradient(180deg,#1C2F1D_0%,#101D11_100%)] text-[#4A7750]"
                        : "border border-[#895253] bg-[linear-gradient(180deg,#2F1C1D_0%,#1D1011_100%)] text-[#895253]";

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
                            <span className="text-sm font-semibold text-[#dbe3ff] whitespace-nowrap">
                              {formatCurrency(item.value || item.valor || 0)}
                            </span>
                            <span className="text-xs text-[#7f84a8] truncate">
                              {item.name || item.titulo}
                            </span>
                          </div>
                          <span className="text-xs text-[#9f9cb9] whitespace-nowrap">
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
          className="bg-slate-700 hover:bg-slate-600 text-white rounded-full w-12 h-12 shadow-lg flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
          aria-label="Mês anterior"
          title="Mês anterior"
        >
          <span className="text-xl leading-none">‹</span>
        </button>

        <div className="h-12 min-w-[84px] px-3 bg-[#171b40] border border-[#2f355d] text-[#cfd5f3] rounded-full shadow-lg flex items-center justify-center text-xs font-semibold uppercase tracking-[0.08em] pointer-events-none select-none">
          {currentMonthLabel}
        </div>

        <button
          type="button"
          onClick={handleNextMonth}
          className="bg-slate-700 hover:bg-slate-600 text-white rounded-full w-12 h-12 shadow-lg flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
          aria-label="Próximo mês"
          title="Próximo mês"
        >
          <span className="text-xl leading-none">›</span>
        </button>

        <button
          type="button"
          onClick={handleOpenSimulation}
          className="bg-amber-500 hover:bg-amber-600 text-white rounded-full w-12 h-12 shadow-lg flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
          aria-label="Simular transação"
          title="Simular transação"
        >
          <Sparkles size={18} />
        </button>

        <button
          type="button"
          onClick={() => setIsExportModalOpen(true)}
          className="bg-sky-500 hover:bg-sky-600 text-white rounded-full w-12 h-12 shadow-lg flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300"
          aria-label="Exportar movimentações em CSV"
          title="Exportar CSV"
        >
          <Download size={18} />
        </button>

        <button
          type="button"
          onClick={handleOpenNewTransaction}
          className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-full w-12 h-12 shadow-lg flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
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
    </div>
  );
};

export default DashboardDesktopRedesignView;
