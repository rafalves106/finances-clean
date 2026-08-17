import React from "react";
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import NestedCirclesChart from "./NestedCirclesChart";

const formatValue = (v) => `R$ ${v.toFixed(2)}`;

describe("NestedCirclesChart", () => {
  it("mostra estado vazio quando não há categorias com gasto", () => {
    render(<NestedCirclesChart items={[]} formatValue={formatValue} />);
    expect(screen.getByText("Sem gastos por categoria neste mês.")).toBeTruthy();
  });

  it("renderiza até 4 categorias, maior valor primeiro (mais externo)", () => {
    render(
      <NestedCirclesChart
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

    expect(screen.getByText("R$ 400.00")).toBeTruthy();
    expect(screen.getByText("R$ 100.00")).toBeTruthy();
    expect(screen.getByText("R$ 50.00")).toBeTruthy();
    expect(screen.getByText("R$ 200.00")).toBeTruthy();
    // A 5ª categoria (menor valor) não aparece - só as 4 maiores.
    expect(screen.queryByText("R$ 10.00")).toBeNull();
  });
});
