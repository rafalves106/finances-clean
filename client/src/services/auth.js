import { API_AUTH_URL } from "./api";

let isLoggedIn = false;

const clearSessionFlag = () => {
  isLoggedIn = false;
};

export const getToken = () => null;

export const setToken = () => {
  isLoggedIn = true;
};

export const logout = async () => {
  clearSessionFlag();

  try {
    await fetch(`${API_AUTH_URL}/logout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Erro ao limpar sessao:", err);
  }
};

export const removeToken = () => {
  void logout();
};

export const getAuthHeaders = () => ({
  "Content-Type": "application/json",
});

export const isAuthenticated = () => isLoggedIn;
