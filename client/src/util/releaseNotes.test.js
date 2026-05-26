import { afterEach, describe, expect, it, vi } from "vitest";
import {
  LAST_SEEN_VERSION_KEY,
  extractReleaseNotesForVersion,
  getLastSeenVersion,
  setLastSeenVersion,
} from "./releaseNotes";

const CHANGELOG_SAMPLE = `# Changelog

## [0.4.0] - 2026-05-26

### Adicionado

- Modal de release notes.

## [0.3.0] - 2026-05-25

### Adicionado

- Melhorias do ciclo 3.
`;

describe("releaseNotes util", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("deve extrair secao quando versao existe", () => {
    const notes = extractReleaseNotesForVersion(CHANGELOG_SAMPLE, "0.4.0");

    expect(notes).toContain("### Adicionado");
    expect(notes).toContain("Modal de release notes.");
    expect(notes).not.toContain("0.3.0");
  });

  it("deve retornar vazio quando versao nao existe no changelog", () => {
    const notes = extractReleaseNotesForVersion(CHANGELOG_SAMPLE, "9.9.9");
    expect(notes).toBe("");
  });

  it("deve retornar vazio para entradas invalidas no parser", () => {
    expect(extractReleaseNotesForVersion("", "0.4.0")).toBe("");
    expect(extractReleaseNotesForVersion(CHANGELOG_SAMPLE, "")).toBe("");
  });

  it("deve ler e salvar versao quando localStorage esta disponivel", () => {
    const getItem = vi.fn().mockReturnValue("0.3.0");
    const setItem = vi.fn();

    vi.stubGlobal("localStorage", { getItem, setItem });

    expect(getLastSeenVersion()).toBe("0.3.0");
    expect(setLastSeenVersion("0.4.0")).toBe(true);
    expect(setItem).toHaveBeenCalledWith(LAST_SEEN_VERSION_KEY, "0.4.0");
  });

  it("deve falhar de forma segura quando localStorage esta indisponivel", () => {
    vi.stubGlobal("localStorage", {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("blocked");
      },
    });

    expect(getLastSeenVersion()).toBeNull();
    expect(setLastSeenVersion("0.4.0")).toBe(false);
    expect(setLastSeenVersion("")).toBe(false);
  });
});