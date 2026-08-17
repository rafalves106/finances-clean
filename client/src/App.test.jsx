import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

vi.mock("../../CHANGELOG.md?raw", () => ({
  default: "",
}));

vi.mock("./services/auth", () => ({
  getAuthHeaders: () => ({}),
  isAuthenticated: () => true,
  removeToken: vi.fn(),
}));

vi.mock("./util/releaseNotes", () => ({
  extractReleaseNotesForVersion: () => null,
  getLastSeenVersion: () => "0.4.0",
}));

vi.mock("./components/home/HomeDesktop", () => ({
  default: ({ onOpenNav }) => (
    <div data-testid="home-desktop-view">
      Home Desktop
      <button type="button" onClick={onOpenNav} aria-label="Abrir menu">
        hambúrguer inline
      </button>
    </div>
  ),
}));

vi.mock("./components/InvestmentsView", () => ({
  default: () => <div>Investments View</div>,
}));

vi.mock("./components/WishListView", () => ({
  default: () => <div>WishList View</div>,
}));

vi.mock("./components/VehicleView", () => ({
  default: () => <div>Vehicle View</div>,
}));

vi.mock("./components/CategoryManagerModal", () => ({
  default: () => null,
}));

vi.mock("./components/LoginView", () => ({
  default: () => <div>Login View</div>,
}));

vi.mock("./components/ReleaseNotesModal", () => ({
  default: () => null,
}));

import App from "./App";

const buildFetchMock = () =>
  vi.fn().mockImplementation(async (url) => {
    const path = String(url);

    if (path.includes("/api/v1/movimentacoes?")) {
      return { ok: true, status: 200, json: async () => [] };
    }

    if (path.includes("/api/v1/movimentacoes/saldo-acumulado")) {
      return { ok: true, status: 200, json: async () => ({ saldo: 0 }) };
    }

    if (path.includes("/api/v1/movimentacoes/resumo?")) {
      return { ok: true, status: 200, json: async () => ({ rendaSalario: 0 }) };
    }

    if (path.includes("/api/v1/investimentos")) {
      return { ok: true, status: 200, json: async () => [] };
    }

    if (path.includes("/api/v1/categorias")) {
      return { ok: true, status: 200, json: async () => [] };
    }

    if (path.includes("/api/v1/veiculos")) {
      return { ok: true, status: 200, json: async () => [] };
    }

    return { ok: true, status: 200, json: async () => [] };
  });

describe("App dashboard integration", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    globalThis.fetch = buildFetchMock();

    globalThis.ResizeObserver = class {
      observe() {}
      disconnect() {}
      unobserve() {}
    };
  });

  it("deve renderizar a Home por padrão, com menu fechado até o hambúrguer ser clicado", async () => {
    render(<App />);

    await waitFor(() => {
      expect(screen.getByTestId("home-desktop-view")).toBeTruthy();
    });

    expect(screen.queryByRole("dialog", { name: "Menu de navegação" })).toBeNull();

    fireEvent.click(screen.getByLabelText("Abrir menu"));

    expect(screen.getByRole("dialog", { name: "Menu de navegação" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Dashboard" })).toBeTruthy();
  });
});
