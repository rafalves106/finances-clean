import { useEffect, useState } from "react";
import { ChevronDown, ChevronUp, X } from "lucide-react";
import { API_CARTAO_URL, API_URL } from "../services/api";
import { formatDate } from "../util/formatDate";
import { useFocusTrap } from "../hooks/useFocusTrap";

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

const hasAdvancedData = (item) =>
  Boolean(item?.fixa || item?.cartaoId || item?.veiculoId);

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
  const [cartoes, setCartoes] = useState([]);
  const [loadingCartao, setLoadingCartao] = useState(false);
  const [validationError, setValidationError] = useState("");
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const { dialogRef, handleDialogKeyDown } = useFocusTrap(isOpen, onClose);
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
      setIsAdvancedOpen(hasAdvancedData(editingItem));
    } else {
      setForm({
        ...INITIAL_FORM,
        tipo: initialCardPurchaseMode ? "Saida" : INITIAL_FORM.tipo,
        vincularCartao: initialCardPurchaseMode,
      });
      setValidationError("");
      setIsAdvancedOpen(initialCardPurchaseMode);
    }
  }, [editingItem, initialCardPurchaseMode, isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const carregarCartoes = async () => {
      setLoadingCartao(true);
      try {
        const response = await fetch(`${API_CARTAO_URL}/resumos`, {
          credentials: "include",
        });
        if (!response.ok) {
          setCartoes([]);
          return;
        }
        const data = await response.json();
        const summaries = Array.isArray(data)
          ? data
          : Array.isArray(data?.resumos)
            ? data.resumos
            : [];
        const lista = summaries.filter((s) => s?.cartao).map((s) => s.cartao);

        setCartoes(lista);

        if (!editingItem && initialCardPurchaseMode && lista.length > 0) {
          setForm((prev) => ({
            ...prev,
            tipo: "Saida",
            vincularCartao: true,
            cartaoId: lista[0].id,
          }));
        }
      } catch {
        setCartoes([]);
      } finally {
        setLoadingCartao(false);
      }
    };

    carregarCartoes();
  }, [editingItem, initialCardPurchaseMode, isOpen]);

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
  const fieldStyle = {
    border: "1px solid var(--border-default)",
    background: "var(--bg-surface)",
    color: "var(--text-primary)",
  };
  const fieldClassName =
    "w-full rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2";
  const advancedActive = isFixed || vincularCartao || Boolean(veiculoId);

  return (
    <div className="fixed inset-0 z-50 bg-[rgba(18,20,28,0.55)] backdrop-blur-sm flex items-center justify-center p-4">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="transaction-modal-title"
        tabIndex={-1}
        onKeyDown={handleDialogKeyDown}
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl p-6"
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border-default)",
          boxShadow: "var(--shadow-modal)",
        }}
      >
        <div className="flex items-center justify-between mb-5">
          <h2
            id="transaction-modal-title"
            className="text-lg sm:text-xl font-semibold"
            style={{ color: "var(--text-primary)" }}
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
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg transition-colors"
            style={{
              border: "1px solid var(--border-default)",
              color: "var(--text-tertiary)",
            }}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {validationError ? (
            <div
              className="rounded-lg p-2 text-xs"
              style={{
                border: "1px solid var(--danger-border)",
                background: "var(--danger-100)",
                color: "var(--danger-700)",
              }}
            >
              {validationError}
            </div>
          ) : null}

          {/* Essencial: campos que cobrem a maioria dos lançamentos do dia a dia */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Título"
              className={fieldClassName}
              style={fieldStyle}
              value={name}
              onChange={(e) => setField("name", e.target.value)}
            />
            <input
              type="text"
              placeholder="Descrição"
              className={fieldClassName}
              style={fieldStyle}
              value={description}
              onChange={(e) => setField("description", e.target.value)}
            />
            <input
              type="date"
              className={fieldClassName}
              style={fieldStyle}
              value={date}
              onChange={(e) => setField("date", e.target.value)}
            />
            <input
              type="number"
              placeholder="Valor"
              className={fieldClassName}
              style={fieldStyle}
              value={value}
              onChange={(e) => setField("value", e.target.value)}
            />
            <select
              className={fieldClassName}
              style={fieldStyle}
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
            <select
              className={fieldClassName}
              style={fieldStyle}
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
          </div>

          {/* Avancado: recorrencia, cartao e veiculo - usado ocasionalmente */}
          <div
            className="rounded-lg"
            style={{ border: "1px solid var(--border-subtle)" }}
          >
            <button
              type="button"
              onClick={() => setIsAdvancedOpen((current) => !current)}
              className="w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium"
              style={{ color: "var(--text-secondary)" }}
            >
              <span>
                Mais opções
                {advancedActive ? " (em uso)" : ""}
              </span>
              {isAdvancedOpen ? (
                <ChevronUp size={16} />
              ) : (
                <ChevronDown size={16} />
              )}
            </button>

            {isAdvancedOpen && (
              <div
                className="px-3 pb-3 space-y-3"
                style={{ borderTop: "1px solid var(--border-subtle)" }}
              >
                <div className="flex items-center gap-2 px-1 pt-3">
                  <input
                    type="checkbox"
                    id="modal-isFixed"
                    className="h-4 w-4 rounded disabled:opacity-50"
                    style={{ accentColor: "var(--accent-600)" }}
                    checked={isFixed}
                    onChange={(e) => setField("isFixed", e.target.checked)}
                    disabled={editingId !== null}
                  />
                  <label
                    htmlFor="modal-isFixed"
                    className="text-sm font-medium"
                    style={{
                      color: editingId
                        ? "var(--text-disabled)"
                        : "var(--text-secondary)",
                    }}
                  >
                    É uma movimentação recorrente?{" "}
                    {editingId && "(Bloqueado na edição)"}
                  </label>
                </div>

                {isFixed && editingId === null && (
                  <div
                    className="flex flex-wrap items-center gap-4 px-3 py-2 rounded-lg"
                    style={{ background: "var(--bg-surface-sunken)" }}
                  >
                    <span
                      className="text-sm font-medium"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      Tipo da movimentação fixa:
                    </span>
                    <label
                      className="flex items-center gap-2 text-sm"
                      style={{ color: "var(--text-primary)" }}
                    >
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
                    <label
                      className="flex items-center gap-2 text-sm"
                      style={{ color: "var(--text-primary)" }}
                    >
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
                  <div
                    className="flex flex-wrap items-center gap-4 px-3 py-2 rounded-lg"
                    style={{ background: "var(--bg-surface-sunken)" }}
                  >
                    <span
                      className="text-sm font-medium"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      Tipo de recorrência:
                    </span>
                    <label
                      className="flex items-center gap-2 text-sm"
                      style={{ color: "var(--text-primary)" }}
                    >
                      <input
                        type="radio"
                        name="tipoRecorrencia"
                        value="Mensal"
                        checked={tipoRecorrencia === "Mensal"}
                        onChange={(e) =>
                          setField("tipoRecorrencia", e.target.value)
                        }
                      />
                      Mensal
                    </label>
                    <label
                      className="flex items-center gap-2 text-sm"
                      style={{ color: "var(--text-primary)" }}
                    >
                      <input
                        type="radio"
                        name="tipoRecorrencia"
                        value="Semanal"
                        checked={tipoRecorrencia === "Semanal"}
                        onChange={(e) =>
                          setField("tipoRecorrencia", e.target.value)
                        }
                      />
                      Semanal
                    </label>
                  </div>
                )}

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
                    style={fieldStyle}
                    value={period}
                    onChange={(e) => setField("period", e.target.value)}
                  />
                )}

                {tipo === "Saida" && (
                  <div
                    className="rounded-lg p-3 space-y-2"
                    style={{ background: "var(--bg-surface-sunken)" }}
                  >
                    <label
                      className="flex items-center gap-2 text-sm"
                      style={{ color: "var(--text-primary)" }}
                    >
                      <input
                        type="checkbox"
                        checked={vincularCartao}
                        disabled={cartoes.length === 0}
                        style={{ accentColor: "var(--accent-600)" }}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setField("vincularCartao", checked);
                          setField(
                            "cartaoId",
                            checked ? cartoes[0]?.id || null : null,
                          );
                        }}
                      />
                      Marcar como compra no cartão
                    </label>

                    {isCompraNoCartao ? (
                      <div
                        className="rounded-md px-2 py-1.5 text-xs"
                        style={{
                          border: "1px solid var(--success-border)",
                          background: "var(--success-100)",
                          color: "var(--success-700)",
                        }}
                      >
                        Use a data real da compra (não use a data de
                        vencimento). A competência e o vencimento são
                        calculados pelo ciclo do cartão.
                      </div>
                    ) : null}

                    {loadingCartao ? (
                      <p
                        className="text-xs"
                        style={{ color: "var(--text-tertiary)" }}
                      >
                        Carregando cartões...
                      </p>
                    ) : cartoes.length > 0 ? (
                      <div className="space-y-2">
                        <label
                          className="block text-xs"
                          style={{ color: "var(--text-secondary)" }}
                        >
                          Cartão selecionado
                          <select
                            className="mt-1 w-full rounded-md p-2 text-xs"
                            style={fieldStyle}
                            value={form.cartaoId || ""}
                            onChange={(e) =>
                              setField("cartaoId", e.target.value || null)
                            }
                          >
                            {cartoes.map((cartao) => (
                              <option key={cartao.id} value={cartao.id}>
                                {cartao.nome}
                              </option>
                            ))}
                          </select>
                        </label>
                        {(() => {
                          const selecionado =
                            cartoes.find(
                              (c) => String(c.id) === String(form.cartaoId),
                            ) || cartoes[0];
                          return selecionado ? (
                            <p
                              className="text-xs"
                              style={{ color: "var(--text-tertiary)" }}
                            >
                              Fechamento dia{" "}
                              <strong>{selecionado.diaFechamento}</strong> ·
                              Vencimento dia{" "}
                              <strong>{selecionado.diaVencimento}</strong>
                            </p>
                          ) : null;
                        })()}
                      </div>
                    ) : (
                      <p
                        className="text-xs"
                        style={{ color: "var(--warning-700)" }}
                      >
                        Nenhum cartão encontrado. Cadastre um cartão para
                        vincular compras.
                      </p>
                    )}
                  </div>
                )}

                {isTransporte && (
                  <select
                    className={fieldClassName}
                    style={fieldStyle}
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
                    className={fieldClassName}
                    style={fieldStyle}
                    value={km}
                    onChange={(e) => setField("km", e.target.value)}
                  />
                )}
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg p-2 font-medium transition-colors"
              style={{
                border: "1px solid var(--border-default)",
                color: "var(--text-secondary)",
              }}
            >
              Cancelar
            </button>
            <button
              aria-label="Cancelar ação"
              type="submit"
              className="flex-1 rounded-lg p-2 font-medium transition-colors"
              style={{
                background:
                  isSimulation || editingId
                    ? "var(--warning-700)"
                    : "var(--accent-600)",
                color: "var(--text-on-accent)",
              }}
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
