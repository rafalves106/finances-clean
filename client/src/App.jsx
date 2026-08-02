import { useState, useEffect, useRef, useLayoutEffect } from "react";
import { LayoutDashboard, Target, Car, LogOut, Search } from "lucide-react";

import DashboardDesktopRedesignView from "./components/DashboardDesktopRedesignView";
import DashboardMobileView from "./components/DashboardMobileView";
import WishlistView from "./components/WishListView";
import VehicleView from "./components/VehicleView";
import CategoryManagerModal from "./components/CategoryManagerModal";
import LoginView from "./components/LoginView";
import RegisterView from "./components/RegisterView";
import ReleaseNotesModal from "./components/ReleaseNotesModal";
import AlertsCenter from "./components/AlertsCenter";
import GlobalSearchModal from "./components/GlobalSearchModal";
import { useBudgetAlerts } from "./hooks/useBudgetAlerts";
import { useAlertsCenter } from "./hooks/useAlertsCenter";
import { useRecurringRenewals } from "./hooks/useRecurringRenewals";
import { useGlobalSearchShortcut } from "./hooks/useGlobalSearchShortcut";

import {
  API_URL,
  API_INVESTIMENTOS_URL,
  API_CATEGORIAS_URL,
  API_VEICULOS_URL,
  API_METAS_URL,
  API_CARTAO_URL,
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
  grupoRecorrenciaId: item.grupoRecorrenciaId,
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
  const [authScreen, setAuthScreen] = useState("login");
  const [activeTab, setActiveTab] = useState("dashboard");
  const [selectedMes, setSelectedMes] = useState(new Date().getMonth() + 1);
  const [selectedAno, setSelectedAno] = useState(new Date().getFullYear());
  const { budgetAlerts } = useBudgetAlerts({
    selectedMes: isLoggedIn ? selectedMes : null,
    selectedAno: isLoggedIn ? selectedAno : null,
  });
  const [incomes, setIncomes] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false);
  const [budgetRefreshKey, setBudgetRefreshKey] = useState(0);
  const [workHoursPerMonth, setWorkHoursPerMonth] = useState(120);
  const [investments, setInvestments] = useState([]);
  const [veiculos, setVeiculos] = useState([]);
  const [metas, setMetas] = useState([]);
  const { expiredGroups: recurringGroups, renovarGrupo } =
    useRecurringRenewals({ enabled: isLoggedIn });
  const [isGlobalSearchOpen, setIsGlobalSearchOpen] = useState(false);
  useGlobalSearchShortcut(() => setIsGlobalSearchOpen(true));
  const [saldoAnterior, setSaldoAnterior] = useState(0);
  const [resumoMensal, setResumoMensal] = useState(null);
  const [faturasVencendo, setFaturasVencendo] = useState([]);
  const [salaryIncomeForGoals, setSalaryIncomeForGoals] = useState(0);
  const [releaseNotesOpen, setReleaseNotesOpen] = useState(false);
  const [releaseNotesContent, setReleaseNotesContent] = useState("");
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);
  const [headerHeight, setHeaderHeight] = useState(96);
  const headerRef = useRef(null);
  const categoryManagerTriggerRef = useRef(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isMobileViewport, setIsMobileViewport] = useState(
    typeof window !== "undefined" ? window.innerWidth < 1024 : false,
  );
  const hasBootstrappedRef = useRef(false);
  const activePeriodKeyRef = useRef(`${selectedAno}-${selectedMes}`);
  const latestMutationTokenRef = useRef(0);

  const INVESTMENT_GOAL_PERCENT = 10;
  const isSidebarExpanded = isSidebarHovered;

  const totalInvestmentsBalance = investments.reduce(
    (acc, curr) => acc + curr.saldoAtual,
    0,
  );
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

  useEffect(() => {
    const handleResize = () => {
      setIsMobileViewport(window.innerWidth < 1024);
    };

    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

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

  const fetchMetas = async () => {
    try {
      const response = await fetch(API_METAS_URL, {
        headers: getAuthHeaders(),
      });

      if (response.status === 401) {
        removeToken();
        setIsLoggedIn(false);
        return;
      }

      if (response.ok) {
        const data = await response.json();
        setMetas(data);
      }
    } catch (err) {
      console.error("Erro ao buscar metas:", err);
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
        setResumoMensal(resumo);
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

      const resFaturasVencendo = await fetch(
        `${API_CARTAO_URL}/faturas-vencendo?mes=${requestMes}&ano=${requestAno}`,
        { headers: getAuthHeaders() },
      );

      if (resFaturasVencendo.status === 401) {
        removeToken();
        setIsLoggedIn(false);
        return;
      }

      if (resFaturasVencendo.ok) {
        setFaturasVencendo(await resFaturasVencendo.json());
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

  const handleRenewRecurringGroup = async (grupoRecorrenciaId) => {
    const resultado = await renovarGrupo(grupoRecorrenciaId, 12);
    if (resultado.ok) {
      fetchData();
    }
  };

  const { alerts } = useAlertsCenter({
    budgetAlerts,
    veiculos,
    recurringGroups,
    onRenewRecurringGroup: handleRenewRecurringGroup,
  });

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
    if (isLoggedIn) fetchMetas();
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

    if (isMobileViewport) {
      setHeaderHeight(0);
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
  }, [isLoggedIn, activeTab, isMobileViewport]);

  if (!isLoggedIn) {
    if (authScreen === "register") {
      return (
        <RegisterView onNavigateToLogin={() => setAuthScreen("login")} />
      );
    }

    return (
      <LoginView
        onLoginSuccess={() => setIsLoggedIn(true)}
        onNavigateToRegister={() => setAuthScreen("register")}
      />
    );
  }

  if (isMobileViewport) {
    const mobileNavItems = [
      { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard size={18} /> },
      { id: "wishlist", label: "Conquistas", icon: <Target size={18} /> },
      { id: "vehicle", label: "Veículos", icon: <Car size={18} /> },
    ];

    return (
      <div
        className="mobile-viewport-shell"
        style={{ background: "var(--bg-app)", color: "var(--text-primary)" }}
      >
        <nav
          className="flex items-center gap-1 px-3 py-2 sticky top-0 z-20 overflow-x-auto"
          style={{
            background: "var(--bg-surface)",
            borderBottom: "1px solid var(--border-subtle)",
          }}
          aria-label="Navegação principal"
        >
          {mobileNavItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveTab(item.id)}
              aria-label={item.label}
              aria-current={activeTab === item.id ? "page" : undefined}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors"
              style={
                activeTab === item.id
                  ? {
                      background: "var(--accent-50)",
                      color: "var(--accent-600)",
                    }
                  : { color: "var(--text-tertiary)" }
              }
            >
              {item.icon}
              {item.label}
            </button>
          ))}
          <div className="flex items-center gap-1 ml-auto">
            <button
              type="button"
              onClick={() => setIsGlobalSearchOpen(true)}
              aria-label="Buscar"
              className="flex items-center justify-center w-9 h-9 rounded-full"
              style={{ color: "var(--text-tertiary)" }}
            >
              <Search size={18} />
            </button>
            <AlertsCenter alerts={alerts} />
            <button
              type="button"
              onClick={() => {
                removeToken();
                setIsLoggedIn(false);
              }}
              aria-label="Sair"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap"
              style={{ color: "var(--text-tertiary)" }}
            >
              <LogOut size={16} />
            </button>
          </div>
        </nav>

        {activeTab === "dashboard" && (
          <DashboardMobileView
            resumoMensal={resumoMensal}
            faturasVencendo={faturasVencendo}
            investmentAmount={investmentAmount}
            incomes={incomes}
            expenses={expenses}
            investments={investments}
            fetchData={fetchData}
            loading={isInitialLoading}
            totalInvestmentsBalance={totalInvestmentsBalance}
            selectedMes={selectedMes}
            selectedAno={selectedAno}
            onChangeMonth={handleChangeMonth}
            categorias={categorias}
            veiculos={veiculos}
            onOpenCategoryManager={handleOpenCategoryManager}
            saldoAnterior={saldoAnterior}
            budgetAlerts={budgetAlerts}
            metas={metas}
            budgetRefreshKey={budgetRefreshKey}
          />
        )}
        {activeTab === "wishlist" && (
          <div className="px-4 pb-6">
            <WishlistView
              totalIncome={monthlyIncomeForGoals}
              hourlyRate={hourlyRate}
              workHoursPerMonth={workHoursPerMonth}
              setWorkHoursPerMonth={setWorkHoursPerMonth}
              categorias={categorias}
              investments={investments}
              metas={metas}
              onMetasChange={fetchMetas}
            />
          </div>
        )}
        {activeTab === "vehicle" && (
          <div className="px-4 pb-6">
            <VehicleView
              veiculos={veiculos}
              fetchVeiculos={fetchVeiculos}
              categorias={categorias}
            />
          </div>
        )}

        <CategoryManagerModal
          isOpen={isCategoryManagerOpen}
          onClose={handleCloseCategoryManager}
          categorias={categorias}
          onCategoriasChange={() => {
            fetchCategorias();
            setBudgetRefreshKey((k) => k + 1);
          }}
        />
        <ReleaseNotesModal
          isOpen={releaseNotesOpen}
          version={APP_VERSION}
          releaseNotes={releaseNotesContent}
          onClose={() => setReleaseNotesOpen(false)}
        />
      </div>
    );
  }

  return (
    <div
      className="uiux-shell flex h-screen overflow-hidden"
      style={{ color: "var(--text-primary)" }}
    >
      <aside
        className="uiux-sidebar uiux-sidebar-motion self-center h-full max-h-[400px] flex flex-col justify-between"
        style={{ width: isSidebarExpanded ? 240 : 64, color: "var(--text-secondary)" }}
        onMouseEnter={() => setIsSidebarHovered(true)}
        onMouseLeave={() => setIsSidebarHovered(false)}
      >
        <nav className="space-y-3 px-3 text-sm">
          {[
            {
              id: "dashboard",
              label: "Dashboard",
              icon: <LayoutDashboard size={20} />,
            },
            {
              id: "wishlist",
              label: "Conquistas",
              icon: <Target size={20} />,
            },
            {
              id: "vehicle",
              label: "Manutenção Veicular",
              icon: <Car size={20} />,
            },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              title={!isSidebarExpanded ? item.label : undefined}
              aria-label={item.label}
              className="group relative w-full flex items-center justify-start gap-3 px-2 rounded-full py-2.5 uiux-sidebar-item-transition"
              style={
                activeTab === item.id
                  ? {
                      background: "var(--accent-50)",
                      color: "var(--accent-600)",
                      border: "1px solid var(--accent-100)",
                    }
                  : { color: "var(--text-tertiary)", border: "1px solid transparent" }
              }
              onMouseEnter={(e) => {
                if (activeTab !== item.id) {
                  e.currentTarget.style.background = "var(--bg-surface-hover)";
                  e.currentTarget.style.color = "var(--text-secondary)";
                }
              }}
              onMouseLeave={(e) => {
                if (activeTab !== item.id) {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "var(--text-tertiary)";
                }
              }}
            >
              <span className="h-5 w-5 shrink-0 flex items-center justify-center">
                {item.icon}
              </span>
              <span
                className={`font-medium whitespace-nowrap overflow-hidden uiux-sidebar-label-motion ${
                  isSidebarExpanded
                    ? "max-w-[180px] opacity-100 translate-x-0"
                    : "max-w-0 opacity-0 -translate-x-1.5"
                }`}
              >
                {item.label}
              </span>
            </button>
          ))}
        </nav>

        <div
          className={`space-y-3 py-4 ${
            isSidebarExpanded ? "px-4" : "px-3.5"
          }`}
          style={{ borderTop: "1px solid var(--border-subtle)" }}
        >
          {isSidebarExpanded ? (
            <div
              className="text-xs text-center"
              style={{ color: "var(--text-tertiary)" }}
            >
              v{APP_VERSION}
            </div>
          ) : null}

          <div
            className={`flex ${isSidebarExpanded ? "justify-start px-2.5" : "justify-center"}`}
          >
            <button
              type="button"
              onClick={() => setIsGlobalSearchOpen(true)}
              aria-label="Buscar (Cmd+K)"
              title={!isSidebarExpanded ? "Buscar (Cmd+K)" : undefined}
              className="flex items-center justify-center w-9 h-9 rounded-full transition-colors"
              style={{ color: "var(--text-tertiary)" }}
            >
              <Search size={18} />
            </button>
          </div>

          <div
            className={`flex ${isSidebarExpanded ? "justify-start px-2.5" : "justify-center"}`}
          >
            <AlertsCenter alerts={alerts} panelPosition="bottom-left" />
          </div>

          <button
            onClick={() => {
              removeToken();
              setIsLoggedIn(false);
            }}
            aria-label="Sair"
            title={!isSidebarExpanded ? "Sair" : undefined}
            className={`w-full flex items-center justify-start text-sm font-medium rounded-full py-2 uiux-sidebar-item-transition ${
              isSidebarExpanded ? "gap-2 px-2.5" : "gap-0 px-2.5"
            }`}
            style={{ color: "var(--text-tertiary)" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--bg-surface-hover)";
              e.currentTarget.style.color = "var(--text-secondary)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "var(--text-tertiary)";
            }}
          >
            <LogOut size={16} className="shrink-0" />
            <span
              className={`whitespace-nowrap overflow-hidden uiux-sidebar-label-motion ${
                isSidebarExpanded
                  ? "max-w-[160px] opacity-100 translate-x-0"
                  : "max-w-0 opacity-0 -translate-x-1.5"
              }`}
            >
              Sair
            </span>
          </button>
        </div>
      </aside>

      <main
        className={`flex-1 ${activeTab === "dashboard" ? "overflow-hidden" : "overflow-auto"}`}
      >
        {activeTab !== "dashboard" ? (
          <header
            ref={headerRef}
            className="uiux-header p-6 flex justify-between items-center sticky top-0 z-10"
            style={{ borderBottom: "1px solid var(--border-subtle)" }}
          >
            <h1
              className="text-2xl font-semibold tracking-wide"
              style={{ color: "var(--text-primary)" }}
            >
              {activeTab === "wishlist" && "Custo de Oportunidade"}
              {activeTab === "vehicle" && "Gestão de Veículos"}
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
              resumoMensal={resumoMensal}
              faturasVencendo={faturasVencendo}
              investmentAmount={investmentAmount}
              incomes={incomes}
              expenses={expenses}
              investments={investments}
              fetchData={fetchData}
              loading={isInitialLoading}
              totalInvestmentsBalance={totalInvestmentsBalance}
              selectedMes={selectedMes}
              selectedAno={selectedAno}
              onChangeMonth={handleChangeMonth}
              categorias={categorias}
              veiculos={veiculos}
              onOpenCategoryManager={handleOpenCategoryManager}
              saldoAnterior={saldoAnterior}
              budgetAlerts={budgetAlerts}
              metas={metas}
              budgetRefreshKey={budgetRefreshKey}
              headerHeight={headerHeight}
            />
          )}
          {activeTab === "wishlist" && (
            <WishlistView
              totalIncome={monthlyIncomeForGoals}
              hourlyRate={hourlyRate}
              workHoursPerMonth={workHoursPerMonth}
              setWorkHoursPerMonth={setWorkHoursPerMonth}
              categorias={categorias}
              investments={investments}
              metas={metas}
              onMetasChange={fetchMetas}
            />
          )}
          {activeTab === "vehicle" && (
            <VehicleView
              veiculos={veiculos}
              fetchVeiculos={fetchVeiculos}
              categorias={categorias}
            />
          )}
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

      {isGlobalSearchOpen ? (
        <GlobalSearchModal
          onClose={() => setIsGlobalSearchOpen(false)}
          onNavigate={setActiveTab}
          incomes={incomes}
          expenses={expenses}
          veiculos={veiculos}
          metas={metas}
        />
      ) : null}
    </div>
  );
};

export default App;
