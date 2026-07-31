import { useState } from "react";
import { Wallet } from "lucide-react";

import { API_AUTH_URL } from "../services/api";

const RegisterView = ({ onNavigateToLogin }) => {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro("");
    setLoading(true);

    try {
      const response = await fetch(`${API_AUTH_URL}/registro-publico`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome, email, senha }),
      });

      if (response.ok) {
        setSucesso(true);
        return;
      }

      if (response.status === 400) {
        setErro("Este email já está cadastrado.");
        return;
      }

      setErro("Erro ao criar conta.");
    } catch (err) {
      console.error("Erro ao registrar:", err);
      setErro("Erro ao criar conta.");
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
              Criar conta
            </p>
          </div>
        </div>

        {sucesso ? (
          <div className="space-y-4">
            <div
              className="text-sm rounded-xl p-3"
              style={{
                color: "var(--success-700)",
                background: "var(--success-100)",
                border: "1px solid var(--success-border)",
              }}
            >
              Conta criada. Peça o código de ativação ao administrador da
              plataforma — ele é solicitado na sua primeira tentativa de
              login.
            </div>

            <button
              type="button"
              onClick={onNavigateToLogin}
              className="w-full font-semibold py-3 rounded-xl transition-colors"
              style={{
                background: "var(--accent-600)",
                color: "var(--text-on-accent)",
              }}
            >
              Ir para o login
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="register-nome"
                className="block text-sm font-medium mb-1"
                style={{ color: "var(--text-secondary)" }}
              >
                Nome
              </label>
              <input
                id="register-nome"
                type="text"
                required
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="w-full p-3 rounded-xl focus:outline-none focus:ring-2"
                style={{
                  border: "1px solid var(--border-default)",
                  "--tw-ring-color": "var(--accent-600)",
                }}
              />
            </div>

            <div>
              <label
                htmlFor="register-email"
                className="block text-sm font-medium mb-1"
                style={{ color: "var(--text-secondary)" }}
              >
                Email
              </label>
              <input
                id="register-email"
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
                htmlFor="register-senha"
                className="block text-sm font-medium mb-1"
                style={{ color: "var(--text-secondary)" }}
              >
                Senha
              </label>
              <input
                id="register-senha"
                type="password"
                required
                minLength={8}
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                className="w-full p-3 rounded-xl focus:outline-none focus:ring-2"
                style={{
                  border: "1px solid var(--border-default)",
                  "--tw-ring-color": "var(--accent-600)",
                }}
              />
              <p
                className="text-xs mt-1"
                style={{ color: "var(--text-tertiary)" }}
              >
                Mínimo de 8 caracteres.
              </p>
            </div>

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
              {loading ? "Criando..." : "Criar conta"}
            </button>
          </form>
        )}

        {!sucesso && (
          <button
            type="button"
            onClick={onNavigateToLogin}
            className="w-full text-center text-sm mt-4"
            style={{ color: "var(--accent-600)" }}
          >
            Já tenho conta
          </button>
        )}
      </div>
    </div>
  );
};

export default RegisterView;
