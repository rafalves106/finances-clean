import { describe, expect, it } from "vitest";
import { formatDate } from "./formatDate";

describe("formatDate", () => {
  it("deve converter YYYY-MM-DD para YYYY-MM-DDT12:00:00Z", () => {
    expect(formatDate("2026-05-25")).toBe("2026-05-25T12:00:00Z");
  });
});
