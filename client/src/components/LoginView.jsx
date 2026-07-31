import { useState } from "react";
import { Wallet } from "lucide-react";

import { API_AUTH_URL } from "../services/api";
import { setToken } from "../services/auth";

const LoginView = ({ onLoginSuccess, onNavigateToRegister }) => {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [codigo, setCodigo] = useState("");
  const [needsActivation, setNeedsActivation] = useState(false);
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro("");
    setLoading(true);

    try {
      if (needsActivation) {
        const response = await fetch(`${API_AUTH_URL}/ativar`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, senha, codigo }),
        });

        if (response.ok) {
          setToken();
          onLoginSuccess();
          return;
        }

        setErro("Código de ativação inválido.");
        return;
      }

      const response = await fetch(`${API_AUTH_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, senha }),
      });

      if (response.ok) {
        const data = await response.json();
        setToken(data.token);
        onLoginSuccess();
        return;
      }

      if (response.status === 403) {
        const data = await response.json().catch(() => null);
        if (data?.code === "CONTA_NAO_ATIVADA") {
          setNeedsActivation(true);
          setErro(
            "Conta ainda não ativada. Peça o código ao administrador da plataforma.",
          );
          return;
        }
      }

      if (response.status === 401) {
        setErro("Email ou senha inválidos");
        return;
      }

      setErro("Erro ao realizar login");
    } catch (err) {
      console.error("Erro ao autenticar:", err);
      setErro("Erro ao realizar login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "var(--bg-app)" }}
    >
      <div
        className="w-full max-w-md rounded-2xl p-8"
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border-default)",
          boxShadow: "var(--shadow-lg)",
        }}
      >
        <div
          className="flex items-center gap-3 mb-8"
          style={{ color: "var(--text-primary)" }}
        >
          <Wallet className="w-10 h-10" style={{ color: "var(--accent-600)" }} />
          <div>
            <h1 className="text-2xl font-bold">Finanças</h1>
            <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
              Entre para continuar
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="login-email"
              className="block text-sm font-medium mb-1"
              style={{ color: "var(--text-secondary)" }}
            >
              Email
            </label>
            <input
              id="login-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 rounded-xl focus:outline-none focus:ring-2"
              style={{
                border: "1px solid var(--border-default)",
                "--tw-ring-color": "var(--accent-600)",
              }}
            />
          </div>

          <div>
            <label
              htmlFor="login-senha"
              className="block text-sm font-medium mb-1"
              style={{ color: "var(--text-secondary)" }}
            >
              Senha
            </label>
            <input
              id="login-senha"
              type="password"
              required
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              className="w-full p-3 rounded-xl focus:outline-none focus:ring-2"
              style={{
                border: "1px solid var(--border-default)",
                "--tw-ring-color": "var(--accent-600)",
              }}
            />
          </div>

          {needsActivation && (
            <div>
              <label
                htmlFor="login-codigo"
                className="block text-sm font-medium mb-1"
                style={{ color: "var(--text-secondary)" }}
              >
                Código de ativação
              </label>
              <input
                id="login-codigo"
                type="text"
                required
                autoFocus
                value={codigo}
                onChange={(e) => setCodigo(e.target.value)}
                className="w-full p-3 rounded-xl focus:outline-none focus:ring-2"
                style={{
                  border: "1px solid var(--border-default)",
                  "--tw-ring-color": "var(--accent-600)",
                }}
              />
            </div>
          )}

          {erro && (
            <div
              className="text-sm rounded-xl p-3"
              style={{
                color: "var(--danger-700)",
                background: "var(--danger-100)",
                border: "1px solid var(--danger-border)",
              }}
            >
              {erro}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full font-semibold py-3 rounded-xl transition-colors disabled:opacity-70"
            style={{
              background: "var(--accent-600)",
              color: "var(--text-on-accent)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--accent-500)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "var(--accent-600)";
            }}
          >
            {loading
              ? needsActivation
                ? "Ativando..."
                : "Entrando..."
              : needsActivation
                ? "Ativar conta"
                : "Entrar"}
          </button>
        </form>

        {!needsActivation && onNavigateToRegister && (
          <button
            type="button"
            onClick={onNavigateToRegister}
            className="w-full text-center text-sm mt-4"
            style={{ color: "var(--accent-600)" }}
          >
            Criar conta
          </button>
        )}
      </div>
    </div>
  );
};

export default LoginView;
