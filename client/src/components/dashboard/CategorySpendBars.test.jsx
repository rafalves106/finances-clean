import React from "react";
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import CategorySpendBars from "./CategorySpendBars";

const formatValue = (v) => `R$ ${v.toFixed(2)}`;

describe("CategorySpendBars", () => {
  it("mostra estado vazio quando não há categorias com gasto", () => {
    render(<CategorySpendBars items={[]} formatValue={formatValue} />);
    expect(screen.getByText("Sem gastos por categoria neste mês.")).toBeTruthy();
  });

  it("renderiza até 4 categorias, maior valor primeiro", () => {
    render(
      <CategorySpendBars
        items={[
          { nome: "Transporte", valor: 100 },
          { nome: "Alimentação", valor: 400 },
          { nome: "Saúde", valor: 50 },
          { nome: "Setup", valor: 200 },
          { nome: "Lazer", valor: 10 },
        ]}
        formatValue={formatValue}
      />,
    );

    expect(screen.getByText("Alimentação")).toBeTruthy();
    expect(screen.getByText("R$ 400.00")).toBeTruthy();
    expect(screen.getByText("R$ 100.00")).toBeTruthy();
    expect(screen.getByText("R$ 50.00")).toBeTruthy();
    expect(screen.getByText("R$ 200.00")).toBeTruthy();
    // A 5ª categoria (menor valor) não aparece - só as 4 maiores.
    expect(screen.queryByText("Lazer")).toBeNull();
  });

  it("valores próximos entre si continuam com nome e valor legíveis (bug do gráfico de bolhas)", () => {
    render(
      <CategorySpendBars
        items={[
          { nome: "Cartões de Crédito", valor: 2234.11 },
          { nome: "Educação", valor: 946.11 },
          { nome: "Transporte", valor: 379.35 },
          { nome: "Outros", valor: 308.6 },
        ]}
        formatValue={formatValue}
      />,
    );

    expect(screen.getByText("Transporte")).toBeTruthy();
    expect(screen.getByText("Outros")).toBeTruthy();
    expect(screen.getByText("R$ 379.35")).toBeTruthy();
    expect(screen.getByText("R$ 308.60")).toBeTruthy();
  });
});
