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

export const getBackLayerStyle = (themeColor, index) => ({
  borderColor:
    index === 0 ? toRgba(themeColor, 0.42) : toRgba(themeColor, 0.34),
  background:
    index === 0
      ? `linear-gradient(180deg, ${toRgba(themeColor, 0.45)} 0%, rgba(28, 27, 36, 0.86) 100%)`
      : `linear-gradient(180deg, ${toRgba(themeColor, 0.34)} 0%, rgba(30, 28, 36, 0.75) 100%)`,
});

export const getFrontLayerStyle = (themeColor) => ({
  borderColor: toRgba(themeColor, 0.58),
  background: `
    radial-gradient(circle at 12% 15%, ${toRgba(themeColor, 0.16)} 0%, ${toRgba(
      themeColor,
      0,
    )} 45%),
    linear-gradient(145deg, ${toRgba(themeColor, 0.96)} 0%, rgba(29, 17, 16, 0.92) 52%, #191026 100%)
  `,
});

export const getCategoryStandardColor = (categoryColor) => {
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
