import { useMemo } from "react";

const normalize = (value) =>
  (value ?? "")
    .toString()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();

export const useGlobalSearch = ({
  query,
  incomes = [],
  expenses = [],
  veiculos = [],
  metas = [],
}) => {
  return useMemo(() => {
    const normalizedQuery = normalize(query).trim();

    if (!normalizedQuery) {
      return [];
    }

    const transacaoResults = [...incomes, ...expenses]
      .filter((item) => normalize(item.name).includes(normalizedQuery))
      .map((item) => ({
        id: `transacao-${item.id}`,
        type: "transacao",
        label: item.name,
        description: `${item.type === "Entrada" ? "Entrada" : "Saída"} · ${item.date}`,
      }));

    const veiculoResults = veiculos
      .filter((veiculo) => normalize(veiculo.nome).includes(normalizedQuery))
      .map((veiculo) => ({
        id: `veiculo-${veiculo.id}`,
        type: "veiculo",
        label: veiculo.nome,
        description: "Veículo",
        activeTab: "vehicle",
      }));

    const metaResults = metas
      .filter((meta) => normalize(meta.descricao).includes(normalizedQuery))
      .map((meta) => ({
        id: `meta-${meta.id}`,
        type: "meta",
        label: meta.descricao,
        description: "Meta",
        activeTab: "wishlist",
      }));

    return [...transacaoResults, ...veiculoResults, ...metaResults].slice(0, 20);
  }, [query, incomes, expenses, veiculos, metas]);
};
