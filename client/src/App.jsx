import { useState, useEffect, useRef, useLayoutEffect } from "react";
import {
  TrendingUp,
  LayoutDashboard,
  Target,
  Bike,
  CreditCard,
  LogOut,
} from "lucide-react";

import DashboardDesktopRedesignView from "./components/DashboardDesktopRedesignView";
import InvestmentsView from "./components/InvestmentsView";
import WishlistView from "./components/WishListView";
import VehicleView from "./components/VehicleView";
import CardViewerView from "./components/CardViewerView";
import CategoryManagerModal from "./components/CategoryManagerModal";
import LoginView from "./components/LoginView";
import ReleaseNotesModal from "./components/ReleaseNotesModal";

import {
  API_URL,
  API_INVESTIMENTOS_URL,
  API_CATEGORIAS_URL,
  API_VEICULOS_URL,
} from "./services/api";
import { getAuthHeaders, isAuthenticated, removeToken } from "./services/auth";
import changelogRaw from "../../CHANGELOG.md?raw";
import {
  extractReleaseNotesForVersion,
  getLastSeenVersion,
} from "./util/releaseNotes";

const APP_VERSION = __APP_VERSION__;

const mapApiToFrontend = (item) => ({
  id: item.id,
  name: item.titulo,
  description: item.descricao,
  value: item.valor,
  date: item.data,
  type: item.tipo,
  fixa: item.fixa,
  periodo: item.periodo,
  tipoRecorrencia: item.tipoRecorrencia,
  investimentoId: item.investimentoId,
  cartaoId: item.cartaoId,
  categoriaId: item.categoriaId,
  veiculoId: item.veiculoId,
  km: item.km,
  categoria: item.categoria,
});

