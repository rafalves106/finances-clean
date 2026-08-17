import React from "react";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import NavDrawer from "./NavDrawer";

describe("NavDrawer", () => {
  it("começa fechado e abre/fecha ao clicar no hambúrguer e no X", () => {
    render(<NavDrawer activeTab="dashboard" onNavigate={vi.fn()} onOpenSearch={vi.fn()} onLogout={vi.fn()} />);

    expect(screen.queryByRole("dialog")).toBeNull();

    fireEvent.click(screen.getByLabelText("Abrir menu"));
    expect(screen.getByRole("dialog")).toBeTruthy();

    fireEvent.click(screen.getByLabelText("Fechar menu"));
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("navega e fecha o menu ao selecionar um item", () => {
    const onNavigate = vi.fn();
    render(<NavDrawer activeTab="dashboard" onNavigate={onNavigate} onOpenSearch={vi.fn()} onLogout={vi.fn()} />);

    fireEvent.click(screen.getByLabelText("Abrir menu"));
    fireEvent.click(screen.getByRole("button", { name: "Veículos" }));

    expect(onNavigate).toHaveBeenCalledWith("vehicle");
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
