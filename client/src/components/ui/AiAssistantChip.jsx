import { Sparkle } from "@phosphor-icons/react";

// Entrada compacta do assistente de IA - substitui o banner grande
// (AssistenteBanner, removido) que não cabia mais no orçamento de altura
// da Home sem scroll. Mesma função (abre AssistenteMovimentacaoModal),
// visual novo e enxuto.
const AiAssistantChip = ({ onClick }) => (
  <button
    type="button"
    onClick={onClick}
    aria-label="Abrir assistente de IA para lançar uma movimentação"
    className="ui-panel ui-panel-interactive flex items-center gap-2 rounded-full py-2 pl-2 pr-4"
  >
    <span
      className="flex h-7 w-7 items-center justify-center rounded-full"
      style={{ background: "var(--accent-600)", color: "var(--text-on-accent)" }}
    >
      <Sparkle size={14} weight="fill" />
    </span>
    <span className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>
      Lançar com IA
    </span>
  </button>
);

export default AiAssistantChip;
