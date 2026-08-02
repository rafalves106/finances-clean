import { useEffect, useState } from "react";
import { Trash2, X } from "lucide-react";
import { useFocusTrap } from "../hooks/useFocusTrap";
import { formatCurrency } from "../util/formatCurrency";

const BulkDeleteConfirmModal = ({ isOpen, onClose, onConfirm, count, totalValue }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { dialogRef, handleDialogKeyDown } = useFocusTrap(isOpen, onClose);

  useEffect(() => {
    if (!isOpen) return;
    setIsSubmitting(false);
  }, [isOpen]);

  const handleConfirm = async () => {
    try {
      setIsSubmitting(true);
      await onConfirm?.();
      onClose?.();
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[rgba(18,20,28,0.55)] backdrop-blur-sm flex items-center justify-center p-4">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="bulk-delete-modal-title"
        tabIndex={-1}
        onKeyDown={handleDialogKeyDown}
        className="w-full max-w-sm rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-5 shadow-[var(--shadow-lg)] text-[var(--text-primary)]"
      >
        <div className="flex items-center justify-between gap-3">
          <h2
            id="bulk-delete-modal-title"
            className="text-lg font-semibold text-[var(--text-primary)]"
          >
            Excluir movimentações
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="rounded-full p-2 text-[var(--text-tertiary)] hover:bg-[var(--bg-surface-sunken)] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <p className="mt-3 text-sm text-[var(--text-secondary)]">
          Tem certeza que deseja excluir{" "}
          <strong className="text-[var(--text-primary)]">
            {count} {count === 1 ? "movimentação" : "movimentações"}
          </strong>
          {totalValue > 0 ? (
            <>
              {" "}
              somando{" "}
              <strong className="text-[var(--text-primary)]">
                {formatCurrency(totalValue)}
              </strong>
            </>
          ) : null}
          ? Essa ação não pode ser desfeita.
        </p>

        <div className="mt-5 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-[var(--border-default)] px-3 py-2 text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-surface-sunken)] transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 rounded-lg bg-[var(--danger-700)] px-3 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 transition-colors"
          >
            <Trash2 size={16} />
            {isSubmitting ? "Excluindo..." : "Excluir"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BulkDeleteConfirmModal;