const parsePeriodKey = (periodKey) => {
  const [yearStr, monthStr] = String(periodKey).split("-");

  return {
    ano: Number(yearStr),
    mes: Number(monthStr),
  };
};

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(isAuthenticated());
  const [activeTab, setActiveTab] = useState("dashboard");
  const [selectedMes, setSelectedMes] = useState(new Date().getMonth() + 1);
  const [selectedAno, setSelectedAno] = useState(new Date().getFullYear());
  const [incomes, setIncomes] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false);
  const [budgetRefreshKey, setBudgetRefreshKey] = useState(0);
  const [workHoursPerMonth, setWorkHoursPerMonth] = useState(120);
  const [investments, setInvestments] = useState([]);
  const [veiculos, setVeiculos] = useState([]);
  const [saldoAnterior, setSaldoAnterior] = useState(0);
  const [salaryIncomeForGoals, setSalaryIncomeForGoals] = useState(0);
  const [releaseNotesOpen, setReleaseNotesOpen] = useState(false);
  const [releaseNotesContent, setReleaseNotesContent] = useState("");
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);
  const [headerHeight, setHeaderHeight] = useState(96);
  const headerRef = useRef(null);
  const categoryManagerTriggerRef = useRef(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const hasBootstrappedRef = useRef(false);
  const activePeriodKeyRef = useRef(`${selectedAno}-${selectedMes}`);
  const latestMutationTokenRef = useRef(0);

  const INVESTMENT_GOAL_PERCENT = 10;
  const isSidebarExpanded = isSidebarHovered;

  const totalInvestmentsBalance = investments.reduce(
    (acc, curr) => acc + curr.saldoAtual,
    0,
  );
  const totalIncome = incomes.reduce((acc, curr) => acc + curr.value, 0);
  const totalExpenses = expenses.reduce((acc, curr) => acc + curr.value, 0);
  const finalBalance = saldoAnterior + totalIncome - totalExpenses;

  const currentMonthIncome = incomes
    .filter((item) => !item.investimentoId)
    .reduce((acc, curr) => acc + curr.value, 0);

  const investmentAmount = currentMonthIncome * (INVESTMENT_GOAL_PERCENT / 100);
  const monthlyIncomeForGoals =
    salaryIncomeForGoals > 0 ? salaryIncomeForGoals : currentMonthIncome;
  const hourlyRate =
    monthlyIncomeForGoals > 0 ? monthlyIncomeForGoals / workHoursPerMonth : 0;

  const handleChangeMonth = (mes, ano) => {
    setSelectedMes(mes);
    setSelectedAno(ano);
  };

  useEffect(() => {
    activePeriodKeyRef.current = `${selectedAno}-${selectedMes}`;
  }, [selectedAno, selectedMes]);

  const handleOpenCategoryManager = (triggerElement) => {
    categoryManagerTriggerRef.current =
      triggerElement || document.activeElement;
    setIsCategoryManagerOpen(true);
  };

  const handleCloseCategoryManager = () => {
    setIsCategoryManagerOpen(false);

    if (categoryManagerTriggerRef.current?.focus) {
      categoryManagerTriggerRef.current.focus();
    }
  };

  const fetchCategorias = async () => {
    try {
      const response = await fetch(API_CATEGORIAS_URL, {
        headers: getAuthHeaders(),
      });

      if (response.status === 401) {
        removeToken();
        setIsLoggedIn(false);
        return;
      }

      if (response.ok) {
        const data = await response.json();
        setCategorias(data);
      }
    } catch (err) {
      console.error("Erro ao buscar categorias:", err);
    }
  };

  const fetchVeiculos = async () => {
    try {
      const response = await fetch(API_VEICULOS_URL, {
        headers: getAuthHeaders(),
      });

      if (response.status === 401) {
        removeToken();
        setIsLoggedIn(false);
        return;
      }

      if (response.ok) {
        const data = await response.json();
        setVeiculos(data);
      }
    } catch (err) {
      console.error("Erro ao buscar veículos:", err);
    }
  };

  const fetchData = async ({
    silent = false,
    periodKey,
    mutationToken,
  } = {}) => {
    const requestPeriodKey = periodKey || activePeriodKeyRef.current;
    const { mes: requestMes, ano: requestAno } =
      parsePeriodKey(requestPeriodKey);
    const requestToken = Number(mutationToken || 0);

    if (requestToken > 0) {
      latestMutationTokenRef.current = Math.max(
        latestMutationTokenRef.current,
        requestToken,
      );
    }

    const shouldShowLoading = !silent && !hasBootstrappedRef.current;

    try {
      if (shouldShowLoading) {
        setIsInitialLoading(true);
      }

      const responseMov = await fetch(
        `${API_URL}?mes=${requestMes}&ano=${requestAno}`,
        { headers: getAuthHeaders() },
      );

      if (responseMov.status === 401) {
        removeToken();
        setIsLoggedIn(false);
        return;
      }

      const dataMov = await responseMov.json();

      const isStaleByPeriod = activePeriodKeyRef.current !== requestPeriodKey;
      const isStaleByToken =
        requestToken > 0 && requestToken < latestMutationTokenRef.current;

      if (isStaleByPeriod || isStaleByToken) {
        return {
          discarded: true,
          reason: isStaleByPeriod ? "period" : "token",
        };
      }

      setIncomes(
        dataMov.filter((item) => item.tipo === "Entrada").map(mapApiToFrontend),
      );
      setExpenses(
        dataMov.filter((item) => item.tipo === "Saida").map(mapApiToFrontend),
      );

      const resSaldo = await fetch(
        `${API_URL}/saldo-acumulado?mes=${requestMes}&ano=${requestAno}`,
        { headers: getAuthHeaders() },
      );

      if (resSaldo.status === 401) {
        removeToken();
        setIsLoggedIn(false);
        return;
      }

      if (resSaldo.ok) {
        const { saldo } = await resSaldo.json();
        setSaldoAnterior(saldo);
      }

      const resResumo = await fetch(
        `${API_URL}/resumo?mes=${requestMes}&ano=${requestAno}`,
        { headers: getAuthHeaders() },
      );

      if (resResumo.status === 401) {
        removeToken();
        setIsLoggedIn(false);
        return;
      }

      if (resResumo.ok) {
        const resumo = await resResumo.json();
        const rendaSalario = resumo?.rendaSalario ?? 0;

        if (rendaSalario > 0) {
          setSalaryIncomeForGoals(rendaSalario);
        } else {
          const fallbackSalaryIncome = dataMov
            .filter((item) => {
              if (item.tipo !== "Entrada" || item.investimentoId) return false;

              const categoriaNome = item.categoria?.nome;

              return categoriaNome === "💰 Salário";
            })
            .reduce((acc, curr) => acc + curr.valor, 0);

          setSalaryIncomeForGoals(fallbackSalaryIncome);
        }
      }

      const responseInv = await fetch(
        `${API_INVESTIMENTOS_URL}?mostrarInativos=false`,
        { headers: getAuthHeaders() },
      );

      if (responseInv.status === 401) {
        removeToken();
        setIsLoggedIn(false);
        return;
      }

      if (responseInv.ok) {
        const dataInv = await responseInv.json();
        setInvestments(dataInv);
      }

      return { discarded: false };
    } catch (err) {
      console.error("Erro ao buscar dados:", err);
      return {
        discarded: false,
        error: err,
      };
    } finally {
      if (shouldShowLoading) {
        setIsInitialLoading(false);
      }
      hasBootstrappedRef.current = true;
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      fetchData();
    }
  }, [isLoggedIn, selectedMes, selectedAno]);

  useEffect(() => {
    if (isLoggedIn) {
      fetchCategorias();
    }
  }, [isLoggedIn]);

  useEffect(() => {
    if (isLoggedIn) fetchVeiculos();
  }, [isLoggedIn]);

  useEffect(() => {
    if (!isLoggedIn) {
      setReleaseNotesOpen(false);
      setReleaseNotesContent("");
      return;
    }

    const lastSeenVersion = getLastSeenVersion();

    if (lastSeenVersion === APP_VERSION) {
      setReleaseNotesOpen(false);
      setReleaseNotesContent("");
      return;
    }

    const notes = extractReleaseNotesForVersion(changelogRaw, APP_VERSION);

    if (!notes) {
      setReleaseNotesOpen(false);
      setReleaseNotesContent("");
      return;
    }

    setReleaseNotesContent(notes);
    setReleaseNotesOpen(true);
  }, [isLoggedIn]);

  useLayoutEffect(() => {
    if (!isLoggedIn) {
      return;
    }

    if (activeTab === "dashboard") {
      setHeaderHeight(0);
      return;
    }

    if (!headerRef.current) {
      return;
    }

    const updateHeaderHeight = () => {
      const nextHeight = Math.ceil(
        headerRef.current?.getBoundingClientRect().height || 96,
      );
      setHeaderHeight(nextHeight > 0 ? nextHeight : 96);
    };

    updateHeaderHeight();

    const observer = new ResizeObserver(() => updateHeaderHeight());
    observer.observe(headerRef.current);

    window.addEventListener("resize", updateHeaderHeight);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateHeaderHeight);
    };
  }, [isLoggedIn, activeTab]);

  if (!isLoggedIn) {
    return <LoginView onLoginSuccess={() => setIsLoggedIn(true)} />;
  }

  return (
    <div className="uiux-shell flex h-screen overflow-hidden text-[#e8ebff]">
      <aside
        className="uiux-sidebar flex flex-col text-[#aeb2d8] transition-all duration-200 ease-in-out"
        style={{ width: isSidebarExpanded ? 240 : 64 }}
        onMouseEnter={() => setIsSidebarHovered(true)}
        onMouseLeave={() => setIsSidebarHovered(false)}
      >
        <nav className="my-auto space-y-3 px-3 text-sm">
          {[
            {
              id: "dashboard",
              label: "Dashboard",
              icon: <LayoutDashboard size={20} />,
              color: "bg-[#1d2148] text-[#f5f7ff] border border-[#30366e]",
            },
            {
              id: "investments",
              label: "Investimentos",
              icon: <TrendingUp size={20} />,
              color: "bg-[#1d2148] text-[#f5f7ff] border border-[#30366e]",
            },
            {
              id: "wishlist",
              label: "Conquistas",
              icon: <Target size={20} />,
              color: "bg-[#1d2148] text-[#f5f7ff] border border-[#30366e]",
            },
            {
              id: "vehicle",
              label: "Manutenção Veicular",
              icon: <Bike size={20} />,
              color: "bg-[#1d2148] text-[#f5f7ff] border border-[#30366e]",
            },
            {
              id: "card",
              label: "Cartões",
              icon: <CreditCard size={20} />,
              color: "bg-[#1d2148] text-[#f5f7ff] border border-[#30366e]",
            },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              title={!isSidebarExpanded ? item.label : undefined}
              aria-label={item.label}
              className={`group relative w-full flex items-center ${isSidebarExpanded ? "justify-start" : "justify-center"} gap-3 px-4 py-2.5 rounded-full transition-all duration-200
                ${activeTab === item.id ? `${item.color} shadow-[0_0_25px_rgba(89,102,192,0.35)]` : "text-[#989fc9] hover:bg-[#171b40] hover:text-white"}`}
            >
              <span className="h-5 w-5 shrink-0 flex items-center justify-center">
                {item.icon}
              </span>
              {isSidebarExpanded ? (
                <span className="font-medium">{item.label}</span>
              ) : (
                <span className="sr-only">{item.label}</span>
              )}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-[#1f2553] space-y-3">
          {isSidebarExpanded ? (
            <div className="text-xs text-[#7f86b5] text-center">
              v{APP_VERSION}
            </div>
          ) : null}

          <button
            onClick={() => {
              removeToken();
              setIsLoggedIn(false);
            }}
            aria-label="Sair"
            title={!isSidebarExpanded ? "Sair" : undefined}
            className={`w-full flex items-center justify-center gap-2 text-sm font-medium text-[#9ea4cf] hover:text-white hover:bg-[#171b40] rounded-full py-2 transition-colors`}
          >
            <LogOut size={16} /> {isSidebarExpanded ? <span>Sair</span> : null}
          </button>
        </div>
      </aside>

      <main
        className={`flex-1 ${activeTab === "dashboard" ? "overflow-hidden" : "overflow-auto"}`}
      >
        {activeTab !== "dashboard" ? (
          <header
            ref={headerRef}
            className="uiux-header p-6 flex justify-between items-center sticky top-0 z-10 border-b border-[#2c315f]"
          >
            <h1 className="text-2xl font-semibold tracking-wide capitalize text-[#ecefff]">
              {activeTab === "investments" && "Planejador de Futuro"}
              {activeTab === "wishlist" && "Custo de Oportunidade"}
              {activeTab === "vehicle" && "Gestão de Veículos"}
              {activeTab === "card" && "Cartão Manual"}
            </h1>
          </header>
        ) : null}

        <div
          className={
            activeTab === "dashboard" ? "px-4 pt-4 pb-4 h-full" : "px-6 pb-6"
          }
        >
          {activeTab === "dashboard" && (
            <DashboardDesktopRedesignView
              totalIncome={totalIncome}
              totalExpenses={totalExpenses}
              finalBalance={finalBalance}
              incomes={incomes}
              expenses={expenses}
              fetchData={fetchData}
              loading={isInitialLoading}
              totalInvestmentsBalance={totalInvestmentsBalance}
              selectedMes={selectedMes}
              selectedAno={selectedAno}
              onChangeMonth={handleChangeMonth}
              categorias={categorias}
              veiculos={veiculos}
              onOpenCategoryManager={handleOpenCategoryManager}
              onOpenCardManagement={() => setActiveTab("card")}
              saldoAnterior={saldoAnterior}
              budgetRefreshKey={budgetRefreshKey}
              headerHeight={headerHeight}
            />
          )}
          {activeTab === "investments" && (
            <InvestmentsView
              investmentAmount={investmentAmount}
              fetchData={fetchData}
              investments={investments}
            />
          )}
          {activeTab === "wishlist" && (
            <WishlistView
              totalIncome={monthlyIncomeForGoals}
              hourlyRate={hourlyRate}
              workHoursPerMonth={workHoursPerMonth}
              setWorkHoursPerMonth={setWorkHoursPerMonth}
            />
          )}
          {activeTab === "vehicle" && (
            <VehicleView
              veiculos={veiculos}
              fetchVeiculos={fetchVeiculos}
              categorias={categorias}
            />
          )}
          {activeTab === "card" && <CardViewerView />}

          <CategoryManagerModal
            isOpen={isCategoryManagerOpen}
            onClose={handleCloseCategoryManager}
            categorias={categorias}
            onCategoriasChange={() => {
              fetchCategorias();
              setBudgetRefreshKey((k) => k + 1);
            }}
          />
        </div>
      </main>

      <ReleaseNotesModal
        isOpen={releaseNotesOpen}
        version={APP_VERSION}
        releaseNotes={releaseNotesContent}
        onClose={() => setReleaseNotesOpen(false)}
      />
    </div>
  );
};

export default App;
