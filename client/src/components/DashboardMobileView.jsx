import { useCallback, useEffect, useMemo, useState } from "react";
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

import { API_CARTAO_URL, extractApiErrorMessage } from "../services/api";
import { formatCurrency } from "../util/formatCurrency";
import TransactionModal from "./TransactionModal";

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
}) => {
  const [activeScreen, setActiveScreen] = useState("home");
  const [viewportWidth, setViewportWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 390,
  );
  const [cardSummaries, setCardSummaries] = useState([]);
  const [cardSummaryError, setCardSummaryError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [openCardPurchaseMode, setOpenCardPurchaseMode] = useState(false);
  const [expandedCardId, setExpandedCardId] = useState(null);
  const [isSimulatorExpanded, setIsSimulatorExpanded] = useState(false);
  const [simulatorForm, setSimulatorForm] = useState({
    aporteMensal: "500",
    taxaAnual: "12",
    periodoAnos: "10",
  });

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

      const multiResponse = await fetch(`${API_CARTAO_URL}/resumos`, {
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

      const response = await fetch(`${API_CARTAO_URL}/resumo`, {
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
  }, []);

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

  const latestTransactions = useMemo(
    () => allTransactions.slice(0, 5),
    [allTransactions],
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

  const simulatorResult = useMemo(() => {
    const aporte = Number(simulatorForm.aporteMensal || 0);
    const taxa = Number(simulatorForm.taxaAnual || 0) / 100;
    const anos = Number(simulatorForm.periodoAnos || 0);

    if (aporte <= 0 || anos <= 0) {
      return 0;
    }

    const totalMeses = anos * 12;
    const taxaMensal = taxa / 12;

    if (taxaMensal === 0) {
      return aporte * totalMeses;
    }

    return aporte * ((Math.pow(1 + taxaMensal, totalMeses) - 1) / taxaMensal);
  }, [simulatorForm]);

  const activeCardSummary = cardSummaries[0] || null;
  const activeCardName = activeCardSummary?.cartao?.nome || "Sem cartão ativo";
  const activeCardLimit = Number(
    activeCardSummary?.limite?.limiteTotal ||
      activeCardSummary?.cartao?.limiteTotal ||
      0,
  );
  const activeCardUsed = Number(
    activeCardSummary?.limite?.limiteUtilizado ||
      activeCardSummary?.limite?.utilizado ||
      activeCardSummary?.limite?.Utilizado ||
      0,
  );

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

  const screenMinHeight = `calc(100dvh - ${headerHeight}px - ${bottomNavHeight}px - env(safe-area-inset-top) - env(safe-area-inset-bottom))`;

  const renderHomeScreen = () => (
    <div className="flex flex-col" style={{ gap: `${sectionGap}px` }}>
      <section
        className="border border-[#2a3554] bg-[linear-gradient(145deg,rgba(26,38,72,0.96)_0%,rgba(17,26,49,0.94)_70%,rgba(14,21,42,0.98)_100%)]"
        style={{ borderRadius: `${cardRadius}px`, padding: `${cardPadding}px` }}
      >
        <p className="text-[11px] uppercase tracking-wide text-[#9ca8ca] m-0">
          Saldo atual
        </p>
        <p className="text-[26px] font-semibold text-[#eef3ff] m-0 mt-1">
          {formatCurrency(finalBalance)}
        </p>
        <p className={`m-0 mt-1 text-[#aeb9db] ${kpiHelperClassName}`}>
          Receitas {formatCurrency(totalIncome)} · Despesas{" "}
          {formatCurrency(totalExpenses)}
        </p>
      </section>

      <section className="grid grid-cols-3 gap-2">
        <article
          className="border border-[#2f4566] bg-[#101a31]"
          style={{
            borderRadius: `${cardRadius - 2}px`,
            padding: `${cardPadding - 2}px`,
          }}
        >
          <p className="m-0 text-[11px] text-[#8f97b8]">Receitas</p>
          <p className="m-0 mt-1 text-sm font-semibold text-emerald-300">
            {formatCurrency(totalIncome)}
          </p>
        </article>
        <article
          className="border border-[#5a2f3f] bg-[#1f1524]"
          style={{
            borderRadius: `${cardRadius - 2}px`,
            padding: `${cardPadding - 2}px`,
          }}
        >
          <p className="m-0 text-[11px] text-[#c3a2ad]">Despesas</p>
          <p className="m-0 mt-1 text-sm font-semibold text-rose-300">
            {formatCurrency(totalExpenses)}
          </p>
        </article>
        <article
          className="border border-[#334b68] bg-[#111a2f]"
          style={{
            borderRadius: `${cardRadius - 2}px`,
            padding: `${cardPadding - 2}px`,
          }}
        >
          <p className="m-0 text-[11px] text-[#9fb1cb]">Investimentos</p>
          <p className="m-0 mt-1 text-sm font-semibold text-sky-300">
            {formatCurrency(totalInvestmentsBalance)}
          </p>
          <p className="m-0 mt-0.5 text-[11px] text-[#8f9ec5]">
            {investments.length} ativos
          </p>
        </article>
      </section>

      <section
        className="border border-[#2a3554] bg-[#101a31]"
        style={{ borderRadius: `${cardRadius}px`, padding: `${cardPadding}px` }}
      >
        <p className="m-0 text-xs font-semibold text-[#dbe3ff]">Cartão ativo</p>
        <p className="m-0 mt-1 text-sm text-[#cdd6f4]">{activeCardName}</p>
        <p className={`m-0 mt-1 text-[#98a4c6] ${kpiHelperClassName}`}>
          Limite {formatCurrency(activeCardLimit)} · Utilizado{" "}
          {formatCurrency(activeCardUsed)}
        </p>
        {cardSummaryError ? (
          <p className="m-0 mt-1 text-[11px] text-rose-300">
            {cardSummaryError}
          </p>
        ) : null}
      </section>

      <section
        className="border border-[#2a3554] bg-[#101a31]"
        style={{ borderRadius: `${cardRadius}px`, padding: `${cardPadding}px` }}
      >
        <p className="m-0 text-xs font-semibold text-[#dbe3ff]">
          Próximos itens
        </p>
        <div className="mt-2 space-y-2">
          {upcomingItems.length === 0 ? (
            <p className={`m-0 text-[#8f97b8] ${kpiHelperClassName}`}>
              Sem próximas movimentações.
            </p>
          ) : (
            upcomingItems.map((item) => {
              const itemType = item.type || item.tipo;
              const isEntrada = itemType === "Entrada";
              return (
                <article
                  key={item.id}
                  className="flex items-center justify-between rounded-xl border border-[#2f3d5f] bg-[#111c34] px-3 py-2"
                >
                  <div>
                    <p className="m-0 text-xs text-[#d5ddf8]">
                      {item.name || item.titulo || "Movimentação"}
                    </p>
                    <p className="m-0 text-[11px] text-[#8f97b8]">
                      {formatDateLabel(item.date || item.data)}
                    </p>
                  </div>
                  <p
                    className={`m-0 text-xs font-semibold ${isEntrada ? "text-emerald-300" : "text-rose-300"}`}
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
        className="border border-[#2a3554] bg-[#101a31]"
        style={{ borderRadius: `${cardRadius}px`, padding: `${cardPadding}px` }}
      >
        <p className="m-0 text-xs font-semibold text-[#dbe3ff]">Categorias</p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {categoriesTop.length === 0 ? (
            <p className={`m-0 text-[#8f97b8] ${kpiHelperClassName}`}>
              Sem categorias no período.
            </p>
          ) : (
            categoriesTop.map((category) => (
              <article
                key={category.id}
                className="rounded-xl border border-[#2f3d5f] bg-[#111c34] px-2.5 py-2"
              >
                <p className="m-0 text-xs text-[#d5ddf8]">
                  {category.icone ? `${category.icone} ` : ""}
                  {category.nome}
                </p>
                <p className="m-0 mt-1 text-[11px] text-[#94a3cb]">
                  {formatCurrency(category.total)}
                </p>
              </article>
            ))
          )}
        </div>
      </section>

      <section
        className="border border-[#2a3554] bg-[#101a31]"
        style={{ borderRadius: `${cardRadius}px`, padding: `${cardPadding}px` }}
      >
        <p className="m-0 text-xs font-semibold text-[#dbe3ff]">
          Movimentações
        </p>
        <div className="mt-2 space-y-2">
          {latestTransactions.length === 0 ? (
            <p className={`m-0 text-[#8f97b8] ${kpiHelperClassName}`}>
              Sem movimentações cadastradas.
            </p>
          ) : (
            latestTransactions.map((item) => {
              const itemType = item.type || item.tipo;
              const isEntrada = itemType === "Entrada";
              return (
                <article
                  key={item.id}
                  className="flex items-center justify-between rounded-xl border border-[#2f3d5f] bg-[#111c34] px-3 py-2"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[#8fa2cf]">
                      {isEntrada ? (
                        <ArrowUpRight size={14} />
                      ) : (
                        <ArrowDownRight size={14} />
                      )}
                    </span>
                    <div>
                      <p className="m-0 text-xs text-[#d5ddf8]">
                        {item.name || item.titulo || "Movimentação"}
                      </p>
                      <p className="m-0 text-[11px] text-[#8f97b8]">
                        {formatDateLabel(item.date || item.data)}
                      </p>
                    </div>
                  </div>
                  <p
                    className={`m-0 text-xs font-semibold ${isEntrada ? "text-emerald-300" : "text-rose-300"}`}
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
    </div>
  );

  const renderChartsScreen = () => (
    <div className="flex flex-col" style={{ gap: `${sectionGap}px` }}>
      <section
        className="border border-[#2a3554] bg-[#101a31]"
        style={{ borderRadius: `${cardRadius}px`, padding: `${cardPadding}px` }}
      >
        <div className="flex items-center justify-between">
          <h2 className="m-0 text-sm font-semibold text-[#dbe3ff]">
            Fluxo do mês
          </h2>
          <p className="m-0 text-[11px] text-[#8f97b8]">Toque para leitura</p>
        </div>
        <div style={{ height: `${chartMinHeight}px` }} className="mt-2">
          {chartSeriesData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-xs text-[#8f97b8]">
              Sem dados para o período.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartSeriesData}>
                <XAxis dataKey="day" stroke="#8f97b8" fontSize={10} />
                <YAxis stroke="#8f97b8" fontSize={10} width={36} />
                <Tooltip
                  formatter={(value) => formatCurrency(Number(value || 0))}
                  contentStyle={{
                    background: "#15172a",
                    border: "1px solid #32375e",
                    borderRadius: "10px",
                    color: "#dbe3ff",
                    fontSize: "12px",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="entrada"
                  stroke="#00b884"
                  fill="rgba(0,184,132,0.32)"
                />
                <Area
                  type="monotone"
                  dataKey="saida"
                  stroke="#ff5c77"
                  fill="rgba(255,92,119,0.26)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>

      <section
        className="border border-[#2a3554] bg-[#101a31]"
        style={{ borderRadius: `${cardRadius}px`, padding: `${cardPadding}px` }}
      >
        <div className="flex items-center justify-between">
          <h2 className="m-0 text-sm font-semibold text-[#dbe3ff]">
            Despesas por categoria
          </h2>
          <p className="m-0 text-[11px] text-[#8f97b8]">Toque para leitura</p>
        </div>
        <div style={{ height: `${chartMinHeight}px` }} className="mt-2">
          {categorySpendChartData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-xs text-[#8f97b8]">
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
                  contentStyle={{
                    background: "#15172a",
                    border: "1px solid #32375e",
                    borderRadius: "10px",
                    color: "#dbe3ff",
                    fontSize: "12px",
                  }}
                />
              </RechartsPieChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>
    </div>
  );

  const renderCardsScreen = () => (
    <div className="flex flex-col" style={{ gap: `${sectionGap}px` }}>
      <section
        className="border border-[#2a3554] bg-[#101a31]"
        style={{ borderRadius: `${cardRadius}px`, padding: `${cardPadding}px` }}
      >
        <div className="flex items-center justify-between mb-2">
          <h2 className="m-0 text-sm font-semibold text-[#dbe3ff]">Cartões</h2>
          <p className="m-0 text-[11px] text-[#8f97b8]">Carrossel horizontal</p>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {(cardSummaries.length > 0 ? cardSummaries : [null]).map(
            (summary, index) => {
              const cardId = String(summary?.cartao?.id || `empty-${index}`);
              const cardName = summary?.cartao?.nome || "Sem cartão";
              const cardLimitTotal = Number(
                summary?.limite?.limiteTotal ||
                  summary?.cartao?.limiteTotal ||
                  0,
              );
              const cardLimitUsed = Number(
                summary?.limite?.limiteUtilizado ||
                  summary?.limite?.utilizado ||
                  summary?.limite?.Utilizado ||
                  0,
              );

              return (
                <article
                  key={cardId}
                  className="min-w-[280px] max-w-[300px] rounded-2xl border border-[#304161] bg-[linear-gradient(145deg,rgba(28,38,70,0.95)_0%,rgba(17,26,49,0.94)_70%,rgba(14,21,42,0.98)_100%)] p-3"
                >
                  <p className="m-0 text-xs text-[#dbe3ff] font-semibold">
                    {cardName}
                  </p>
                  <p className="m-0 mt-1 text-[11px] text-[#9aa8cc]">
                    Limite {formatCurrency(cardLimitTotal)}
                  </p>
                  <p className="m-0 mt-0.5 text-[11px] text-[#9aa8cc]">
                    Utilizado {formatCurrency(cardLimitUsed)}
                  </p>
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedCardId((current) =>
                        current === cardId ? null : cardId,
                      )
                    }
                    className="mt-3 h-11 w-full rounded-xl border border-[#3c5078] text-[#dbe3ff] text-sm font-medium flex items-center justify-center gap-1"
                  >
                    Ações
                    {expandedCardId === cardId ? (
                      <ChevronUp size={14} />
                    ) : (
                      <ChevronDown size={14} />
                    )}
                  </button>
                  {expandedCardId === cardId ? (
                    <div className="mt-2 space-y-2 rounded-xl border border-[#32486d] bg-[#0f1a31] p-2">
                      <button
                        type="button"
                        onClick={() => {
                          setOpenCardPurchaseMode(true);
                          setIsModalOpen(true);
                        }}
                        className="h-11 w-full rounded-lg border border-[#356150] text-[#8fe7c4] text-xs font-semibold"
                      >
                        Nova compra no cartão
                      </button>
                      <p className="m-0 text-[11px] text-[#8f97b8]">
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
    <div className="flex flex-col" style={{ gap: `${sectionGap}px` }}>
      <section
        className="border border-[#2a3554] bg-[#101a31]"
        style={{ borderRadius: `${cardRadius}px`, padding: `${cardPadding}px` }}
      >
        <h2 className="m-0 text-sm font-semibold text-[#dbe3ff]">
          Investimentos ativos
        </h2>
        <div className="mt-2 space-y-2">
          {investments.length === 0 ? (
            <p className="m-0 text-xs text-[#8f97b8]">
              Nenhum investimento ativo.
            </p>
          ) : (
            investments.map((investment) => (
              <article
                key={investment.id}
                className="rounded-xl border border-[#2f3d5f] bg-[#111c34] px-3 py-2"
              >
                <p className="m-0 text-xs font-semibold text-[#dbe3ff]">
                  {investment.nome}
                </p>
                <p className="m-0 mt-1 text-[11px] text-[#94a3cb]">
                  Saldo {formatCurrency(Number(investment.saldoAtual || 0))}
                </p>
              </article>
            ))
          )}
        </div>
      </section>

      <section
        className="border border-[#2a3554] bg-[#101a31]"
        style={{ borderRadius: `${cardRadius}px`, padding: `${cardPadding}px` }}
      >
        <button
          type="button"
          onClick={() => setIsSimulatorExpanded((value) => !value)}
          className="h-11 w-full rounded-xl border border-[#3c5078] text-[#dbe3ff] text-sm font-semibold flex items-center justify-between px-3"
        >
          Simulador de patrimônio
          {isSimulatorExpanded ? (
            <ChevronUp size={16} />
          ) : (
            <ChevronDown size={16} />
          )}
        </button>

        {isSimulatorExpanded ? (
          <div className="mt-3 space-y-2">
            <label className="block text-xs text-[#a4b1d6]">
              Aporte mensal
              <input
                type="number"
                value={simulatorForm.aporteMensal}
                onChange={(event) =>
                  setSimulatorForm((current) => ({
                    ...current,
                    aporteMensal: event.target.value,
                  }))
                }
                className="mt-1 h-11 w-full rounded-lg border border-[#334266] bg-[#111a2f] px-3 text-sm text-[#dbe3ff]"
              />
            </label>
            <label className="block text-xs text-[#a4b1d6]">
              Taxa anual (%)
              <input
                type="number"
                value={simulatorForm.taxaAnual}
                onChange={(event) =>
                  setSimulatorForm((current) => ({
                    ...current,
                    taxaAnual: event.target.value,
                  }))
                }
                className="mt-1 h-11 w-full rounded-lg border border-[#334266] bg-[#111a2f] px-3 text-sm text-[#dbe3ff]"
              />
            </label>
            <label className="block text-xs text-[#a4b1d6]">
              Período (anos)
              <input
                type="number"
                value={simulatorForm.periodoAnos}
                onChange={(event) =>
                  setSimulatorForm((current) => ({
                    ...current,
                    periodoAnos: event.target.value,
                  }))
                }
                className="mt-1 h-11 w-full rounded-lg border border-[#334266] bg-[#111a2f] px-3 text-sm text-[#dbe3ff]"
              />
            </label>
            <p className="m-0 rounded-xl border border-[#2f4566] bg-[#111c34] px-3 py-2 text-sm font-semibold text-[#8fe7c4]">
              Resultado estimado: {formatCurrency(simulatorResult)}
            </p>
          </div>
        ) : null}
      </section>
    </div>
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

  return (
    <div className="min-h-[100dvh] flex flex-col">
      <header
        className="px-3 flex items-center justify-between border-b border-[#2a3554] bg-[#101a33]/95"
        style={{
          height: `${headerHeight}px`,
          paddingTop: "max(8px, env(safe-area-inset-top))",
        }}
      >
        <button
          type="button"
          onClick={handlePreviousMonth}
          className="h-11 min-w-11 px-3 rounded-lg border border-[#2f3b5a] text-sm text-[#c8d1ee]"
        >
          Mes -
        </button>
        <p className="text-sm font-semibold text-[#dbe3ff] capitalize">
          {currentMonthLabel}
        </p>
        <button
          type="button"
          onClick={handleNextMonth}
          className="h-11 min-w-11 px-3 rounded-lg border border-[#2f3b5a] text-sm text-[#c8d1ee]"
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
          <p className="m-0 text-[11px] tracking-wide uppercase text-[#8f97b8]">
            {MOBILE_SCREEN_LABELS[activeScreen]}
          </p>
        </div>
        <div className="transition-opacity duration-200 ease-out opacity-100">
          {renderActiveScreen()}
        </div>
      </main>

      <nav
        className="fixed left-0 right-0 bottom-0 z-20 border-t border-[#2a3554] bg-[#101a33]/96 backdrop-blur-md px-3 pt-2 pb-[calc(8px+env(safe-area-inset-bottom))]"
        style={{ minHeight: `${bottomNavHeight}px` }}
      >
        <div className="grid grid-cols-5 items-center gap-2">
          <button
            type="button"
            className={`h-11 rounded-xl border flex items-center justify-center ${
              activeScreen === "home"
                ? "text-[#dbe3ff] bg-[#1a2849] border-[#314870]"
                : "text-[#96a7d9] border-[#2b3958]"
            }`}
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
            className={`h-11 rounded-xl border flex items-center justify-center ${
              activeScreen === "charts"
                ? "text-[#dbe3ff] bg-[#1a2849] border-[#314870]"
                : "text-[#96a7d9] border-[#2b3958]"
            }`}
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
            className="h-11 rounded-xl text-white bg-[#1f8b63] border border-[#2aa174] flex items-center justify-center"
            aria-label="Nova movimentação"
            onClick={() => {
              setOpenCardPurchaseMode(false);
              setIsModalOpen(true);
            }}
          >
            <Plus size={18} />
          </button>
          <button
            type="button"
            className={`h-11 rounded-xl border flex items-center justify-center ${
              activeScreen === "cards"
                ? "text-[#dbe3ff] bg-[#1a2849] border-[#314870]"
                : "text-[#96a7d9] border-[#2b3958]"
            }`}
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
            className={`h-11 rounded-xl border flex items-center justify-center ${
              activeScreen === "investments"
                ? "text-[#dbe3ff] bg-[#1a2849] border-[#314870]"
                : "text-[#96a7d9] border-[#2b3958]"
            }`}
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
          setOpenCardPurchaseMode(false);
        }}
        onSuccess={async () => {
          await fetchData?.({ silent: true });
          await loadCardSummaries();
          setIsModalOpen(false);
          setOpenCardPurchaseMode(false);
        }}
        categorias={categorias}
        veiculos={veiculos}
        initialCardPurchaseMode={openCardPurchaseMode}
      />
    </div>
  );
};

export default DashboardMobileView;
