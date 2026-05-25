import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("api service fetch wrapper", () => {
  beforeEach(() => {
    vi.resetModules();
    delete globalThis.__financeFetchCredentialsPatched;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    delete globalThis.__financeFetchCredentialsPatched;
  });

  it("deve incluir credentials include e preservar headers existentes", async () => {
    const rawFetch = vi.fn().mockResolvedValue({ ok: true });
    globalThis.fetch = rawFetch;

    await import("./api");

    await globalThis.fetch("/api/test", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Test": "1" },
      body: JSON.stringify({ ok: true }),
    });

    expect(rawFetch).toHaveBeenCalledWith("/api/test", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Test": "1" },
      body: JSON.stringify({ ok: true }),
      credentials: "include",
    });
  });

  it("deve incluir credentials include quando init nao for informado", async () => {
    const rawFetch = vi.fn().mockResolvedValue({ ok: true });
    globalThis.fetch = rawFetch;

    await import("./api");

    await globalThis.fetch("/api/health");

    expect(rawFetch).toHaveBeenCalledWith("/api/health", {
      credentials: "include",
    });
  });

  it("nao deve repatchar fetch quando flag global ja estiver definida", async () => {
    globalThis.__financeFetchCredentialsPatched = true;
    const rawFetch = vi.fn().mockResolvedValue({ ok: true });
    globalThis.fetch = rawFetch;

    await import("./api");

    await globalThis.fetch("/api/plain");

    expect(rawFetch).toHaveBeenCalledWith("/api/plain");
  });
});
