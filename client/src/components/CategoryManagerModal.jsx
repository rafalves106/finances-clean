import { useEffect, useRef, useState } from "react";
import { Pencil, Trash2, X } from "lucide-react";

import { API_CATEGORIAS_URL } from "../services/api";
import { getAuthHeaders } from "../services/auth";

const CategoryManagerModal = ({
  isOpen,
  onClose,
  categorias,
  onCategoriasChange,
}) => {
  const [editingCat, setEditingCat] = useState(null);
  const [formNome, setFormNome] = useState("");
  const [formIcone, setFormIcone] = useState("");
  const [formCor, setFormCor] = useState("#94a3b8");
  const [formOrcamentoMensal, setFormOrcamentoMensal] = useState("");
  const [feedback, setFeedback] = useState({ type: "", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingCategoryId, setDeletingCategoryId] = useState(null);
  const dialogRef = useRef(null);

  const isBusy = isSubmitting || deletingCategoryId !== null;

  const clearForm = () => {
    setEditingCat(null);
    setFormNome("");
    setFormIcone("");
    setFormCor("#94a3b8");
    setFormOrcamentoMensal("");
  };

  const setErrorFeedback = (message) => {
    setFeedback({ type: "error", message });
  };

  const setSuccessFeedback = (message) => {
    setFeedback({ type: "success", message });
  };

  useEffect(() => {
    if (!isOpen) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    clearForm();
    setFeedback({ type: "", message: "" });
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !dialogRef.current) return;

    const focusable = dialogRef.current.querySelectorAll(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    );

    if (focusable.length > 0) {
      focusable[0].focus();
      return;
    }

    dialogRef.current.focus();
  }, [isOpen]);

  const handleDialogKeyDown = (e) => {
    if (e.key === "Escape") {
      e.preventDefault();
      onClose();
      return;
    }

    if (e.key !== "Tab" || !dialogRef.current) return;

    const focusable = Array.from(
      dialogRef.current.querySelectorAll(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ),
    );

    if (focusable.length === 0) {
      e.preventDefault();
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const current = document.activeElement;

    if (e.shiftKey && current === first) {
      e.preventDefault();
      last.focus();
      return;
    }

    if (!e.shiftKey && current === last) {
      e.preventDefault();
      first.focus();
    }
  };

  if (!isOpen) return null;

  const handleEdit = (category) => {
    setEditingCat({
      id: category.id,
      nome: category.nome,
      icone: category.icone || "",
      cor: category.cor || "#94a3b8",
      isGlobal: Boolean(category.isGlobal),
    });
    setFormNome(category.nome || "");
    setFormIcone(category.icone || "");
    setFormCor(category.cor || "#94a3b8");
    setFormOrcamentoMensal(
      category.orcamentoMensal ? String(category.orcamentoMensal) : "",
    );
    setFeedback({ type: "", message: "" });
  };

  const handleDelete = async (category) => {
    if (isBusy) return;

    const confirmed = window.confirm(
      `Deseja realmente deletar a categoria "${category.nome}"?`,
    );

    if (!confirmed) {
      return;
    }

    setDeletingCategoryId(category.id);
    setFeedback({ type: "", message: "" });

    try {
      const response = await fetch(`${API_CATEGORIAS_URL}/${category.id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error("Não foi possível deletar a categoria.");
      }

      clearForm();
      onCategoriasChange();
      setSuccessFeedback(`Categoria "${category.nome}" deletada com sucesso.`);
    } catch (err) {
      console.error("Erro ao deletar categoria:", err);
      setErrorFeedback(
        err.message || "Erro ao deletar categoria. Tente novamente.",
      );
    } finally {
      setDeletingCategoryId(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isBusy) return;

    setFeedback({ type: "", message: "" });

    const isEditingGlobal = Boolean(editingCat?.isGlobal);

    if (!isEditingGlobal && !formNome.trim()) {
      setErrorFeedback("Informe um nome para a categoria.");
      return;
    }

    if (!isEditingGlobal && formIcone && formIcone.length > 2) {
      setErrorFeedback("Ícone inválido: use no máximo 2 caracteres.");
      return;
    }

    const orcamentoNumerico =
      formOrcamentoMensal.trim() === "" ? null : Number(formOrcamentoMensal);

    if (
      orcamentoNumerico !== null &&
      (!Number.isFinite(orcamentoNumerico) || orcamentoNumerico <= 0)
    ) {
      setErrorFeedback("Orçamento inválido: informe um valor maior que zero.");
      return;
    }

    const payload = {
      nome: isEditingGlobal ? editingCat.nome : formNome.trim(),
      icone: isEditingGlobal
        ? editingCat.icone || null
        : formIcone.trim() || null,
      cor: isEditingGlobal ? editingCat.cor : formCor || "#94a3b8",
      orcamentoMensal: orcamentoNumerico,
    };

    try {
      setIsSubmitting(true);

      const response = editingCat
        ? await fetch(`${API_CATEGORIAS_URL}/${editingCat.id}`, {
            method: "PUT",
            headers: getAuthHeaders(),
            body: JSON.stringify(payload),
          })
        : await fetch(API_CATEGORIAS_URL, {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify(payload),
          });

      if (!response.ok) {
        throw new Error("Não foi possível salvar a categoria.");
      }

      clearForm();
      onCategoriasChange();
      setSuccessFeedback(
        editingCat
          ? "Categoria atualizada com sucesso."
          : "Categoria criada com sucesso.",
      );
    } catch (err) {
      console.error("Erro ao salvar categoria:", err);
      setErrorFeedback(
        err.message || "Erro ao salvar categoria. Tente novamente.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="category-modal-title"
        tabIndex={-1}
        onKeyDown={handleDialogKeyDown}
        className="absolute right-0 top-0 h-full w-full max-w-sm bg-white shadow-xl overflow-y-auto"
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-200 sticky top-0 bg-white z-10">
          <h2
            id="category-modal-title"
            className="text-lg font-bold text-slate-800"
          >
            Categorias
          </h2>
          <button
            onClick={onClose}
            aria-label="Fechar modal de categorias"
            className="text-slate-400 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
            disabled={isBusy}
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4 space-y-6">
          <div aria-live="polite" aria-atomic="true" className="sr-only">
            {feedback.message}
          </div>

          {feedback.message && (
            <div
              role={feedback.type === "error" ? "alert" : "status"}
              aria-live={feedback.type === "error" ? "assertive" : "polite"}
              className={`text-sm rounded-lg border px-3 py-2 ${
                feedback.type === "error"
                  ? "bg-rose-50 border-rose-200 text-rose-700"
                  : "bg-emerald-50 border-emerald-200 text-emerald-700"
              }`}
            >
              {feedback.message}
            </div>
          )}

          <div className="space-y-3">
            {categorias.map((category) => (
              <div
                key={category.id}
                className="flex items-center justify-between gap-3 p-3 rounded-xl border border-slate-200"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-lg">{category.icone || "•"}</span>
                  <span className="font-medium text-slate-700 truncate">
                    {category.nome}
                  </span>
                  {category.isGlobal && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 font-semibold uppercase tracking-wide">
                      Global
                    </span>
                  )}
                  <span
                    className="w-3 h-3 rounded-full shrink-0 border border-slate-200"
                    style={{ backgroundColor: category.cor || "#94a3b8" }}
                  />
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleEdit(category)}
                    aria-label={`Editar categoria ${category.nome}`}
                    className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                    title="Editar"
                    disabled={isBusy}
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(category)}
                    aria-label={
                      deletingCategoryId === category.id
                        ? `Excluindo categoria ${category.nome}`
                        : `Deletar categoria ${category.nome}`
                    }
                    className={`p-2 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${category.isGlobal || isBusy ? "text-slate-300 cursor-not-allowed" : "hover:bg-red-50 text-red-500"}`}
                    title={
                      deletingCategoryId === category.id
                        ? "Excluindo..."
                        : "Deletar"
                    }
                    disabled={Boolean(category.isGlobal) || isBusy}
                  >
                    {deletingCategoryId === category.id ? (
                      <span className="text-[10px] font-semibold">...</span>
                    ) : (
                      <Trash2 size={14} />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="category-name"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Nome
              </label>
              <input
                id="category-name"
                type="text"
                required
                className="w-full p-2 border rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                value={formNome}
                onChange={(e) => setFormNome(e.target.value)}
                disabled={Boolean(editingCat?.isGlobal) || isBusy}
              />
            </div>

            <div>
              <label
                htmlFor="category-icon"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Ícone
              </label>
              <input
                id="category-icon"
                type="text"
                maxLength={2}
                placeholder="Emoji"
                className="w-full p-2 border rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                value={formIcone}
                onChange={(e) => setFormIcone(e.target.value)}
                disabled={Boolean(editingCat?.isGlobal) || isBusy}
              />
            </div>

            <div>
              <label
                htmlFor="category-color"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Cor
              </label>
              <input
                id="category-color"
                type="color"
                className="w-full h-11 p-1 border rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                value={formCor}
                onChange={(e) => setFormCor(e.target.value)}
                disabled={Boolean(editingCat?.isGlobal) || isBusy}
              />
            </div>

            <div>
              <label
                htmlFor="category-budget"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Orçamento mensal
              </label>
              <input
                id="category-budget"
                type="number"
                min="0.01"
                step="0.01"
                placeholder="Ex.: 500"
                className="w-full p-2 border rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                value={formOrcamentoMensal}
                onChange={(e) => setFormOrcamentoMensal(e.target.value)}
                disabled={isBusy}
              />
              <p className="text-xs text-slate-500 mt-1">
                Opcional. Valor mensal em R$.
              </p>
              {editingCat?.isGlobal && (
                <p className="text-xs text-slate-500 mt-1">
                  Para categoria global, apenas o orçamento é personalizado para
                  seu usuário.
                </p>
              )}
            </div>

            <div className="flex gap-2 pt-2">
              {editingCat && (
                <button
                  type="button"
                  onClick={clearForm}
                  className="flex-1 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 font-medium transition-colors p-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                  disabled={isBusy}
                >
                  Cancelar
                </button>
              )}
              <button
                type="submit"
                className={`flex-1 text-white rounded-lg font-medium transition-colors p-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${editingCat ? "bg-amber-500 hover:bg-amber-600" : "bg-emerald-500 hover:bg-emerald-600"}`}
                disabled={isBusy}
              >
                {isSubmitting
                  ? editingCat
                    ? "Atualizando..."
                    : "Salvando..."
                  : editingCat
                    ? "Atualizar"
                    : "Salvar"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CategoryManagerModal;
