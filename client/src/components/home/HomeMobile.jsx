import { useMemo, useState } from "react";
import {
  ArrowLeft,
  Bank,
  CalendarCheck,
  Plus,
  TrendDown,
  TrendUp,
  Wallet,
} from "@phosphor-icons/react";
import { formatCurrency } from "../../util/formatCurrency";
import { formatDateLabel, formatVariationPercent } from "../../util/dashboardFormatters";
import { useDashboardFinancials } from "../../hooks/useDashboardFinancials";
import { useTransactionActions } from "../../hooks/useTransactionActions";
import CategorySpendBars from "../dashboard/CategorySpendBars";
import TransactionModal from "../TransactionModal";
import AssistenteMovimentacaoModal from "../AssistenteMovimentacaoModal";
import Panel from "../ui/Panel";
import IconTile from "../ui/IconTile";
import AiAssistantChip from "../ui/AiAssistantChip";

const TREND_TONE = {
  up: { icon: TrendUp, text: "text-positive" },
  down: { icon: TrendDown, text: "text-negative" },
};

// Home mobile "só o essencial" (pedido explícito do usuário): sem gestão de
// cartões/investimentos, sem exportação, sem análise gráfica detalhada -
// isso tudo mora no desktop. Aqui: saldo do mês, categoria de gasto,
// próxima fatura e as últimas movimentações, com um atalho rápido pra
// lançar (texto/IA). Rola normalmente (padrão mobile), sem a exigência de
// caber 100% na tela que existe no desktop.
const HomeMobile = ({
  resumoMensal = null,
  comparativoMensal = null,
  faturasVencendo = [],
  incomes = [],
  expenses = [],
  fetchData,
  loading,
  totalInvestmentsBalance = 0,
  selectedMes,
  selectedAno,
  onChangeMonth = () => {},
  categorias = [],
  veiculos = [],
  onOpenCategoryManager,
  saldoAnterior = 0,
}) => {
  const [isAssistenteOpen, setIsAssistenteOpen] = useState(false);

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

  const allTransactions = useMemo(() => [...incomes, ...expenses], [incomes, expenses]);

  const { monthComparison } = useDashboardFinancials({
    allTransactions,
    incomes,
    expenses,
    categorias,
    selectedMes,
    selectedAno,
    saldoAnterior,
    faturaTransactions: [],
    resumoMensal,
    comparativoMensal,
  });

  const {
    isModalOpen,
    setIsModalOpen,
    editingItem,
    isCloning,
    isAiDraft,
    handleOpenNewTransaction,
    handleOpenEditTransaction,
    handleOpenAssistantDraft,
  } = useTransactionActions({ categorias, fetchData });

  const totalIncomeExibido = resumoMensal?.totalEntradas ?? monthComparison.currentIncome;
  const totalExpenseExibido = resumoMensal?.totalSaidas ?? monthComparison.currentExpense;
  const saldoDoMesExibido = resumoMensal
    ? resumoMensal.totalEntradas - resumoMensal.totalSaidas
    : monthComparison.currentBalance;

  const categoriaGastosDoMes = useMemo(
    () =>
      (resumoMensal?.porCategoria ?? [])
        .filter((item) => Number(item.totalSaidas || 0) > 0)
        .map((item) => ({ nome: item.nome || "Sem categoria", valor: Number(item.totalSaidas || 0) }))
        .sort((a, b) => b.valor - a.valor)
        .slice(0, 4),
    [resumoMensal],
  );

  const proximaFatura = faturasVencendo[0] || null;

  const recentTransactions = useMemo(
    () =>
      [...allTransactions]
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 8),
    [allTransactions],
  );

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center" style={{ color: "var(--text-tertiary)" }}>
        Carregando informações...
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 px-4 pb-24 pt-16">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handlePreviousMonth}
          aria-label="Mês anterior"
          className="flex h-8 w-8 items-center justify-center rounded-full"
          style={{ color: "var(--text-secondary)" }}
        >
          <ArrowLeft size={14} />
        </button>
        <span className="flex-1 text-center text-sm font-semibold capitalize" style={{ color: "var(--text-primary)" }}>
          {currentMonthLabel}
        </span>
        <button
          type="button"
          onClick={handleNextMonth}
          aria-label="Próximo mês"
          className="flex h-8 w-8 items-center justify-center rounded-full"
          style={{ color: "var(--text-secondary)" }}
        >
          <ArrowLeft size={14} style={{ transform: "rotate(180deg)" }} />
        </button>
      </div>

      <Panel className="rounded-2xl p-4 rise-in">
        <p className="m-0 text-xs" style={{ color: "var(--text-tertiary)" }}>Saldo do mês</p>
        <p className="m-0 mt-1 text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
          {formatCurrency(saldoDoMesExibido)}
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <div>
            <p className="m-0 text-[11px]" style={{ color: "var(--text-tertiary)" }}>Receitas</p>
            <p className="m-0 text-sm font-semibold" style={{ color: "var(--success-700)" }}>
              {formatCurrency(totalIncomeExibido)}
            </p>
          </div>
          <div>
            <p className="m-0 text-[11px]" style={{ color: "var(--text-tertiary)" }}>Despesas</p>
            <p className="m-0 text-sm font-semibold" style={{ color: "var(--danger-700)" }}>
              {formatCurrency(totalExpenseExibido)}
            </p>
          </div>
        </div>
      </Panel>

      <div className="flex items-center gap-2 rise-in stagger-1">
        <AiAssistantChip onClick={() => setIsAssistenteOpen(true)} />
        <button
          type="button"
          onClick={handleOpenNewTransaction}
          className="flex h-11 flex-1 items-center justify-center gap-2 rounded-full text-xs font-semibold"
          style={{ background: "var(--accent-600)", color: "var(--text-on-accent)" }}
        >
          <Plus size={15} weight="bold" /> Nova transação
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 rise-in stagger-2">
        <Panel className="flex flex-col items-center justify-center gap-1 rounded-2xl p-3 text-center">
          <IconTile icon={Bank} tone="neutral" size={32} />
          <p className="m-0 text-sm font-bold" style={{ color: "var(--text-primary)" }}>
            {formatCurrency(totalInvestmentsBalance)}
          </p>
          <p className="m-0 text-[10px]" style={{ color: "var(--text-tertiary)" }}>
            Investimentos ({formatVariationPercent(monthComparison.investmentPercent)})
          </p>
        </Panel>

        <Panel className="flex flex-col items-center justify-center gap-1 rounded-2xl p-3 text-center">
          <IconTile icon={CalendarCheck} tone="accent" size={32} />
          {proximaFatura ? (
            <>
              <p className="m-0 text-sm font-bold" style={{ color: "var(--text-primary)" }}>
                {formatCurrency(proximaFatura.valor)}
              </p>
              <p className="m-0 text-[10px]" style={{ color: "var(--text-tertiary)" }}>
                {proximaFatura.nomeCartao} · vence {formatDateLabel(proximaFatura.dataVencimento)}
              </p>
            </>
          ) : (
            <p className="m-0 text-[11px]" style={{ color: "var(--text-tertiary)" }}>Sem fatura próxima</p>
          )}
        </Panel>
      </div>

      <Panel
        as="button"
        interactive
        animationClassName="rise-in stagger-3"
        onClick={(e) => onOpenCategoryManager?.(e.currentTarget)}
        className="flex flex-col gap-2 rounded-2xl p-3 text-left"
      >
        <p className="m-0 text-xs font-semibold" style={{ color: "var(--text-primary)" }}>
          Gastos por categoria
        </p>
        <CategorySpendBars items={categoriaGastosDoMes} formatValue={formatCurrency} />
      </Panel>

      <Panel className="rounded-2xl p-3 rise-in stagger-4">
        <p className="m-0 mb-2 text-xs font-semibold" style={{ color: "var(--text-primary)" }}>
          Últimas movimentações
        </p>
        {recentTransactions.length === 0 ? (
          <p className="py-3 text-center text-xs" style={{ color: "var(--text-tertiary)" }}>
            Nenhuma movimentação neste mês.
          </p>
        ) : (
          <div className="divide-y" style={{ borderColor: "var(--border-subtle)" }}>
            {recentTransactions.map((item) => {
              const isEntrada = item.type === "Entrada";
              const trend = isEntrada ? TREND_TONE.up : TREND_TONE.down;
              const TrendIcon = trend.icon;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleOpenEditTransaction(item)}
                  className="flex w-full items-center justify-between gap-2 py-2.5 text-left"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <TrendIcon size={14} weight="bold" className={trend.text} />
                    <div className="min-w-0">
                      <p className="m-0 truncate text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                        {item.name}
                      </p>
                      <p className="m-0 text-[11px]" style={{ color: "var(--text-tertiary)" }}>
                        {formatDateLabel(item.date)} · {item.categoria?.nome || "Sem categoria"}
                      </p>
                    </div>
                  </div>
                  <span className={`whitespace-nowrap text-sm font-semibold ${trend.text}`}>
                    {isEntrada ? "+" : "-"}
                    {formatCurrency(item.value)}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </Panel>

      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchData}
        categorias={categorias}
        veiculos={veiculos}
        editingItem={editingItem}
        isCloning={isCloning}
        isAiDraft={isAiDraft}
        periodKey={`${selectedAno}-${selectedMes}`}
      />

      <AssistenteMovimentacaoModal
        isOpen={isAssistenteOpen}
        onClose={() => setIsAssistenteOpen(false)}
        onDraftReady={(draft) => {
          setIsAssistenteOpen(false);
          handleOpenAssistantDraft(draft);
        }}
      />
    </div>
  );
};

export default HomeMobile;
