// Dial circular (estilo "Growth rate" da referência): fundo escuro,
// anel de progresso coral, percentual no centro. SVG puro, sem lib nova.
const GrowthDial = ({ percent, label, size = 120 }) => {
  const clamped = Math.max(0, Math.min(100, percent));
  const strokeWidth = 8;
  const radius = size / 2 - strokeWidth;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div
      className="relative flex items-center justify-center rounded-full"
      style={{ width: size, height: size, background: "var(--bg-inverse)" }}
    >
      <svg width={size} height={size} className="absolute inset-0 -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.12)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--accent-600)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 300ms ease" }}
        />
      </svg>
      <div className="relative text-center">
        <p className="m-0 text-xl font-bold" style={{ color: "#ffffff" }}>
          {Math.round(clamped)}%
        </p>
        <p className="m-0 text-[10px]" style={{ color: "rgba(255,255,255,0.65)" }}>
          {label}
        </p>
      </div>
    </div>
  );
};

export default GrowthDial;
