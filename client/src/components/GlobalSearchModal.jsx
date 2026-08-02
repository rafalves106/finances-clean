import { useState } from "react";
import { Search, X } from "lucide-react";
import { useFocusTrap } from "../hooks/useFocusTrap";
import { useGlobalSearch } from "../hooks/useGlobalSearch";

const TYPE_LABELS = {
  transacao: "Transação",
  veiculo: "Veículo",
  meta: "Meta",
};

const GlobalSearchModal = ({
  onClose,
  onNavigate,
  incomes,
  expenses,
  veiculos,
  metas,
}) => {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const { dialogRef, handleDialogKeyDown } = useFocusTrap(true, onClose);
  const results = useGlobalSearch({ query, incomes, expenses, veiculos, metas });

  const handleQueryChange = (event) => {
    setQuery(event.target.value);
    setSelectedIndex(0);
  };

  const handleSelect = (result) => {
    if (result.activeTab) {
      onNavigate?.(result.activeTab);
    }
    onClose?.();
  };

  const handleKeyDown = (event) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setSelectedIndex((current) => Math.min(current + 1, results.length - 1));
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setSelectedIndex((current) => Math.max(current - 1, 0));
      return;
    }

    if (event.key === "Enter" && results[selectedIndex]) {
      event.preventDefault();
      handleSelect(results[selectedIndex]);
      return;
    }

    handleDialogKeyDown(event);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[rgba(18,20,28,0.55)] backdrop-blur-sm flex items-start justify-center p-4 pt-[15vh]">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="global-search-title"
        tabIndex={-1}
        onKeyDown={handleKeyDown}
        className="w-full max-w-lg rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] shadow-[var(--shadow-lg)] text-[var(--text-primary)] overflow-hidden"
      >
        <div
          className="flex items-center gap-2 px-4 py-3"
          style={{ borderBottom: "1px solid var(--border-subtle)" }}
        >
          <Search size={18} style={{ color: "var(--text-tertiary)" }} />
          <label
            htmlFor="global-search-input"
            id="global-search-title"
            className="sr-only"
          >
            Buscar transações, veículos e metas
          </label>
          <input
            id="global-search-input"
            type="text"
            value={query}
            onChange={handleQueryChange}
            placeholder="Buscar transações, veículos e metas..."
            className="flex-1 bg-transparent outline-none text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)]"
          />
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar busca"
            className="rounded-full p-1.5 transition-colors"
            style={{ color: "var(--text-tertiary)" }}
          >
            <X size={16} />
          </button>
        </div>

        <div className="max-h-80 overflow-y-auto">
          {query.trim() === "" ? (
            <p
              className="px-4 py-6 text-sm text-center"
              style={{ color: "var(--text-tertiary)" }}
            >
              Digite para buscar em transações do mês, veículos e metas.
            </p>
          ) : results.length === 0 ? (
            <p
              className="px-4 py-6 text-sm text-center"
              style={{ color: "var(--text-tertiary)" }}
            >
              Nenhum resultado encontrado.
            </p>
          ) : (
            results.map((result, index) => (
              <button
                key={result.id}
                type="button"
                onClick={() => handleSelect(result)}
                onMouseEnter={() => setSelectedIndex(index)}
                className="w-full flex items-center justify-between gap-3 px-4 py-2.5 text-left transition-colors"
                style={{
                  background:
                    index === selectedIndex
                      ? "var(--bg-surface-sunken)"
                      : "transparent",
                }}
              >
                <div className="min-w-0">
                  <p
                    className="text-sm font-medium truncate"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {result.label}
                  </p>
                  <p
                    className="text-xs"
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    {result.description}
                  </p>
                </div>
                <span
                  className="text-[10px] uppercase font-semibold tracking-wide flex-shrink-0"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  {TYPE_LABELS[result.type]}
                </span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default GlobalSearchModal;
