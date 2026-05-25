import { describe, expect, it } from "vitest";
import { formatHours } from "./formatHours";

describe("formatHours", () => {
  it("deve formatar horas inteiras sem minutos", () => {
    expect(formatHours(1.0)).toBe("1h ");
    expect(formatHours(2)).toBe("2h ");
  });

  it("deve formatar horas com minutos", () => {
    expect(formatHours(1.5)).toBe("1h 30min");
  });

  it("deve formatar zero horas", () => {
    expect(formatHours(0)).toBe("0h ");
  });
});
