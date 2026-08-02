import { describe, expect, it } from "vitest";
import { renderHook } from "@testing-library/react";
import { useGlobalSearch } from "./useGlobalSearch";

const incomes = [
  { id: "inc-1", name: "Salário", type: "Entrada", date: "2026-08-05" },
];
const expenses = [
  { id: "exp-1", name: "Supermercado Extra", type: "Saida", date: "2026-08-10" },
];
const veiculos = [{ id: "v-1", nome: "Honda Civic" }];
const metas = [{ id: "m-1", descricao: "Viagem para o Japão" }];

describe("useGlobalSearch", () => {
  it("retorna lista vazia quando a busca esta vazia", () => {
    const { result } = renderHook(() =>
      useGlobalSearch({ query: "", incomes, expenses, veiculos, metas }),
    );

    expect(result.current).toEqual([]);
  });

  it("encontra transacoes, veiculos e metas por substring, ignorando maiusculas", () => {
    const { result } = renderHook(() =>
      useGlobalSearch({ query: "super", incomes, expenses, veiculos, metas }),
    );

    expect(result.current).toHaveLength(1);
    expect(result.current[0]).toMatchObject({
      type: "transacao",
      label: "Supermercado Extra",
    });
  });

  it("ignora acentos na busca", () => {
    const { result } = renderHook(() =>
      useGlobalSearch({ query: "japao", incomes, expenses, veiculos, metas }),
    );

    expect(result.current).toHaveLength(1);
    expect(result.current[0]).toMatchObject({
      type: "meta",
      label: "Viagem para o Japão",
      activeTab: "wishlist",
    });
  });

  it("resultado de veiculo aponta para a aba vehicle", () => {
    const { result } = renderHook(() =>
      useGlobalSearch({ query: "civic", incomes, expenses, veiculos, metas }),
    );

    expect(result.current[0]).toMatchObject({
      type: "veiculo",
      activeTab: "vehicle",
    });
  });
});
