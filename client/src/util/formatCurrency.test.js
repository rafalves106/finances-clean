import { describe, expect, it } from "vitest";
import { formatCurrency } from "./formatCurrency";

describe("formatCurrency", () => {
  it("deve formatar valores positivos em BRL", () => {
    expect(formatCurrency(1234.56)).toBe("R$\u00a01.234,56");
  });

  it("deve formatar zero e negativos corretamente", () => {
    expect(formatCurrency(0)).toBe("R$\u00a00,00");
    expect(formatCurrency(-99.9)).toBe("-R$\u00a099,90");
  });
});
