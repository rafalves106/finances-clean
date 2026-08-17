// Gráfico de círculos concêntricos (estilo "Annual profits" da referência).
// Sem biblioteca nova - área proporcional ao valor (raio = sqrt(valor)),
// maior valor por fora, tons de coral graduados do mais claro (fora) ao mais
// escuro/saturado (dentro).
const TINTS = ["var(--accent-50)", "var(--accent-100)", "var(--accent-500)", "var(--accent-600)"];
const TEXT_ON_TINT = ["var(--text-primary)", "var(--text-primary)", "var(--text-on-accent)", "var(--text-on-accent)"];

const NestedCirclesChart = ({ items, formatValue, size = 260 }) => {
  const ordenado = [...items]
    .filter((item) => Number(item.valor) > 0)
    .sort((a, b) => b.valor - a.valor)
    .slice(0, 4);

  if (ordenado.length === 0) {
    return (
      <div
        className="flex h-full items-center justify-center text-sm"
        style={{ color: "var(--text-tertiary)" }}
      >
        Sem gastos por categoria neste mês.
      </div>
    );
  }

  const maiorValor = ordenado[0].valor;
  const raioMax = size / 2;
  const raioMin = raioMax * 0.32;

  const circulos = ordenado.map((item, index) => {
    const proporcao = Math.sqrt(item.valor / maiorValor);
    const raio = Math.max(raioMin, raioMax * proporcao);
    return { ...item, raio, tint: TINTS[index], corTexto: TEXT_ON_TINT[index] };
  });

  return (
    <div
      className="relative mx-auto"
      style={{ width: size, height: size }}
      role="img"
      aria-label={`Gastos por categoria: ${ordenado.map((i) => `${i.nome} ${formatValue(i.valor)}`).join(", ")}`}
    >
      {circulos.map((circulo, index) => (
        <div
          key={circulo.nome}
          className="absolute rounded-full flex items-start justify-center"
          style={{
            width: circulo.raio * 2,
            height: circulo.raio * 2,
            left: raioMax - circulo.raio,
            top: raioMax - circulo.raio,
            background: circulo.tint,
            zIndex: index,
            paddingTop: index === circulos.length - 1 ? "42%" : "10px",
          }}
        >
          <span className="text-center leading-tight" style={{ color: circulo.corTexto }}>
            <span className="block text-xs font-semibold">{formatValue(circulo.valor)}</span>
          </span>
        </div>
      ))}
    </div>
  );
};

export default NestedCirclesChart;
