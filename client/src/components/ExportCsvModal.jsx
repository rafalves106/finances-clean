import { useEffect, useRef, useState } from "react";
import { Download, X } from "lucide-react";

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
  const dialogRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    setStartDate(defaultStartDate);
    setEndDate(defaultEndDate);
    setErrorMessage("");
    setIsSubmitting(false);
  }, [defaultEndDate, defaultStartDate, isOpen]);

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

  const handleDialogKeyDown = (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      onClose();
      return;
    }

    if (event.key !== "Tab" || !dialogRef.current) return;

    const focusable = Array.from(
      dialogRef.current.querySelectorAll(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ),
    );

    if (focusable.length === 0) {
      event.preventDefault();
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const current = document.activeElement;

    if (event.shiftKey && current === first) {
      event.preventDefault();
      last.focus();
      return;
    }

    if (!event.shiftKey && current === last) {
      event.preventDefault();
      first.focus();
    }
  };

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
    <div className="fixed inset-0 z-50 bg-[rgba(4,7,15,0.72)] backdrop-blur-sm flex items-center justify-center p-4">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="export-csv-modal-title"
        tabIndex={-1}
        onKeyDown={handleDialogKeyDown}
        className="w-full max-w-md rounded-2xl border border-[#2a3554] bg-[linear-gradient(180deg,rgba(20,26,44,0.98)_0%,rgba(15,20,36,0.98)_100%)] p-5 shadow-[0_24px_60px_rgba(6,10,22,0.5)] text-[#dbe3ff]"
      >
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2
              id="export-csv-modal-title"
              className="text-lg font-semibold text-[#ecefff]"
            >
              Exportar movimentações em CSV
            </h2>
            <p className="mt-1 text-xs text-[#8f94b4]">
              Escolha o período que será baixado no arquivo.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar modal de exportação CSV"
            className="rounded-full p-2 text-[#8f94b4] hover:bg-[#1e2340] hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="flex flex-col gap-1 text-xs font-medium text-[#aeb2d8]">
              Data inicial
              <input
                type="date"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
                className="rounded-lg border border-[#2f355d] bg-[#10162a] px-3 py-2 text-sm text-[#dbe3ff] outline-none focus:border-[#7da7ff]"
                required
              />
            </label>

            <label className="flex flex-col gap-1 text-xs font-medium text-[#aeb2d8]">
              Data final
              <input
                type="date"
                value={endDate}
                onChange={(event) => setEndDate(event.target.value)}
                className="rounded-lg border border-[#2f355d] bg-[#10162a] px-3 py-2 text-sm text-[#dbe3ff] outline-none focus:border-[#7da7ff]"
                required
              />
            </label>
          </div>

          {errorMessage ? (
            <p className="text-xs text-[#f08f9f]" role="alert">
              {errorMessage}
            </p>
          ) : null}

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-[#2f355d] px-3 py-2 text-sm font-medium text-[#cfd5f3] hover:bg-[#1e2340] transition-colors"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 rounded-lg bg-sky-500 px-3 py-2 text-sm font-semibold text-white hover:bg-sky-600 disabled:cursor-not-allowed disabled:opacity-60 transition-colors"
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
