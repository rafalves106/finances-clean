import { createElement } from "react";

// Badge circular com gradiente + sombra interna (classe .icon-tile,
// index.css) - dá aos ícones do Phosphor uma leitura "dimensional/premium"
// sem baixar assets 3D renderizados de verdade (ponytail: se algum dia
// precisar de ícones 3D renderizados de fato, trocar por um set tipo
// 3dicons.co aqui dentro, isolado nesse único componente).
const TONES = {
  accent: { bg: "linear-gradient(160deg, var(--accent-100) 0%, var(--accent-50) 100%)", color: "var(--accent-600)" },
  inverse: { bg: "linear-gradient(160deg, #2a251c 0%, var(--bg-inverse) 100%)", color: "#ffffff" },
  success: { bg: "linear-gradient(160deg, var(--success-100) 0%, #f0fdf4 100%)", color: "var(--success-700)" },
  danger: { bg: "linear-gradient(160deg, var(--danger-100) 0%, #fef2f2 100%)", color: "var(--danger-700)" },
  neutral: { bg: "linear-gradient(160deg, var(--bg-surface-sunken) 0%, var(--bg-surface) 100%)", color: "var(--text-secondary)" },
};

const IconTile = (props) => {
  const { icon, tone = "accent", size = 40, iconSize, weight = "duotone" } = props;
  const palette = TONES[tone] || TONES.accent;

  return (
    <span className="icon-tile" style={{ width: size, height: size, background: palette.bg }}>
      {createElement(icon, {
        size: iconSize || Math.round(size * 0.5),
        weight,
        color: palette.color,
      })}
    </span>
  );
};

export default IconTile;
