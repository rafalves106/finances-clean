import { useState } from "react";
import { AlertTriangle, Copy, Sparkles, Trash2, X } from "lucide-react";
import { API_ASSISTENTE_URL, API_URL } from "../services/api";
import { formatCurrency } from "../util/formatCurrency";
import { useFocusTrap } from "../hooks/useFocusTrap";

const normalizar = (texto) =>
  String(texto || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();

// Procura, entre as movimentações já carregadas, uma parecida com o título
// que a IA extraiu do texto - mesmo tipo (Entrada/Saida) e um título contido
// no outro (cobre "Uber" batendo com "Uber Viagem SP", por ex). Só client-side,
// sobre dados que já estão em memória - não manda nada novo pra IA nem faz
// chamada extra.
const encontrarSimilar = (titulo, tipo, allTransactions) => {
  const alvo = normalizar(titulo);
  if (alvo.length < 3) return null;

  const candidatos = allTransactions
    .filter((item) => (item.type || item.tipo) === tipo && item.id)
    .map((item) => ({ item, nome: normalizar(item.name || item.titulo) }))
    .filter(({ nome }) => nome.length >= 3 && (nome.includes(alvo) || alvo.includes(nome)));

  if (candidatos.length === 0) return null;

  return candidatos.sort(
    (a, b) => new Date(b.item.date || b.item.data) - new Date(a.item.date || a.item.data),
  )[0].item;
};

// Busca candidatas a remoção no backend (não em allTransactions, que só tem
// o mês selecionado) - se a IA extraiu mês/ano, escopa a busca a esse mês;
// senão traz todas as movimentações do usuário e filtra por termo/tipo aqui.
// Investimentos ficam de fora (o backend bloqueia excluí-los por aqui mesmo).
const buscarCandidatosParaRemocao = async (resultado, selectedAno) => {
  const mes = resultado.filtroMes ?? null;
  const ano = resultado.filtroAno ?? (mes ? selectedAno : null);
  const query = mes && ano ? `?mes=${mes}&ano=${ano}` : "";

  const response = await fetch(`${API_URL}${query}`, { credentials: "include" });
  if (!response.ok) {
    throw new Error("Não consegui buscar as movimentações agora.");
  }

  const lista = await response.json();
  const termo = normalizar(resultado.filtroTermoBusca);

  return lista.filter((item) => {
    if (item.investimentoId) return false;
    if (resultado.filtroTipo && item.tipo !== resultado.filtroTipo) return false;
    if (termo && !normalizar(item.titulo).includes(termo)) return false;
    return true;
  });
};

const AssistenteMovimentacaoModal = ({
  isOpen,
  onClose,
  onDraftReady,
  onCloneSuggestion,
  onConfirmDelete,
  allTransactions = [],
  selectedAno,
}) => {
  const [texto, setTexto] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [erro, setErro] = useState("");
  const [sugestao, setSugestao] = useState(null);
  const [remocao, setRemocao] = useState(null);
  const [isExcluindo, setIsExcluindo] = useState(false);
  const { dialogRef, handleDialogKeyDown } = useFocusTrap(isOpen, onClose);

  if (!isOpen) return null;

  const handleFechar = () => {
    setTexto("");
    setErro("");
    setSugestao(null);
    setRemocao(null);
    onClose();
  };

  const handleConfirmarExclusao = async () => {
    if (!remocao) return;
    setIsExcluindo(true);
    try {
      await onConfirmDelete(remocao.matches.map((item) => item.id));
      handleFechar();
    } finally {
      setIsExcluindo(false);
    }
  };

  const montarDraft = (resultado) => ({
    id: null,
    titulo: resultado.titulo,
    valor: resultado.valor,
    data: resultado.data,
    tipo: resultado.tipo || "Saida",
    categoriaId: resultado.categoriaId,
    fixa: Boolean(resultado.fixa),
    periodo: resultado.periodo ?? undefined,
    tipoRecorrencia: resultado.tipoRecorrencia ?? undefined,
    tipoMovimentacaoFixa: resultado.tipoMovimentacaoFixa ?? undefined,
  });

  const handleEnviar = async (e) => {
    e.preventDefault();
    if (!texto.trim() || isLoading) return;

    setIsLoading(true);
    setErro("");
    setSugestao(null);
    setRemocao(null);

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

      if (resultado.intent === "Remover") {
        const matches = await buscarCandidatosParaRemocao(resultado, selectedAno);

        if (matches.length === 0) {
          setErro("Não encontrei nenhuma movimentação com esse critério.");
          return;
        }

        setRemocao({ resultado, matches });
        return;
      }

      const draft = montarDraft(resultado);

      const parecida = onCloneSuggestion && !resultado.fixa
        ? encontrarSimilar(resultado.titulo, draft.tipo, allTransactions)
        : null;

      if (parecida) {
        setSugestao({ draft, parecida });
        return;
      }

      onDraftReady(draft);
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

        {remocao ? (
          <div className="space-y-3">
            <div
              className="flex items-start gap-2 rounded-lg p-3 text-sm"
              style={{ border: "1px solid var(--danger-border)", background: "var(--danger-100)", color: "var(--danger-700)" }}
            >
              <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
              <span>
                Encontrei <strong>{remocao.matches.length}</strong>{" "}
                {remocao.matches.length === 1 ? "movimentação" : "movimentações"} pra excluir. Essa ação não pode
                ser desfeita.
              </span>
            </div>

            <div
              className="max-h-56 space-y-1.5 overflow-y-auto rounded-lg p-2"
              style={{ border: "1px solid var(--border-default)", background: "var(--bg-surface-sunken)" }}
            >
              {remocao.matches.map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-2 px-1 py-1 text-sm">
                  <span className="truncate" style={{ color: "var(--text-primary)" }} title={item.titulo}>
                    {item.titulo}
                  </span>
                  <span className="flex-shrink-0 whitespace-nowrap" style={{ color: "var(--text-tertiary)" }}>
                    {formatCurrency(item.valor)} · {(item.data || "").split("T")[0]}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setRemocao(null)}
                disabled={isExcluindo}
                className="flex-1 rounded-lg p-2 text-sm font-medium transition-colors disabled:opacity-50"
                style={{ border: "1px solid var(--border-default)", color: "var(--text-secondary)" }}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmarExclusao}
                disabled={isExcluindo}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-lg p-2 text-sm font-medium text-white transition-colors disabled:opacity-50"
                style={{ background: "var(--danger-700)" }}
              >
                <Trash2 size={14} />
                {isExcluindo
                  ? "Excluindo..."
                  : `Excluir ${remocao.matches.length}`}
              </button>
            </div>
          </div>
        ) : sugestao ? (
          <div className="space-y-3">
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              Encontrei uma movimentação parecida. Quer clonar ela em vez de criar uma nova do zero?
            </p>
            <div
              className="rounded-lg p-3 text-sm"
              style={{ border: "1px solid var(--border-default)", background: "var(--bg-surface-sunken)" }}
            >
              <p className="m-0 font-semibold" style={{ color: "var(--text-primary)" }}>
                {sugestao.parecida.name || sugestao.parecida.titulo}
              </p>
              <p className="m-0 text-xs" style={{ color: "var(--text-tertiary)" }}>
                {sugestao.parecida.date || sugestao.parecida.data}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  onDraftReady(sugestao.draft);
                  setTexto("");
                  setSugestao(null);
                }}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-lg p-2 text-sm font-medium transition-colors"
                style={{ border: "1px solid var(--border-default)", color: "var(--text-secondary)" }}
              >
                <Sparkles size={14} /> Criar nova
              </button>
              <button
                type="button"
                onClick={() => {
                  onCloneSuggestion(sugestao.parecida);
                  setTexto("");
                  setSugestao(null);
                  handleFechar();
                }}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-lg p-2 text-sm font-medium transition-colors"
                style={{ background: "var(--accent-600)", color: "var(--text-on-accent)" }}
              >
                <Copy size={14} /> Clonar a parecida
              </button>
            </div>
          </div>
        ) : (
          <>
            <p className="text-sm mb-3" style={{ color: "var(--text-tertiary)" }}>
              Descreva a movimentação com suas palavras. Ex: "gastei 45 reais de uber ontem" ou
              "netflix 39,90 todo mês". Também remove: "apaga a compra do notebook" ou "limpa as
              saídas de agosto". Nada é salvo ou excluído automaticamente — você confirma antes.
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
          </>
        )}
      </div>
    </div>
  );
};

export default AssistenteMovimentacaoModal;
