import React from "react";
import { describe, expect, it } from "vitest";
import { fireEvent, render } from "@testing-library/react";
import InvestmentsView from "./InvestmentsView";
import { formatCurrency } from "../util/formatCurrency";

const setup = (investmentAmount = 0) =>
  render(
    <InvestmentsView
      investmentAmount={investmentAmount}
      investments={[]}
      fetchData={() => {}}
    />,
  );

const updateSimulator = (container, { initial, monthly, rate, years }) => {
  const numberInputs = container.querySelectorAll('input[type="number"]');
  const yearsInput = container.querySelector('input[type="range"]');

  fireEvent.change(numberInputs[0], { target: { value: String(initial) } });
  fireEvent.change(numberInputs[1], { target: { value: String(monthly) } });
  fireEvent.change(numberInputs[2], { target: { value: String(rate) } });
  fireEvent.change(yearsInput, { target: { value: String(years) } });
};

const calculateExpected = ({ initial, monthly, rate, years }) => {
  const months = years * 12;
  const rateDecimal = rate / 100;
  const futureValue =
    rateDecimal === 0
      ? Number(initial) + Number(monthly) * months
      : initial * Math.pow(1 + rateDecimal, months) +
        (monthly * (Math.pow(1 + rateDecimal, months) - 1)) / rateDecimal;
  const totalInvested = Number(initial) + Number(monthly) * months;
  const totalInterest = futureValue - totalInvested;

  return { futureValue, totalInvested, totalInterest };
};

const normalizeText = (value) => value.replace(/\u00a0/g, " ");

const expectTextInView = (container, value) => {
  expect(normalizeText(container.textContent || "")).toContain(
    normalizeText(value),
  );
};

describe("InvestmentsView simulador", () => {
  it("deve calcular com taxa maior que zero", () => {
    const { container } = setup(0);
    const payload = { initial: 1000, monthly: 100, rate: 1, years: 1 };
    const expected = calculateExpected(payload);

    updateSimulator(container, payload);

    expectTextInView(container, formatCurrency(expected.totalInvested));
    expectTextInView(container, `+${formatCurrency(expected.totalInterest)}`);
    expectTextInView(container, formatCurrency(expected.futureValue));
  });

  it("deve calcular corretamente com taxa igual a zero", () => {
    const { container } = setup(0);
    const payload = { initial: 1000, monthly: 100, rate: 0, years: 2 };
    const expected = calculateExpected(payload);

    updateSimulator(container, payload);

    expectTextInView(container, formatCurrency(expected.totalInvested));
    expectTextInView(container, `+${formatCurrency(expected.totalInterest)}`);
    expectTextInView(container, formatCurrency(expected.futureValue));
  });

  it("deve manter valores limítrofes válidos sem NaN no resultado", () => {
    const { container } = setup(0);
    const payload = { initial: 0, monthly: 0, rate: 0, years: 30 };
    const expected = calculateExpected(payload);

    updateSimulator(container, payload);

    expectTextInView(container, formatCurrency(0));
    expectTextInView(container, formatCurrency(expected.futureValue));
    expect(container.textContent.includes("NaN")).toBe(false);
  });
});
