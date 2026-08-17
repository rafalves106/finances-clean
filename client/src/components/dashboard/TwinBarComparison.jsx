import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis } from "recharts";

// Comparativo de duas barras (estilo "2022/2023" da referência), usando
// dados reais já calculados em useDashboardFinancials (monthComparison).
const TwinBarComparison = ({ currentLabel, currentValue, previousLabel, previousValue, formatValue }) => {
  const data = [
    { periodo: previousLabel, valor: previousValue },
    { periodo: currentLabel, valor: currentValue },
  ];

  return (
    <div className="h-full w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} barSize={28}>
          <XAxis
            dataKey="periodo"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "var(--text-tertiary)", fontSize: 11 }}
          />
          <Tooltip
            formatter={(value) => formatValue(value)}
            contentStyle={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border-default)",
              borderRadius: 8,
              fontSize: 12,
            }}
          />
          <Bar dataKey="valor" radius={[8, 8, 8, 8]}>
            {data.map((entry, index) => (
              <Cell key={entry.periodo} fill={index === 1 ? "var(--accent-600)" : "var(--border-strong)"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default TwinBarComparison;
