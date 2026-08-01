import { formatCurrency } from "../../util/formatCurrency";

export const CHART_SERIES_ORDER = ["entrada", "saida", "saldo"];

export const CHART_SERIES_LABEL = {
  entrada: "Receita",
  saida: "Despesa",
  saldo: "Saldo",
};

export const formatChartAxisTick = (value) => {
  if (value >= 1000) {
    const compact = value / 1000;
    const normalized = Number.isInteger(compact)
      ? String(compact)
      : String(compact).replace(/\.0$/, "");
    return `${normalized}K`;
  }

  return String(value);
};

export const CHART_THEME_COLORS = {
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

export const renderChartTooltip = ({ active, payload, label }) => {
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
        background: "var(--bg-inverse)",
        border: "1px solid rgba(255,255,255,0.12)",
        borderRadius: "12px",
        boxShadow: "0 12px 28px rgba(5, 9, 18, 0.45)",
        color: "var(--text-on-accent)",
        fontSize: "12px",
        padding: "10px 12px",
      }}
    >
      <p style={{ color: "rgba(255,255,255,0.7)", fontWeight: 500, margin: "0 0 4px" }}>
        {label}
      </p>
      {items.map((item) => (
        <p
          key={item.dataKey}
          style={{ color: "var(--text-on-accent)", padding: 0, margin: 0, lineHeight: 1.5 }}
        >
          {CHART_SERIES_LABEL[item.dataKey] ?? item.dataKey}:{" "}
          {formatCurrency(item.value)}
        </p>
      ))}
    </div>
  );
};

export const renderCategoryComparisonTooltip = ({ active, payload }) => {
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
        background: "var(--bg-inverse)",
        border: "1px solid rgba(255,255,255,0.12)",
        borderRadius: "12px",
        boxShadow: "0 12px 28px rgba(5, 9, 18, 0.45)",
        color: "var(--text-on-accent)",
        fontSize: "12px",
        padding: "10px 12px",
      }}
    >
      <p style={{ color: "rgba(255,255,255,0.7)", fontWeight: 500, margin: "0 0 4px" }}>
        {categoryName}
      </p>
      {payload.map((item) => (
        <p
          key={item.dataKey}
          style={{ color: "var(--text-on-accent)", padding: 0, margin: 0, lineHeight: 1.5 }}
        >
          {item.name}: {formatCurrency(item.value)}
        </p>
      ))}
    </div>
  );
};

export const renderCategoryPieTooltip = ({ active, payload }) => {
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
        background: "var(--bg-inverse)",
        border: "1px solid rgba(255,255,255,0.12)",
        borderRadius: "12px",
        boxShadow: "0 12px 28px rgba(5, 9, 18, 0.45)",
        color: "var(--text-on-accent)",
        fontSize: "12px",
        padding: "10px 12px",
      }}
    >
      <p style={{ color: "rgba(255,255,255,0.7)", fontWeight: 500, margin: "0 0 4px" }}>
        {categoryName}
      </p>
      <p style={{ color: "var(--text-on-accent)", padding: 0, margin: 0, lineHeight: 1.5 }}>
        Gasto no mês: {formatCurrency(firstItem?.value || 0)}
      </p>
    </div>
  );
};

export const renderCategoryPieIconLabel = ({
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
