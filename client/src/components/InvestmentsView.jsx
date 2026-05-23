import { useState } from "react";
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

const InvestmentsView = ({ investmentAmount, investments, fetchData }) => {
  // --- ESTADOS DO SIMULADOR (Mantidos do seu original) ---
  const [initialVal, setInitialVal] = useState(0);
  const [monthlyVal, setMonthlyVal] = useState(investmentAmount || 0);
  const [rate, setRate] = useState(0.85);
  const [years, setYears] = useState(1);

  const months = years * 12;
  const rateDecimal = rate / 100;
  const futureValue =
    initialVal * Math.pow(1 + rateDecimal, months) +
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

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* 1. SIMULADOR (Seu código original mantido) */}
      <header className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h2 className="text-xl font-bold flex items-center gap-2 text-slate-800">
          <BarChart3 className="text-blue-600" /> Simulador de Juros Compostos
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Veja o poder do tempo e dos aportes mensais.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase">
              Aporte Inicial
            </label>
            <input
              type="number"
              value={initialVal}
              onChange={(e) => setInitialVal(Number(e.target.value))}
              className="w-full p-2 border rounded-lg mt-1"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase">
              Aporte Mensal
            </label>
            <input
              type="number"
              value={monthlyVal}
              onChange={(e) => setMonthlyVal(Number(e.target.value))}
              className="w-full p-2 border rounded-lg mt-1"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase">
              Taxa de Juros (% ao mês)
            </label>
            <input
              type="number"
              step="0.01"
              value={rate}
              onChange={(e) => setRate(Number(e.target.value))}
              className="w-full p-2 border rounded-lg mt-1"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase">
              Período (Anos)
            </label>
            <input
              type="range"
              min="1"
              max="30"
              value={years}
              onChange={(e) => setYears(Number(e.target.value))}
              className="w-full mt-2 accent-blue-600"
            />
            <div className="text-right font-bold text-slate-700">
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
      <form
        onSubmit={handleCreateInvestment}
        className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm mt-8"
      >
        <h3 className="text-lg font-bold flex items-center gap-2 text-slate-800 mb-6">
          <PlusCircle className="text-emerald-600" size={20} /> Nova Aplicação
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <input
            type="text"
            placeholder="Nome do Ativo (ex: MXRF11, CDB)"
            value={newNome}
            onChange={(e) => setNewNome(e.target.value)}
            className="p-2 border rounded-lg"
            required
          />
          <input
            type="text"
            placeholder="Corretora / Banco"
            value={newInstituicao}
            onChange={(e) => setNewInstituicao(e.target.value)}
            className="p-2 border rounded-lg"
            required
          />

          <select
            value={newTipo}
            onChange={(e) => setNewTipo(e.target.value)}
            className="p-2 border rounded-lg"
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
            className="p-2 border rounded-lg"
            required
            min="0.01"
            step="0.01"
          />

          <input
            type="date"
            value={newDate}
            onChange={(e) => setNewDate(e.target.value)}
            className="p-2 border rounded-lg"
            required
          />

          <select
            value={newRentabilidade}
            onChange={(e) => setNewRentabilidade(e.target.value)}
            className="p-2 border rounded-lg"
          >
            <option value="PosFixado">Pós-Fixado (CDI/Selic)</option>
            <option value="PreFixado">Pré-Fixado</option>
            <option value="IPCA">Atrelado à Inflação (IPCA)</option>
            <option value="Variavel">Renda Variável</option>
          </select>

          <select
            value={newLiquidez}
            onChange={(e) => setNewLiquidez(e.target.value)}
            className="p-2 border rounded-lg"
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
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm mt-8">
        <h3 className="text-lg font-bold flex items-center gap-2 text-slate-800 mb-6">
          <Briefcase className="text-blue-600" size={20} /> Minha Carteira
        </h3>

        {investments.length === 0 ? (
          <p className="text-slate-400 text-center py-8">
            Você ainda não possui investimentos cadastrados.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {investments.map((inv) => (
              <div
                key={inv.id}
                className="border border-slate-200 rounded-xl p-5 hover:shadow-md transition-shadow relative overflow-hidden flex flex-col justify-between"
              >
                {/* Cabeçalho do Card */}
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="font-bold text-slate-800">{inv.nome}</h4>
                    <p className="text-xs text-slate-500">
                      {inv.instituicao} • {inv.tipo}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDelete(inv.id)}
                    className="text-slate-300 hover:text-red-500 transition-colors p-1"
                    title="Remover"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                {/* Valores */}
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between items-end">
                    <span className="text-sm text-slate-500">Saldo Atual</span>
                    <span className="text-xl font-bold text-blue-600">
                      {formatCurrency(inv.saldoAtual)}
                    </span>
                  </div>
                  <div className="flex justify-between items-end">
                    <span className="text-xs text-slate-400">
                      Total Aplicado
                    </span>
                    <span className="text-sm font-medium text-slate-600">
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
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex gap-2 items-center animate-fade-in mt-auto">
                    <input
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
                      className="text-slate-400 hover:text-slate-600 p-2"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2 mt-auto border-t border-slate-100 pt-4">
                    <button
                      onClick={() => {
                        setActiveAction({ id: inv.id, type: "aporte" });
                        setActionValue("");
                      }}
                      className="flex flex-col items-center gap-1 text-slate-500 hover:text-emerald-600 transition-colors group"
                    >
                      <div className="bg-slate-100 group-hover:bg-emerald-50 p-2 rounded-full">
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
                      className="flex flex-col items-center gap-1 text-slate-500 hover:text-rose-600 transition-colors group"
                    >
                      <div className="bg-slate-100 group-hover:bg-rose-50 p-2 rounded-full">
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
                      className="flex flex-col items-center gap-1 text-slate-500 hover:text-blue-600 transition-colors group"
                    >
                      <div className="bg-slate-100 group-hover:bg-blue-50 p-2 rounded-full">
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
