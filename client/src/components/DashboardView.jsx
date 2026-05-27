import { useEffect, useMemo, useState } from "react";
import { API_URL } from "../services/api";
import { formatCurrency } from "../util/formatCurrency";
import TransactionModal from "./TransactionModal";

import {
  Trash2,
  Pencil,
  X,
  Wallet,
  DollarSign,
  PiggyBank,
  ArrowDownCircle,
  ArrowUpCircle,
  Briefcase,
  Plus,
  PieChart,
  Settings,
  Sparkles,
  RotateCcw,
} from "lucide-react";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Line,
  Legend,
} from "recharts";

const sortTransactions = (transactions) => {
  return [...transactions].sort((a, b) => {
    const dateA = new Date(a.date || a.data);
    const dateB = new Date(b.date || b.data);
    return dateA - dateB;
  });
};

const formatDateInputValue = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const getMonthDateRange = (month, year) => {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);

  return {
    startDate: formatDateInputValue(startDate),
    endDate: formatDateInputValue(endDate),
  };
};

const DashboardView = ({
  totalIncome,
  totalExpenses,
  finalBalance,
  totalInvestmentsBalance,
  fetchData,
  loading,
  selectedMes,
  selectedAno,
  onChangeMonth,
  categorias,
  veiculos,
  onOpenCategoryManager,
  incomes = [],
  expenses = [],
  saldoAnterior = 0,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSimulationModalOpen, setIsSimulationModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [simulatedTransactions, setSimulatedTransactions] = useState([]);
  const [renumberingGroupId, setRenumberingGroupId] = useState(null);
  const initialRange = getMonthDateRange(selectedMes, selectedAno);
  const [exportStartDate, setExportStartDate] = useState(
    initialRange.startDate,
  );
  const [exportEndDate, setExportEndDate] = useState(initialRange.endDate);
  const [isExportingCsv, setIsExportingCsv] = useState(false);

  const currentMonthLabel = new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
  }).format(new Date(selectedAno, selectedMes - 1, 1));

  const handlePreviousMonth = () => {
    const previousDate = new Date(selectedAno, selectedMes - 2, 1);
    onChangeMonth(previousDate.getMonth() + 1, previousDate.getFullYear());
  };

  const handleNextMonth = () => {
    const nextDate = new Date(selectedAno, selectedMes, 1);
    onChangeMonth(nextDate.getMonth() + 1, nextDate.getFullYear());
  };

  useEffect(() => {
    const range = getMonthDateRange(selectedMes, selectedAno);
    setExportStartDate(range.startDate);
    setExportEndDate(range.endDate);
  }, [selectedMes, selectedAno]);

  const simulatedIncomes = useMemo(
    () =>
      simulatedTransactions.filter(
        (item) => (item.type || item.tipo) === "Entrada",
      ),
    [simulatedTransactions],
  );

  const simulatedExpenses = useMemo(
    () =>
      simulatedTransactions.filter(
        (item) => (item.type || item.tipo) === "Saida",
      ),
    [simulatedTransactions],
  );

  const currentMonthSimulatedIncomes = useMemo(
    () =>
      simulatedIncomes.filter((item) => {
        const date = new Date(item.date || item.data);
        return (
          date.getMonth() + 1 === selectedMes &&
          date.getFullYear() === selectedAno
        );
      }),
    [simulatedIncomes, selectedMes, selectedAno],
  );

  const currentMonthSimulatedExpenses = useMemo(
    () =>
      simulatedExpenses.filter((item) => {
        const date = new Date(item.date || item.data);
        return (
          date.getMonth() + 1 === selectedMes &&
          date.getFullYear() === selectedAno
        );
      }),
    [simulatedExpenses, selectedMes, selectedAno],
  );

  const simulatedIncomeTotal = useMemo(
    () =>
      currentMonthSimulatedIncomes.reduce(
        (acc, item) => acc + Number(item.value || item.valor || 0),
        0,
      ),
    [currentMonthSimulatedIncomes],
  );

  const simulatedExpenseTotal = useMemo(
    () =>
      currentMonthSimulatedExpenses.reduce(
        (acc, item) => acc + Number(item.value || item.valor || 0),
        0,
      ),
    [currentMonthSimulatedExpenses],
  );

  const groupedIncomes = useMemo(
    () =>
      sortTransactions([...incomes, ...currentMonthSimulatedIncomes]).reduce(
        (acc, item) => {
          const date = new Date(item.date || item.data);
          const month = date.toLocaleString("pt-BR", {
            month: "long",
            year: "numeric",
          });
          const day = date.toLocaleDateString("pt-BR");
          if (!acc[month]) acc[month] = {};
          if (!acc[month][day]) acc[month][day] = [];
          acc[month][day].push(item);
          return acc;
        },
        {},
      ),
    [incomes, currentMonthSimulatedIncomes],
  );

  const groupedExpenses = useMemo(
    () =>
      sortTransactions([...expenses, ...currentMonthSimulatedExpenses]).reduce(
        (acc, item) => {
          const date = new Date(item.date || item.data);
          const month = date.toLocaleString("pt-BR", {
            month: "long",
            year: "numeric",
          });
          const day = date.toLocaleDateString("pt-BR");
          if (!acc[month]) acc[month] = {};
          if (!acc[month][day]) acc[month][day] = [];
          acc[month][day].push(item);
          return acc;
        },
        {},
      ),
    [expenses, currentMonthSimulatedExpenses],
  );

  const hasSimulation = simulatedTransactions.length > 0;
  const displayedIncomeTotal = totalIncome + simulatedIncomeTotal;
  const displayedExpenseTotal = totalExpenses + simulatedExpenseTotal;
  const displayedFinalBalance = hasSimulation
    ? saldoAnterior + displayedIncomeTotal - displayedExpenseTotal
    : finalBalance;

  const expensesByCategory = useMemo(() => {
    const grouped = expenses
      .filter((item) => !item.investimentoId)
      .reduce((acc, item) => {
        const categoria = item.categoria || {};
        const id = item.categoriaId || null;
        const key = id || "sem-categoria";
        const totalValue = Number(item.value || item.valor || 0);

        if (!acc[key]) {
          acc[key] = {
            id,
            nome: categoria.nome || "Sem categoria",
            icone: categoria.icone || "",
            cor: categoria.cor || "#94a3b8",
            total: 0,
          };
        }

        acc[key].total += totalValue;
        return acc;
      }, {});

    return Object.values(grouped)
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [expenses]);

  const totalCategoryExpenses = useMemo(
    () =>
      expenses
        .filter((item) => !item.investimentoId)
        .reduce((acc, item) => acc + Number(item.value || item.valor || 0), 0),
    [expenses],
  );

  const chartData = useMemo(() => {
    const grouped = [
      ...incomes,
      ...expenses,
      ...currentMonthSimulatedIncomes,
      ...currentMonthSimulatedExpenses,
    ].reduce((acc, item) => {
      const rawDate = item.date || item.data;

      const dateKey = rawDate.split("T")[0];

      const isIncome = (item.type || item.tipo)?.toLowerCase() === "entrada";
      const value = Number(item.value || item.valor);

      if (!acc[dateKey]) {
        acc[dateKey] = { entrada: 0, saida: 0 };
      }
      if (isIncome) {
        acc[dateKey].entrada += value;
      } else {
        acc[dateKey].saida += value;
      }
      return acc;
    }, {});

    return Object.entries(grouped)
      .sort((a, b) => new Date(a[0]) - new Date(b[0]))
      .reduce((acc, [isoDate, dayTotals], index) => {
        const previousBalance =
          index > 0 ? acc[index - 1].saldo : saldoAnterior;

        const [year, month, day] = isoDate.split("-");
        const displayLabel = `${day}/${month}/${year.slice(2)}`;

        acc.push({
          data: displayLabel,
          entrada: dayTotals.entrada,
          saida: dayTotals.saida,
          saldo: previousBalance + dayTotals.entrada - dayTotals.saida,
        });
        return acc;
      }, []);
  }, [
    incomes,
    expenses,
    saldoAnterior,
    currentMonthSimulatedIncomes,
    currentMonthSimulatedExpenses,
  ]);

  const handleEditClick = (item, type) => {
    setEditingItem({ ...item, tipo: type });
    setIsModalOpen(true);
  };

  const handleSimulate = (formData) => {
    const categoria =
      categorias.find((item) => item.id === formData.categoryId) || null;

    const count = formData.isFixed ? parseInt(formData.period) || 1 : 1;
    const novasSimulacoes = [];

    for (let i = 0; i < count; i++) {
      const baseDate = new Date(`${formData.date}T12:00:00Z`);

      if (formData.isFixed) {
        if (formData.tipoRecorrencia === "Semanal") {
          baseDate.setDate(baseDate.getDate() + 7 * i);
        } else {
          baseDate.setMonth(baseDate.getMonth() + i);
        }
      }

      novasSimulacoes.push({
        id: crypto.randomUUID(),
        name: formData.name,
        description: formData.description,
        value: Number(formData.value),
        type: formData.tipo,
        date: baseDate.toISOString(),
        categoriaId: formData.categoryId || null,
        veiculoId: formData.veiculoId || null,
        km: formData.km ? parseInt(formData.km) : null,
        categoria,
        isSimulated: true,
      });
    }

    setSimulatedTransactions((prev) => [...prev, ...novasSimulacoes]);
    setIsSimulationModalOpen(false);
  };

  const handleRemoveSimulation = (id) => {
    setSimulatedTransactions((prev) => prev.filter((item) => item.id !== id));
  };

  const handleApplySimulation = async () => {
    try {
      for (const item of simulatedTransactions) {
        const response = await fetch(API_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            titulo: item.name,
            descricao: item.description,
            valor: item.value,
            tipo: item.type,
            data: item.date,
            fixa: false,
            periodo: 0,
            categoriaId: item.categoriaId || null,
            veiculoId: item.veiculoId || null,
            km: item.km || null,
          }),
        });

        if (!response.ok) {
          throw new Error("Erro ao aplicar simulação");
        }
      }

      await fetchData();
      setSimulatedTransactions([]);
    } catch (err) {
      console.error("Erro ao aplicar simulação:", err);
      alert("Erro ao aplicar as transações simuladas. Verifique o console.");
    }
  };

  const handleRemove = async (id) => {
    try {
      await fetch(`${API_URL}/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      fetchData();
    } catch (err) {
      console.error("Erro ao deletar item:", err);
      alert("Erro ao deletar. Verifique o console.");
    }
  };

  const handleRenumberGroup = async (groupId) => {
    if (!groupId) return;

    const confirmed = window.confirm(
      "Deseja renumerar este grupo recorrente? Os títulos serão normalizados para 1/N...N/N.",
    );

    if (!confirmed) return;

    try {
      setRenumberingGroupId(groupId);

      const response = await fetch(`${API_URL}/grupos/${groupId}/renumerar`, {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Grupo não encontrado ou sem permissão.");
        }

        throw new Error("Não foi possível renumerar o grupo.");
      }

      await fetchData();
      alert("Grupo renumerado com sucesso.");
    } catch (err) {
      console.error("Erro ao renumerar grupo:", err);
      alert(err.message || "Erro ao renumerar grupo.");
    } finally {
      setRenumberingGroupId(null);
    }
  };

  const handleExportCsv = async () => {
    if (!exportStartDate || !exportEndDate) {
      alert("Informe data de início e data de fim para exportar o CSV.");
      return;
    }

    try {
      setIsExportingCsv(true);

      const query = new URLSearchParams({
        dataInicio: exportStartDate,
        dataFim: exportEndDate,
      });

      const response = await fetch(
        `${API_URL}/exportar-csv?${query.toString()}`,
        {
          method: "GET",
          credentials: "include",
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          errorText || "Não foi possível exportar movimentações.",
        );
      }

      const blob = await response.blob();
      const contentDisposition = response.headers.get("content-disposition");
      const filenameMatch =
        contentDisposition?.match(/filename\*=UTF-8''([^;\r\n]+)/i) ||
        contentDisposition?.match(/filename="([^"]+)"/i) ||
        contentDisposition?.match(/filename=([^;\r\n"]+)/i);
      const fileName = filenameMatch
        ? decodeURIComponent(filenameMatch[1].trim())
        : "movimentacoes.csv";

      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error("Erro ao exportar CSV:", err);
      alert(err.message || "Erro ao exportar CSV.");
    } finally {
      setIsExportingCsv(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-400 animate-pulse">
        <Wallet className="w-12 h-12 mb-4 opacity-50" />
        <p>Carregando informações...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col">
        <div className="flex items-center justify-between gap-3 mb-6">
          <h3 className="text-slate-700 font-bold flex items-center gap-2">
            <DollarSign size={18} className="text-blue-500" /> Evolução
            Financeira
          </h3>
          <div className="flex flex-wrap items-end gap-2">
            <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
              Data início
              <input
                type="date"
                value={exportStartDate}
                onChange={(e) => setExportStartDate(e.target.value)}
                className="px-2 py-1.5 rounded-lg border border-slate-200 text-sm text-slate-700"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
              Data fim
              <input
                type="date"
                value={exportEndDate}
                onChange={(e) => setExportEndDate(e.target.value)}
                className="px-2 py-1.5 rounded-lg border border-slate-200 text-sm text-slate-700"
              />
            </label>
            <button
              type="button"
              onClick={handleExportCsv}
              disabled={isExportingCsv}
              className="px-3 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {isExportingCsv ? "Exportando..." : "Exportar CSV"}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 mb-4">
          <button
            type="button"
            onClick={handlePreviousMonth}
            className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
          >
            ‹
          </button>
          <span className="text-sm font-semibold text-slate-700 capitalize">
            {currentMonthLabel}
          </span>
          <button
            type="button"
            onClick={handleNextMonth}
            className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
          >
            ›
          </button>
        </div>

        <div className="flex-1 w-full">
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart
              data={chartData}
              margin={{ top: 5, right: 5, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorSaldo" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
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
                tick={{ fontSize: 12, fill: "#94a3b8" }}
                dy={10}
              />
              <YAxis
                hide={false}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: "#cbd5e1" }}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: "8px",
                  border: "none",
                  boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                }}
                formatter={(value, name) => {
                  const formattedValue = formatCurrency(value);
                  if (name === "entrada") return [formattedValue, "Receita"];
                  if (name === "saida") return [formattedValue, "Despesa"];
                  return [formattedValue, "Saldo"];
                }}
              />
              <Legend
                iconType="circle"
                wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }}
              />
              <Line
                type="monotone"
                dataKey="entrada"
                stroke="#10b981"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
                name="entrada"
              />
              <Line
                type="monotone"
                dataKey="saida"
                stroke="#f43f5e"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
                name="saida"
              />
              <Area
                type="monotone"
                dataKey="saldo"
                stroke="#3b82f6"
                strokeWidth={1}
                strokeOpacity={0.5}
                fillOpacity={1}
                fill="url(#colorSaldo)"
                animationDuration={1000}
                dot={{ r: 2, strokeWidth: 1, fill: "#3b82f6" }}
                name="saldo"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {hasSimulation && (
        <div className="bg-amber-50 border border-amber-300 rounded-xl p-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="text-sm font-medium text-amber-900">
            ⚠️ Simulação ativa — {simulatedTransactions.length} transação(ões)
            pendente(s)
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSimulatedTransactions([])}
              className="px-3 py-2 rounded-lg bg-slate-200 text-slate-700 font-medium hover:bg-slate-300 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleApplySimulation}
              className="px-3 py-2 rounded-lg bg-amber-500 text-white font-medium hover:bg-amber-600 transition-colors"
            >
              Aplicar tudo
            </button>
          </div>
        </div>
      )}
      <div className="grid grid-cols-1 gap-6 items-start">
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
              <div className="flex items-center gap-2 text-emerald-600 mb-2 font-medium">
                {" "}
                <ArrowUpCircle size={20} /> Entrada{" "}
              </div>
              {hasSimulation ? (
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-slate-400 line-through">
                    {formatCurrency(totalIncome)}
                  </span>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-2xl font-bold text-slate-900">
                      {formatCurrency(displayedIncomeTotal)}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wide rounded-full bg-amber-100 text-amber-700 px-2 py-0.5">
                      + simulado
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-2xl font-bold">
                  {formatCurrency(totalIncome)}
                </div>
              )}
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
              <div className="flex items-center gap-2 text-rose-600 mb-2 font-medium">
                {" "}
                <ArrowDownCircle size={20} /> Saídas{" "}
              </div>
              {hasSimulation ? (
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-slate-400 line-through">
                    {formatCurrency(totalExpenses)}
                  </span>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-2xl font-bold text-slate-900">
                      {formatCurrency(displayedExpenseTotal)}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wide rounded-full bg-amber-100 text-amber-700 px-2 py-0.5">
                      + simulado
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-2xl font-bold">
                  {formatCurrency(totalExpenses)}
                </div>
              )}
            </div>
            <div className="bg-blue-50 p-4 rounded-xl shadow-sm border border-blue-100">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2 text-blue-700 font-medium">
                  <PiggyBank size={20} /> Investimentos
                </div>
                <span className="text-xs font-bold text-blue-700 bg-blue-200 px-2 py-0.5 rounded-full">
                  Meta: Definir
                </span>
              </div>
              <div className="text-2xl font-bold text-blue-900 mb-3">
                {formatCurrency(totalInvestmentsBalance || 0)}
              </div>
            </div>
            <div
              className={`p-4 rounded-xl shadow-sm border ${displayedFinalBalance >= 0 ? "bg-emerald-50 border-emerald-100" : "bg-red-50 border-red-100"}`}
            >
              <div className="flex items-center gap-2 mb-2 font-medium">
                {" "}
                <DollarSign size={20} /> Saldo Livre{" "}
              </div>
              {hasSimulation ? (
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-slate-400 line-through">
                    {formatCurrency(finalBalance)}
                  </span>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-2xl font-bold">
                      {formatCurrency(displayedFinalBalance)}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wide rounded-full bg-amber-100 text-amber-700 px-2 py-0.5">
                      + simulado
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-2xl font-bold">
                  {formatCurrency(finalBalance)}
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-700 flex items-center gap-2">
                <PieChart size={18} className="text-slate-500" /> Gastos por
                Categoria
              </h3>
              <button
                type="button"
                onClick={onOpenCategoryManager}
                aria-label="Gerenciar categorias"
                title="Gerenciar categorias"
                className="p-1 rounded-md hover:bg-slate-50"
              >
                <Settings
                  size={16}
                  className="text-slate-400 hover:text-slate-600"
                />
              </button>
            </div>

            {expensesByCategory.length === 0 ? (
              <div className="text-center text-sm text-slate-400 py-6">
                Nenhum gasto registrado neste mês
              </div>
            ) : (
              <div className="space-y-4">
                {expensesByCategory.map((item) => {
                  const percentage =
                    totalCategoryExpenses > 0
                      ? (item.total / totalCategoryExpenses) * 100
                      : 0;

                  return (
                    <div key={item.id || item.nome}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-slate-700 font-medium">
                          {item.icone} {item.nome}
                        </span>
                        <span className="text-slate-600 font-semibold">
                          {formatCurrency(item.total)}
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${Math.min(percentage, 100)}%`,
                            backgroundColor: item.cor || "#94a3b8",
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex flex-col">
          <h3 className="font-bold text-emerald-700 mb-3 shrink-0">Entradas</h3>
          {Object.keys(groupedIncomes).length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 gap-2">
              <ArrowUpCircle size={32} className="text-slate-200" />
              <p className="text-sm text-slate-400">
                Nenhuma entrada em {currentMonthLabel}
              </p>
            </div>
          ) : (
            Object.entries(groupedIncomes).map(([month, days]) => (
              <details
                key={month}
                className="group mb-4 bg-white rounded-lg border border-slate-200 shadow-sm"
                close="true"
              >
                <summary className="flex justify-between items-center p-4 cursor-pointer list-none font-bold text-slate-700 hover:bg-slate-50 transition-colors">
                  <span className="capitalize">{month}</span>
                  <span className="text-slate-400 group-open:rotate-180 transition-transform">
                    ▼
                  </span>
                </summary>

                <div className="p-4 pt-0 border-t border-slate-100">
                  {Object.entries(days).map(([day, transactions]) => (
                    <div key={day} className="mt-4">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                        {day}
                      </h4>

                      <div className="space-y-1">
                        {transactions.map((i) => (
                          <div
                            key={i.id}
                            className={`flex justify-between py-3 px-2 rounded-md transition-colors ${
                              i.isSimulated
                                ? "border border-dashed border-amber-300 bg-amber-50"
                                : "border-b last:border-0 border-slate-50 hover:bg-slate-50"
                            }`}
                          >
                            <div>
                              <span className="block text-sm font-medium text-slate-700">
                                {i.name || i.titulo}
                              </span>
                              {i.categoria && (
                                <span
                                  className="text-[10px] px-2 py-0.5 rounded-full font-medium inline-flex items-center gap-1 mt-1"
                                  style={{
                                    backgroundColor:
                                      (i.categoria.cor || "#94a3b8") + "20",
                                    color: i.categoria.cor || "#94a3b8",
                                  }}
                                >
                                  {i.categoria.icone} {i.categoria.nome}
                                </span>
                              )}
                              <p className="text-xs font-light text-slate-500">
                                {i.description || i.descricao}
                              </p>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="font-semibold text-emerald-600 text-sm">
                                {formatCurrency(i.value || i.valor)}
                              </span>

                              {i.isSimulated ? (
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] font-bold uppercase tracking-wide bg-amber-100 text-amber-700 px-2 py-1 rounded-full">
                                    Simulado
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveSimulation(i.id)}
                                    aria-label="Remover transação simulada"
                                    className="p-1 rounded-full hover:bg-amber-100 text-amber-700 transition-colors"
                                    title="Remover simulação"
                                  >
                                    <X size={14} />
                                  </button>
                                </div>
                              ) : i.investimentoId ? (
                                <div
                                  className="flex items-center gap-1 text-blue-500 bg-blue-50 px-2 py-1 rounded-md cursor-help"
                                  title="Gerenciado na aba de Investimentos"
                                >
                                  <Briefcase size={14} />
                                  <span className="text-[10px] font-bold uppercase hidden sm:inline">
                                    Investimento
                                  </span>
                                </div>
                              ) : (
                                <>
                                  {(i.grupoRecorrenciaId ||
                                    i.grupoRecorrenciaID) && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleRenumberGroup(
                                          i.grupoRecorrenciaId ||
                                            i.grupoRecorrenciaID,
                                        )
                                      }
                                      disabled={
                                        renumberingGroupId ===
                                        (i.grupoRecorrenciaId ||
                                          i.grupoRecorrenciaID)
                                      }
                                      aria-label={`Renumerar grupo da entrada ${i.name || i.titulo}`}
                                      className="p-1 hover:bg-blue-50 rounded-full transition-colors disabled:opacity-50"
                                      title="Renumerar grupo"
                                    >
                                      <RotateCcw
                                        size={14}
                                        className="text-slate-300 hover:text-blue-500"
                                      />
                                    </button>
                                  )}

                                  <button
                                    onClick={() =>
                                      handleEditClick(i, "Entrada")
                                    }
                                    aria-label={`Editar entrada ${i.name || i.titulo}`}
                                    className="p-1 hover:bg-amber-50 rounded-full transition-colors"
                                    title="Editar"
                                  >
                                    <Pencil
                                      size={14}
                                      className="text-slate-300 hover:text-amber-500"
                                    />
                                  </button>

                                  <button
                                    onClick={() => handleRemove(i.id)}
                                    aria-label={`Excluir entrada ${i.name || i.titulo}`}
                                    className="p-1 hover:bg-red-50 rounded-full transition-colors"
                                    title="Excluir"
                                  >
                                    <Trash2
                                      size={14}
                                      className="text-slate-300 hover:text-red-500"
                                    />
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </details>
            ))
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex flex-col">
          <h3 className="font-bold text-rose-700 mb-3 shrink-0">Saídas</h3>
          {Object.keys(groupedExpenses).length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 gap-2">
              <ArrowDownCircle size={32} className="text-slate-200" />
              <p className="text-sm text-slate-400">
                Nenhuma saída em {currentMonthLabel}
              </p>
            </div>
          ) : (
            Object.entries(groupedExpenses).map(([month, days]) => (
              <details
                key={month}
                className="group mb-4 bg-white rounded-lg border border-slate-200 shadow-sm"
                close="true"
              >
                <summary className="flex justify-between items-center p-4 cursor-pointer list-none font-bold text-slate-700 hover:bg-slate-50 transition-colors">
                  <span className="capitalize">{month}</span>
                  <span className="text-slate-400 group-open:rotate-180 transition-transform">
                    ▼
                  </span>
                </summary>

                <div className="p-4 pt-0 border-t border-slate-100">
                  {Object.entries(days).map(([day, transactions]) => (
                    <div key={day} className="mt-4">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                        {day}
                      </h4>

                      <div className="space-y-1">
                        {transactions.map((i) => (
                          <div
                            key={i.id}
                            className={`flex justify-between py-3 px-2 rounded-md transition-colors ${
                              i.isSimulated
                                ? "border border-dashed border-amber-300 bg-amber-50"
                                : "border-b last:border-0 border-slate-50 hover:bg-slate-50"
                            }`}
                          >
                            <div>
                              <span className="block text-sm font-medium text-slate-700">
                                {i.name || i.titulo}
                              </span>
                              {i.categoria && (
                                <span
                                  className="text-[10px] px-2 py-0.5 rounded-full font-medium inline-flex items-center gap-1 mt-1"
                                  style={{
                                    backgroundColor:
                                      (i.categoria.cor || "#94a3b8") + "20",
                                    color: i.categoria.cor || "#94a3b8",
                                  }}
                                >
                                  {i.categoria.icone} {i.categoria.nome}
                                </span>
                              )}
                              <p className="text-xs font-light text-slate-500">
                                {i.description || i.descricao}
                              </p>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="font-semibold text-rose-600 text-sm">
                                {formatCurrency(i.value || i.valor)}
                              </span>

                              {i.isSimulated ? (
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] font-bold uppercase tracking-wide bg-amber-100 text-amber-700 px-2 py-1 rounded-full">
                                    Simulado
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveSimulation(i.id)}
                                    aria-label="Remover transação simulada"
                                    className="p-1 rounded-full hover:bg-amber-100 text-amber-700 transition-colors"
                                    title="Remover simulação"
                                  >
                                    <X size={14} />
                                  </button>
                                </div>
                              ) : i.investimentoId ? (
                                <div
                                  className="flex items-center gap-1 text-blue-500 bg-blue-50 px-2 py-1 rounded-md cursor-help"
                                  title="Gerenciado na aba de Investimentos"
                                >
                                  <Briefcase size={14} />
                                  <span className="text-[10px] font-bold uppercase hidden sm:inline">
                                    Investimento
                                  </span>
                                </div>
                              ) : (
                                <>
                                  {(i.grupoRecorrenciaId ||
                                    i.grupoRecorrenciaID) && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleRenumberGroup(
                                          i.grupoRecorrenciaId ||
                                            i.grupoRecorrenciaID,
                                        )
                                      }
                                      disabled={
                                        renumberingGroupId ===
                                        (i.grupoRecorrenciaId ||
                                          i.grupoRecorrenciaID)
                                      }
                                      aria-label={`Renumerar grupo da saída ${i.name || i.titulo}`}
                                      className="p-1 hover:bg-blue-50 rounded-full transition-colors disabled:opacity-50"
                                      title="Renumerar grupo"
                                    >
                                      <RotateCcw
                                        size={14}
                                        className="text-slate-300 hover:text-blue-500"
                                      />
                                    </button>
                                  )}

                                  <button
                                    onClick={() => handleEditClick(i, "Saida")}
                                    aria-label={`Editar saída ${i.name || i.titulo}`}
                                    className="p-1 hover:bg-amber-50 rounded-full transition-colors"
                                    title="Editar"
                                  >
                                    <Pencil
                                      size={14}
                                      className="text-slate-300 hover:text-amber-500"
                                    />
                                  </button>

                                  <button
                                    onClick={() => handleRemove(i.id)}
                                    aria-label={`Excluir saída ${i.name || i.titulo}`}
                                    className="p-1 hover:bg-red-50 rounded-full transition-colors"
                                    title="Excluir"
                                  >
                                    <Trash2
                                      size={14}
                                      className="text-slate-300 hover:text-red-500"
                                    />
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </details>
            ))
          )}
        </div>
      </div>

      <button
        className="fixed bottom-6 right-6 z-40 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full w-14 h-14 shadow-lg flex items-center justify-center transition-colors"
        aria-label="Adicionar nova transação"
        onClick={() => {
          setEditingItem(null);
          setIsModalOpen(true);
        }}
      >
        <Plus size={24} />
      </button>

      <button
        type="button"
        className="fixed bottom-6 right-24 z-40 bg-amber-500 hover:bg-amber-600 text-white rounded-full w-14 h-14 shadow-lg flex items-center justify-center transition-colors"
        aria-label="Simular transação"
        onClick={() => {
          setIsSimulationModalOpen(true);
        }}
        title="Simular transação"
      >
        <Sparkles size={22} />
      </button>

      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchData}
        categorias={categorias}
        veiculos={veiculos}
        editingItem={editingItem}
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

export default DashboardView;
