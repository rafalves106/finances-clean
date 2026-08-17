import { useState } from "react";
import { Sparkles, X } from "lucide-react";
import { API_ASSISTENTE_URL } from "../services/api";
import { useFocusTrap } from "../hooks/useFocusTrap";

const AssistenteMovimentacaoModal = ({ isOpen, onClose, onDraftReady }) => {
  const [texto, setTexto] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [erro, setErro] = useState("");
  const { dialogRef, handleDialogKeyDown } = useFocusTrap(isOpen, onClose);

  if (!isOpen) return null;

  const handleFechar = () => {
    setTexto("");
    setErro("");
    onClose();
  };

  const handleEnviar = async (e) => {
    e.preventDefault();
    if (!texto.trim() || isLoading) return;

    setIsLoading(true);
    setErro("");

    try {
      const response = await fetch(`${API_ASSISTENTE_URL}/interpretar-movimentacao`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ texto }),
      });

      if (!response.ok) {
        setErro("Não consegui falar com o assistente agora. Tente de novo em instantes.");
        return;
      }

      const resultado = await response.json();

      if (!resultado.entendido) {
        setErro(resultado.observacao || "Não entendi essa movimentação. Tente descrever de outro jeito.");
        return;
      }

      onDraftReady({
        id: null,
        titulo: resultado.titulo,
        valor: resultado.valor,
        data: resultado.data,
        tipo: resultado.tipo || "Saida",
        categoriaId: resultado.categoriaId,
      });
      setTexto("");
    } catch {
      setErro("Não consegui falar com o assistente agora. Tente de novo em instantes.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[rgba(18,20,28,0.55)] backdrop-blur-sm flex items-center justify-center p-4">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="assistente-modal-title"
        tabIndex={-1}
        onKeyDown={handleDialogKeyDown}
        className="w-full max-w-lg rounded-2xl p-6"
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border-default)",
          boxShadow: "var(--shadow-modal)",
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2
            id="assistente-modal-title"
            className="flex items-center gap-2 text-lg font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            <Sparkles size={18} />
            Adicionar por texto
          </h2>
          <button
            type="button"
            onClick={handleFechar}
            aria-label="Fechar assistente"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg transition-colors"
            style={{ border: "1px solid var(--border-default)", color: "var(--text-tertiary)" }}
          >
            <X size={20} />
          </button>
        </div>

        <p className="text-sm mb-3" style={{ color: "var(--text-tertiary)" }}>
          Descreva a movimentação com suas palavras. Ex: "gastei 45 reais de uber ontem".
          Nada é salvo automaticamente — você confirma antes.
        </p>

        <form onSubmit={handleEnviar} className="space-y-3">
          <textarea
            autoFocus
            rows={3}
            placeholder="Descreva a movimentação..."
            className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2"
            style={{
              border: "1px solid var(--border-default)",
              background: "var(--bg-surface)",
              color: "var(--text-primary)",
            }}
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            disabled={isLoading}
          />

          {erro ? (
            <div
              className="rounded-lg p-2 text-xs"
              style={{
                border: "1px solid var(--danger-border)",
                background: "var(--danger-100)",
                color: "var(--danger-700)",
              }}
            >
              {erro}
            </div>
          ) : null}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleFechar}
              className="flex-1 rounded-lg p-2 font-medium transition-colors"
              style={{ border: "1px solid var(--border-default)", color: "var(--text-secondary)" }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!texto.trim() || isLoading}
              className="flex-1 rounded-lg p-2 font-medium transition-colors disabled:opacity-50"
              style={{ background: "var(--accent-600)", color: "var(--text-on-accent)" }}
            >
              {isLoading ? "Analisando..." : "Analisar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AssistenteMovimentacaoModal;
