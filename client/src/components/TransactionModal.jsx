import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { API_CARTAO_URL, API_URL } from "../services/api";
import { formatDate } from "../util/formatDate";

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
  tipoMovimentacaoFixa: "RecorrenteFixa",
  vincularCartao: false,
  cartaoId: null,
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
  periodKey,
  initialCardPurchaseMode = false,
}) => {
  const [form, setForm] = useState(INITIAL_FORM);
  const [cartaoAtivo, setCartaoAtivo] = useState(null);
  const [loadingCartao, setLoadingCartao] = useState(false);
  const [validationError, setValidationError] = useState("");
  const dialogRef = useRef(null);
  const setField = (field, value) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  useEffect(() => {
    if (!isOpen) return;

    if (editingItem) {
      const rawDate = editingItem.date || editingItem.data;
      const dateStr = rawDate ? rawDate.split("T")[0] : "";

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
        tipoMovimentacaoFixa:
          editingItem.tipoMovimentacaoFixa === 1 ||
          editingItem.tipoMovimentacaoFixa === "Parcelada"
            ? "Parcelada"
            : "RecorrenteFixa",
        vincularCartao: Boolean(editingItem.cartaoId),
        cartaoId: editingItem.cartaoId || null,
        date: dateStr,
      });
      setValidationError("");
    } else {
      setForm({
        ...INITIAL_FORM,
        tipo: initialCardPurchaseMode ? "Saida" : INITIAL_FORM.tipo,
        vincularCartao: initialCardPurchaseMode,
      });
      setValidationError("");
    }
  }, [editingItem, initialCardPurchaseMode, isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const carregarCartaoAtivo = async () => {
      setLoadingCartao(true);

      try {
        const response = await fetch(`${API_CARTAO_URL}/resumo`, {
          credentials: "include",
        });

        if (!response.ok) {
          setCartaoAtivo(null);
          return;
        }

        const data = await response.json();
        const cartao = data?.cartao || null;
        setCartaoAtivo(cartao);

        if (!editingItem && initialCardPurchaseMode && cartao?.id) {
          setForm((prev) => ({
            ...prev,
            tipo: "Saida",
            vincularCartao: true,
            cartaoId: cartao.id,
          }));
        }
      } catch {
        setCartaoAtivo(null);
      } finally {
        setLoadingCartao(false);
      }
    };

    carregarCartaoAtivo();
  }, [editingItem, initialCardPurchaseMode, isOpen]);

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
    setValidationError("");

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
      tipoMovimentacaoFixa,
      vincularCartao,
      cartaoId,
    } = form;

    if (!name || !value || !tipo || !date) {
      setValidationError("Preencha os campos obrigatórios da transação.");
      return;
    }

    if (isFixed && !period) {
      setValidationError("Informe a duração da recorrência.");
      return;
    }

    if (tipo === "Saida" && vincularCartao && !cartaoId) {
      setValidationError(
        "Selecione um cartão ativo para registrar compra no cartão.",
      );
      return;
    }

    const payload = {
      titulo: name,
      descricao: description,
      valor: parseFloat(value),
      tipo,
      data: formatDate(date),
      fixa: isFixed,
      periodo: isFixed ? parseInt(period) : 0,
      tipoRecorrencia: isFixed ? tipoRecorrencia : "Mensal",
      tipoMovimentacaoFixa: isFixed ? tipoMovimentacaoFixa : "RecorrenteFixa",
      categoriaId: categoryId || null,
      veiculoId: veiculoId || null,
      km: km ? parseInt(km) : null,
      cartaoId:
        tipo === "Saida" && vincularCartao && cartaoId ? cartaoId : null,
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
        tipoMovimentacaoFixa,
        vincularCartao,
        cartaoId,
      });
      return;
    }

    try {
      const response = editingId
        ? await fetch(`${API_URL}/${editingId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify(payload),
          })
        : await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify(payload),
          });

      if (response.ok) {
        let responseBody = null;

        try {
          responseBody = await response.clone().json();
        } catch {
          responseBody = null;
        }

        const resolvedId = editingId || responseBody?.id || responseBody?.Id;

        onSuccess?.({
          type: editingId ? "edit" : "create",
          id: resolvedId,
          payload,
          requestPeriodKey: periodKey,
        });
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
    tipoMovimentacaoFixa,
    vincularCartao,
  } = form;

  const categoriaTransporte = categorias.find(
    (c) => c.nome?.toLowerCase() === "transporte",
  );
  const isTransporte =
    categoryId === categoriaTransporte?.id && tipo === "Saida";
  const isCompraNoCartao = tipo === "Saida" && vincularCartao;
  const fieldClassName =
    "w-full rounded-lg border border-[#334266] bg-[#111a2f] px-3 py-2 text-sm text-[#dbe3ff] placeholder:text-[#7f89ac] focus:border-[#4f6fb0] focus:outline-none focus:ring-2 focus:ring-[#4f6fb0]/25";

  return (
    <div className="fixed inset-0 z-50 bg-[rgba(4,7,15,0.72)] backdrop-blur-sm flex items-center justify-center p-4">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="transaction-modal-title"
        tabIndex={-1}
        onKeyDown={handleDialogKeyDown}
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-[#2a3554] bg-[linear-gradient(145deg,rgba(18,24,40,0.98)_0%,rgba(17,22,38,0.95)_55%,rgba(14,19,34,0.98)_100%)] p-6 shadow-[0_24px_60px_rgba(3,8,18,0.6)]"
      >
        <div className="flex items-center justify-between mb-5">
          <h2
            id="transaction-modal-title"
            className="text-lg sm:text-xl font-semibold text-[#dbe3ff]"
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
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#31405f] text-[#8f97b8] transition-colors hover:bg-[#1f2a45] hover:text-[#dbe3ff]"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {validationError ? (
            <div className="rounded-lg border border-[#6b3040] bg-[#2a1620] p-2 text-xs text-[#f5a3b2]">
              {validationError}
            </div>
          ) : null}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Título"
              className={fieldClassName}
              value={name}
              onChange={(e) => setField("name", e.target.value)}
            />
            <input
              type="text"
              placeholder="Descrição"
              className={fieldClassName}
              value={description}
              onChange={(e) => setField("description", e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2 px-1 py-2 rounded-lg border border-[#2a3554] bg-[#101a31]">
            <input
              type="checkbox"
              id="modal-isFixed"
              className="h-4 w-4 rounded border-[#3c4b6b] bg-[#111a2f] accent-emerald-500 disabled:opacity-50"
              checked={isFixed}
              onChange={(e) => setField("isFixed", e.target.checked)}
              disabled={editingId !== null}
            />
            <label
              htmlFor="modal-isFixed"
              className={`text-sm font-medium ${editingId ? "text-[#7f89ac]" : "text-[#b9bfd8]"}`}
            >
              É uma movimentação recorrente?{" "}
              {editingId && "(Bloqueado na edição)"}
            </label>
          </div>

          {isFixed && editingId === null && (
            <div className="flex flex-wrap items-center gap-4 px-3 py-2 rounded-lg border border-[#2a3554] bg-[#101a31]">
              <span className="text-sm font-medium text-[#b9bfd8]">
                Tipo da movimentação fixa:
              </span>
              <label className="flex items-center gap-2 text-sm text-[#dbe3ff]">
                <input
                  type="radio"
                  name="tipoMovimentacaoFixa"
                  value="RecorrenteFixa"
                  checked={tipoMovimentacaoFixa === "RecorrenteFixa"}
                  onChange={(e) =>
                    setField("tipoMovimentacaoFixa", e.target.value)
                  }
                />
                Recorrente Fixa
              </label>
              <label className="flex items-center gap-2 text-sm text-[#dbe3ff]">
                <input
                  type="radio"
                  name="tipoMovimentacaoFixa"
                  value="Parcelada"
                  checked={tipoMovimentacaoFixa === "Parcelada"}
                  onChange={(e) =>
                    setField("tipoMovimentacaoFixa", e.target.value)
                  }
                />
                Parcelada
              </label>
            </div>
          )}

          {isFixed && editingId === null && (
            <div className="flex flex-wrap items-center gap-4 px-3 py-2 rounded-lg border border-[#2a3554] bg-[#101a31]">
              <span className="text-sm font-medium text-[#b9bfd8]">
                Tipo de recorrência:
              </span>
              <label className="flex items-center gap-2 text-sm text-[#dbe3ff]">
                <input
                  type="radio"
                  name="tipoRecorrencia"
                  value="Mensal"
                  checked={tipoRecorrencia === "Mensal"}
                  onChange={(e) => setField("tipoRecorrencia", e.target.value)}
                />
                Mensal
              </label>
              <label className="flex items-center gap-2 text-sm text-[#dbe3ff]">
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
              className={fieldClassName}
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
                className={fieldClassName}
                value={period}
                onChange={(e) => setField("period", e.target.value)}
              />
            )}

            <input
              type="number"
              placeholder="Valor"
              className={fieldClassName}
              value={value}
              onChange={(e) => setField("value", e.target.value)}
            />

            <select
              className={fieldClassName}
              value={tipo}
              onChange={(e) => {
                const novoTipo = e.target.value;
                setField("tipo", novoTipo);

                if (novoTipo !== "Saida") {
                  setField("vincularCartao", false);
                }
              }}
            >
              <option value="Saida">Saída</option>
              <option value="Entrada">Entrada</option>
            </select>

            {tipo === "Saida" && (
              <div className="md:col-span-2 rounded-lg border border-[#2f4566] bg-[#111a2f] p-3 space-y-2">
                <label className="flex items-center gap-2 text-sm text-[#dbe3ff]">
                  <input
                    type="checkbox"
                    checked={vincularCartao}
                    disabled={!cartaoAtivo}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setField("vincularCartao", checked);
                      setField(
                        "cartaoId",
                        checked ? cartaoAtivo?.id || null : null,
                      );
                    }}
                  />
                  Marcar como compra no cartão ativo
                </label>

                {isCompraNoCartao ? (
                  <div className="rounded-md border border-[#1f5a4b] bg-[#0f2f26] px-2 py-1.5 text-xs text-[#84e0bc]">
                    Use a data real da compra (não use a data de vencimento). A
                    competência e o vencimento são calculados pelo ciclo do
                    cartão.
                  </div>
                ) : null}

                {loadingCartao ? (
                  <p className="text-xs text-[#8f97b8]">
                    Carregando cartão ativo...
                  </p>
                ) : cartaoAtivo ? (
                  <div className="space-y-2">
                    <label className="block text-xs text-[#b9bfd8]">
                      Cartão selecionado
                      <select
                        className="mt-1 w-full rounded-md border border-[#334266] bg-[#182540] p-2 text-xs text-[#dbe3ff]"
                        value={form.cartaoId || cartaoAtivo.id}
                        onChange={(e) =>
                          setField("cartaoId", e.target.value || null)
                        }
                      >
                        <option value={cartaoAtivo.id}>
                          {cartaoAtivo.nome}
                        </option>
                      </select>
                    </label>
                    <p className="text-xs text-[#9aa3c4]">
                      Fechamento dia{" "}
                      <strong>{cartaoAtivo.diaFechamento}</strong> · Vencimento
                      dia <strong>{cartaoAtivo.diaVencimento}</strong>
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-[#f3ca8d]">
                    Nenhum cartão ativo encontrado. Cadastre um cartão para
                    vincular compras.
                  </p>
                )}
              </div>
            )}

            <select
              className={`${fieldClassName} md:col-span-2`}
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
                className={`${fieldClassName} md:col-span-2`}
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
                className={`${fieldClassName} md:col-span-2`}
                value={km}
                onChange={(e) => setField("km", e.target.value)}
              />
            )}
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-[#3b4868] bg-[#1b2945] p-2 font-medium text-[#c4cbe4] transition-colors hover:bg-[#223255]"
            >
              Cancelar
            </button>
            <button
              aria-label="Cancelar ação"
              type="submit"
              className={`flex-1 rounded-lg p-2 font-medium text-white transition-colors ${
                isSimulation
                  ? "bg-[#c47b16] hover:bg-[#d08a2f]"
                  : editingId
                    ? "bg-[#c47b16] hover:bg-[#d08a2f]"
                    : "bg-[#1f8b63] hover:bg-[#28a373]"
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
