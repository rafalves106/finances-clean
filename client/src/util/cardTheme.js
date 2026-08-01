export const DEFAULT_CARD_THEME = "#271815";

export const normalizeCardTheme = (value) => {
  if (typeof value !== "string") {
    return DEFAULT_CARD_THEME;
  }

  const trimmed = value.trim();
  if (/^#[0-9A-Fa-f]{6}$/.test(trimmed)) {
    return trimmed.toUpperCase();
  }

  return DEFAULT_CARD_THEME;
};

export const hexToRgb = (hexColor) => {
  const normalized = normalizeCardTheme(hexColor).replace("#", "");
  return {
    r: parseInt(normalized.slice(0, 2), 16),
    g: parseInt(normalized.slice(2, 4), 16),
    b: parseInt(normalized.slice(4, 6), 16),
  };
};

export const rgbToHsl = (r, g, b) => {
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

export const hexToHsl = (hexColor) => {
  const { r, g, b } = hexToRgb(hexColor);
  return rgbToHsl(r, g, b);
};

export const toRgba = (hexColor, alpha) => {
  const { r, g, b } = hexToRgb(hexColor);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export const toHsla = (hslColor, alpha) => {
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

export const clampRatio = (value) => Math.min(1, Math.max(0, value));

export const mixRgb = (from, to, ratio) =>
  Math.round(from + (to - from) * clampRatio(ratio));

export const rgbToHex = ({ r, g, b }) =>
  `#${[r, g, b]
    .map((channel) => channel.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase()}`;

export const mixWithWhite = (hexColor, ratio) => {
  const rgb = hexToRgb(hexColor);
  return rgbToHex({
    r: mixRgb(rgb.r, 255, ratio),
    g: mixRgb(rgb.g, 255, ratio),
    b: mixRgb(rgb.b, 255, ratio),
  });
};

export const mixWithBlack = (hexColor, ratio) => {
  const rgb = hexToRgb(hexColor);
  return rgbToHex({
    r: mixRgb(rgb.r, 0, ratio),
    g: mixRgb(rgb.g, 0, ratio),
    b: mixRgb(rgb.b, 0, ratio),
  });
};

export const getThemePalette = (themeColor) => ({
  backName: mixWithBlack(themeColor, 0.35),
  usedText: mixWithBlack(themeColor, 0.4),
  cardName: mixWithBlack(themeColor, 0.35),
  progressTrackBorder: mixWithWhite(themeColor, 0.4),
  progressTrackStart: toRgba(themeColor, 0.12),
  progressTrackEnd: toRgba(mixWithWhite(themeColor, 0.85), 0.6),
  progressFillBorder: mixWithBlack(themeColor, 0.2),
  progressFillStart: mixWithWhite(themeColor, 0.1),
  progressFillEnd: mixWithBlack(themeColor, 0.1),
});

export const getBackLayerStyle = (themeColor, index) => ({
  borderColor:
    index === 0 ? toRgba(themeColor, 0.32) : toRgba(themeColor, 0.22),
  background:
    index === 0
      ? `linear-gradient(180deg, ${mixWithWhite(themeColor, 0.82)} 0%, ${mixWithWhite(themeColor, 0.92)} 100%)`
      : `linear-gradient(180deg, ${mixWithWhite(themeColor, 0.88)} 0%, ${mixWithWhite(themeColor, 0.95)} 100%)`,
});

export const getFrontLayerStyle = (themeColor) => ({
  borderColor: toRgba(themeColor, 0.4),
  background: `
    radial-gradient(circle at 12% 15%, ${toRgba(themeColor, 0.14)} 0%, ${toRgba(
      themeColor,
      0,
    )} 45%),
    linear-gradient(145deg, ${mixWithWhite(themeColor, 0.78)} 0%, ${mixWithWhite(themeColor, 0.9)} 100%)
  `,
});

export const getCategoryStandardColor = (categoryColor) => {
  if (!categoryColor || typeof categoryColor !== "string") {
    // Fallback: cor padrão cinza
    return {
      gradient1: "hsl(0, 0%, 94%)",
      gradient2: "hsl(0, 0%, 90%)",
      border: "hsl(0, 0%, 80%)",
      text: "hsl(0, 0%, 35%)",
    };
  }

  try {
    const hsl = hexToHsl(categoryColor);
    const hue = hsl.h;

    // Aplica o padrão: HUE fixo, S e L padronizados (light mode)
    return {
      gradient1: `hsl(${hue}, 55%, 92%)`,
      gradient2: `hsl(${hue}, 60%, 88%)`,
      border: `hsl(${hue}, 45%, 78%)`,
      text: `hsl(${hue}, 55%, 32%)`,
    };
  } catch {
    // Fallback se houver erro na conversão
    return {
      gradient1: "hsl(0, 0%, 94%)",
      gradient2: "hsl(0, 0%, 90%)",
      border: "hsl(0, 0%, 80%)",
      text: "hsl(0, 0%, 35%)",
    };
  }
};
