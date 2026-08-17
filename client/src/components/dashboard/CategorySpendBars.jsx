// Lista de barras horizontais pras top categorias de gasto do mês.
//
// ponytail: já tentamos bolhas concêntricas (estilo "Annual profits" da
// referência) duas vezes e voltou bug as duas - primeiro o círculo mais
// interno cobria o rótulo dos círculos do meio, depois (mesmo com rótulo
// numa coluna separada) quando os dois menores valores ficavam próximos os
// círculos internos viravam quase do mesmo tamanho e a lista de números
// perdia a ligação visual com as bolhas. Barra horizontal não tem esse
// problema estrutural: nome e valor sempre lado a lado, barra sempre
// legível não importa a proporção entre os valores.
const TINTS = ["var(--accent-600)", "var(--accent-500)", "var(--accent-200, var(--accent-100))", "var(--accent-100)"];

const CategorySpendBars = ({ items, formatValue }) => {
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

  return (
    <div
      className="flex h-full flex-col justify-center gap-2.5"
      role="img"
      aria-label={`Gastos por categoria: ${ordenado.map((i) => `${i.nome} ${formatValue(i.valor)}`).join(", ")}`}
    >
      {ordenado.map((item, index) => (
        <div key={item.nome}>
          <div className="mb-1 flex items-center justify-between gap-2 text-xs">
            <span className="truncate font-medium" style={{ color: "var(--text-secondary)" }}>
              {item.nome}
            </span>
            <span className="whitespace-nowrap font-semibold" style={{ color: "var(--text-primary)" }}>
              {formatValue(item.valor)}
            </span>
          </div>
          <div
            className="h-1.5 overflow-hidden rounded-full"
            style={{ background: "var(--bg-surface-sunken)" }}
          >
            <div
              className="h-full rounded-full"
              style={{
                width: `${Math.max(6, (item.valor / maiorValor) * 100)}%`,
                background: TINTS[index],
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

export default CategorySpendBars;
