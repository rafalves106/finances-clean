import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { API_URL } from "../services/api";
import { formatDate } from "../util/formatDate";
import { getAuthHeaders } from "../services/auth";

const INITIAL_FORM = {
  editingId: null,
  name: "",
  description: "",
  value: "",
  date: "",
  tipo: "Saida",
  categoryId: "",
  veiculoId: "",
  km: "",
  isFixed: false,
  period: "",
  tipoRecorrencia: "Mensal",
};

const TransactionModal = ({
  isOpen,
  onClose,
  onSuccess,
  categorias,
  veiculos = [],
  editingItem,
  isSimulation = false,
  onSimulate,
}) => {
  const [form, setForm] = useState(INITIAL_FORM);
  const dialogRef = useRef(null);
  const setField = (field, value) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  useEffect(() => {
    if (!isOpen) return;

    if (editingItem) {
      const rawDate = editingItem.date || editingItem.data;
      const dateStr = rawDate ? rawDate.split("T")[0] : "";

      // eslint-disable-next-line react-hooks/set-state-in-effect
      setForm({
        editingId: editingItem.id,
        name: editingItem.name || editingItem.titulo || "",
        description: editingItem.description || editingItem.descricao || "",
        value: String(editingItem.value || editingItem.valor || ""),
        tipo: editingItem.tipo || editingItem.type || "Saida",
        categoryId: editingItem.categoriaId || "",
        veiculoId: editingItem.veiculoId || "",
        km: editingItem.km != null ? String(editingItem.km) : "",
        isFixed: Boolean(editingItem.fixa),
        period: editingItem.periodo ? String(editingItem.periodo) : "",
        tipoRecorrencia:
          editingItem.tipoRecorrencia === 1 ||
          editingItem.tipoRecorrencia === "Semanal"
            ? "Semanal"
            : "Mensal",
        date: dateStr,
      });
    } else {
      setForm(INITIAL_FORM);
    }
  }, [editingItem, isOpen]);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    const {
      editingId,
      name,
      value,
      tipo,
      date,
      description,
      isFixed,
      period,
      categoryId,
      veiculoId,
      km,
      tipoRecorrencia,
    } = form;

    if (!name || !value || !tipo || !date) return;
    if (isFixed && !period) return;

    const payload = {
      titulo: name,
      descricao: description,
      valor: parseFloat(value),
      tipo,
      data: formatDate(date),
      fixa: isFixed,
      periodo: isFixed ? parseInt(period) : 0,
      tipoRecorrencia: isFixed ? tipoRecorrencia : "Mensal",
      categoriaId: categoryId || null,
      veiculoId: veiculoId || null,
      km: km ? parseInt(km) : null,
    };

    if (isSimulation) {
      onSimulate?.({
        name,
        description,
        value,
        date,
        tipo,
        categoryId,
        veiculoId,
        km,
        isFixed,
        period,
        tipoRecorrencia,
      });
      return;
    }

    try {
      const response = editingId
        ? await fetch(`${API_URL}/${editingId}`, {
            method: "PUT",
            headers: getAuthHeaders(),
            body: JSON.stringify(payload),
          })
        : await fetch(API_URL, {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify(payload),
          });

      if (response.ok) {
        onSuccess();
        onClose();
      }
    } catch (err) {
      console.error("Erro ao salvar transação:", err);
    }
  };

  if (!isOpen) return null;

  const {
    editingId,
    name,
    description,
    value,
    date,
    tipo,
    categoryId,
    veiculoId,
    km,
    isFixed,
    period,
    tipoRecorrencia,
  } = form;

  const categoriaTransporte = categorias.find(
    (c) => c.nome?.toLowerCase() === "transporte",
  );
  const isTransporte =
    categoryId === categoriaTransporte?.id && tipo === "Saida";

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="transaction-modal-title"
        tabIndex={-1}
        onKeyDown={handleDialogKeyDown}
        className="bg-white rounded-2xl max-w-lg w-full mx-4 p-6 shadow-xl"
      >
        <div className="flex items-center justify-between mb-4">
          <h2
            id="transaction-modal-title"
            className="text-xl font-bold text-slate-800"
          >
            {isSimulation
              ? "Simular Transação"
              : editingItem
                ? "Editar Transação"
                : "Nova Transação"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar modal de transação"
            className="text-slate-400 hover:text-slate-600"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Título"
              className="p-2 border rounded-lg"
              value={name}
              onChange={(e) => setField("name", e.target.value)}
            />
            <input
              type="text"
              placeholder="Descrição"
              className="p-2 border rounded-lg"
              value={description}
              onChange={(e) => setField("description", e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2 px-1">
            <input
              type="checkbox"
              id="modal-isFixed"
              className="w-4 h-4 text-emerald-500 rounded border-slate-300 disabled:opacity-50"
              checked={isFixed}
              onChange={(e) => setField("isFixed", e.target.checked)}
              disabled={editingId !== null}
            />
            <label
              htmlFor="modal-isFixed"
              className={`text-sm font-medium ${editingId ? "text-slate-400" : "text-slate-600"}`}
            >
              É uma movimentação recorrente?{" "}
              {editingId && "(Bloqueado na edição)"}
            </label>
          </div>

          {isFixed && editingId === null && (
            <div className="flex flex-wrap items-center gap-4 px-1">
              <span className="text-sm font-medium text-slate-600">
                Tipo de recorrência:
              </span>
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="radio"
                  name="tipoRecorrencia"
                  value="Mensal"
                  checked={tipoRecorrencia === "Mensal"}
                  onChange={(e) => setField("tipoRecorrencia", e.target.value)}
                />
                Mensal
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="radio"
                  name="tipoRecorrencia"
                  value="Semanal"
                  checked={tipoRecorrencia === "Semanal"}
                  onChange={(e) => setField("tipoRecorrencia", e.target.value)}
                />
                Semanal
              </label>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="date"
              className="p-2 border rounded-lg"
              value={date}
              onChange={(e) => setField("date", e.target.value)}
            />

            {isFixed && editingId === null && (
              <input
                type="number"
                min="1"
                placeholder={
                  tipoRecorrencia === "Semanal"
                    ? "Duração (semanas)"
                    : "Duração (meses)"
                }
                className="p-2 border rounded-lg"
                value={period}
                onChange={(e) => setField("period", e.target.value)}
              />
            )}

            <input
              type="number"
              placeholder="Valor"
              className="p-2 border rounded-lg"
              value={value}
              onChange={(e) => setField("value", e.target.value)}
            />

            <select
              className="p-2 border rounded-lg"
              value={tipo}
              onChange={(e) => setField("tipo", e.target.value)}
            >
              <option value="Saida">Saída</option>
              <option value="Entrada">Entrada</option>
            </select>

            <select
              className="p-2 border rounded-lg md:col-span-2"
              value={categoryId}
              onChange={(e) => {
                setField("categoryId", e.target.value);
                setField("veiculoId", "");
                setField("km", "");
              }}
            >
              <option value="">Sem categoria</option>
              {categorias.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.icone ? `${cat.icone} ` : ""}
                  {cat.nome}
                </option>
              ))}
            </select>

            {isTransporte && (
              <select
                className="p-2 border rounded-lg md:col-span-2"
                value={veiculoId}
                onChange={(e) => {
                  setField("veiculoId", e.target.value);
                  setField("km", "");
                }}
              >
                <option value="">Selecione o veículo</option>
                {veiculos.map((veiculo) => (
                  <option key={veiculo.id} value={veiculo.id}>
                    {veiculo.nome} — {veiculo.modelo} ({veiculo.ano})
                  </option>
                ))}
              </select>
            )}

            {isTransporte && veiculoId && (
              <input
                type="number"
                placeholder="Quilometragem (km)"
                className="p-2 border rounded-lg md:col-span-2"
                value={km}
                onChange={(e) => setField("km", e.target.value)}
              />
            )}
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 font-medium transition-colors p-2"
            >
              Cancelar
            </button>
            <button
              aria-label="Cancelar ação"
              type="submit"
              className={`flex-1 text-white rounded-lg font-medium transition-colors p-2 ${
                isSimulation
                  ? "bg-amber-500 hover:bg-amber-600"
                  : editingId
                    ? "bg-amber-500 hover:bg-amber-600"
                    : "bg-emerald-500 hover:bg-emerald-600"
              }`}
            >
              {isSimulation ? "Simular" : editingId ? "Atualizar" : "Salvar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TransactionModal;
