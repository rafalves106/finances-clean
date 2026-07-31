export const formatDateLabel = (dateInput) => {
  const date = new Date(dateInput);
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
  });
};

export const UPCOMING_ITEM_TITLE_MAX_LENGTH = 22;

export const truncateWithThreeDots = (text, maxLength) => {
  const normalized = String(text || "").trim();
  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength).trimEnd()}...`;
};

export const getMonthYearFromValue = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return {
    month: date.getMonth() + 1,
    year: date.getFullYear(),
  };
};

export const calculateVariationPercent = (currentValue, previousValue) => {
  if (previousValue <= 0) {
    return currentValue > 0 ? 100 : 0;
  }

  return ((currentValue - previousValue) / previousValue) * 100;
};

export const formatVariationPercent = (value) => {
  const normalized = Number.isFinite(value) ? value : 0;
  const sign = normalized >= 0 ? "+" : "";
  return `${sign}${normalized.toFixed(1).replace(".", ",")}%`;
};

export const isInvestmentExpense = (item) => {
  const type = item.type || item.tipo;
  const categoryName = String(item.categoria?.nome || "").toLowerCase();

  return type === "Saida" && categoryName.includes("invest");
};

export const sortByDate = (list) =>
  [...list].sort(
    (a, b) => new Date(b.date || b.data) - new Date(a.date || a.data),
  );

export const getMonthDateRange = (year, month) => {
  const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const endDate = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

  return { startDate, endDate };
};
