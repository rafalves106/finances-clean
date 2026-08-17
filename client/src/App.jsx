import { useState, useEffect, useRef } from "react";

import HomeDesktop from "./components/home/HomeDesktop";
import HomeMobile from "./components/home/HomeMobile";
import NavDrawer from "./components/layout/NavDrawer";
import HamburgerButton from "./components/ui/HamburgerButton";
import WishlistView from "./components/WishListView";
import VehicleView from "./components/VehicleView";
import CategoryManagerModal from "./components/CategoryManagerModal";
import LoginView from "./components/LoginView";
import RegisterView from "./components/RegisterView";
import ReleaseNotesModal from "./components/ReleaseNotesModal";
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

const TAB_TITLES = {
  wishlist: "Custo de Oportunidade",
  vehicle: "Gestão de Veículos",
};

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
  const [isNavOpen, setIsNavOpen] = useState(false);
  useGlobalSearchShortcut(() => setIsGlobalSearchOpen(true));
  const [saldoAnterior, setSaldoAnterior] = useState(0);
  const [resumoMensal, setResumoMensal] = useState(null);
  const [comparativoMensal, setComparativoMensal] = useState(null);
  const [faturasVencendo, setFaturasVencendo] = useState([]);
  const [salaryIncomeForGoals, setSalaryIncomeForGoals] = useState(0);
  const [releaseNotesOpen, setReleaseNotesOpen] = useState(false);
  const [releaseNotesContent, setReleaseNotesContent] = useState("");
  const categoryManagerTriggerRef = useRef(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isMobileViewport, setIsMobileViewport] = useState(
    typeof window !== "undefined" ? window.innerWidth < 1024 : false,
  );
  const hasBootstrappedRef = useRef(false);
  const activePeriodKeyRef = useRef(`${selectedAno}-${selectedMes}`);
  const latestMutationTokenRef = useRef(0);

  const INVESTMENT_GOAL_PERCENT = 10;

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

      const resComparativo = await fetch(
        `${API_URL}/comparativo-categorias?mes=${requestMes}&ano=${requestAno}&meses=3`,
        { headers: getAuthHeaders() },
      );

      if (resComparativo.status === 401) {
        removeToken();
        setIsLoggedIn(false);
        return;
      }

      if (resComparativo.ok) {
        setComparativoMensal(await resComparativo.json());
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

  const handleLogout = () => {
    removeToken();
    setIsLoggedIn(false);
  };

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

  const sharedModals = (
    <>
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
    </>
  );

  const navDrawer = (
    <NavDrawer
      isOpen={isNavOpen}
      onClose={() => setIsNavOpen(false)}
      activeTab={activeTab}
      onNavigate={setActiveTab}
      alerts={alerts}
      onOpenSearch={() => setIsGlobalSearchOpen(true)}
      onLogout={handleLogout}
      version={APP_VERSION}
    />
  );

  // Em mobile e nas telas sem barra de ações própria (Conquistas, Veículos),
  // o hambúrguer flutua no canto. Na Home desktop ele vira parte da linha de
  // ações (mês, IA, relatório, exportar, nova transação) - ver HomeDesktop.
  const floatingNavTrigger = (
    <HamburgerButton
      onClick={() => setIsNavOpen(true)}
      className="fixed top-4 left-4 z-30"
    />
  );

  if (isMobileViewport) {
    return (
      <div
        className="mobile-viewport-shell"
        style={{ color: "var(--text-primary)" }}
      >
        {floatingNavTrigger}
        {navDrawer}

        {activeTab === "dashboard" && (
          <HomeMobile
            resumoMensal={resumoMensal}
            comparativoMensal={comparativoMensal}
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
            metas={metas}
          />
        )}
        {activeTab === "wishlist" && (
          <div className="px-4 pt-16 pb-6">
            <h1
              className="mb-4 text-xl font-semibold"
              style={{ color: "var(--text-primary)" }}
            >
              {TAB_TITLES.wishlist}
            </h1>
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
          <div className="px-4 pt-16 pb-6">
            <h1
              className="mb-4 text-xl font-semibold"
              style={{ color: "var(--text-primary)" }}
            >
              {TAB_TITLES.vehicle}
            </h1>
            <VehicleView
              veiculos={veiculos}
              fetchVeiculos={fetchVeiculos}
              categorias={categorias}
            />
          </div>
        )}

        {sharedModals}
      </div>
    );
  }

  return (
    <div
      className="app-shell h-screen overflow-hidden"
      style={{ color: "var(--text-primary)" }}
    >
      {activeTab === "dashboard" ? null : floatingNavTrigger}
      {navDrawer}

      <main className="h-full">
        {activeTab === "dashboard" ? (
          <div className="h-full px-5 pb-5">
            <HomeDesktop
              onOpenNav={() => setIsNavOpen(true)}
              resumoMensal={resumoMensal}
              comparativoMensal={comparativoMensal}
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
          </div>
        ) : (
          <div className="h-full overflow-y-auto px-8 pb-8 pt-16">
            <h1
              className="mb-5 text-2xl font-semibold tracking-tight"
              style={{ color: "var(--text-primary)" }}
            >
              {TAB_TITLES[activeTab]}
            </h1>
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
          </div>
        )}
      </main>

      {sharedModals}
    </div>
  );
};

export default App;
