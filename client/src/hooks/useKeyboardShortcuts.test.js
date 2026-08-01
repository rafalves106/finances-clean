import { afterEach, describe, expect, it, vi } from "vitest";
import { renderHook, cleanup } from "@testing-library/react";
import { useKeyboardShortcuts } from "./useKeyboardShortcuts";

const dispatchKey = (key) => {
  window.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true }));
};

describe("useKeyboardShortcuts", () => {
  afterEach(() => {
    cleanup();
    document.body.innerHTML = "";
  });

  it("chama onNewTransaction ao pressionar N", () => {
    const onNewTransaction = vi.fn();
    renderHook(() =>
      useKeyboardShortcuts({ onNewTransaction, onPreviousMonth: vi.fn(), onNextMonth: vi.fn() }),
    );

    dispatchKey("n");

    expect(onNewTransaction).toHaveBeenCalledTimes(1);
  });

  it("chama onPreviousMonth/onNextMonth nas setas", () => {
    const onPreviousMonth = vi.fn();
    const onNextMonth = vi.fn();
    renderHook(() =>
      useKeyboardShortcuts({
        onNewTransaction: vi.fn(),
        onPreviousMonth,
        onNextMonth,
      }),
    );

    dispatchKey("ArrowLeft");
    dispatchKey("ArrowRight");

    expect(onPreviousMonth).toHaveBeenCalledTimes(1);
    expect(onNextMonth).toHaveBeenCalledTimes(1);
  });

  it("ignora atalhos quando o foco esta em um campo de input", () => {
    const onNewTransaction = vi.fn();
    const input = document.createElement("input");
    document.body.appendChild(input);
    input.focus();

    renderHook(() =>
      useKeyboardShortcuts({
        onNewTransaction,
        onPreviousMonth: vi.fn(),
        onNextMonth: vi.fn(),
      }),
    );

    input.dispatchEvent(new KeyboardEvent("keydown", { key: "n", bubbles: true }));

    expect(onNewTransaction).not.toHaveBeenCalled();
  });

  it("ignora atalhos quando ha um modal aberto (role=dialog)", () => {
    const onNewTransaction = vi.fn();
    const dialog = document.createElement("div");
    dialog.setAttribute("role", "dialog");
    document.body.appendChild(dialog);

    renderHook(() =>
      useKeyboardShortcuts({
        onNewTransaction,
        onPreviousMonth: vi.fn(),
        onNextMonth: vi.fn(),
      }),
    );

    dispatchKey("n");

    expect(onNewTransaction).not.toHaveBeenCalled();
  });
});
