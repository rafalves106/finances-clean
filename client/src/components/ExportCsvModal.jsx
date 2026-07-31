import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";
import { useFocusTrap } from "../hooks/useFocusTrap";

const ExportCsvModal = ({
  isOpen,
  onClose,
  onConfirm,
  defaultStartDate = "",
  defaultEndDate = "",
}) => {
  const [startDate, setStartDate] = useState(defaultStartDate);
  const [endDate, setEndDate] = useState(defaultEndDate);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const { dialogRef, handleDialogKeyDown } = useFocusTrap(isOpen, onClose);

  useEffect(() => {
    if (!isOpen) return;

    setStartDate(defaultStartDate);
    setEndDate(defaultEndDate);
    setErrorMessage("");
    setIsSubmitting(false);
  }, [defaultEndDate, defaultStartDate, isOpen]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage("");

    if (!startDate || !endDate) {
      setErrorMessage("Informe a data inicial e a data final.");
      return;
    }

    if (startDate > endDate) {
      setErrorMessage("A data inicial deve ser menor ou igual à data final.");
      return;
    }

    try {
      setIsSubmitting(true);
      await onConfirm?.({ startDate, endDate });
      onClose?.();
    } catch (error) {
      setErrorMessage(error?.message || "Não foi possível exportar o CSV.");
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
        aria-labelledby="export-csv-modal-title"
        tabIndex={-1}
        onKeyDown={handleDialogKeyDown}
        className="w-full max-w-md rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-5 shadow-[var(--shadow-lg)] text-[var(--text-primary)]"
      >
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2
              id="export-csv-modal-title"
              className="text-lg font-semibold text-[var(--text-primary)]"
            >
              Exportar movimentações em CSV
            </h2>
            <p className="mt-1 text-xs text-[var(--text-tertiary)]">
              Escolha o período que será baixado no arquivo.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar modal de exportação CSV"
            className="rounded-full p-2 text-[var(--text-tertiary)] hover:bg-[var(--bg-surface-sunken)] hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="flex flex-col gap-1 text-xs font-medium text-[var(--text-secondary)]">
              Data inicial
              <input
                type="date"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
                className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface-sunken)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent-600)]"
                required
              />
            </label>

            <label className="flex flex-col gap-1 text-xs font-medium text-[var(--text-secondary)]">
              Data final
              <input
                type="date"
                value={endDate}
                onChange={(event) => setEndDate(event.target.value)}
                className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface-sunken)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent-600)]"
                required
              />
            </label>
          </div>

          {errorMessage ? (
            <p className="text-xs text-[var(--danger-700)]" role="alert">
              {errorMessage}
            </p>
          ) : null}

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-[var(--border-default)] px-3 py-2 text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-surface-sunken)] transition-colors"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 rounded-lg bg-[var(--accent-600)] px-3 py-2 text-sm font-semibold text-[var(--text-on-accent)] hover:bg-[var(--accent-500)] disabled:cursor-not-allowed disabled:opacity-60 transition-colors"
            >
              <Download size={16} />
              {isSubmitting ? "Exportando..." : "Exportar CSV"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ExportCsvModal;
