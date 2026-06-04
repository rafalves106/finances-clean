import { useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronLeft,
  Plus,
  RefreshCw,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  CartesianGrid,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { API_CARTAO_URL, extractApiErrorMessage } from "../services/api";
import { formatCurrency } from "../util/formatCurrency";
import TransactionModal from "./TransactionModal";
import InvestmentsView from "./InvestmentsView";

const formatDateLabel = (dateInput) => {
  const date = new Date(dateInput);
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
  });
};

const UPCOMING_ITEM_TITLE_MAX_LENGTH = 22;

const truncateWithThreeDots = (text, maxLength) => {
  const normalized = String(text || "").trim();
  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength).trimEnd()}...`;
};

const getMonthYearFromValue = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return {
    month: date.getMonth() + 1,
    year: date.getFullYear(),
  };
};

const calculateVariationPercent = (currentValue, previousValue) => {
  if (previousValue <= 0) {
    return currentValue > 0 ? 100 : 0;
  }

  return ((currentValue - previousValue) / previousValue) * 100;
};

const formatVariationPercent = (value) => {
  const normalized = Number.isFinite(value) ? value : 0;
  const sign = normalized >= 0 ? "+" : "";
  return `${sign}${normalized.toFixed(1).replace(".", ",")}%`;
};

const isInvestmentExpense = (item) => {
  const type = item.type || item.tipo;
  const categoryName = String(item.categoria?.nome || "").toLowerCase();

  return type === "Saida" && categoryName.includes("invest");
};

const sortByDate = (list) =>
  [...list].sort(
    (a, b) => new Date(b.date || b.data) - new Date(a.date || a.data),
  );

const CHART_SERIES_ORDER = ["entrada", "saida", "saldo"];

const CHART_SERIES_LABEL = {
  entrada: "Receita",
  saida: "Despesa",
  saldo: "Saldo",
};

const CHART_Y_TICKS = [0, 1000, 2500, 5000, 7500, 10000];

const formatChartAxisTick = (value) => {
  if (value >= 1000) {
    const compact = value / 1000;
    const normalized = Number.isInteger(compact)
      ? String(compact)
      : String(compact).replace(/\.0$/, "");
    return `${normalized}K`;
  }

  return String(value);
};

const CHART_THEME_COLORS = {
  entrada: {
    line: "#2C462F",
    fill: "#059669",
    glow: "rgba(5, 150, 105, 0.34)",
  },
  saida: {
    line: "#462C2C",
    fill: "#E11D48",
    glow: "rgba(225, 29, 72, 0.3)",
  },
  saldo: {
    line: "#2C4246",
    fill: "#2563EB",
    glow: "rgba(37, 99, 235, 0.28)",
  },
};

const getUniqueTooltipItems = (payload) => {
  if (!Array.isArray(payload) || payload.length === 0) {
    return [];
  }

  const uniqueByDataKey = new Map();

  payload.forEach((item) => {
    const key = item?.dataKey;
    if (!key || uniqueByDataKey.has(key)) {
      return;
    }

    uniqueByDataKey.set(key, item);
  });

  return CHART_SERIES_ORDER.map((key) => uniqueByDataKey.get(key)).filter(
    Boolean,
  );
};

const renderChartTooltip = ({ active, payload, label }) => {
  if (!active) {
    return null;
  }

  const items = getUniqueTooltipItems(payload);
  if (items.length === 0) {
    return null;
  }

  return (
    <div
      style={{
        background: "#15172a",
        border: "1px solid #32375e",
        borderRadius: "12px",
        boxShadow: "0 12px 28px rgba(5, 9, 18, 0.45)",
        color: "#dbe3ff",
        fontSize: "12px",
        padding: "10px 12px",
      }}
    >
      <p style={{ color: "#b9bfd8", fontWeight: 500, margin: "0 0 4px" }}>
        {label}
      </p>
      {items.map((item) => (
        <p
          key={item.dataKey}
          style={{ color: "#dbe3ff", padding: 0, margin: 0, lineHeight: 1.5 }}
        >
          {CHART_SERIES_LABEL[item.dataKey] ?? item.dataKey}:{" "}
          {formatCurrency(item.value)}
        </p>
      ))}
    </div>
  );
};

const renderCategoryComparisonTooltip = ({ active, payload }) => {
  if (!active || !Array.isArray(payload) || payload.length === 0) {
    return null;
  }

  const rawCategoryName = payload[0]?.payload?.nome;
  const categoryName =
    typeof rawCategoryName === "string" && rawCategoryName.trim().length > 0
      ? rawCategoryName
      : "Categoria";

  return (
    <div
      style={{
        background: "#15172a",
        border: "1px solid #32375e",
        borderRadius: "12px",
        boxShadow: "0 12px 28px rgba(5, 9, 18, 0.45)",
        color: "#dbe3ff",
        fontSize: "12px",
        padding: "10px 12px",
      }}
    >
      <p style={{ color: "#b9bfd8", fontWeight: 500, margin: "0 0 4px" }}>
        {categoryName}
      </p>
      {payload.map((item) => (
        <p
          key={item.dataKey}
          style={{ color: "#dbe3ff", padding: 0, margin: 0, lineHeight: 1.5 }}
        >
          {item.name}: {formatCurrency(item.value)}
        </p>
      ))}
    </div>
  );
};

const renderCategoryPieTooltip = ({ active, payload }) => {
  if (!active || !Array.isArray(payload) || payload.length === 0) {
    return null;
  }

  const firstItem = payload[0];
  const rawCategoryName = firstItem?.payload?.nome;
  const categoryName =
    typeof rawCategoryName === "string" && rawCategoryName.trim().length > 0
      ? rawCategoryName
      : "Categoria";

  return (
    <div
      style={{
        background: "#15172a",
        border: "1px solid #32375e",
        borderRadius: "12px",
        boxShadow: "0 12px 28px rgba(5, 9, 18, 0.45)",
        color: "#dbe3ff",
        fontSize: "12px",
        padding: "10px 12px",
      }}
    >
      <p style={{ color: "#b9bfd8", fontWeight: 500, margin: "0 0 4px" }}>
        {categoryName}
      </p>
      <p style={{ color: "#dbe3ff", padding: 0, margin: 0, lineHeight: 1.5 }}>
        Gasto no mês: {formatCurrency(firstItem?.value || 0)}
      </p>
    </div>
  );
};

const renderCategoryPieIconLabel = ({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
  payload,
}) => {
  if (!payload?.icone || (Number.isFinite(percent) && percent < 0.06)) {
    return null;
  }

  const centerX = Number(cx);
  const centerY = Number(cy);
  const inner = Number(innerRadius);
  const outer = Number(outerRadius);
  const radius = inner + (outer - inner) * 0.5;
  const angleInRad = (-Number(midAngle) * Math.PI) / 180;
  const x = centerX + radius * Math.cos(angleInRad);
  const y = centerY + radius * Math.sin(angleInRad);

  return (
    <text
      x={x}
      y={y}
      textAnchor="middle"
      dominantBaseline="central"
      style={{ fontSize: 12 }}
    >
      {payload.icone}
    </text>
  );
};

const DEFAULT_CARD_THEME = "#271815";

const normalizeCardTheme = (value) => {
  if (typeof value !== "string") {
    return DEFAULT_CARD_THEME;
  }

  const trimmed = value.trim();
  if (/^#[0-9A-Fa-f]{6}$/.test(trimmed)) {
    return trimmed.toUpperCase();
  }

  return DEFAULT_CARD_THEME;
};

const hexToRgb = (hexColor) => {
  const normalized = normalizeCardTheme(hexColor).replace("#", "");
  return {
    r: parseInt(normalized.slice(0, 2), 16),
    g: parseInt(normalized.slice(2, 4), 16),
    b: parseInt(normalized.slice(4, 6), 16),
  };
};

const rgbToHsl = (r, g, b) => {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
      default:
        break;
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
};

const hexToHsl = (hexColor) => {
  const { r, g, b } = hexToRgb(hexColor);
  return rgbToHsl(r, g, b);
};

const toRgba = (hexColor, alpha) => {
  const { r, g, b } = hexToRgb(hexColor);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const toHsla = (hslColor, alpha) => {
  if (!hslColor || typeof hslColor !== "string") {
    return `hsla(0, 0%, 0%, ${alpha})`;
  }

  const hslMatch = hslColor.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
  if (!hslMatch) {
    return hslColor;
  }

  const [, h, s, l] = hslMatch;
  return `hsla(${h}, ${s}%, ${l}%, ${alpha})`;
};

const clampRatio = (value) => Math.min(1, Math.max(0, value));

const mixRgb = (from, to, ratio) =>
  Math.round(from + (to - from) * clampRatio(ratio));

const rgbToHex = ({ r, g, b }) =>
  `#${[r, g, b]
    .map((channel) => channel.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase()}`;

const mixWithWhite = (hexColor, ratio) => {
  const rgb = hexToRgb(hexColor);
  return rgbToHex({
    r: mixRgb(rgb.r, 255, ratio),
    g: mixRgb(rgb.g, 255, ratio),
    b: mixRgb(rgb.b, 255, ratio),
  });
};

const mixWithBlack = (hexColor, ratio) => {
  const rgb = hexToRgb(hexColor);
  return rgbToHex({
    r: mixRgb(rgb.r, 0, ratio),
    g: mixRgb(rgb.g, 0, ratio),
    b: mixRgb(rgb.b, 0, ratio),
  });
};

const getThemePalette = (themeColor) => ({
  backName: mixWithWhite(themeColor, 0.58),
  usedText: mixWithWhite(themeColor, 0.62),
  cardName: mixWithWhite(themeColor, 0.56),
  progressTrackBorder: mixWithWhite(themeColor, 0.36),
  progressTrackStart: toRgba(themeColor, 0.22),
  progressTrackEnd: toRgba(mixWithBlack(themeColor, 0.68), 0.9),
  progressFillBorder: mixWithWhite(themeColor, 0.48),
  progressFillStart: mixWithWhite(themeColor, 0.24),
  progressFillEnd: mixWithBlack(themeColor, 0.4),
});

const getBackLayerStyle = (themeColor, index) => ({
  borderColor:
    index === 0 ? toRgba(themeColor, 0.42) : toRgba(themeColor, 0.34),
  background:
    index === 0
      ? `linear-gradient(180deg, ${toRgba(themeColor, 0.45)} 0%, rgba(28, 27, 36, 0.86) 100%)`
      : `linear-gradient(180deg, ${toRgba(themeColor, 0.34)} 0%, rgba(30, 28, 36, 0.75) 100%)`,
});

const getFrontLayerStyle = (themeColor) => ({
  borderColor: toRgba(themeColor, 0.58),
  background: `
    radial-gradient(circle at 12% 15%, ${toRgba(themeColor, 0.16)} 0%, ${toRgba(
      themeColor,
      0,
    )} 45%),
    linear-gradient(145deg, ${toRgba(themeColor, 0.96)} 0%, rgba(29, 17, 16, 0.92) 52%, #191026 100%)
  `,
});

const getCategoryStandardColor = (categoryColor) => {
  if (!categoryColor || typeof categoryColor !== "string") {
    // Fallback: cor padrão cinza
    return {
      gradient1: "hsl(0, 0%, 20%)",
      gradient2: "hsl(0, 0%, 12%)",
      border: "hsl(0, 0%, 16%)",
      text: "hsl(0, 0%, 38%)",
    };
  }

  try {
    const hsl = hexToHsl(categoryColor);
    const hue = hsl.h;

    // Aplica o padrão: HUE fixo, S e L padronizados
    return {
      gradient1: `hsl(${hue}, 25%, 15%)`,
      gradient2: `hsl(${hue}, 28%, 9%)`,
      border: `hsl(${hue}, 23%, 22%)`,
      text: `hsl(${hue}, 23%, 38%)`,
    };
  } catch {
    // Fallback se houver erro na conversão
    return {
      gradient1: "hsl(0, 0%, 20%)",
      gradient2: "hsl(0, 0%, 12%)",
      border: "hsl(0, 0%, 16%)",
      text: "hsl(0, 0%, 38%)",
    };
  }
};

const DashboardDesktopRedesignView = ({
  incomes = [],
  expenses = [],
  totalInvestmentsBalance = 0,
  investmentAmount = 0,
  investments = [],
  selectedMes,
  selectedAno,
  onChangeMonth = () => {},
  categorias = [],
  veiculos = [],
  fetchData,
  loading,
  saldoAnterior = 0,
  onOpenCategoryManager,
  headerHeight = 96,
}) => {
  const [viewportHeight, setViewportHeight] = useState(
    typeof window !== "undefined" ? window.innerHeight : 900,
  );
  const [viewportWidth, setViewportWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1920,
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
  const [showUpcomingReceipts, setShowUpcomingReceipts] = useState(false);
  const [activeSlide, setActiveSlide] = useState(null);
  const [openCardFormId, setOpenCardFormId] = useState(null);
  const [cardFormById, setCardFormById] = useState({});
  const [cardFormStatusById, setCardFormStatusById] = useState({});
  const [isSavingCardById, setIsSavingCardById] = useState({});
  const [investmentSlideActions, setInvestmentSlideActions] = useState(null);
  const summaryRef = useRef(null);
  const planningRef = useRef(null);
  const reviewRef = useRef(null);

  useEffect(() => {
    const onResize = () => {
      setViewportHeight(window.innerHeight);
      setViewportWidth(window.innerWidth);
    };
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
          const summaries = Array.isArray(multiData)
            ? multiData
            : Array.isArray(multiData?.resumos)
              ? multiData.resumos
              : Array.isArray(multiData?.data)
                ? multiData.data
                : [];

          const validSummaries = summaries.filter((item) => item?.cartao);

          if (validSummaries.length > 0) {
            setCardSummaries(validSummaries.slice(0, 3));
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
        if (data?.cartao) {
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

  useEffect(() => {
    setCardFormById((current) => {
      const next = { ...current };

      cardSummaries.forEach((summary) => {
        const card = summary?.cartao;
        if (!card?.id) {
          return;
        }

        const cardId = String(card.id);
        if (next[cardId]) {
          return;
        }

        next[cardId] = {
          nome: card.nome || "",
          limiteTotal: String(card.limiteTotal ?? ""),
          diaFechamento: String(card.diaFechamento ?? ""),
          diaVencimento: String(card.diaVencimento ?? ""),
          corTema: normalizeCardTheme(card.corTema),
        };
      });

      return next;
    });
  }, [cardSummaries]);

  const viewportTier =
    viewportWidth >= 1920 || viewportHeight >= 1080
      ? "xl"
      : viewportWidth >= 1440 || viewportHeight >= 900
        ? "lg"
        : "md";
  const desktopGap =
    viewportTier === "xl" ? 16 : viewportTier === "lg" ? 12 : 9;
  const mainPaddingTop =
    viewportTier === "xl" ? 16 : viewportTier === "lg" ? 12 : 10;
  const mainPaddingBottom =
    viewportTier === "xl" ? 16 : viewportTier === "lg" ? 12 : 10;
  const chartMargin =
    viewportTier === "xl"
      ? { top: 8, right: 8, left: 8, bottom: 8 }
      : viewportTier === "lg"
        ? { top: 6, right: 6, left: 4, bottom: 6 }
        : { top: 4, right: 4, left: 2, bottom: 4 };
  const chartTickFontSize = viewportTier === "md" ? 9 : 10;
  const chartYAxisWidth =
    viewportTier === "xl" ? 28 : viewportTier === "lg" ? 26 : 24;
  const hUtil = Math.max(
    380,
    Math.floor(
      viewportHeight - headerHeight - mainPaddingTop - mainPaddingBottom,
    ),
  );
  const hConteudo = Math.max(220, hUtil - 2 * desktopGap);
  const hSecao1 = Math.floor(hConteudo * 0.3);
  const hSecao2 = Math.floor(hConteudo * 0.28);
  const hSecao3Raw = hConteudo - hSecao1 - hSecao2;
  const hSecao3 = Math.min(hSecao3Raw, 345);
  const currentMonthLabel = new Intl.DateTimeFormat("pt-BR", {
    month: "short",
    year: "2-digit",
  }).format(new Date(selectedAno, selectedMes - 1, 1));

  const handlePreviousMonth = () => {
    const previousDate = new Date(selectedAno, selectedMes - 2, 1);
    onChangeMonth(previousDate.getMonth() + 1, previousDate.getFullYear());
  };

  const handleNextMonth = () => {
    const nextDate = new Date(selectedAno, selectedMes, 1);
    onChangeMonth(nextDate.getMonth() + 1, nextDate.getFullYear());
  };

  const allTransactions = useMemo(
    () => [...incomes, ...expenses, ...simulatedTransactions],
    [expenses, incomes, simulatedTransactions],
  );

  const cardTransactionsById = useMemo(() => {
    const grouped = new Map();

    sortByDate(allTransactions).forEach((item) => {
      if (!item?.cartaoId) {
        return;
      }

      const key = String(item.cartaoId);
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }

      grouped.get(key).push(item);
    });

    return grouped;
  }, [allTransactions]);

  const cardColumns = useMemo(
    () => Array.from({ length: 3 }, (_, index) => cardSummaries[index] || null),
    [cardSummaries],
  );

  const cardSummary = cardSummaries[0] || null;
  const backCardSummaries = cardSummaries.slice(1, 3);
  const activeCardTheme = normalizeCardTheme(cardSummary?.cartao?.corTema);
  const activeCardPalette = getThemePalette(activeCardTheme);
  const cardLimitTotal = Number(
    cardSummary?.limite?.limiteTotal || cardSummary?.cartao?.limiteTotal || 0,
  );
  const cardLimitUsed = Number(
    cardSummary?.limite?.limiteUtilizado ||
      cardSummary?.limite?.utilizado ||
      cardSummary?.limite?.Utilizado ||
      0,
  );
  const cardUsagePercent =
    cardLimitTotal > 0
      ? Math.min(100, Math.max(0, (cardLimitUsed / cardLimitTotal) * 100))
      : 0;

  const handleBringCardToFront = (cardIndex) => {
    setCardSummaries((current) => {
      if (cardIndex <= 0 || cardIndex >= current.length) {
        return current;
      }

      const selected = current[cardIndex];
      return [selected, ...current.filter((_, index) => index !== cardIndex)];
    });
  };

  const handleCardFormChange = (cardId, field, value) => {
    setCardFormById((current) => ({
      ...current,
      [cardId]: {
        ...(current[cardId] || {}),
        [field]: value,
      },
    }));
  };

  const handleCardFormSubmit = async (event, cardId) => {
    event.preventDefault();

    const values = cardFormById[cardId];
    if (!values) {
      return;
    }

    const payload = {
      nome: values.nome?.trim() || "",
      limiteTotal: Number(values.limiteTotal || 0),
      diaFechamento: Number(values.diaFechamento || 0),
      diaVencimento: Number(values.diaVencimento || 0),
      corTema: values.corTema || DEFAULT_CARD_THEME,
    };

    try {
      setIsSavingCardById((current) => ({ ...current, [cardId]: true }));
      setCardFormStatusById((current) => ({ ...current, [cardId]: "" }));

      const response = await fetch(`${API_CARTAO_URL}/${cardId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const message = await extractApiErrorMessage(
          response,
          "Não foi possível salvar o cartão.",
        );
        setCardFormStatusById((current) => ({ ...current, [cardId]: message }));
        return;
      }

      setCardSummaries((current) =>
        current.map((summary) => {
          if (String(summary?.cartao?.id) !== cardId) {
            return summary;
          }

          return {
            ...summary,
            cartao: {
              ...summary.cartao,
              nome: payload.nome,
              limiteTotal: payload.limiteTotal,
              diaFechamento: payload.diaFechamento,
              diaVencimento: payload.diaVencimento,
              corTema: payload.corTema,
            },
          };
        }),
      );

      setCardFormStatusById((current) => ({
        ...current,
        [cardId]: "Cartão atualizado com sucesso.",
      }));
    } catch (error) {
      console.error("Error saving card:", error);
      setCardFormStatusById((current) => ({
        ...current,
        [cardId]: "Erro ao salvar cartão.",
      }));
    } finally {
      setIsSavingCardById((current) => ({ ...current, [cardId]: false }));
    }
  };

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

  const monthComparison = useMemo(() => {
    const previousRef = new Date(selectedAno, selectedMes - 2, 1);
    const previousMonth = previousRef.getMonth() + 1;
    const previousYear = previousRef.getFullYear();

    const sumByTypeAndPeriod = (type, month, year) =>
      allTransactions
        .filter((item) => (item.type || item.tipo) === type)
        .reduce((acc, item) => {
          const dateInfo = getMonthYearFromValue(item.date || item.data);
          if (!dateInfo) {
            return acc;
          }

          if (dateInfo.month !== month || dateInfo.year !== year) {
            return acc;
          }

          return acc + Number(item.value || item.valor || 0);
        }, 0);

    const currentIncome = sumByTypeAndPeriod(
      "Entrada",
      selectedMes,
      selectedAno,
    );
    const previousIncome = sumByTypeAndPeriod(
      "Entrada",
      previousMonth,
      previousYear,
    );

    const currentExpense = sumByTypeAndPeriod(
      "Saida",
      selectedMes,
      selectedAno,
    );
    const previousExpense = sumByTypeAndPeriod(
      "Saida",
      previousMonth,
      previousYear,
    );

    const sumInvestmentsByPeriod = (month, year) =>
      allTransactions.filter(isInvestmentExpense).reduce((acc, item) => {
        const dateInfo = getMonthYearFromValue(item.date || item.data);
        if (!dateInfo) {
          return acc;
        }

        if (dateInfo.month !== month || dateInfo.year !== year) {
          return acc;
        }

        return acc + Number(item.value || item.valor || 0);
      }, 0);

    const currentInvestment = sumInvestmentsByPeriod(selectedMes, selectedAno);
    const previousInvestment = sumInvestmentsByPeriod(
      previousMonth,
      previousYear,
    );

    return {
      incomePercent: calculateVariationPercent(currentIncome, previousIncome),
      expensePercent: calculateVariationPercent(
        currentExpense,
        previousExpense,
      ),
      balancePercent: calculateVariationPercent(
        currentIncome - currentExpense,
        previousIncome - previousExpense,
      ),
      incomeDiff: currentIncome - previousIncome,
      expenseDiff: currentExpense - previousExpense,
      balanceDiff:
        currentIncome - currentExpense - (previousIncome - previousExpense),
      currentBalance: currentIncome - currentExpense,
      investmentPercent: calculateVariationPercent(
        currentInvestment,
        previousInvestment,
      ),
      investmentDiff: currentInvestment - previousInvestment,
      currentInvestment,
    };
  }, [allTransactions, selectedAno, selectedMes]);

  const receitasTrendIsPositive = monthComparison.incomePercent >= 0;
  const despesasTrendIsPositive = monthComparison.expensePercent <= 0;
  const saldoTrendIsPositive = monthComparison.balancePercent >= 0;
  const investmentTrendIsPositive = monthComparison.investmentDiff > 0;

  const receitasTagClassName = receitasTrendIsPositive
    ? "tag-positive"
    : "tag-negative";
  const despesasTagClassName = despesasTrendIsPositive
    ? "tag-positive"
    : "tag-negative";
  const saldoTagClassName = saldoTrendIsPositive
    ? "tag-positive"
    : "tag-negative";
  const investimentosTagClassName = investmentTrendIsPositive
    ? "tag-positive"
    : "tag-negative";

  const receitasDiffColorClassName = receitasTrendIsPositive
    ? "text-positive"
    : "text-negative";
  const despesasDiffColorClassName = despesasTrendIsPositive
    ? "text-positive"
    : "text-negative";
  const saldoDiffColorClassName = saldoTrendIsPositive
    ? "text-positive"
    : "text-negative";
  const investimentoDiffColorClassName = investmentTrendIsPositive
    ? "text-positive"
    : "text-negative";

  const receitasDiffDirection =
    monthComparison.incomeDiff >= 0 ? "a mais" : "a menos";
  const despesasDiffDirection =
    monthComparison.expenseDiff >= 0 ? "a mais" : "a menos";
  const saldoDiffDirection =
    monthComparison.balanceDiff >= 0 ? "a mais" : "a menos";
  const investimentoDiffDirection =
    monthComparison.investmentDiff >= 0 ? "a mais" : "a menos";

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
        const [, month, day] = iso.split("-");
        acc.push({
          data: `${day}/${month}`,
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
      .slice(0, 5)
      .map((item) => ({
        id: item.id,
        title: item.name || item.titulo || "Despesa",
        value: Number(item.value || item.valor || 0),
        categoria: item.categoria?.nome || "Sem categoria",
        icone: item.categoria?.icone || "•",
        dueDate: new Date(item.date || item.data),
      }));
  }, [expenses, selectedAno, selectedMes]);

  const upcomingReceipts = useMemo(() => {
    const now = new Date();
    const monthStart = new Date(selectedAno, selectedMes - 1, 1, 0, 0, 0, 0);
    const monthEnd = new Date(selectedAno, selectedMes, 0, 23, 59, 59, 999);
    const start =
      selectedMes === now.getMonth() + 1 && selectedAno === now.getFullYear()
        ? new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0)
        : monthStart;

    return sortByDate(incomes)
      .filter((item) => {
        const dueDate = new Date(item.date || item.data);
        return dueDate >= start && dueDate <= monthEnd;
      })
      .slice(0, 5)
      .map((item) => ({
        id: item.id,
        title: item.name || item.titulo || "Receita",
        value: Number(item.value || item.valor || 0),
        categoria: item.categoria?.nome || "Sem categoria",
        icone: item.categoria?.icone || "•",
        dueDate: new Date(item.date || item.data),
      }));
  }, [incomes, selectedAno, selectedMes]);

  const categoryRankingAll = useMemo(() => {
    const categoriaById = new Map(
      categorias.map((categoria) => [String(categoria.id), categoria]),
    );

    const grouped = expenses.reduce((acc, item) => {
      const key = item.categoriaId || "sem-categoria";
      const categoriaRef = categoriaById.get(String(key));
      const nome =
        item.categoria?.nome || categoriaRef?.nome || "Sem categoria";
      const icone = item.categoria?.icone || categoriaRef?.icone || "";
      const cor = item.categoria?.cor || categoriaRef?.cor || "#6A6785";
      const limite = Number(
        item.categoria?.orcamentoMensal ||
          categoriaRef?.orcamentoMensal ||
          item.categoria?.limiteMensal ||
          categoriaRef?.limiteMensal ||
          0,
      );

      if (!acc[key]) {
        acc[key] = { id: key, nome, icone, cor, limite, total: 0 };
      }
      acc[key].total += Number(item.value || item.valor || 0);
      return acc;
    }, {});

    return Object.values(grouped).sort((a, b) => b.total - a.total);
  }, [categorias, expenses]);

  const categoryRanking = useMemo(
    () => categoryRankingAll.slice(0, 4),
    [categoryRankingAll],
  );

  const slideCategoryRanking = useMemo(
    () => categoryRankingAll.slice(0, 8),
    [categoryRankingAll],
  );

  const slideCategoryLeftColumn = useMemo(
    () => slideCategoryRanking.slice(0, 4),
    [slideCategoryRanking],
  );

  const slideCategoryRightColumn = useMemo(
    () => slideCategoryRanking.slice(4, 8),
    [slideCategoryRanking],
  );

  const exceededCategoryAlerts = useMemo(
    () =>
      categoryRankingAll
        .filter((item) => item.limite > 0 && item.total > item.limite)
        .slice(0, 8),
    [categoryRankingAll],
  );

  const exceededAlertsLeftColumn = useMemo(
    () => exceededCategoryAlerts.slice(0, 4),
    [exceededCategoryAlerts],
  );

  const exceededAlertsRightColumn = useMemo(
    () => exceededCategoryAlerts.slice(4, 8),
    [exceededCategoryAlerts],
  );

  const categoryComparisonData = useMemo(() => {
    const categoriaById = new Map(
      categorias.map((categoria) => [String(categoria.id), categoria]),
    );
    const previousRef = new Date(selectedAno, selectedMes - 2, 1);
    const previousMonth = previousRef.getMonth() + 1;
    const previousYear = previousRef.getFullYear();

    const grouped = allTransactions.reduce((acc, item) => {
      if ((item.type || item.tipo) !== "Saida") {
        return acc;
      }

      const dateInfo = getMonthYearFromValue(item.date || item.data);
      if (!dateInfo) {
        return acc;
      }

      const isCurrentPeriod =
        dateInfo.month === selectedMes && dateInfo.year === selectedAno;
      const isPreviousPeriod =
        dateInfo.month === previousMonth && dateInfo.year === previousYear;

      if (!isCurrentPeriod && !isPreviousPeriod) {
        return acc;
      }

      const key = String(
        item.categoriaId || item.categoria?.id || "sem-categoria",
      );
      const categoriaRef = categoriaById.get(key);
      const nome =
        item.categoria?.nome || categoriaRef?.nome || "Sem categoria";
      const cor = item.categoria?.cor || categoriaRef?.cor || "#6A6785";

      if (!acc[key]) {
        acc[key] = {
          id: key,
          nome,
          cor,
          currentTotal: 0,
          previousTotal: 0,
        };
      }

      const value = Number(item.value || item.valor || 0);
      if (isCurrentPeriod) {
        acc[key].currentTotal += value;
      }
      if (isPreviousPeriod) {
        acc[key].previousTotal += value;
      }

      return acc;
    }, {});

    return Object.values(grouped)
      .filter((item) => item.currentTotal > 0 || item.previousTotal > 0)
      .sort((a, b) => {
        if (b.currentTotal !== a.currentTotal) {
          return b.currentTotal - a.currentTotal;
        }

        return b.previousTotal - a.previousTotal;
      })
      .slice(0, 8)
      .map((item) => ({
        ...item,
        shortName: truncateWithThreeDots(item.nome, 10),
      }));
  }, [allTransactions, categorias, selectedAno, selectedMes]);

  const currentMonthShortLabel = new Intl.DateTimeFormat("pt-BR", {
    month: "short",
  }).format(new Date(selectedAno, selectedMes - 1, 1));

  const previousMonthShortLabel = new Intl.DateTimeFormat("pt-BR", {
    month: "short",
  }).format(new Date(selectedAno, selectedMes - 2, 1));

  const categoryPieData = useMemo(
    () => categoryRankingAll.filter((item) => item.total > 0),
    [categoryRankingAll],
  );

  const slideCategoryPieData = useMemo(
    () => slideCategoryRanking.filter((item) => item.total > 0),
    [slideCategoryRanking],
  );

  const dashboardPiePaddingAngle = categoryPieData.length > 8 ? 2 : 6;
  const dashboardPieCornerRadius = categoryPieData.length > 8 ? 8 : 14;

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

  const sortedMovimentacoes = useMemo(
    () => sortByDate(filteredTransactions).slice(0, 5),
    [filteredTransactions],
  );

  const handleOpenSimulation = () => {
    setIsSimulationModalOpen(true);
  };

  const handleOpenNewTransaction = () => {
    setEditingItem(null);
    setOpenCardPurchaseMode(false);
    setIsModalOpen(true);
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
      style={{ height: "95vh", maxHeight: "95vh" }}
    >
      {activeSlide === "investments" ? (
        <div
          className="h-full min-h-0 flex flex-col"
          style={{ gap: `${desktopGap}px`, paddingBottom: "88px" }}
        >
          <div className="flex items-center justify-between gap-3 flex-shrink-0">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setActiveSlide(null)}
                className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#1e2340] border border-[#2a3554] text-[#b9bfd8] hover:bg-[#2a3554] transition-colors"
                aria-label="Voltar ao dashboard"
              >
                <ChevronLeft size={16} />
              </button>
              <h2 className="text-sm font-semibold text-[#b9bfd8]">
                Investimentos
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => investmentSlideActions?.openInvestmentModal?.()}
                className="inline-flex items-center gap-2 rounded-lg border border-[#26513f] bg-[#143325] px-3 py-2 text-sm font-semibold text-[#8ef0c6] hover:bg-[#194130] transition-colors"
              >
                <Plus size={14} /> Nova aplicação
              </button>
              <button
                type="button"
                onClick={() => investmentSlideActions?.openAporteModal?.()}
                disabled={!investmentSlideActions?.hasInvestments}
                className="inline-flex items-center gap-2 rounded-lg border border-[#2f4566] bg-[#151f34] px-3 py-2 text-sm font-semibold text-[#9ec2ff] hover:bg-[#1a2842] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <TrendingUp size={14} /> Novo aporte
              </button>
            </div>
          </div>

          <section className="flex-1 min-h-0 grid grid-cols-1 xl:grid-cols-3 gap-4 overflow-hidden rounded-2xl border border-[#33457a] bg-[radial-gradient(circle_at_12%_8%,rgba(90,118,199,0.2)_0%,rgba(33,44,78,0.16)_36%,rgba(16,23,44,0.88)_100%)] p-3 shadow-[inset_0_1px_0_rgba(163,182,255,0.05)]">
            <InvestmentsView
              investmentAmount={investmentAmount}
              investments={investments}
              fetchData={fetchData}
              isRedesign
              onRegisterActions={setInvestmentSlideActions}
            />
          </section>
        </div>
      ) : activeSlide === "cards" ? (
        <div
          className="h-full min-h-0 flex flex-col"
          style={{ gap: `${desktopGap}px`, paddingBottom: "88px" }}
        >
          <div className="flex items-center gap-3 flex-shrink-0">
            <button
              type="button"
              onClick={() => setActiveSlide(null)}
              className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#1e2340] border border-[#2a3554] text-[#b9bfd8] hover:bg-[#2a3554] transition-colors"
              aria-label="Voltar ao dashboard"
            >
              <ChevronLeft size={16} />
            </button>
            <h2 className="text-sm font-semibold text-[#b9bfd8]">
              Gestão dos Cartões
            </h2>
          </div>

          {cardSummaryError ? (
            <p
              className="text-xs"
              style={{ color: "var(--color-vermelho-text)" }}
            >
              {cardSummaryError}
            </p>
          ) : null}

          <section className="grid grid-cols-3 gap-3 min-h-0 flex-1 items-stretch overflow-hidden">
            {cardColumns.map((summary, index) => {
              if (!summary?.cartao?.id) {
                return (
                  <article
                    key={`empty-card-column-${index}`}
                    className="rounded-xl border border-dashed border-[#324066] bg-[radial-gradient(circle_at_20%_0%,rgba(64,89,145,0.22)_0%,rgba(18,24,40,0.95)_45%),linear-gradient(145deg,rgba(18,24,40,0.98)_0%,rgba(17,22,38,0.95)_55%,rgba(14,19,34,0.98)_100%)] p-4 min-h-0 max-h-full overflow-y-auto flex flex-col items-center justify-center gap-3 shadow-[0_16px_30px_rgba(6,10,22,0.38)]"
                  >
                    <p className="text-sm text-[#9f9cb9] text-center">
                      Sem cartão nesta coluna.
                    </p>
                  </article>
                );
              }

              const card = summary.cartao;
              const cardId = String(card.id);
              const themeColor = normalizeCardTheme(card.corTema);
              const palette = getThemePalette(themeColor);
              const cardLimitTotal = Number(
                summary?.limite?.limiteTotal || card.limiteTotal || 0,
              );
              const cardLimitUsed = Number(
                summary?.limite?.limiteUtilizado ||
                  summary?.limite?.utilizado ||
                  summary?.limite?.Utilizado ||
                  0,
              );
              const cardUsagePercent =
                cardLimitTotal > 0
                  ? Math.min(
                      100,
                      Math.max(0, (cardLimitUsed / cardLimitTotal) * 100),
                    )
                  : 0;

              const cardMovements = (
                cardTransactionsById.get(cardId) || []
              ).slice(0, 8);

              const formValues = cardFormById[cardId] || {
                nome: card.nome || "",
                limiteTotal: String(card.limiteTotal || ""),
                diaFechamento: String(card.diaFechamento || ""),
                diaVencimento: String(card.diaVencimento || ""),
                corTema: normalizeCardTheme(card.corTema),
              };

              const statusMessage = cardFormStatusById[cardId];
              const isSaving = Boolean(isSavingCardById[cardId]);

              return (
                <article
                  key={cardId}
                  className="rounded-xl border border-[#324066] shadow-[0_16px_30px_rgba(6,10,22,0.45)] p-3 min-h-0 max-h-full overflow-y-auto flex flex-col gap-3 bg-[radial-gradient(circle_at_20%_0%,rgba(64,89,145,0.24)_0%,rgba(18,24,40,0.92)_42%),linear-gradient(145deg,rgba(18,24,40,0.98)_0%,rgba(17,22,38,0.95)_55%,rgba(14,19,34,0.98)_100%)]"
                >
                  <div
                    className="rounded-xl border p-3 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]"
                    style={getFrontLayerStyle(themeColor)}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p
                        className="text-sm font-semibold truncate"
                        style={{ color: palette.cardName }}
                      >
                        {card.nome || "Cartão"}
                      </p>
                      <span
                        className="text-xs font-medium"
                        style={{ color: palette.usedText }}
                      >
                        {Math.round(cardUsagePercent)}%
                      </span>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-xs">
                      <span style={{ color: palette.usedText }}>
                        Utilizado {formatCurrency(cardLimitUsed)}
                      </span>
                      <span style={{ color: palette.usedText }}>
                        Limite {formatCurrency(cardLimitTotal)}
                      </span>
                    </div>
                    <div className="mt-2 h-2 rounded-full border border-[#2a3554] overflow-hidden">
                      <div
                        className="h-full"
                        style={{
                          width: `${cardUsagePercent}%`,
                          background: `linear-gradient(90deg, ${palette.progressFillStart} 0%, ${palette.progressFillEnd} 100%)`,
                        }}
                      />
                    </div>
                    <div className="mt-2 flex items-center justify-between text-xs text-[#9f9cb9]">
                      <span>
                        Fechamento {String(card.diaFechamento).padStart(2, "0")}
                      </span>
                      <span>
                        Vencimento {String(card.diaVencimento).padStart(2, "0")}
                      </span>
                    </div>
                  </div>

                  <div className="rounded-xl border border-[#2a3554] bg-[linear-gradient(180deg,rgba(20,26,44,0.88)_0%,rgba(15,20,36,0.9)_100%)] p-3 min-h-0 flex-1 flex flex-col">
                    <h3 className="text-xs font-semibold text-[#b9bfd8] mb-2">
                      Movimentações do Cartão
                    </h3>
                    <div className="flex-1 min-h-0 overflow-y-auto space-y-2">
                      {cardMovements.length === 0 ? (
                        <p className="text-xs text-[#7f84a8]">
                          Nenhuma movimentação vinculada.
                        </p>
                      ) : (
                        cardMovements.map((item) => {
                          const isEntrada =
                            (item.type || item.tipo) === "Entrada";
                          return (
                            <div
                              key={item.id}
                              className="flex items-center justify-between gap-2"
                            >
                              <div className="min-w-0">
                                <p className="text-xs text-[#dbe3ff] truncate">
                                  {item.name || item.titulo || "Movimentação"}
                                </p>
                                <p className="text-[11px] text-[#7f84a8]">
                                  {item.date || item.data
                                    ? formatDateLabel(item.date || item.data)
                                    : "--/--"}
                                </p>
                              </div>
                              <span
                                className="text-xs font-semibold whitespace-nowrap"
                                style={{
                                  color: isEntrada
                                    ? "var(--color-verde-text)"
                                    : "var(--color-vermelho-text)",
                                }}
                              >
                                {isEntrada ? "+" : "-"}
                                {formatCurrency(item.value || item.valor || 0)}
                              </span>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setOpenCardFormId((current) =>
                          current === cardId ? null : cardId,
                        )
                      }
                      className="w-full text-xs font-medium text-[#cfd5f3] border border-[#2a3554] rounded-lg px-3 py-2 hover:bg-[#1e2340] transition-colors"
                    >
                      {openCardFormId === cardId
                        ? "Fechar Formulário"
                        : "Editar Cartão"}
                    </button>
                  </div>

                  {openCardFormId === cardId ? (
                    <form
                      onSubmit={(event) => handleCardFormSubmit(event, cardId)}
                      className="rounded-xl border border-[#2a3554] bg-[linear-gradient(180deg,rgba(20,26,44,0.9)_0%,rgba(16,21,37,0.92)_100%)] p-3 grid grid-cols-2 gap-2"
                    >
                      <input
                        type="text"
                        value={formValues.nome}
                        onChange={(event) =>
                          handleCardFormChange(
                            cardId,
                            "nome",
                            event.target.value,
                          )
                        }
                        placeholder="Nome do cartão"
                        className="col-span-2 px-2 py-1.5 rounded-md border border-[#2a3554] bg-transparent text-xs text-[#dbe3ff]"
                        required
                      />
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formValues.limiteTotal}
                        onChange={(event) =>
                          handleCardFormChange(
                            cardId,
                            "limiteTotal",
                            event.target.value,
                          )
                        }
                        placeholder="Limite total"
                        className="px-2 py-1.5 rounded-md border border-[#2a3554] bg-transparent text-xs text-[#dbe3ff]"
                        required
                      />
                      <input
                        type="color"
                        value={formValues.corTema || DEFAULT_CARD_THEME}
                        onChange={(event) =>
                          handleCardFormChange(
                            cardId,
                            "corTema",
                            event.target.value,
                          )
                        }
                        className="h-8 rounded-md border border-[#2a3554] bg-transparent"
                      />
                      <input
                        type="number"
                        min="1"
                        max="31"
                        value={formValues.diaFechamento}
                        onChange={(event) =>
                          handleCardFormChange(
                            cardId,
                            "diaFechamento",
                            event.target.value,
                          )
                        }
                        placeholder="Dia fechamento"
                        className="px-2 py-1.5 rounded-md border border-[#2a3554] bg-transparent text-xs text-[#dbe3ff]"
                        required
                      />
                      <input
                        type="number"
                        min="1"
                        max="31"
                        value={formValues.diaVencimento}
                        onChange={(event) =>
                          handleCardFormChange(
                            cardId,
                            "diaVencimento",
                            event.target.value,
                          )
                        }
                        placeholder="Dia vencimento"
                        className="px-2 py-1.5 rounded-md border border-[#2a3554] bg-transparent text-xs text-[#dbe3ff]"
                        required
                      />
                      <button
                        type="submit"
                        disabled={isSaving}
                        className="col-span-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 disabled:cursor-not-allowed rounded-lg px-3 py-2"
                      >
                        {isSaving ? "Salvando..." : "Salvar alterações"}
                      </button>
                    </form>
                  ) : null}

                  {statusMessage ? (
                    <p
                      className="text-xs"
                      style={{
                        color: statusMessage.includes("sucesso")
                          ? "var(--color-verde-text)"
                          : "var(--color-vermelho-text)",
                      }}
                    >
                      {statusMessage}
                    </p>
                  ) : null}
                </article>
              );
            })}
          </section>
        </div>
      ) : activeSlide === "charts" ? (
        <div
          className="h-full flex flex-col"
          style={{ gap: `${desktopGap}px` }}
        >
          <div className="flex items-center gap-3 flex-shrink-0">
            <button
              type="button"
              onClick={() => setActiveSlide(null)}
              className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#1e2340] border border-[#2a3554] text-[#b9bfd8] hover:bg-[#2a3554] transition-colors"
              aria-label="Voltar ao dashboard"
            >
              <ChevronLeft size={16} />
            </button>
            <h2 className="text-sm font-semibold text-[#b9bfd8]">
              Análise Gráfica
            </h2>
            <button
              type="button"
              onClick={(e) => onOpenCategoryManager(e.currentTarget)}
              className="ml-auto text-xs font-medium text-[#7f84a8] border border-[#2a3554] rounded-lg px-3 py-1.5 hover:bg-[#1e2340] transition-colors"
            >
              Gerenciar Categorias
            </button>
          </div>

          <section
            className="border rounded-2xl p-3 shadow-sm flex flex-col bg-[linear-gradient(145deg,rgba(18,24,40,0.98)_0%,rgba(17,22,38,0.95)_55%,rgba(14,19,34,0.98)_100%)] border-[#2a3554] overflow-hidden"
            style={{ flex: "1 1 0", minHeight: 0 }}
          >
            <div className="flex-1 min-h-0">
              {chartData.length === 0 ? (
                <div className="h-full rounded-xl border border-[#2f3b5d] bg-[linear-gradient(160deg,rgba(17,23,39,0.82)_0%,rgba(15,20,36,0.9)_100%)] flex items-center justify-center px-6 text-center">
                  <p className="text-sm text-[#9fb0d3]">
                    Ainda não há dados no período para montar o gráfico.
                  </p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={chartMargin}>
                    <defs>
                      <linearGradient
                        id="colorReceitaSlide"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="0%"
                          stopColor={CHART_THEME_COLORS.entrada.fill}
                          stopOpacity={0.28}
                        />
                        <stop
                          offset="100%"
                          stopColor={CHART_THEME_COLORS.entrada.fill}
                          stopOpacity={0.02}
                        />
                      </linearGradient>
                      <linearGradient
                        id="colorDespesaSlide"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="0%"
                          stopColor={CHART_THEME_COLORS.saida.fill}
                          stopOpacity={0.24}
                        />
                        <stop
                          offset="100%"
                          stopColor={CHART_THEME_COLORS.saida.fill}
                          stopOpacity={0.02}
                        />
                      </linearGradient>
                      <linearGradient
                        id="colorSaldoSlide"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor={CHART_THEME_COLORS.saldo.fill}
                          stopOpacity={0.1}
                        />
                        <stop
                          offset="95%"
                          stopColor={CHART_THEME_COLORS.saldo.fill}
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="4 10"
                      vertical={false}
                      stroke="#2a2f52"
                    />
                    <XAxis
                      dataKey="data"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: chartTickFontSize, fill: "#7f84a8" }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      domain={[0, 10000]}
                      ticks={CHART_Y_TICKS}
                      tickFormatter={formatChartAxisTick}
                      tick={{ fontSize: chartTickFontSize, fill: "#7f84a8" }}
                      width={chartYAxisWidth}
                    />
                    <Tooltip
                      content={renderChartTooltip}
                      cursor={{
                        stroke: "#b9bfd8",
                        strokeWidth: 2,
                        strokeDasharray: "6 6",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="entrada"
                      fill="url(#colorReceitaSlide)"
                      stroke="none"
                      isAnimationActive={false}
                      name="entrada"
                    />
                    <Area
                      type="monotone"
                      dataKey="saida"
                      fill="url(#colorDespesaSlide)"
                      stroke="none"
                      isAnimationActive={false}
                      name="saida"
                    />
                    <Area
                      type="monotone"
                      dataKey="saldo"
                      stroke="none"
                      fill="url(#colorSaldoSlide)"
                      isAnimationActive={false}
                      name="saldo"
                    />
                    <Line
                      type="monotone"
                      dataKey="entrada"
                      stroke={CHART_THEME_COLORS.entrada.line}
                      strokeWidth={2}
                      dot={false}
                      activeDot={{
                        r: 7,
                        fill: "#7aa8ff",
                        stroke: "#cfd5ff",
                        strokeWidth: 2,
                      }}
                      name="entrada"
                      style={{
                        filter: `drop-shadow(0 0 4px ${CHART_THEME_COLORS.entrada.glow})`,
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="saida"
                      stroke={CHART_THEME_COLORS.saida.line}
                      strokeWidth={2}
                      dot={false}
                      activeDot={{
                        r: 7,
                        fill: "#7aa8ff",
                        stroke: "#cfd5ff",
                        strokeWidth: 2,
                      }}
                      name="saida"
                      style={{
                        filter: `drop-shadow(0 0 4px ${CHART_THEME_COLORS.saida.glow})`,
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="saldo"
                      stroke={CHART_THEME_COLORS.saldo.line}
                      strokeWidth={2}
                      dot={false}
                      name="saldo"
                      style={{ opacity: 0.6 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </section>

          <section
            className="rounded-xl border shadow-sm flex flex-col p-4 overflow-hidden bg-[linear-gradient(145deg,rgba(18,24,40,0.98)_0%,rgba(17,22,38,0.95)_55%,rgba(14,19,34,0.98)_100%)] border-[#2a3554]"
            style={{ flex: "1 1 0", minHeight: 0 }}
          >
            <div className="flex-1 min-h-0">
              {slideCategoryRanking.length === 0 ? (
                <p className="text-sm text-[#7f84a8]">
                  Nenhum gasto registrado neste mês
                </p>
              ) : (
                <div className="h-full grid grid-cols-2 gap-4 min-h-0">
                  <div className="min-h-0 flex flex-col gap-3">
                    <div className="grid grid-cols-2 gap-3 min-h-0 flex-1">
                      {[slideCategoryLeftColumn, slideCategoryRightColumn].map(
                        (column, columnIndex) => (
                          <div
                            key={`slide-category-column-${columnIndex}`}
                            className="overflow-y-auto pr-1 space-y-4"
                          >
                            {column.length === 0 ? (
                              <p className="text-xs text-[#7f84a8]">
                                Sem categorias nesta coluna
                              </p>
                            ) : (
                              column.map((item) => {
                                const standardColor = getCategoryStandardColor(
                                  item.cor,
                                );
                                return (
                                  <div key={item.id} className="space-y-1.5">
                                    <div
                                      className="h-5 rounded-full border overflow-hidden"
                                      style={{
                                        borderColor: "#2F2C46",
                                        background: `linear-gradient(180deg, ${toRgba(standardColor.gradient1, 0.2)} 0%, ${toRgba(standardColor.gradient2, 0.75)} 100%)`,
                                      }}
                                    >
                                      <div
                                        className="h-full rounded-full border"
                                        style={{
                                          width: `${Math.min(100, (item.total / (item.limite > 0 ? item.limite : item.total || 1)) * 100)}%`,
                                          borderColor: standardColor.border,
                                          background: `linear-gradient(180deg, ${standardColor.gradient1} 0%, ${standardColor.gradient2} 100%)`,
                                        }}
                                      />
                                    </div>
                                    <div className="flex items-center justify-between text-xs gap-2">
                                      <div className="inline-flex items-center gap-2 min-w-0">
                                        <span
                                          className="font-semibold truncate"
                                          style={{ color: standardColor.text }}
                                        >
                                          {item.nome}
                                        </span>
                                        <span
                                          className="whitespace-nowrap"
                                          style={{ color: standardColor.text }}
                                        >
                                          {formatCurrency(item.total)}
                                        </span>
                                      </div>
                                      <span className="font-semibold text-[#6A6785] whitespace-nowrap">
                                        {formatCurrency(
                                          item.limite > 0
                                            ? item.limite
                                            : item.total,
                                        )}
                                      </span>
                                    </div>
                                  </div>
                                );
                              })
                            )}
                          </div>
                        ),
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-1 flex-shrink-0">
                      {[
                        exceededAlertsLeftColumn,
                        exceededAlertsRightColumn,
                      ].map((alertsColumn, columnIndex) => (
                        <div
                          key={`exceeded-alerts-column-${columnIndex}`}
                          className="space-y-2"
                        >
                          {alertsColumn.length === 0 ? (
                            columnIndex === 0 ? (
                              <p className="text-xs text-[#7f84a8]">
                                Nenhum limite excedido.
                              </p>
                            ) : null
                          ) : (
                            alertsColumn.map((item) => (
                              <p
                                key={`alert-${item.id}`}
                                className="text-xs font-medium"
                                style={{ color: "var(--color-vermelho-text)" }}
                              >
                                <span
                                  style={{
                                    color: "var(--color-vermelho-text)",
                                  }}
                                >
                                  Limite da categoria {item.nome} excedido em
                                </span>{" "}
                                <span
                                  className="font-semibold"
                                  style={{
                                    color: "var(--color-vermelho-text)",
                                  }}
                                >
                                  {formatCurrency(item.total - item.limite)}
                                </span>
                                <span
                                  style={{
                                    color: "var(--color-vermelho-text)",
                                  }}
                                >
                                  .
                                </span>
                              </p>
                            ))
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="min-h-0 grid grid-cols-2 gap-3">
                    <div className="min-h-0 rounded-lg border border-[#2F2C46] bg-[linear-gradient(145deg,rgba(17,22,38,0.95)_0%,rgba(14,19,34,0.98)_100%)] p-2">
                      {slideCategoryPieData.length === 0 ? (
                        <p className="text-xs text-[#7f84a8] text-center pt-8">
                          Sem dados para gráfico
                        </p>
                      ) : (
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <defs>
                              {slideCategoryPieData.map((item) => {
                                const standardColor = getCategoryStandardColor(
                                  item.cor,
                                );
                                return (
                                  <linearGradient
                                    key={`slideGrad-${item.id}`}
                                    id={`slideGrad-${item.id}`}
                                    x1="0"
                                    y1="0"
                                    x2="0"
                                    y2="1"
                                  >
                                    <stop
                                      offset="0%"
                                      stopColor={toHsla(
                                        standardColor.gradient1,
                                        0.85,
                                      )}
                                    />
                                    <stop
                                      offset="100%"
                                      stopColor={toHsla(
                                        standardColor.gradient2,
                                        0.92,
                                      )}
                                    />
                                  </linearGradient>
                                );
                              })}
                            </defs>
                            <Pie
                              data={slideCategoryPieData}
                              dataKey="total"
                              nameKey="nome"
                              innerRadius="35%"
                              outerRadius="80%"
                              paddingAngle={8}
                              cornerRadius={16}
                              stroke="none"
                              label={renderCategoryPieIconLabel}
                              labelLine={false}
                            >
                              {slideCategoryPieData.map((item) => {
                                const standardColor = getCategoryStandardColor(
                                  item.cor,
                                );
                                return (
                                  <Cell
                                    key={item.id}
                                    fill={`url(#slideGrad-${item.id})`}
                                    stroke={standardColor.border}
                                    strokeWidth={1.5}
                                  />
                                );
                              })}
                            </Pie>
                            <Tooltip
                              content={renderCategoryPieTooltip}
                              cursor={false}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      )}
                    </div>

                    <div className="min-h-0 rounded-lg border border-[#2F2C46] bg-[linear-gradient(145deg,rgba(17,22,38,0.95)_0%,rgba(14,19,34,0.98)_100%)] p-2">
                      {categoryComparisonData.length === 0 ? (
                        <p className="text-xs text-[#7f84a8] text-center pt-8">
                          Sem histórico para comparar com{" "}
                          {previousMonthShortLabel}
                        </p>
                      ) : (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={categoryComparisonData}
                            margin={{ top: 12, right: 8, left: 0, bottom: 4 }}
                            barGap={2}
                          >
                            <CartesianGrid
                              strokeDasharray="4 10"
                              vertical={false}
                              stroke="#2a2f52"
                            />
                            <XAxis
                              dataKey="shortName"
                              axisLine={false}
                              tickLine={false}
                              tick={{ fontSize: 9, fill: "#7f84a8" }}
                            />
                            <YAxis
                              axisLine={false}
                              tickLine={false}
                              tickFormatter={formatChartAxisTick}
                              tick={{ fontSize: 9, fill: "#7f84a8" }}
                              width={26}
                            />
                            <Tooltip
                              content={renderCategoryComparisonTooltip}
                              cursor={{
                                fill: "rgba(185, 191, 216, 0.12)",
                              }}
                            />
                            <Bar
                              dataKey="previousTotal"
                              name={`Mês anterior (${previousMonthShortLabel})`}
                              radius={[4, 4, 0, 0]}
                            >
                              {categoryComparisonData.map((item) => {
                                const standardColor = getCategoryStandardColor(
                                  item.cor,
                                );
                                return (
                                  <Cell
                                    key={`previous-bar-${item.id}`}
                                    fill={toHsla(standardColor.gradient2, 0.95)}
                                    stroke={standardColor.border}
                                    strokeWidth={1}
                                  />
                                );
                              })}
                            </Bar>
                            <Bar
                              dataKey="currentTotal"
                              name={`Mês atual (${currentMonthShortLabel})`}
                              radius={[4, 4, 0, 0]}
                            >
                              {categoryComparisonData.map((item) => {
                                const standardColor = getCategoryStandardColor(
                                  item.cor,
                                );
                                return (
                                  <Cell
                                    key={`current-bar-${item.id}`}
                                    fill={toHsla(standardColor.gradient1, 0.95)}
                                    stroke={standardColor.border}
                                    strokeWidth={1}
                                  />
                                );
                              })}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>
      ) : (
        <div
          className="grid h-full"
          style={{
            rowGap: `${desktopGap}px`,
            gridTemplateRows: `${hSecao1}px ${hSecao2}px ${hSecao3}px`,
          }}
        >
          <section ref={summaryRef} className="grid grid-cols-3 gap-3 min-h-0">
            <article
              className="col-span-2 border rounded-2xl p-2 shadow-sm min-h-0 flex flex-col bg-[linear-gradient(145deg,rgba(18,24,40,0.98)_0%,rgba(17,22,38,0.95)_55%,rgba(14,19,34,0.98)_100%)] border-[#2a3554] cursor-pointer"
              onClick={() => setActiveSlide("charts")}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setActiveSlide("charts");
                }
              }}
              aria-label="Ver análise gráfica detalhada"
            >
              <div className="flex-1 min-h-0 cursor-pointer">
                {chartData.length === 0 ? (
                  <div className="h-full rounded-xl border border-[#2f3b5d] bg-[linear-gradient(160deg,rgba(17,23,39,0.82)_0%,rgba(15,20,36,0.9)_100%)] flex items-center justify-center px-6 text-center">
                    <p className="text-sm text-[#9fb0d3]">
                      Ainda não há dados no período para montar o gráfico de
                      monitoramento.
                    </p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={chartMargin}>
                      <defs>
                        <linearGradient
                          id="colorReceitaRedesign"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="0%"
                            stopColor={CHART_THEME_COLORS.entrada.fill}
                            stopOpacity={0.28}
                          />
                          <stop
                            offset="100%"
                            stopColor={CHART_THEME_COLORS.entrada.fill}
                            stopOpacity={0.02}
                          />
                        </linearGradient>
                        <linearGradient
                          id="colorDespesaRedesign"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="0%"
                            stopColor={CHART_THEME_COLORS.saida.fill}
                            stopOpacity={0.24}
                          />
                          <stop
                            offset="100%"
                            stopColor={CHART_THEME_COLORS.saida.fill}
                            stopOpacity={0.02}
                          />
                        </linearGradient>
                        <linearGradient
                          id="colorSaldoRedesign"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor={CHART_THEME_COLORS.saldo.fill}
                            stopOpacity={0.1}
                          />
                          <stop
                            offset="95%"
                            stopColor={CHART_THEME_COLORS.saldo.fill}
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="4 10"
                        vertical={false}
                        stroke="#2a2f52"
                      />
                      <XAxis
                        dataKey="data"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: chartTickFontSize, fill: "#7f84a8" }}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        domain={[0, 10000]}
                        ticks={CHART_Y_TICKS}
                        tickFormatter={formatChartAxisTick}
                        tick={{ fontSize: chartTickFontSize, fill: "#7f84a8" }}
                        width={chartYAxisWidth}
                      />
                      <Tooltip
                        content={renderChartTooltip}
                        cursor={{
                          stroke: "#b9bfd8",
                          strokeWidth: 2,
                          strokeDasharray: "6 6",
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="entrada"
                        fill="url(#colorReceitaRedesign)"
                        stroke="none"
                        isAnimationActive={false}
                        name="entrada"
                      />
                      <Area
                        type="monotone"
                        dataKey="saida"
                        fill="url(#colorDespesaRedesign)"
                        stroke="none"
                        isAnimationActive={false}
                        name="saida"
                      />
                      <Area
                        type="monotone"
                        dataKey="saldo"
                        stroke="none"
                        fill="url(#colorSaldoRedesign)"
                        isAnimationActive={false}
                        name="saldo"
                      />
                      <Line
                        type="monotone"
                        dataKey="entrada"
                        stroke={CHART_THEME_COLORS.entrada.line}
                        strokeWidth={2}
                        dot={false}
                        activeDot={{
                          r: 7,
                          fill: "#7aa8ff",
                          stroke: "#cfd5ff",
                          strokeWidth: 2,
                        }}
                        name="entrada"
                        style={{
                          filter: `drop-shadow(0 0 4px ${CHART_THEME_COLORS.entrada.glow})`,
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="saida"
                        stroke={CHART_THEME_COLORS.saida.line}
                        strokeWidth={2}
                        dot={false}
                        activeDot={{
                          r: 7,
                          fill: "#7aa8ff",
                          stroke: "#cfd5ff",
                          strokeWidth: 2,
                        }}
                        name="saida"
                        style={{
                          filter: `drop-shadow(0 0 4px ${CHART_THEME_COLORS.saida.glow})`,
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="saldo"
                        stroke={CHART_THEME_COLORS.saldo.line}
                        strokeWidth={2}
                        dot={false}
                        name="saldo"
                        style={{ opacity: 0.6 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </article>

            <article
              className="col-span-1 rounded-xl border p-5 shadow-sm min-h-0 flex flex-col gap-3 cursor-pointer"
              onClick={() => setActiveSlide("cards")}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  setActiveSlide("cards");
                }
              }}
              role="button"
              tabIndex={0}
              aria-label="Abrir slide de gestão dos cartões"
            >
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
                        onClick={(event) => {
                          event.stopPropagation();
                          handleBringCardToFront(index + 1);
                        }}
                        className={`uiux-card-layer uiux-card-layer-back-clickable ${index === 0 ? "uiux-card-layer-back-1" : "uiux-card-layer-back-2"}`}
                        aria-label={`Selecionar cartão ${item?.cartao?.nome || "secundário"}`}
                        style={getBackLayerStyle(
                          normalizeCardTheme(item?.cartao?.corTema),
                          index,
                        )}
                      >
                        <p
                          className="uiux-card-layer-back-name"
                          style={{
                            color: getThemePalette(
                              normalizeCardTheme(item?.cartao?.corTema),
                            ).backName,
                          }}
                        >
                          {item?.cartao?.nome || ""}
                        </p>
                      </button>
                    ))}

                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        setActiveSlide("cards");
                      }}
                      className="uiux-card-layer uiux-card-layer-front uiux-card-layer-front-clickable"
                      aria-label="Abrir gestão do cartão"
                      style={getFrontLayerStyle(activeCardTheme)}
                    >
                      <div className="uiux-card-top-row">
                        <p
                          className="uiux-card-value-used"
                          style={{ color: activeCardPalette.usedText }}
                        >
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
                        style={{
                          borderColor: activeCardPalette.progressTrackBorder,
                          background: `linear-gradient(90deg, ${activeCardPalette.progressTrackStart} 0%, ${activeCardPalette.progressTrackEnd} 100%)`,
                        }}
                      >
                        <div
                          className={`uiux-card-progress-fill ${cardUsagePercent <= 0 ? "uiux-card-progress-fill-empty" : ""}`}
                          style={{
                            width: `${cardUsagePercent}%`,
                            borderColor: activeCardPalette.progressFillBorder,
                            background: `linear-gradient(90deg, ${activeCardPalette.progressFillStart} 0%, ${activeCardPalette.progressFillEnd} 100%)`,
                          }}
                        />
                      </div>

                      <div className="uiux-card-footer-row">
                        <p
                          className="uiux-card-name"
                          style={{ color: activeCardPalette.cardName }}
                        >
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
                <p
                  className="mt-1 text-xs"
                  style={{ color: "var(--color-vermelho-text)" }}
                >
                  {cardSummaryError}
                </p>
              ) : null}
            </article>
          </section>

          <section ref={planningRef} className="grid grid-cols-3 gap-3 min-h-0">
            <article className="col-span-1 border rounded-2xl p-4 shadow-sm min-h-0 flex flex-col overflow-hidden bg-[linear-gradient(145deg,rgba(18,24,40,0.98)_0%,rgba(17,22,38,0.95)_55%,rgba(14,19,34,0.98)_100%)] border-[#2a3554]">
              <div className="sticky top-0 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-[#b9bfd8]">
                  {showUpcomingReceipts
                    ? "Próximas receitas"
                    : "Próximas despesas"}
                </h3>
                <button
                  onClick={() => setShowUpcomingReceipts(!showUpcomingReceipts)}
                  className="hover:bg-[#3a4558] rounded-lg transition-colors duration-200"
                  title={showUpcomingReceipts ? "Ver despesas" : "Ver receitas"}
                >
                  <RefreshCw size={16} className="text-[#7f84a8]" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto pt-2 space-y-2">
                {(showUpcomingReceipts ? upcomingReceipts : upcomingPayments)
                  .length === 0 ? (
                  <p className="text-xs text-[#7f84a8] text-center py-4">
                    Nenhum item no período
                  </p>
                ) : (
                  (showUpcomingReceipts
                    ? upcomingReceipts
                    : upcomingPayments
                  ).map((item) => (
                    <div
                      key={item.id}
                      className="rounded-lg flex items-center justify-between gap-2"
                    >
                      <div className="flex-1 min-w-0 flex items-center gap-2">
                        <span className="text-base">{item.icone}</span>
                        <span className="text-sm font-semibold text-[#dbe3ff] whitespace-nowrap">
                          {formatCurrency(item.value)}
                        </span>
                        <span
                          className="text-xs text-[#7f84a8] truncate"
                          title={item.title}
                        >
                          {truncateWithThreeDots(
                            item.title,
                            UPCOMING_ITEM_TITLE_MAX_LENGTH,
                          )}
                        </span>
                      </div>
                      <span className="text-xs text-[#9f9cb9] whitespace-nowrap">
                        {formatDateLabel(item.dueDate)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </article>

            <div className="col-span-2 grid grid-rows-[auto_auto] gap-3 min-h-0">
              <article className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4">
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <span className="text-[24px] font-light text-[#b9bfd8] leading-none">
                        Receitas
                      </span>
                      <span
                        className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${receitasTagClassName}`}
                      >
                        {formatVariationPercent(monthComparison.incomePercent)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Você recebeu{" "}
                      <span
                        className={`font-semibold ${receitasDiffColorClassName}`}
                      >
                        {formatCurrency(Math.abs(monthComparison.incomeDiff))}
                      </span>{" "}
                      {receitasDiffDirection} este mês
                    </p>
                    <p className="text-2xl font-bold text-[#ABA8C2] mt-1">
                      {formatCurrency(totalIncome)}
                    </p>
                  </div>
                  <div className="rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <span className="text-[24px] font-light text-[#b9bfd8] leading-none">
                        Despesas
                      </span>
                      <span
                        className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${despesasTagClassName}`}
                      >
                        {formatVariationPercent(monthComparison.expensePercent)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Você gastou{" "}
                      <span
                        className={`font-semibold ${despesasDiffColorClassName}`}
                      >
                        {formatCurrency(Math.abs(monthComparison.expenseDiff))}
                      </span>{" "}
                      {despesasDiffDirection} este mês
                    </p>
                    <p className="text-2xl font-bold text-[#ABA8C2] mt-1">
                      {formatCurrency(totalExpense)}
                    </p>
                  </div>
                  <div className="rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <span className="text-[24px] font-light text-[#b9bfd8] leading-none">
                        Saldo total
                      </span>
                      <span
                        className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${saldoTagClassName}`}
                      >
                        {formatVariationPercent(monthComparison.balancePercent)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Seu saldo ficou{" "}
                      <span
                        className={`font-semibold ${saldoDiffColorClassName}`}
                      >
                        {formatCurrency(Math.abs(monthComparison.balanceDiff))}
                      </span>{" "}
                      {saldoDiffDirection} este mês
                    </p>
                    <p className="text-2xl font-bold text-[#ABA8C2] mt-1">
                      {formatCurrency(monthComparison.currentBalance)}
                    </p>
                  </div>
                </div>
              </article>

              <article
                className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4 min-h-0 cursor-pointer"
                onClick={() => setActiveSlide("investments")}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setActiveSlide("investments");
                  }
                }}
                role="button"
                tabIndex={0}
                aria-label="Abrir slide de investimentos"
              >
                <div className="rounded-lg p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <div className="text-[24px] font-light text-[#b9bfd8] leading-none">
                        Investimentos
                      </div>
                      <p className="text-2xl font-bold text-slate-800 leading-none">
                        {formatCurrency(totalInvestmentsBalance)}
                      </p>
                      <span
                        className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${investimentosTagClassName}`}
                      >
                        {formatVariationPercent(
                          monthComparison.investmentPercent,
                        )}
                      </span>
                    </div>

                    <div className="text-right text-xs text-slate-500">
                      {monthComparison.currentInvestment <= 0 ? (
                        <span
                          className="font-semibold"
                          style={{ color: "var(--color-vermelho-text)" }}
                        >
                          Você não investiu este mês
                        </span>
                      ) : (
                        <span>
                          Você investiu{" "}
                          <span
                            className={`font-semibold ${investimentoDiffColorClassName}`}
                          >
                            {formatCurrency(
                              Math.abs(monthComparison.investmentDiff),
                            )}
                          </span>{" "}
                          {investimentoDiffDirection} esse mês
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </article>
            </div>
          </section>

          <section
            ref={reviewRef}
            className="grid grid-cols-2 gap-3 min-h-0 self-start"
          >
            <div className="min-h-0 order-2">
              <article
                className="bg-white border border-slate-200 rounded-xl shadow-sm h-full min-h-[260px] max-h-[345px] overflow-hidden flex flex-col p-4 cursor-pointer"
                onClick={() => setActiveSlide("charts")}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setActiveSlide("charts");
                  }
                }}
                role="button"
                tabIndex={0}
                aria-label="Ver análise de categorias detalhada"
              >
                <div className="sticky top-0 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-[#b9bfd8]">
                    Gastos por Categoria
                  </h3>
                </div>
                <div className="flex-1 min-h-0 grid grid-cols-2 gap-4 pt-2">
                  {categoryRanking.length === 0 ? (
                    <p className="text-sm text-slate-500 col-span-2">
                      Nenhum gasto registrado neste mês
                    </p>
                  ) : (
                    <>
                      <div className="overflow-y-auto pr-1 space-y-3">
                        {categoryRanking.map((item) => {
                          const standardColor = getCategoryStandardColor(
                            item.cor,
                          );
                          return (
                            <div key={item.id} className="rounded-lg space-y-1">
                              <div
                                className="h-5 rounded-full border overflow-hidden"
                                style={{
                                  borderColor: "#2F2C46",
                                  background: `linear-gradient(180deg, ${toRgba(standardColor.gradient1, 0.2)} 0%, ${toRgba(
                                    standardColor.gradient2,
                                    0.75,
                                  )} 100%)`,
                                }}
                              >
                                <div
                                  className="h-full rounded-full border"
                                  style={{
                                    width: `${Math.min(
                                      100,
                                      (item.total /
                                        (item.limite > 0
                                          ? item.limite
                                          : item.total || 1)) *
                                        100,
                                    )}%`,
                                    borderColor: standardColor.border,
                                    background: `linear-gradient(180deg, ${standardColor.gradient1} 0%, ${standardColor.gradient2} 100%)`,
                                  }}
                                />
                              </div>
                              <div className="flex items-center justify-between text-xs">
                                <span style={{ color: standardColor.text }}>
                                  {formatCurrency(item.total)}
                                </span>
                                <span className="font-semibold text-[#6A6785]">
                                  {formatCurrency(
                                    item.limite > 0 ? item.limite : item.total,
                                  )}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <div className="min-h-0 flex items-center justify-center cursor-pointer">
                        {categoryPieData.length === 0 ? (
                          <p className="text-xs text-slate-500 text-center">
                            Sem dados para gráfico
                          </p>
                        ) : (
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={categoryPieData}
                                dataKey="total"
                                nameKey="nome"
                                innerRadius={40}
                                outerRadius={90}
                                paddingAngle={dashboardPiePaddingAngle}
                                cornerRadius={dashboardPieCornerRadius}
                                stroke="none"
                                label={renderCategoryPieIconLabel}
                                labelLine={false}
                              >
                                {categoryPieData.map((item) => {
                                  const standardColor =
                                    getCategoryStandardColor(item.cor);
                                  return (
                                    <Cell
                                      key={item.id}
                                      fill={`url(#categoriaGradient-${item.id})`}
                                      stroke={standardColor.border}
                                      strokeWidth={1.5}
                                    />
                                  );
                                })}
                              </Pie>
                              <Tooltip
                                content={renderCategoryPieTooltip}
                                cursor={false}
                              />
                              <defs>
                                {categoryPieData.map((item) => {
                                  const standardColor =
                                    getCategoryStandardColor(item.cor);
                                  return (
                                    <linearGradient
                                      key={`categoriaGradient-${item.id}`}
                                      id={`categoriaGradient-${item.id}`}
                                      x1="0"
                                      y1="0"
                                      x2="0"
                                      y2="1"
                                    >
                                      <stop
                                        offset="0%"
                                        stopColor={toHsla(
                                          standardColor.gradient1,
                                          0.85,
                                        )}
                                      />
                                      <stop
                                        offset="100%"
                                        stopColor={toHsla(
                                          standardColor.gradient2,
                                          0.92,
                                        )}
                                      />
                                    </linearGradient>
                                  );
                                })}
                              </defs>
                            </PieChart>
                          </ResponsiveContainer>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </article>
            </div>

            <article className="bg-white border border-slate-200 rounded-xl shadow-sm min-h-0 max-h-[345px] overflow-hidden order-1 flex flex-col p-4">
              <div className="sticky top-0 flex items-center justify-between gap-2 flex-wrap">
                <h3 className="text-sm font-semibold text-[#b9bfd8]">
                  Movimentações
                </h3>
                <div className="flex items-center gap-2">
                  <input
                    type="search"
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Buscar transação"
                    className="w-44 sm:w-56 px-2 py-1 rounded-md border border-[#6A6785] bg-transparent text-xs text-[#6A6785] placeholder:text-[#6A6785]"
                  />
                  <select
                    value={filterType}
                    onChange={(event) => setFilterType(event.target.value)}
                    className="px-2 py-1 rounded-md border border-[#6A6785] bg-transparent text-xs text-[#6A6785]"
                  >
                    <option value="todas">Todas</option>
                    <option value="entradas">Somente entradas</option>
                    <option value="saidas">Somente saídas</option>
                    <option value="simuladas">Somente simuladas</option>
                  </select>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto pt-2">
                <div className="space-y-3">
                  {sortedMovimentacoes.length === 0 ? (
                    <p className="text-sm text-slate-500">
                      Nenhuma movimentação encontrada.
                    </p>
                  ) : (
                    sortedMovimentacoes.map((item) => {
                      const isEntrada = (item.type || item.tipo) === "Entrada";
                      const iconClassName = isEntrada
                        ? "border border-[#4A7750] bg-[linear-gradient(180deg,#1C2F1D_0%,#101D11_100%)] text-[#4A7750]"
                        : "border border-[#895253] bg-[linear-gradient(180deg,#2F1C1D_0%,#1D1011_100%)] text-[#895253]";

                      return (
                        <div
                          key={item.id}
                          className="rounded-lg flex items-center justify-between gap-2"
                        >
                          <div className="flex-1 min-w-0 flex items-center gap-2">
                            <span
                              className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${iconClassName}`}
                            >
                              {isEntrada ? "↑" : "↓"}
                            </span>
                            <span className="text-base">
                              {item.categoria?.icone || "•"}
                            </span>
                            <span className="text-sm font-semibold text-[#dbe3ff] whitespace-nowrap">
                              {formatCurrency(item.value || item.valor || 0)}
                            </span>
                            <span className="text-xs text-[#7f84a8] truncate">
                              {item.name || item.titulo}
                            </span>
                          </div>
                          <span className="text-xs text-[#9f9cb9] whitespace-nowrap">
                            {item.date || item.data
                              ? formatDateLabel(item.date || item.data)
                              : "--/--"}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </article>
          </section>
        </div>
      )}

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

      <div className="fixed bottom-4 right-4 z-40 flex items-center gap-4">
        <button
          type="button"
          onClick={handlePreviousMonth}
          className="bg-slate-700 hover:bg-slate-600 text-white rounded-full w-12 h-12 shadow-lg flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
          aria-label="Mês anterior"
          title="Mês anterior"
        >
          <span className="text-xl leading-none">‹</span>
        </button>

        <div className="h-12 min-w-[84px] px-3 bg-[#171b40] border border-[#2f355d] text-[#cfd5f3] rounded-full shadow-lg flex items-center justify-center text-xs font-semibold uppercase tracking-[0.08em] pointer-events-none select-none">
          {currentMonthLabel}
        </div>

        <button
          type="button"
          onClick={handleNextMonth}
          className="bg-slate-700 hover:bg-slate-600 text-white rounded-full w-12 h-12 shadow-lg flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
          aria-label="Próximo mês"
          title="Próximo mês"
        >
          <span className="text-xl leading-none">›</span>
        </button>

        <button
          type="button"
          onClick={handleOpenSimulation}
          className="bg-amber-500 hover:bg-amber-600 text-white rounded-full w-12 h-12 shadow-lg flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
          aria-label="Simular transação"
          title="Simular transação"
        >
          <Sparkles size={18} />
        </button>

        <button
          type="button"
          onClick={handleOpenNewTransaction}
          className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-full w-12 h-12 shadow-lg flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
          aria-label="Adicionar nova transação"
        >
          <Plus size={20} />
        </button>
      </div>

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
