import React from "react";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import NavDrawer from "./NavDrawer";

// Controlado de fora (isOpen/onClose) desde que o botão hambúrguer virou um
// componente separado (ui/HamburgerButton) pra poder aparecer inline na
// Home desktop em vez de sempre flutuando - ver App.jsx.
describe("NavDrawer", () => {
  it("não renderiza nada quando isOpen é false", () => {
    render(
      <NavDrawer
        isOpen={false}
        onClose={vi.fn()}
        activeTab="dashboard"
        onNavigate={vi.fn()}
        onOpenSearch={vi.fn()}
        onLogout={vi.fn()}
      />,
    );

    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("fecha ao clicar no X ou no fundo", () => {
    const onClose = vi.fn();
    render(
      <NavDrawer
        isOpen
        onClose={onClose}
        activeTab="dashboard"
        onNavigate={vi.fn()}
        onOpenSearch={vi.fn()}
        onLogout={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByLabelText("Fechar menu"));
    expect(onClose).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByLabelText("Fechar menu clicando fora"));
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it("navega e fecha o menu ao selecionar um item", () => {
    const onNavigate = vi.fn();
    const onClose = vi.fn();
    render(
      <NavDrawer
        isOpen
        onClose={onClose}
        activeTab="dashboard"
        onNavigate={onNavigate}
        onOpenSearch={vi.fn()}
        onLogout={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Veículos" }));

    expect(onNavigate).toHaveBeenCalledWith("vehicle");
    expect(onClose).toHaveBeenCalled();
  });
});
