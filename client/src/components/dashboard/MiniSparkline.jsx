import { Area, AreaChart, ResponsiveContainer } from "recharts";

// ponytail: não temos série histórica diária de saldo de investimentos, só o
// saldo total e a variação do mês (ambos reais, mostrados ao lado). A curva
// abaixo é decorativa - trocar por série real quando o backend expuser
// histórico de saldo por dia/aporte.
const MOCK_TREND = [
  { i: 0, v: 40 },
  { i: 1, v: 55 },
  { i: 2, v: 48 },
  { i: 3, v: 62 },
  { i: 4, v: 58 },
  { i: 5, v: 70 },
  { i: 6, v: 66 },
  { i: 7, v: 80 },
];

const MiniSparkline = ({ isPositive = true }) => (
  <div className="h-full w-full" aria-hidden="true">
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={MOCK_TREND} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="sparklineFill" x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="0%"
              stopColor={isPositive ? "var(--accent-600)" : "var(--danger-700)"}
              stopOpacity={0.35}
            />
            <stop
              offset="100%"
              stopColor={isPositive ? "var(--accent-600)" : "var(--danger-700)"}
              stopOpacity={0}
            />
          </linearGradient>
        </defs>
        <Area
          type="monotone"
          dataKey="v"
          stroke={isPositive ? "var(--accent-600)" : "var(--danger-700)"}
          strokeWidth={2}
          fill="url(#sparklineFill)"
        />
      </AreaChart>
    </ResponsiveContainer>
  </div>
);

export default MiniSparkline;
