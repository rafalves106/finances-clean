import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowDownCircle,
  ArrowUpCircle,
  CreditCard,
  DollarSign,
  Plus,
  Settings,
  Sparkles,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { API_CARTAO_URL, extractApiErrorMessage } from "../services/api";
import { formatCurrency } from "../util/formatCurrency";
import TransactionModal from "./TransactionModal";

const formatDateLabel = (dateInput) => {
  const date = new Date(dateInput);
  return date.toLocaleDateString("pt-BR");
};

const sortByDate = (list) =>
  [...list].sort(
    (a, b) => new Date(b.date || b.data) - new Date(a.date || a.data),
  );

const DashboardDesktopRedesignView = ({
  incomes = [],
  expenses = [],
  totalInvestmentsBalance = 0,
  selectedMes,
  selectedAno,
  onChangeMonth,
  categorias = [],
  veiculos = [],
  fetchData,
  loading,
  saldoAnterior = 0,
  onOpenCategoryManager,
  onOpenCardManagement,
  headerHeight = 96,
}) => {
  const [viewportHeight, setViewportHeight] = useState(
    typeof window !== "undefined" ? window.innerHeight : 900,
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("todas");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSimulationModalOpen, setIsSimulationModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [openCardPurchaseMode, setOpenCardPurchaseMode] = useState(false);
  const [cardSummaries, setCardSummaries] = useState([]);
  const [isCardSummaryLoading, setIsCardSummaryLoading] = useState(false);
  const [cardSummaryError, setCardSummaryError] = useState("");
  const [simulatedTransactions, setSimulatedTransactions] = useState([]);
  const summaryRef = useRef(null);
  const planningRef = useRef(null);
  const reviewRef = useRef(null);

  useEffect(() => {
    const onResize = () => setViewportHeight(window.innerHeight);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    const fetchCardSummary = async () => {
      try {
        setIsCardSummaryLoading(true);
        setCardSummaryError("");

        const multiResponse = await fetch(`${API_CARTAO_URL}/resumos`, {
          method: "GET",
          credentials: "include",
        });

        if (multiResponse.ok) {
          const multiData = await multiResponse.json();
          const summaries = Array.isArray(multiData) ? multiData : [];

          if (summaries.length > 0) {
            setCardSummaries(summaries.slice(0, 3));
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
        if (data?.cartao && data?.limite && data?.previsaoFatura) {
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
    };

    fetchCardSummary();
  }, [selectedMes, selectedAno]);

  const cardSummary = cardSummaries[0] || null;
  const backCardSummaries = cardSummaries.slice(1, 3);

  const handleBringCardToFront = (cardIndex) => {
    setCardSummaries((current) => {
      if (cardIndex <= 0 || cardIndex >= current.length) {
        return current;
      }

      const selected = current[cardIndex];
      return [selected, ...current.filter((_, index) => index !== cardIndex)];
    });
  };

  const desktopGap = viewportHeight >= 1080 ? 16 : 12;
  const mainPaddingTop = 16;
  const mainPaddingBottom = 16;
  const hUtil = Math.max(
    380,
    Math.floor(
      viewportHeight - headerHeight - mainPaddingTop - mainPaddingBottom,
    ),
  );
  const hConteudo = Math.max(220, hUtil - 2 * desktopGap);
  const hSecao1 = Math.floor(hConteudo * 0.3);
  const hSecao2 = Math.floor(hConteudo * 0.28);
  const hSecao3 = hConteudo - hSecao1 - hSecao2;

  const allTransactions = useMemo(
    () => [...incomes, ...expenses, ...simulatedTransactions],
    [expenses, incomes, simulatedTransactions],
  );

  const totalIncome = useMemo(
    () =>
      allTransactions
        .filter((item) => (item.type || item.tipo) === "Entrada")
        .reduce((acc, item) => acc + Number(item.value || item.valor || 0), 0),
    [allTransactions],
  );

  const totalExpense = useMemo(
    () =>
      allTransactions
        .filter((item) => (item.type || item.tipo) === "Saida")
        .reduce((acc, item) => acc + Number(item.value || item.valor || 0), 0),
    [allTransactions],
  );

  const saldoLivre = saldoAnterior + totalIncome - totalExpense;
  const cardLimitTotal = Number(
    cardSummary?.limite?.limiteTotal || cardSummary?.cartao?.limiteTotal || 0,
  );
  const cardLimitUsed = Number(
    cardSummary?.limite?.limiteUtilizado || cardSummary?.limite?.utilizado || 0,
  );
  const cardUsagePercent =
    cardLimitTotal > 0
      ? Math.min(100, Math.max(0, (cardLimitUsed / cardLimitTotal) * 100))
      : 0;

  const chartData = useMemo(() => {
    const grouped = allTransactions.reduce((acc, item) => {
      const iso = (item.date || item.data || "").split("T")[0];
      if (!iso) return acc;
      if (!acc[iso]) {
        acc[iso] = { entrada: 0, saida: 0 };
      }
      if ((item.type || item.tipo) === "Entrada") {
        acc[iso].entrada += Number(item.value || item.valor || 0);
      } else {
        acc[iso].saida += Number(item.value || item.valor || 0);
      }
      return acc;
    }, {});

    return Object.entries(grouped)
      .sort((a, b) => new Date(a[0]) - new Date(b[0]))
      .reduce((acc, [iso, values], index) => {
        const previous = index > 0 ? acc[index - 1].saldo : saldoAnterior;
        const [year, month, day] = iso.split("-");
        acc.push({
          data: `${day}/${month}/${year.slice(2)}`,
          entrada: values.entrada,
          saida: values.saida,
          saldo: previous + values.entrada - values.saida,
        });
        return acc;
      }, []);
  }, [allTransactions, saldoAnterior]);

  const upcomingPayments = useMemo(() => {
    const now = new Date();
    const monthStart = new Date(selectedAno, selectedMes - 1, 1, 0, 0, 0, 0);
    const monthEnd = new Date(selectedAno, selectedMes, 0, 23, 59, 59, 999);
    const start =
      selectedMes === now.getMonth() + 1 && selectedAno === now.getFullYear()
        ? new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0)
        : monthStart;

    return sortByDate(expenses)
      .filter((item) => {
        const dueDate = new Date(item.date || item.data);
        return dueDate >= start && dueDate <= monthEnd;
      })
      .slice(0, 12)
      .map((item) => ({
        id: item.id,
        title: item.name || item.titulo || "Despesa",
        value: Number(item.value || item.valor || 0),
        categoria: item.categoria?.nome || "Sem categoria",
        dueDate: new Date(item.date || item.data),
      }));
  }, [expenses, selectedAno, selectedMes]);

  const categoryRanking = useMemo(() => {
    const grouped = expenses.reduce((acc, item) => {
      const key = item.categoriaId || "sem-categoria";
      const nome = item.categoria?.nome || "Sem categoria";
      const icone = item.categoria?.icone || "";
      if (!acc[key]) {
        acc[key] = { id: key, nome, icone, total: 0 };
      }
      acc[key].total += Number(item.value || item.valor || 0);
      return acc;
    }, {});

    return Object.values(grouped)
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);
  }, [expenses]);

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

  const saidas = filteredTransactions.filter(
    (item) => (item.type || item.tipo) === "Saida",
  );
  const entradas = filteredTransactions.filter(
    (item) => (item.type || item.tipo) === "Entrada",
  );

  const handlePreviousMonth = () => {
    const previousDate = new Date(selectedAno, selectedMes - 2, 1);
    onChangeMonth(previousDate.getMonth() + 1, previousDate.getFullYear());
  };

  const handleNextMonth = () => {
    const nextDate = new Date(selectedAno, selectedMes, 1);
    onChangeMonth(nextDate.getMonth() + 1, nextDate.getFullYear());
  };

  const handleOpenSimulation = () => {
    setIsSimulationModalOpen(true);
  };

  const handleOpenNewTransaction = () => {
    setEditingItem(null);
    setOpenCardPurchaseMode(false);
    setIsModalOpen(true);
  };

  const handleOpenNewCardPurchase = () => {
    setEditingItem(null);
    setOpenCardPurchaseMode(true);
    setIsModalOpen(true);
  };

  const handleNavigate = (target) => {
    if (target === "planejar") {
      planningRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
      return;
    }

    if (target === "revisar") {
      reviewRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    summaryRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
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
    } catch (error) {
      console.error("Erro ao aplicar simulação:", error);
      alert("Erro ao aplicar as transações simuladas. Verifique o console.");
    }
  };

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
      style={{ height: `${hUtil}px` }}
    >
      <div
        className="grid h-full"
        style={{
          rowGap: `${desktopGap}px`,
          gridTemplateRows: `${hSecao1}px ${hSecao2}px ${hSecao3}px`,
        }}
      >
        <section ref={summaryRef} className="grid grid-cols-3 gap-3 min-h-0">
          <article className="col-span-2 bg-white border border-slate-200 rounded-xl p-4 shadow-sm min-h-0 flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <h3 className="uiux-subsection-title text-sm font-semibold tracking-wide flex items-center gap-2">
                <DollarSign size={16} className="text-[#aba8c2]" /> Evolução
                financeira
              </h3>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePreviousMonth}
                  className="px-2.5 py-1 rounded-lg border border-[#2f2c46] text-[#aba8c2]"
                >
                  ‹
                </button>
                <button
                  type="button"
                  onClick={handleNextMonth}
                  className="px-2.5 py-1 rounded-lg border border-[#2f2c46] text-[#aba8c2]"
                >
                  ›
                </button>
              </div>
            </div>

            <div className="flex-1 min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={chartData}
                  margin={{ top: 4, right: 8, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient
                      id="colorSaldoRedesign"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor="#3b82f6"
                        stopOpacity={0.12}
                      />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#f1f5f9"
                  />
                  <XAxis
                    dataKey="data"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: "#94a3b8" }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: "#cbd5e1" }}
                  />
                  <Tooltip
                    formatter={(value, name) => [
                      formatCurrency(value),
                      name === "entrada"
                        ? "Receita"
                        : name === "saida"
                          ? "Despesa"
                          : "Saldo",
                    ]}
                  />
                  <Legend
                    iconType="circle"
                    wrapperStyle={{ fontSize: "11px" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="entrada"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={false}
                    name="entrada"
                  />
                  <Line
                    type="monotone"
                    dataKey="saida"
                    stroke="#f43f5e"
                    strokeWidth={2}
                    dot={false}
                    name="saida"
                  />
                  <Area
                    type="monotone"
                    dataKey="saldo"
                    stroke="#3b82f6"
                    fill="url(#colorSaldoRedesign)"
                    name="saldo"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </article>

          <article className="col-span-1 rounded-xl border p-5 shadow-sm min-h-0 flex flex-col gap-3">
            <div className="uiux-card-premium-wrap flex-1">
              {isCardSummaryLoading ? (
                <div
                  className="uiux-card-state-box"
                  role="status"
                  aria-live="polite"
                >
                  <p className="text-sm text-[#c8c5dd] font-medium">
                    Carregando cartão...
                  </p>
                </div>
              ) : !cardSummary ? (
                <div className="uiux-card-state-box">
                  <p className="text-sm text-[#d6d4e7] font-semibold">
                    Nenhum cartão ativo encontrado.
                  </p>
                  <p className="text-xs text-[#9f9cb9] mt-1">
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
                      onClick={() => handleBringCardToFront(index + 1)}
                      className={`uiux-card-layer uiux-card-layer-back-clickable ${index === 0 ? "uiux-card-layer-back-1" : "uiux-card-layer-back-2"}`}
                      aria-label={`Selecionar cartão ${item?.cartao?.nome || "secundário"}`}
                    >
                      <p className="uiux-card-layer-back-name">
                        {item?.cartao?.nome || ""}
                      </p>
                    </button>
                  ))}

                  <button
                    type="button"
                    onClick={onOpenCardManagement}
                    className="uiux-card-layer uiux-card-layer-front uiux-card-layer-front-clickable"
                    aria-label="Abrir gestão do cartão"
                  >
                    <div className="uiux-card-top-row">
                      <p className="uiux-card-value-used">
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
                    >
                      <div
                        className={`uiux-card-progress-fill ${cardUsagePercent <= 0 ? "uiux-card-progress-fill-empty" : ""}`}
                        style={{ width: `${cardUsagePercent}%` }}
                      />
                    </div>

                    <div className="uiux-card-footer-row">
                      <p className="uiux-card-name">
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
              <p className="mt-1 text-xs text-rose-300">{cardSummaryError}</p>
            ) : null}
          </article>
        </section>

        <section ref={planningRef} className="grid grid-cols-3 gap-3 min-h-0">
          <article className="col-span-1 bg-white border border-slate-200 rounded-xl shadow-sm min-h-0 overflow-hidden">
            <div className="sticky top-0 bg-white border-b border-slate-100 px-4 py-3 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">
                Próximos pagamentos
              </h3>
              <span className="text-xs font-semibold text-slate-500">
                {upcomingPayments.length}
              </span>
            </div>
            <div className="h-[calc(100%-3.1rem)] overflow-y-auto p-4 space-y-2">
              {upcomingPayments.length === 0 ? (
                <p className="text-sm text-slate-500">
                  Nenhum pagamento pendente no restante do período.
                </p>
              ) : (
                upcomingPayments.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-lg border border-slate-100 px-3 py-2"
                  >
                    <p className="text-sm font-medium text-slate-700">
                      {item.title}
                    </p>
                    <p className="text-xs text-slate-500">
                      {item.categoria} · {formatDateLabel(item.dueDate)}
                    </p>
                    <p className="text-sm font-semibold text-rose-600 mt-1">
                      {formatCurrency(item.value)}
                    </p>
                  </div>
                ))
              )}
            </div>
          </article>

          <article className="col-span-2 bg-white border border-slate-200 rounded-xl shadow-sm p-4 min-h-0">
            <div className="grid grid-cols-4 gap-3">
              <div className="rounded-lg border border-slate-200 p-3">
                <div className="flex items-center gap-1 text-xs text-slate-500 uppercase">
                  <ArrowUpCircle size={14} className="text-emerald-600" />{" "}
                  Entradas
                </div>
                <p className="text-base font-bold text-emerald-700 mt-1">
                  {formatCurrency(totalIncome)}
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 p-3">
                <div className="flex items-center gap-1 text-xs text-slate-500 uppercase">
                  <ArrowDownCircle size={14} className="text-rose-600" /> Saídas
                </div>
                <p className="text-base font-bold text-rose-700 mt-1">
                  {formatCurrency(totalExpense)}
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 p-3">
                <div className="flex items-center gap-1 text-xs text-slate-500 uppercase">
                  <CreditCard size={14} className="text-teal-600" />
                  Investimentos
                </div>
                <p className="text-base font-bold text-slate-800 mt-1">
                  {formatCurrency(totalInvestmentsBalance)}
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 p-3">
                <div className="flex items-center gap-1 text-xs text-slate-500 uppercase">
                  <DollarSign size={14} className="text-blue-600" /> Saldo livre
                </div>
                <p className="text-base font-bold text-slate-800 mt-1">
                  {formatCurrency(saldoLivre)}
                </p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleNavigate("operar")}
                role="tab"
                aria-selected="true"
                className="px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700"
              >
                Operar agora
              </button>
              <button
                type="button"
                onClick={() => handleNavigate("planejar")}
                role="tab"
                aria-selected="false"
                className="px-3 py-1.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700"
              >
                Planejar mês
              </button>
              <button
                type="button"
                onClick={() => handleNavigate("revisar")}
                role="tab"
                aria-selected="false"
                className="px-3 py-1.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700"
              >
                Revisar transações
              </button>
              <button
                type="button"
                onClick={handleOpenNewCardPurchase}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-teal-600 text-white text-xs font-medium hover:bg-teal-700"
              >
                <Plus size={13} /> Nova compra no cartão
              </button>
              <button
                type="button"
                onClick={onOpenCardManagement}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-slate-200 text-slate-700 text-xs font-medium hover:bg-slate-50"
              >
                <Settings size={13} /> Abrir gestão
              </button>
            </div>

            {saldoLivre < 0 ? (
              <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50 p-3">
                <p className="text-sm font-semibold text-rose-700">
                  Saldo do mês está negativo
                </p>
                <button
                  type="button"
                  onClick={handleOpenSimulation}
                  className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-white border border-rose-200 text-xs font-medium text-rose-700 hover:bg-rose-100"
                >
                  Simular ajuste
                </button>
              </div>
            ) : null}

            {cardSummaryError ? (
              <p className="mt-2 text-xs text-rose-600">{cardSummaryError}</p>
            ) : null}
          </article>
        </section>

        <section ref={reviewRef} className="grid grid-cols-3 gap-3 min-h-0">
          <article className="col-span-1 bg-white border border-slate-200 rounded-xl shadow-sm min-h-0 overflow-hidden">
            <div className="sticky top-0 bg-white border-b border-slate-100 px-4 py-3 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                <AlertTriangle size={14} className="text-amber-600" />{" "}
                Categorias
              </h3>
              <button
                type="button"
                onClick={(event) => onOpenCategoryManager(event.currentTarget)}
                className="p-1 rounded-md hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                aria-label="Gerenciar categorias"
                title="Gerenciar categorias"
              >
                <Settings size={14} className="text-slate-500" />
              </button>
            </div>
            <div className="h-[calc(100%-3.1rem)] overflow-y-auto p-4 space-y-2">
              {categoryRanking.length === 0 ? (
                <p className="text-sm text-slate-500">
                  Nenhum gasto registrado neste mês
                </p>
              ) : (
                categoryRanking.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-lg border border-slate-100 px-3 py-2"
                  >
                    <p className="text-sm font-medium text-slate-700">
                      {item.icone} {item.nome}
                    </p>
                    <p className="text-sm font-semibold text-slate-800 mt-1">
                      {formatCurrency(item.total)}
                    </p>
                  </div>
                ))
              )}
            </div>
          </article>

          <article className="col-span-2 bg-white border border-slate-200 rounded-xl shadow-sm min-h-0 overflow-hidden">
            <div className="sticky top-0 bg-white border-b border-slate-100 px-4 py-3">
              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">
                Movimentações
              </h3>
              <div className="mt-2 flex flex-col sm:flex-row gap-2">
                <input
                  type="search"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Buscar transação"
                  className="w-full sm:w-64 px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-700"
                />
                <select
                  value={filterType}
                  onChange={(event) => setFilterType(event.target.value)}
                  className="px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-700"
                >
                  <option value="todas">Todas</option>
                  <option value="entradas">Somente entradas</option>
                  <option value="saidas">Somente saídas</option>
                  <option value="simuladas">Somente simuladas</option>
                </select>
              </div>
            </div>

            <div className="h-[calc(100%-5.85rem)] overflow-y-auto p-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <h4 className="text-sm font-bold text-rose-700">Saídas</h4>
                  {saidas.length === 0 ? (
                    <p className="text-sm text-slate-500">
                      Nenhuma saída encontrada.
                    </p>
                  ) : (
                    sortByDate(saidas).map((item) => (
                      <div
                        key={item.id}
                        className="rounded-lg border border-slate-100 px-3 py-2 text-left"
                      >
                        <p className="text-sm font-medium text-slate-700">
                          {item.name || item.titulo}
                        </p>
                        <p className="text-xs text-slate-500">
                          {item.description || item.descricao}
                        </p>
                        <p className="text-sm font-semibold text-rose-600 mt-1">
                          {formatCurrency(item.value || item.valor || 0)}
                        </p>
                      </div>
                    ))
                  )}
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-bold text-emerald-700 text-right">
                    Entradas
                  </h4>
                  {entradas.length === 0 ? (
                    <p className="text-sm text-slate-500 text-right">
                      Nenhuma entrada encontrada.
                    </p>
                  ) : (
                    sortByDate(entradas).map((item) => (
                      <div
                        key={item.id}
                        className="rounded-lg border border-slate-100 px-3 py-2 text-right"
                      >
                        <p className="text-sm font-medium text-slate-700">
                          {item.name || item.titulo}
                        </p>
                        <p className="text-xs text-slate-500">
                          {item.description || item.descricao}
                        </p>
                        <p className="text-sm font-semibold text-emerald-600 mt-1">
                          {formatCurrency(item.value || item.valor || 0)}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </article>
        </section>
      </div>

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

      <button
        type="button"
        onClick={handleOpenNewTransaction}
        className="fixed bottom-4 right-4 z-40 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full w-12 h-12 shadow-lg flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
        aria-label="Adicionar nova transação"
      >
        <Plus size={20} />
      </button>

      <button
        type="button"
        onClick={handleOpenSimulation}
        className="fixed bottom-4 right-20 z-40 bg-amber-500 hover:bg-amber-600 text-white rounded-full w-12 h-12 shadow-lg flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
        aria-label="Simular transação"
        title="Simular transação"
      >
        <Sparkles size={18} />
      </button>

      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setOpenCardPurchaseMode(false);
        }}
        onSuccess={async () => {
          await fetchData();
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
