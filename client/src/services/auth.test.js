import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("auth service", () => {
  beforeEach(() => {
    vi.resetModules();
    delete globalThis.__financeFetchCredentialsPatched;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    delete globalThis.__financeFetchCredentialsPatched;
  });

  it("deve retornar null em getToken", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true });
    const auth = await import("./auth");

    expect(auth.getToken()).toBeNull();
  });

  it("deve atualizar o estado de autenticacao com setToken", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true });
    const auth = await import("./auth");

    expect(auth.isAuthenticated()).toBe(false);
    auth.setToken();
    expect(auth.isAuthenticated()).toBe(true);
  });

  it("deve limpar sessao em logout e chamar endpoint de logout", async () => {
    const rawFetch = vi.fn().mockResolvedValue({ ok: true });
    globalThis.fetch = rawFetch;

    const auth = await import("./auth");
    const api = await import("./api");

    auth.setToken();
    expect(auth.isAuthenticated()).toBe(true);

    await auth.logout();

    expect(auth.isAuthenticated()).toBe(false);
    expect(rawFetch).toHaveBeenCalledWith(`${api.API_AUTH_URL}/logout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });
  });

  it("removeToken deve disparar logout assincrono e limpar sessao", async () => {
    const rawFetch = vi.fn().mockResolvedValue({ ok: true });
    globalThis.fetch = rawFetch;

    const auth = await import("./auth");

    auth.setToken();
    expect(auth.isAuthenticated()).toBe(true);

    auth.removeToken();
    await Promise.resolve();

    expect(auth.isAuthenticated()).toBe(false);
    expect(rawFetch).toHaveBeenCalledTimes(1);
  });

  it("deve retornar headers de autenticacao sem Authorization", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true });
    const auth = await import("./auth");

    expect(auth.getAuthHeaders()).toEqual({
      "Content-Type": "application/json",
    });
  });

  it("logout deve tratar erro de fetch sem quebrar execucao", async () => {
    const rawFetch = vi.fn().mockRejectedValue(new Error("network error"));
    globalThis.fetch = rawFetch;

    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    const auth = await import("./auth");

    auth.setToken();
    await expect(auth.logout()).resolves.toBeUndefined();
    expect(auth.isAuthenticated()).toBe(false);
    expect(consoleErrorSpy).toHaveBeenCalled();
  });
});
