import { Mic } from "lucide-react";

// Banner de entrada do assistente de IA, estilo "Hey, precisa de ajuda?".
// O botão de microfone já aparece aqui pra manter a promessa visual da
// referência, mas por enquanto ele abre o mesmo modal de texto do assistente
// - entrada por áudio ainda não foi implementada (fica pra uma próxima etapa).
const AssistenteBanner = ({ onAbrirAssistente, className = "" }) => {
  return (
    <button
      type="button"
      onClick={onAbrirAssistente}
      aria-label="Abrir assistente de IA"
      className={`w-full flex items-center justify-between gap-4 rounded-3xl px-6 py-5 text-left transition-transform hover:-translate-y-0.5 ${className}`}
      style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--border-default)",
        boxShadow: "var(--shadow-md)",
      }}
    >
      <div>
        <p
          className="m-0 text-xl font-semibold sm:text-2xl"
          style={{ color: "var(--text-primary)" }}
        >
          Precisa de ajuda? 👋
        </p>
        <p className="m-0 mt-1 text-sm sm:text-base" style={{ color: "var(--text-tertiary)" }}>
          Descreva um gasto ou recebimento, eu preparo o lançamento pra você confirmar.
        </p>
      </div>
      <span
        aria-hidden="true"
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full"
        style={{ background: "var(--accent-600)", color: "var(--text-on-accent)" }}
      >
        <Mic size={20} />
      </span>
    </button>
  );
};

export default AssistenteBanner;
