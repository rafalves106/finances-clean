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

  const panelStyle = {
    background: "var(--bg-surface)",
    border: "1px solid var(--border-default)",
  };
  const fieldStyle = {
    border: "1px solid var(--border-default)",
    background: "var(--bg-surface)",
    color: "var(--text-primary)",
    "--tw-ring-color": "var(--accent-600)",
  };

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* 1. SIMULADOR */}
      <header className="p-6 rounded-xl shadow-sm" style={panelStyle}>
        <h2
          className="text-xl font-bold flex items-center gap-2"
          style={{ color: "var(--text-primary)" }}
        >
          <BarChart3 style={{ color: "var(--accent-600)" }} /> Simulador de
          Juros Compostos
        </h2>
        <p className="text-sm mt-1" style={{ color: "var(--text-tertiary)" }}>
          Veja o poder do tempo e dos aportes mensais.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-xl shadow-sm space-y-4" style={panelStyle}>
          <div>
            <label
              htmlFor="investment-simulator-initial"
              className="text-xs font-bold uppercase"
              style={{ color: "var(--text-tertiary)" }}
            >
              Aporte Inicial
            </label>
            <input
              id="investment-simulator-initial"
              type="number"
              value={initialVal}
              onChange={(e) => setInitialVal(Number(e.target.value))}
              className="w-full p-2 rounded-lg mt-1 focus:outline-none focus:ring-2"
              style={fieldStyle}
            />
          </div>
          <div>
            <label
              htmlFor="investment-simulator-monthly"
              className="text-xs font-bold uppercase"
              style={{ color: "var(--text-tertiary)" }}
            >
              Aporte Mensal
            </label>
            <input
              id="investment-simulator-monthly"
              type="number"
              value={monthlyVal}
              onChange={(e) => setMonthlyVal(Number(e.target.value))}
              className="w-full p-2 rounded-lg mt-1 focus:outline-none focus:ring-2"
              style={fieldStyle}
            />
          </div>
          <div>
            <label
              htmlFor="investment-simulator-rate"
              className="text-xs font-bold uppercase"
              style={{ color: "var(--text-tertiary)" }}
            >
              Taxa de Juros (% ao mês)
            </label>
            <input
              id="investment-simulator-rate"
              type="number"
              step="0.01"
              value={rate}
              onChange={(e) => setRate(Number(e.target.value))}
              className="w-full p-2 rounded-lg mt-1 focus:outline-none focus:ring-2"
              style={fieldStyle}
            />
          </div>
          <div>
            <label
              htmlFor="investment-simulator-years"
              className="text-xs font-bold uppercase"
              style={{ color: "var(--text-tertiary)" }}
            >
              Período (Anos)
            </label>
            <input
              id="investment-simulator-years"
              type="range"
              min="1"
              max="30"
              value={years}
              onChange={(e) => setYears(Number(e.target.value))}
              className="w-full mt-2"
              style={{ accentColor: "var(--accent-600)" }}
            />
            <div
              className="text-right font-bold"
              style={{ color: "var(--text-primary)" }}
            >
              {years} Anos
            </div>
          </div>
        </div>

        <div
          className="md:col-span-2 p-8 rounded-xl shadow-sm flex flex-col justify-center relative overflow-hidden"
          style={{
            background: "var(--accent-50)",
            border: "1px solid var(--accent-100)",
          }}
        >
          <div className="relative z-10 grid grid-cols-2 gap-8">
            <div>
              <p
                className="text-sm mb-1"
                style={{ color: "var(--text-secondary)" }}
              >
                Total Investido (Do seu bolso)
              </p>
              <p
                className="text-2xl font-semibold"
                style={{ color: "var(--text-primary)" }}
              >
                {formatCurrency(totalInvested)}
              </p>
            </div>
            <div>
              <p
                className="text-sm mb-1 flex items-center gap-1"
                style={{ color: "var(--success-700)" }}
              >
                <TrendingUp size={14} /> Total em Juros (Lucro)
              </p>
              <p
                className="text-2xl font-semibold"
                style={{ color: "var(--success-700)" }}
              >
                +{formatCurrency(totalInterest)}
              </p>
            </div>
          </div>
          <div
            className="mt-8 pt-8 relative z-10"
            style={{ borderTop: "1px solid var(--accent-100)" }}
          >
            <p
              className="text-sm uppercase tracking-wide"
              style={{ color: "var(--text-secondary)" }}
            >
              Patrimônio Final Estimado
            </p>
            <p
              className="text-5xl font-bold mt-2"
              style={{ color: "var(--accent-600)" }}
            >
              {formatCurrency(futureValue)}
            </p>
          </div>
        </div>
      </div>

      {/* 2. FORMULÁRIO DE NOVO INVESTIMENTO */}
      <form
        onSubmit={handleCreateInvestment}
        className="p-6 rounded-xl shadow-sm mt-8"
        style={panelStyle}
      >
        <h3
          className="text-lg font-bold flex items-center gap-2 mb-6"
          style={{ color: "var(--text-primary)" }}
        >
          <PlusCircle style={{ color: "var(--success-700)" }} size={20} />{" "}
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
            className="p-2 rounded-lg focus:outline-none focus:ring-2"
            style={fieldStyle}
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
            className="p-2 rounded-lg focus:outline-none focus:ring-2"
            style={fieldStyle}
            required
          />

          <select
            value={newTipo}
            onChange={(e) => setNewTipo(e.target.value)}
            className="p-2 rounded-lg focus:outline-none focus:ring-2"
            style={fieldStyle}
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
            className="p-2 rounded-lg focus:outline-none focus:ring-2"
            style={fieldStyle}
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
            className="p-2 rounded-lg focus:outline-none focus:ring-2"
            style={fieldStyle}
            required
          />

          <select
            value={newRentabilidade}
            onChange={(e) => setNewRentabilidade(e.target.value)}
            className="p-2 rounded-lg focus:outline-none focus:ring-2"
            style={fieldStyle}
          >
            <option value="PosFixado">Pós-Fixado (CDI/Selic)</option>
            <option value="PreFixado">Pré-Fixado</option>
            <option value="IPCA">Atrelado à Inflação (IPCA)</option>
            <option value="Variavel">Renda Variável</option>
          </select>

          <select
            value={newLiquidez}
            onChange={(e) => setNewLiquidez(e.target.value)}
            className="p-2 rounded-lg focus:outline-none focus:ring-2"
            style={fieldStyle}
          >
            <option value="Diaria">Liquidez Diária</option>
            <option value="NoVencimento">Apenas no Vencimento</option>
            <option value="PrazoFechado">Prazo Fechado (D+X)</option>
          </select>

          <button
            type="submit"
            className="rounded-lg font-bold transition-colors"
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
            Salvar Investimento
          </button>
        </div>
      </form>

      {/* 3. LISTA DA CARTEIRA DE INVESTIMENTOS */}
      <div className="p-6 rounded-xl shadow-sm mt-8" style={panelStyle}>
        <h3
          className="text-lg font-bold flex items-center gap-2 mb-6"
          style={{ color: "var(--text-primary)" }}
        >
          <Briefcase style={{ color: "var(--accent-600)" }} size={20} /> Minha
          Carteira
        </h3>

        {investments.length === 0 ? (
          <p
            className="text-center py-8"
            style={{ color: "var(--text-tertiary)" }}
          >
            Você ainda não possui investimentos cadastrados.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {investments.map((inv) => (
              <div
                key={inv.id}
                className="rounded-xl p-5 transition-shadow relative overflow-hidden flex flex-col justify-between"
                style={{
                  border: "1px solid var(--border-default)",
                  background: "var(--bg-surface-sunken)",
                }}
              >
                {/* Cabeçalho do Card */}
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4
                      className="font-bold"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {inv.nome}
                    </h4>
                    <p
                      className="text-xs"
                      style={{ color: "var(--text-tertiary)" }}
                    >
                      {inv.instituicao} • {inv.tipo}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDelete(inv.id)}
                    aria-label={`Remover investimento ${inv.nome}`}
                    className="transition-colors p-1"
                    style={{ color: "var(--text-tertiary)" }}
                    title="Remover"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                {/* Valores */}
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between items-end">
                    <span
                      className="text-sm"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      Saldo Atual
                    </span>
                    <span
                      className="text-xl font-bold"
                      style={{ color: "var(--accent-600)" }}
                    >
                      {formatCurrency(inv.saldoAtual)}
                    </span>
                  </div>
                  <div className="flex justify-between items-end">
                    <span
                      className="text-xs"
                      style={{ color: "var(--text-tertiary)" }}
                    >
                      Total Aplicado
                    </span>
                    <span
                      className="text-sm font-medium"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {formatCurrency(inv.valorAplicado)}
                    </span>
                  </div>
                  {/* Rentabilidade Simples */}
                  <div className="flex justify-between items-end">
                    <span
                      className="text-xs"
                      style={{ color: "var(--text-tertiary)" }}
                    >
                      Rentabilidade
                    </span>
                    <span
                      className="text-sm font-bold"
                      style={{
                        color:
                          inv.saldoAtual >= inv.valorAplicado
                            ? "var(--success-700)"
                            : "var(--danger-700)",
                      }}
                    >
                      {formatCurrency(inv.saldoAtual - inv.valorAplicado)}
                    </span>
                  </div>
                </div>

                {/* Botões de Ação */}
                {activeAction.id === inv.id ? (
                  <div
                    className="p-3 rounded-lg border flex gap-2 items-center animate-fade-in mt-auto"
                    style={{
                      background: "var(--bg-surface)",
                      borderColor: "var(--border-default)",
                    }}
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
                      className="flex-1 p-2 rounded-md text-sm focus:outline-none focus:ring-2"
                      style={fieldStyle}
                      value={actionValue}
                      onChange={(e) => setActionValue(e.target.value)}
                      autoFocus
                    />
                    <button
                      onClick={() => handleExecuteAction(inv.id)}
                      className="px-3 py-2 rounded-md text-sm font-bold"
                      style={{
                        background: "var(--accent-600)",
                        color: "var(--text-on-accent)",
                      }}
                    >
                      OK
                    </button>
                    <button
                      onClick={() => setActiveAction({ id: null, type: null })}
                      aria-label="Cancelar edição de ação"
                      className="p-2"
                      style={{ color: "var(--text-tertiary)" }}
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <div
                    className="grid grid-cols-3 gap-2 mt-auto border-t pt-4"
                    style={{ borderColor: "var(--border-subtle)" }}
                  >
                    <button
                      onClick={() => {
                        setActiveAction({ id: inv.id, type: "aporte" });
                        setActionValue("");
                      }}
                      className="flex flex-col items-center gap-1 transition-colors group"
                      style={{ color: "var(--text-tertiary)" }}
                    >
                      <div
                        className="p-2 rounded-full"
                        style={{ background: "var(--bg-surface)" }}
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
                      className="flex flex-col items-center gap-1 transition-colors group"
                      style={{ color: "var(--text-tertiary)" }}
                    >
                      <div
                        className="p-2 rounded-full"
                        style={{ background: "var(--bg-surface)" }}
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
                      className="flex flex-col items-center gap-1 transition-colors group"
                      style={{ color: "var(--text-tertiary)" }}
                    >
                      <div
                        className="p-2 rounded-full"
                        style={{ background: "var(--bg-surface)" }}
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
