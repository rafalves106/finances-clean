import React from "react";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import AssistenteBanner from "./AssistenteBanner";

describe("AssistenteBanner", () => {
  it("chama onAbrirAssistente ao clicar", () => {
    const onAbrirAssistente = vi.fn();
    render(<AssistenteBanner onAbrirAssistente={onAbrirAssistente} />);

    fireEvent.click(screen.getByRole("button", { name: "Abrir assistente de IA" }));

    expect(onAbrirAssistente).toHaveBeenCalledTimes(1);
  });
});
