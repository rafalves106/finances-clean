import { BarChart3, CreditCard, Home, PieChart, Plus } from "lucide-react";

const MOBILE_SCREENS = ["home", "charts", "cards", "investments"];

const DashboardMobileView = ({
  selectedMes,
  selectedAno,
  onChangeMonth,
}) => {
  const currentScreen = "home";

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

  return (
    <div className="min-h-[100dvh] flex flex-col">
      <header className="h-14 px-3 flex items-center justify-between border-b border-[#2a3554] bg-[#101a33]/95">
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

      <main className="flex-1 px-3 py-3 pb-[84px]">
        <section className="rounded-2xl border border-[#2a3554] bg-[#111a2f] p-3">
          <h2 className="text-sm font-semibold text-[#dbe3ff]">
            Mobile Dashboard
          </h2>
          <p className="text-xs text-[#8f97b8] mt-1">
            Shell mobile ativa com contrato de telas: {MOBILE_SCREENS.join(" | ")}
          </p>
          <p className="text-xs text-[#8f97b8] mt-2">
            Tela atual: <strong>{currentScreen}</strong>
          </p>
        </section>
      </main>

      <nav className="fixed left-0 right-0 bottom-0 z-20 border-t border-[#2a3554] bg-[#101a33]/96 backdrop-blur-md px-3 pt-2 pb-[calc(8px+env(safe-area-inset-bottom))]">
        <div className="grid grid-cols-5 items-center gap-2">
          <button
            type="button"
            className="h-11 rounded-xl text-[#dbe3ff] bg-[#1a2849] border border-[#314870] flex items-center justify-center"
            aria-label="Home"
          >
            <Home size={18} />
          </button>
          <button
            type="button"
            className="h-11 rounded-xl text-[#96a7d9] border border-[#2b3958] flex items-center justify-center"
            aria-label="Gráficos"
          >
            <BarChart3 size={18} />
          </button>
          <button
            type="button"
            className="h-11 rounded-xl text-white bg-[#1f8b63] border border-[#2aa174] flex items-center justify-center"
            aria-label="Nova movimentação"
          >
            <Plus size={18} />
          </button>
          <button
            type="button"
            className="h-11 rounded-xl text-[#96a7d9] border border-[#2b3958] flex items-center justify-center"
            aria-label="Cartões"
          >
            <CreditCard size={18} />
          </button>
          <button
            type="button"
            className="h-11 rounded-xl text-[#96a7d9] border border-[#2b3958] flex items-center justify-center"
            aria-label="Investimentos"
          >
            <PieChart size={18} />
          </button>
        </div>
      </nav>
    </div>
  );
};

export default DashboardMobileView;