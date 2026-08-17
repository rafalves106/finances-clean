import React from "react";
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import GrowthDial from "./GrowthDial";

describe("GrowthDial", () => {
  it("arredonda e mostra o percentual e o rótulo", () => {
    render(<GrowthDial percent={36.4} label="Orçamento usado" />);
    expect(screen.getByText("36%")).toBeTruthy();
    expect(screen.getByText("Orçamento usado")).toBeTruthy();
  });

  it("satura em 100% mesmo com valor maior (evita anel quebrado)", () => {
    render(<GrowthDial percent={180} label="Estourado" />);
    expect(screen.getByText("100%")).toBeTruthy();
  });

  it("nunca fica negativo", () => {
    render(<GrowthDial percent={-20} label="Teste" />);
    expect(screen.getByText("0%")).toBeTruthy();
  });
});
