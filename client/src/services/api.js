const BASE = import.meta.env.VITE_API_BASE_URL || "";

if (!globalThis.__financeFetchCredentialsPatched) {
  const originalFetch = globalThis.fetch.bind(globalThis);

  globalThis.fetch = (input, init) => {
    const requestInit = init
      ? { ...init, credentials: "include" }
      : { credentials: "include" };

    return originalFetch(input, requestInit);
  };

  globalThis.__financeFetchCredentialsPatched = true;
}

export const API_URL = `${BASE}/api/v1/movimentacoes`;
export const API_METAS_URL = `${BASE}/api/v1/metas`;
export const API_VEHICLE_URL = `${BASE}/api/v1/manutencoes`;
export const API_INVESTIMENTOS_URL = `${BASE}/api/v1/investimentos`;
export const API_CATEGORIAS_URL = `${BASE}/api/v1/categorias`;
export const API_CATEGORIAS_ALERTAS_ORCAMENTO_URL = `${API_CATEGORIAS_URL}/alertas-orcamento`;
export const API_VEICULOS_URL = `${BASE}/api/v1/veiculos`;
export const API_CARTAO_URL = `${BASE}/api/v1/cartao`;
export const API_AUTH_URL = `${BASE}/api/v1/auth`;

export const extractApiErrorMessage = async (response, fallbackMessage) => {
  try {
    const body = await response.json();
    return body?.error?.message || fallbackMessage;
  } catch {
    return fallbackMessage;
  }
};
