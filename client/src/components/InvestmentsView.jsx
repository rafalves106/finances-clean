import { useCallback, useEffect, useState } from "react";
import { API_URL } from "../services/api";
import { formatCurrency } from "../util/formatCurrency";
import { formatDate } from "../util/formatDate";
import { getAuthHeaders } from "../services/auth";

import {
  TrendingUp,
  BarChart3,
  PlusCircle,
  Briefcase,
  ArrowUpCircle,
  ArrowDownCircle,
  RefreshCw,
  Trash2,
  X,
} from "lucide-react";

// Adapta a URL base para o endpoint de investimentos
const INV_API_URL = API_URL.replace("movimentacoes", "investimentos");

const InvestmentsView = ({
  investmentAmount,
  investments,
  fetchData,
  isRedesign = false,
  onRegisterActions,
}) => {
  // --- ESTADOS DO SIMULADOR (Mantidos do seu original) ---
  const [initialVal, setInitialVal] = useState(0);
  const [monthlyVal, setMonthlyVal] = useState(investmentAmount || 0);
  const [rate, setRate] = useState(0.85);
  const [years, setYears] = useState(1);

  const months = years * 12;
  const rateDecimal = rate / 100;
  const futureValue =
    rateDecimal === 0
      ? Number(initialVal) + Number(monthlyVal) * months
      : initialVal * Math.pow(1 + rateDecimal, months) +
        (monthlyVal * (Math.pow(1 + rateDecimal, months) - 1)) / rateDecimal;
  const totalInvested = Number(initialVal) + Number(monthlyVal) * months;
  const totalInterest = futureValue - totalInvested;

  // Estados do Formulário de Novo Investimento
  const [newNome, setNewNome] = useState("");
  const [newInstituicao, setNewInstituicao] = useState("");
  const [newTipo, setNewTipo] = useState("TesouroDireto");
  const [newValor, setNewValor] = useState("");
  const [newDate, setNewDate] = useState("");
  const [newRentabilidade, setNewRentabilidade] = useState("PosFixado");
  const [newLiquidez, setNewLiquidez] = useState("Diaria");

  // Estado para ações inline nos cards (Aporte, Saque, Atualizar Saldo)
  // Ex: { id: "123", type: "aporte" }
  const [activeAction, setActiveAction] = useState({ id: null, type: null });
  const [actionValue, setActionValue] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createModalType, setCreateModalType] = useState("investment");
  const [selectedInvestmentId, setSelectedInvestmentId] = useState("");
  const [aporteValue, setAporteValue] = useState("");

  const handleCreateInvestment = async (e) => {
    e.preventDefault();
    if (!newNome || !newInstituicao || !newValor || !newDate) return;

    const payload = {
      nome: newNome,
      instituicao: newInstituicao,
      tipo: newTipo,
      valorAplicado: parseFloat(newValor),
      dataInicio: formatDate(newDate),
      tipoRentabilidade: newRentabilidade,
      liquidez: newLiquidez,
    };

    try {
      const response = await fetch(INV_API_URL, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        fetchData();
        setNewNome("");
        setNewInstituicao("");
        setNewValor("");
        setNewDate("");
      } else {
        alert("Erro ao criar investimento");
      }
    } catch (err) {
      console.error("Erro ao criar investimento:", err);
      alert("Erro ao criar investimento. Verifique o console.");
    }
  };

  const handleExecuteAction = async (id) => {
    if (!actionValue || isNaN(actionValue) || Number(actionValue) <= 0) return;

    const payload = {
      valor: parseFloat(actionValue),
      novoSaldoAtual: parseFloat(actionValue), // Usado apenas no PUT de Saldo
      data: new Date().toISOString(),
      dataAtualizacao: new Date().toISOString(), // Usado apenas no PUT de Saldo
    };

    let url = `${INV_API_URL}/${id}`;
    let method = "POST";

    if (activeAction.type === "aporte") url += "/aportes";
    if (activeAction.type === "saque") url += "/saques";
    if (activeAction.type === "saldo") {
      url += "/saldo";
      method = "PUT";
    }

    try {
      const response = await fetch(url, {
        method: method,
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setActiveAction({ id: null, type: null });
        setActionValue("");
        fetchData();
      } else {
        const errorText = await response.text();
        alert(`Erro: ${errorText}`);
      }
    } catch (err) {
      console.error("Erro ao executar ação:", err);
      alert("Erro ao executar ação. Verifique o console.");
    }
  };

  const handleDelete = async (id) => {
    if (
      !window.confirm(
        "Deseja realmente remover este investimento? O valor será estornado para seu Saldo Livre.",
      )
    )
      return;

    try {
      const response = await fetch(`${INV_API_URL}/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      if (response.ok) {
        fetchData();
      }
    } catch (err) {
      console.error("Erro ao remover investimento:", err);
      alert("Erro ao remover investimento. Verifique o console.");
    }
  };

  const resetCreateForm = () => {
    setNewNome("");
    setNewInstituicao("");
    setNewTipo("TesouroDireto");
    setNewValor("");
    setNewDate("");
    setNewRentabilidade("PosFixado");
    setNewLiquidez("Diaria");
  };

  const resetAporteForm = () => {
    setSelectedInvestmentId("");
    setAporteValue("");
  };

  const closeCreateModal = () => {
    setIsCreateModalOpen(false);
    resetCreateForm();
    resetAporteForm();
  };

  const openInvestmentModal = useCallback(() => {
    setCreateModalType("investment");
    setIsCreateModalOpen(true);
    resetAporteForm();
  }, []);

  const openAporteModal = useCallback((investmentId = "") => {
    setCreateModalType("aporte");
    setSelectedInvestmentId(investmentId ? String(investmentId) : "");
    setAporteValue("");
    setIsCreateModalOpen(true);
  }, []);

  useEffect(() => {
    if (!isRedesign || typeof onRegisterActions !== "function") {
      return undefined;
    }

    onRegisterActions({
      openInvestmentModal,
      openAporteModal,
      hasInvestments: investments.length > 0,
    });

    return () => {
      onRegisterActions(null);
    };
  }, [
    isRedesign,
    onRegisterActions,
    openInvestmentModal,
    openAporteModal,
    investments.length,
  ]);

  const handleModalSubmit = async (e) => {
    e.preventDefault();

    if (createModalType === "investment") {
      if (!newNome || !newInstituicao || !newValor || !newDate) return;

      const payload = {
        nome: newNome,
        instituicao: newInstituicao,
        tipo: newTipo,
        valorAplicado: parseFloat(newValor),
        dataInicio: formatDate(newDate),
        tipoRentabilidade: newRentabilidade,
        liquidez: newLiquidez,
      };

      try {
        const response = await fetch(INV_API_URL, {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify(payload),
        });

        if (response.ok) {
          fetchData();
          closeCreateModal();
        } else {
          alert("Erro ao criar investimento");
        }
      } catch (err) {
        console.error("Erro ao criar investimento:", err);
        alert("Erro ao criar investimento. Verifique o console.");
      }

      return;
    }

    if (!selectedInvestmentId || !aporteValue || Number(aporteValue) <= 0) {
      return;
    }

    try {
      const response = await fetch(
        `${INV_API_URL}/${selectedInvestmentId}/aportes`,
        {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify({
            valor: parseFloat(aporteValue),
            data: new Date().toISOString(),
          }),
        },
      );

      if (response.ok) {
        fetchData();
        closeCreateModal();
      } else {
        const errorText = await response.text();
        alert(`Erro: ${errorText}`);
      }
    } catch (err) {
      console.error("Erro ao criar aporte:", err);
      alert("Erro ao criar aporte. Verifique o console.");
    }
  };

  const panelClass = isRedesign
    ? "p-6 rounded-xl border border-[#2a3554] shadow-sm bg-[linear-gradient(145deg,rgba(18,24,40,0.98)_0%,rgba(17,22,38,0.95)_55%,rgba(14,19,34,0.98)_100%)]"
    : "bg-white p-6 rounded-xl border border-slate-200 shadow-sm";

  const inputClass = isRedesign
    ? "w-full p-2 border border-[#2a3554] rounded-lg mt-1 bg-[#10152d] text-[#dbe3ff] placeholder:text-[#7f84a8]"
    : "w-full p-2 border rounded-lg mt-1";

  const compactInputClass = isRedesign
    ? "p-2 border border-[#2a3554] rounded-lg bg-[#10152d] text-[#dbe3ff] placeholder:text-[#7f84a8]"
    : "p-2 border rounded-lg";

  const labelClass = isRedesign
    ? "text-xs font-bold text-[#9f9cb9] uppercase"
    : "text-xs font-bold text-slate-500 uppercase";

  const sectionTitleClass = isRedesign
    ? "text-lg font-bold flex items-center gap-2 text-[#dbe3ff] mb-6"
    : "text-lg font-bold flex items-center gap-2 text-slate-800 mb-6";

  const portfolioCardClass = isRedesign
    ? "border border-[#2a3554] rounded-xl p-5 bg-[linear-gradient(180deg,rgba(20,26,44,0.9)_0%,rgba(16,21,37,0.92)_100%)] hover:border-[#3a4672] transition-colors relative overflow-hidden flex flex-col justify-between"
    : "border border-slate-200 rounded-xl p-5 hover:shadow-md transition-shadow relative overflow-hidden flex flex-col justify-between";

  const redesignPanelClass =
    "p-6 rounded-2xl border border-[#41528a] bg-[radial-gradient(circle_at_12%_8%,rgba(98,125,204,0.24)_0%,rgba(39,52,92,0.18)_32%,rgba(22,30,56,0.94)_100%)] shadow-[0_14px_34px_rgba(7,12,26,0.42)] backdrop-blur-[1px]";

  if (isRedesign) {
    return (
      <>
        <div className={`${redesignPanelClass} space-y-4`}>
          <h3 className="text-sm font-semibold text-[#9f9cb9] uppercase tracking-wide">
            Simulação Rápida
          </h3>
          <div>
            <label
              htmlFor="investment-simulator-initial"
              className={labelClass}
            >
              Aporte Inicial
            </label>
            <input
              id="investment-simulator-initial"
              type="number"
              value={initialVal}
              onChange={(e) => setInitialVal(Number(e.target.value))}
              className={inputClass}
            />
          </div>
          <div>
            <label
              htmlFor="investment-simulator-monthly"
              className={labelClass}
            >
              Aporte Mensal
            </label>
            <input
              id="investment-simulator-monthly"
              type="number"
              value={monthlyVal}
              onChange={(e) => setMonthlyVal(Number(e.target.value))}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="investment-simulator-rate" className={labelClass}>
              Taxa de Juros (% ao mês)
            </label>
            <input
              id="investment-simulator-rate"
              type="number"
              step="0.01"
              value={rate}
              onChange={(e) => setRate(Number(e.target.value))}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="investment-simulator-years" className={labelClass}>
              Período (Anos)
            </label>
            <input
              id="investment-simulator-years"
              type="range"
              min="1"
              max="30"
              value={years}
              onChange={(e) => setYears(Number(e.target.value))}
              className="w-full mt-2 accent-blue-600"
            />
            <div className="text-right font-bold text-[#dbe3ff]">
              {years} Anos
            </div>
          </div>
        </div>

        <div className="md:col-span-1 rounded-2xl text-white p-6 shadow-[0_16px_38px_rgba(7,12,26,0.48)] flex flex-col justify-center relative overflow-hidden border border-[#3d4f86] bg-[linear-gradient(150deg,rgba(38,52,92,0.92)_0%,rgba(23,32,61,0.96)_52%,rgba(17,24,47,0.98)_100%)]">
          <div className="absolute top-0 right-0 p-24 bg-blue-500 rounded-full blur-[100px] opacity-20"></div>
          <div className="relative z-10 grid grid-cols-1 gap-5">
            <div>
              <p className="text-slate-400 text-xs mb-1 uppercase tracking-wide">
                Total Investido
              </p>
              <p className="text-2xl font-semibold text-slate-300">
                {formatCurrency(totalInvested)}
              </p>
            </div>
            <div>
              <p className="text-emerald-400 text-xs mb-1 flex items-center gap-1 uppercase tracking-wide">
                <TrendingUp size={14} /> Total em Juros
              </p>
              <p className="text-2xl font-semibold text-emerald-400">
                +{formatCurrency(totalInterest)}
              </p>
            </div>
          </div>
          <div className="mt-6 pt-6 border-t border-slate-700 relative z-10">
            <p className="text-slate-400 text-xs uppercase tracking-wide">
              Patrimônio Final Estimado
            </p>
            <p className="text-4xl font-bold mt-2 bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
              {formatCurrency(futureValue)}
            </p>
          </div>
        </div>

        <div className={`${redesignPanelClass} flex flex-col min-h-0`}>
          <h3 className="text-sm font-semibold text-[#dbe3ff] uppercase tracking-wide mb-3">
            Investimentos Cadastrados
          </h3>
          {investments.length === 0 ? (
            <p className="text-[#7f84a8] text-center py-8">
              Você ainda não possui investimentos cadastrados.
            </p>
          ) : (
            <div className="space-y-2 overflow-y-auto pr-1">
              {investments.map((inv) => (
                <div
                  key={inv.id}
                  className="rounded-lg border border-[#3d4f86] bg-[linear-gradient(165deg,rgba(35,48,84,0.78)_0%,rgba(24,32,61,0.88)_100%)] p-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-[#dbe3ff]">
                        {inv.nome}
                      </p>
                      <p className="text-xs text-[#9f9cb9]">
                        {inv.instituicao} • {inv.tipo}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDelete(inv.id)}
                      aria-label={`Remover investimento ${inv.nome}`}
                      className="text-[#8f94b4] hover:text-[#f08f9f] transition-colors p-1"
                      title="Remover"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>

                  <div className="mt-2 flex items-end justify-between gap-2">
                    <div>
                      <p className="text-[11px] uppercase tracking-wide text-[#7f84a8]">
                        Saldo Atual
                      </p>
                      <p className="text-base font-bold text-[#7aa8ff]">
                        {formatCurrency(inv.saldoAtual)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => openAporteModal(String(inv.id))}
                      className="inline-flex items-center gap-1 rounded-md border border-[#2f4566] bg-[#151f34] px-2.5 py-1.5 text-xs font-semibold text-[#9ec2ff] hover:bg-[#1a2842] transition-colors"
                    >
                      <PlusCircle size={12} /> Aportar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#090b14]/75 px-4 backdrop-blur-[2px]">
            <div className="w-full max-w-2xl rounded-2xl border border-[#2a3554] bg-[linear-gradient(145deg,rgba(18,24,40,0.98)_0%,rgba(15,20,35,0.97)_100%)] p-5 shadow-[0_22px_80px_rgba(6,10,20,0.65)]">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-[#dbe3ff]">
                    {createModalType === "investment"
                      ? "Nova aplicação"
                      : "Novo aporte"}
                  </h3>
                  <p className="text-xs text-[#9f9cb9] mt-1">
                    {createModalType === "investment"
                      ? "Cadastre um novo ativo na sua carteira."
                      : "Selecione o investimento e informe o valor do aporte."}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeCreateModal}
                  className="text-[#8f94b4] hover:text-[#dbe3ff] p-1 transition-colors"
                  aria-label="Fechar modal"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="mb-4 inline-flex rounded-lg border border-[#2a3554] bg-[#10152d] p-1">
                <button
                  type="button"
                  onClick={() => setCreateModalType("investment")}
                  className={`rounded-md px-3 py-1.5 text-sm font-semibold transition-colors ${
                    createModalType === "investment"
                      ? "bg-[#1b2b47] text-[#dbe3ff]"
                      : "text-[#9f9cb9] hover:text-[#dbe3ff]"
                  }`}
                >
                  Aplicação
                </button>
                <button
                  type="button"
                  onClick={() => setCreateModalType("aporte")}
                  className={`rounded-md px-3 py-1.5 text-sm font-semibold transition-colors ${
                    createModalType === "aporte"
                      ? "bg-[#1b2b47] text-[#dbe3ff]"
                      : "text-[#9f9cb9] hover:text-[#dbe3ff]"
                  }`}
                >
                  Aporte
                </button>
              </div>

              <form onSubmit={handleModalSubmit} className="space-y-3">
                {createModalType === "investment" ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="Nome do Ativo (ex: MXRF11, CDB)"
                      value={newNome}
                      onChange={(e) => setNewNome(e.target.value)}
                      className={compactInputClass}
                      required
                    />
                    <input
                      type="text"
                      placeholder="Corretora / Banco"
                      value={newInstituicao}
                      onChange={(e) => setNewInstituicao(e.target.value)}
                      className={compactInputClass}
                      required
                    />
                    <select
                      value={newTipo}
                      onChange={(e) => setNewTipo(e.target.value)}
                      className={compactInputClass}
                    >
                      <option value="TesouroDireto">Tesouro Direto</option>
                      <option value="CDB">CDB</option>
                      <option value="LCI">LCI</option>
                      <option value="LCA">LCA</option>
                      <option value="FII">FII</option>
                      <option value="Acoes">Ações</option>
                      <option value="Criptomoedas">Cripto</option>
                      <option value="Outros">Outros</option>
                    </select>
                    <input
                      type="number"
                      placeholder="Valor Aplicado"
                      value={newValor}
                      onChange={(e) => setNewValor(e.target.value)}
                      className={compactInputClass}
                      required
                      min="0.01"
                      step="0.01"
                    />
                    <input
                      type="date"
                      value={newDate}
                      onChange={(e) => setNewDate(e.target.value)}
                      className={compactInputClass}
                      required
                    />
                    <select
                      value={newRentabilidade}
                      onChange={(e) => setNewRentabilidade(e.target.value)}
                      className={compactInputClass}
                    >
                      <option value="PosFixado">Pós-Fixado (CDI/Selic)</option>
                      <option value="PreFixado">Pré-Fixado</option>
                      <option value="IPCA">Atrelado à Inflação (IPCA)</option>
                      <option value="Variavel">Renda Variável</option>
                    </select>
                    <select
                      value={newLiquidez}
                      onChange={(e) => setNewLiquidez(e.target.value)}
                      className={compactInputClass}
                    >
                      <option value="Diaria">Liquidez Diária</option>
                      <option value="NoVencimento">Apenas no Vencimento</option>
                      <option value="PrazoFechado">Prazo Fechado (D+X)</option>
                    </select>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <select
                      value={selectedInvestmentId}
                      onChange={(e) => setSelectedInvestmentId(e.target.value)}
                      className={compactInputClass}
                      required
                    >
                      <option value="">Selecione o investimento</option>
                      {investments.map((inv) => (
                        <option key={inv.id} value={inv.id}>
                          {inv.nome} - {inv.instituicao}
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      placeholder="Valor do aporte"
                      value={aporteValue}
                      onChange={(e) => setAporteValue(e.target.value)}
                      className={compactInputClass}
                      required
                      min="0.01"
                      step="0.01"
                    />
                  </div>
                )}

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={closeCreateModal}
                    className="rounded-lg border border-[#2a3554] px-4 py-2 text-sm font-semibold text-[#9f9cb9] hover:text-[#dbe3ff] transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="rounded-lg border border-[#26513f] bg-[#143325] px-4 py-2 text-sm font-semibold text-[#8ef0c6] hover:bg-[#194130] transition-colors"
                  >
                    {createModalType === "investment"
                      ? "Salvar investimento"
                      : "Salvar aporte"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <div
      className={`space-y-6 animate-fade-in pb-10 ${
        isRedesign ? "text-[#dbe3ff]" : ""
      }`}
    >
      {/* 1. SIMULADOR (Seu código original mantido) */}
      <header className={panelClass}>
        <h2
          className={`text-xl font-bold flex items-center gap-2 ${
            isRedesign ? "text-[#dbe3ff]" : "text-slate-800"
          }`}
        >
          <BarChart3
            className={isRedesign ? "text-[#7aa8ff]" : "text-blue-600"}
          />{" "}
          Simulador de Juros Compostos
        </h2>
        <p
          className={`text-sm mt-1 ${isRedesign ? "text-[#9f9cb9]" : "text-slate-500"}`}
        >
          Veja o poder do tempo e dos aportes mensais.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className={`${panelClass} space-y-4`}>
          <div>
            <label
              htmlFor="investment-simulator-initial"
              className={labelClass}
            >
              Aporte Inicial
            </label>
            <input
              id="investment-simulator-initial"
              type="number"
              value={initialVal}
              onChange={(e) => setInitialVal(Number(e.target.value))}
              className={inputClass}
            />
          </div>
          <div>
            <label
              htmlFor="investment-simulator-monthly"
              className={labelClass}
            >
              Aporte Mensal
            </label>
            <input
              id="investment-simulator-monthly"
              type="number"
              value={monthlyVal}
              onChange={(e) => setMonthlyVal(Number(e.target.value))}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="investment-simulator-rate" className={labelClass}>
              Taxa de Juros (% ao mês)
            </label>
            <input
              id="investment-simulator-rate"
              type="number"
              step="0.01"
              value={rate}
              onChange={(e) => setRate(Number(e.target.value))}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="investment-simulator-years" className={labelClass}>
              Período (Anos)
            </label>
            <input
              id="investment-simulator-years"
              type="range"
              min="1"
              max="30"
              value={years}
              onChange={(e) => setYears(Number(e.target.value))}
              className="w-full mt-2 accent-blue-600"
            />
            <div
              className={`text-right font-bold ${
                isRedesign ? "text-[#dbe3ff]" : "text-slate-700"
              }`}
            >
              {years} Anos
            </div>
          </div>
        </div>

        <div className="md:col-span-2 bg-slate-900 text-white p-8 rounded-xl shadow-lg flex flex-col justify-center relative overflow-hidden">
          <div className="absolute top-0 right-0 p-32 bg-blue-500 rounded-full blur-[100px] opacity-20"></div>
          <div className="relative z-10 grid grid-cols-2 gap-8">
            <div>
              <p className="text-slate-400 text-sm mb-1">
                Total Investido (Do seu bolso)
              </p>
              <p className="text-2xl font-semibold text-slate-300">
                {formatCurrency(totalInvested)}
              </p>
            </div>
            <div>
              <p className="text-emerald-400 text-sm mb-1 flex items-center gap-1">
                <TrendingUp size={14} /> Total em Juros (Lucro)
              </p>
              <p className="text-2xl font-semibold text-emerald-400">
                +{formatCurrency(totalInterest)}
              </p>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-slate-700 relative z-10">
            <p className="text-slate-400 text-sm uppercase tracking-wide">
              Patrimônio Final Estimado
            </p>
            <p className="text-5xl font-bold mt-2 bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
              {formatCurrency(futureValue)}
            </p>
          </div>
        </div>
      </div>

      {/* 2. FORMULÁRIO DE NOVO INVESTIMENTO */}
      <form onSubmit={handleCreateInvestment} className={`${panelClass} mt-8`}>
        <h3 className={sectionTitleClass}>
          <PlusCircle
            className={isRedesign ? "text-[#5fd0a5]" : "text-emerald-600"}
            size={20}
          />{" "}
          Nova Aplicação
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <label htmlFor="new-investment-name" className="sr-only">
            Nome do ativo
          </label>
          <input
            id="new-investment-name"
            type="text"
            placeholder="Nome do Ativo (ex: MXRF11, CDB)"
            value={newNome}
            onChange={(e) => setNewNome(e.target.value)}
            className={compactInputClass}
            required
          />
          <label htmlFor="new-investment-institution" className="sr-only">
            Corretora ou banco
          </label>
          <input
            id="new-investment-institution"
            type="text"
            placeholder="Corretora / Banco"
            value={newInstituicao}
            onChange={(e) => setNewInstituicao(e.target.value)}
            className={compactInputClass}
            required
          />

          <select
            value={newTipo}
            onChange={(e) => setNewTipo(e.target.value)}
            className={compactInputClass}
          >
            <option value="TesouroDireto">Tesouro Direto</option>
            <option value="CDB">CDB</option>
            <option value="LCI">LCI</option>
            <option value="LCA">LCA</option>
            <option value="FII">FII</option>
            <option value="Acoes">Ações</option>
            <option value="Criptomoedas">Cripto</option>
            <option value="Outros">Outros</option>
          </select>

          <label htmlFor="new-investment-value" className="sr-only">
            Valor aplicado
          </label>
          <input
            id="new-investment-value"
            type="number"
            placeholder="Valor Aplicado"
            value={newValor}
            onChange={(e) => setNewValor(e.target.value)}
            className={compactInputClass}
            required
            min="0.01"
            step="0.01"
          />

          <label htmlFor="new-investment-date" className="sr-only">
            Data inicial do investimento
          </label>
          <input
            id="new-investment-date"
            type="date"
            value={newDate}
            onChange={(e) => setNewDate(e.target.value)}
            className={compactInputClass}
            required
          />

          <select
            value={newRentabilidade}
            onChange={(e) => setNewRentabilidade(e.target.value)}
            className={compactInputClass}
          >
            <option value="PosFixado">Pós-Fixado (CDI/Selic)</option>
            <option value="PreFixado">Pré-Fixado</option>
            <option value="IPCA">Atrelado à Inflação (IPCA)</option>
            <option value="Variavel">Renda Variável</option>
          </select>

          <select
            value={newLiquidez}
            onChange={(e) => setNewLiquidez(e.target.value)}
            className={compactInputClass}
          >
            <option value="Diaria">Liquidez Diária</option>
            <option value="NoVencimento">Apenas no Vencimento</option>
            <option value="PrazoFechado">Prazo Fechado (D+X)</option>
          </select>

          <button
            type="submit"
            className="bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 transition-colors"
          >
            Salvar Investimento
          </button>
        </div>
      </form>

      {/* 3. LISTA DA CARTEIRA DE INVESTIMENTOS */}
      <div className={`${panelClass} mt-8`}>
        <h3 className={sectionTitleClass}>
          <Briefcase
            className={isRedesign ? "text-[#7aa8ff]" : "text-blue-600"}
            size={20}
          />{" "}
          Minha Carteira
        </h3>

        {investments.length === 0 ? (
          <p
            className={`${isRedesign ? "text-[#7f84a8]" : "text-slate-400"} text-center py-8`}
          >
            Você ainda não possui investimentos cadastrados.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {investments.map((inv) => (
              <div key={inv.id} className={portfolioCardClass}>
                {/* Cabeçalho do Card */}
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4
                      className={`font-bold ${isRedesign ? "text-[#dbe3ff]" : "text-slate-800"}`}
                    >
                      {inv.nome}
                    </h4>
                    <p
                      className={`text-xs ${isRedesign ? "text-[#9f9cb9]" : "text-slate-500"}`}
                    >
                      {inv.instituicao} • {inv.tipo}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDelete(inv.id)}
                    aria-label={`Remover investimento ${inv.nome}`}
                    className="text-slate-300 hover:text-red-500 transition-colors p-1"
                    title="Remover"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                {/* Valores */}
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between items-end">
                    <span
                      className={`text-sm ${isRedesign ? "text-[#9f9cb9]" : "text-slate-500"}`}
                    >
                      Saldo Atual
                    </span>
                    <span
                      className={`text-xl font-bold ${isRedesign ? "text-[#7aa8ff]" : "text-blue-600"}`}
                    >
                      {formatCurrency(inv.saldoAtual)}
                    </span>
                  </div>
                  <div className="flex justify-between items-end">
                    <span
                      className={`text-xs ${isRedesign ? "text-[#7f84a8]" : "text-slate-400"}`}
                    >
                      Total Aplicado
                    </span>
                    <span
                      className={`text-sm font-medium ${isRedesign ? "text-[#b9bfd8]" : "text-slate-600"}`}
                    >
                      {formatCurrency(inv.valorAplicado)}
                    </span>
                  </div>
                  {/* Rentabilidade Simples */}
                  <div className="flex justify-between items-end">
                    <span className="text-xs text-slate-400">
                      Rentabilidade
                    </span>
                    <span
                      className={`text-sm font-bold ${inv.saldoAtual >= inv.valorAplicado ? "text-emerald-500" : "text-red-500"}`}
                    >
                      {formatCurrency(inv.saldoAtual - inv.valorAplicado)}
                    </span>
                  </div>
                </div>

                {/* Botões de Ação */}
                {activeAction.id === inv.id ? (
                  <div
                    className={`${isRedesign ? "bg-[#10152d] border-[#2a3554]" : "bg-slate-50 border-slate-200"} p-3 rounded-lg border flex gap-2 items-center animate-fade-in mt-auto`}
                  >
                    <label
                      htmlFor={`investment-action-${inv.id}`}
                      className="sr-only"
                    >
                      {activeAction.type === "saldo"
                        ? "Novo saldo total"
                        : "Valor da operação"}
                    </label>
                    <input
                      id={`investment-action-${inv.id}`}
                      type="number"
                      placeholder={
                        activeAction.type === "saldo"
                          ? "Novo Saldo Total"
                          : "Valor"
                      }
                      className="flex-1 p-2 border rounded-md text-sm"
                      value={actionValue}
                      onChange={(e) => setActionValue(e.target.value)}
                      autoFocus
                    />
                    <button
                      onClick={() => handleExecuteAction(inv.id)}
                      className="bg-blue-600 text-white px-3 py-2 rounded-md text-sm font-bold hover:bg-blue-700"
                    >
                      OK
                    </button>
                    <button
                      onClick={() => setActiveAction({ id: null, type: null })}
                      aria-label="Cancelar edição de ação"
                      className="text-slate-400 hover:text-slate-600 p-2"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <div
                    className={`grid grid-cols-3 gap-2 mt-auto border-t ${isRedesign ? "border-[#2a3554]" : "border-slate-100"} pt-4`}
                  >
                    <button
                      onClick={() => {
                        setActiveAction({ id: inv.id, type: "aporte" });
                        setActionValue("");
                      }}
                      className={`flex flex-col items-center gap-1 ${isRedesign ? "text-[#9f9cb9] hover:text-[#5fd0a5]" : "text-slate-500 hover:text-emerald-600"} transition-colors group`}
                    >
                      <div
                        className={`${isRedesign ? "bg-[#171d38] group-hover:bg-[#183227]" : "bg-slate-100 group-hover:bg-emerald-50"} p-2 rounded-full`}
                      >
                        <ArrowUpCircle size={16} />
                      </div>
                      <span className="text-[10px] font-bold uppercase">
                        Aportar
                      </span>
                    </button>
                    <button
                      onClick={() => {
                        setActiveAction({ id: inv.id, type: "saque" });
                        setActionValue("");
                      }}
                      className={`flex flex-col items-center gap-1 ${isRedesign ? "text-[#9f9cb9] hover:text-[#e48797]" : "text-slate-500 hover:text-rose-600"} transition-colors group`}
                    >
                      <div
                        className={`${isRedesign ? "bg-[#171d38] group-hover:bg-[#351e2a]" : "bg-slate-100 group-hover:bg-rose-50"} p-2 rounded-full`}
                      >
                        <ArrowDownCircle size={16} />
                      </div>
                      <span className="text-[10px] font-bold uppercase">
                        Resgatar
                      </span>
                    </button>
                    <button
                      onClick={() => {
                        setActiveAction({ id: inv.id, type: "saldo" });
                        setActionValue(inv.saldoAtual);
                      }}
                      className={`flex flex-col items-center gap-1 ${isRedesign ? "text-[#9f9cb9] hover:text-[#7aa8ff]" : "text-slate-500 hover:text-blue-600"} transition-colors group`}
                    >
                      <div
                        className={`${isRedesign ? "bg-[#171d38] group-hover:bg-[#1c2948]" : "bg-slate-100 group-hover:bg-blue-50"} p-2 rounded-full`}
                      >
                        <RefreshCw size={16} />
                      </div>
                      <span className="text-[10px] font-bold uppercase">
                        Atualizar
                      </span>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default InvestmentsView;
