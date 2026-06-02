import { useCallback, useEffect, useMemo, useState } from "react";
import { API_CARTAO_URL, extractApiErrorMessage } from "../services/api";
import { getAuthHeaders } from "../services/auth";
import { formatCurrency } from "../util/formatCurrency";

const QUICK_COLORS = [
  "#271815",
  "#1E293B",
  "#14532D",
  "#3F2B27",
  "#1F2937",
  "#7C2D12",
  "#0F766E",
  "#581C87",
];

const INITIAL_FORM = {
  nome: "",
  limiteTotal: "",
  diaFechamento: "",
  diaVencimento: "",
  corTema: "#271815",
};

const normalizeColor = (value) => {
  if (!value || typeof value !== "string") {
    return "#271815";
  }

  const trimmed = value.trim();
  if (/^#[0-9A-Fa-f]{6}$/.test(trimmed)) {
    return trimmed.toUpperCase();
  }

  return "#271815";
};

const mapCardToForm = (card) => ({
  nome: card.nome || "",
  limiteTotal: String(card.limiteTotal ?? ""),
  diaFechamento: String(card.diaFechamento ?? ""),
  diaVencimento: String(card.diaVencimento ?? ""),
  corTema: normalizeColor(card.corTema),
});

const CardViewerView = ({ onCardsChanged }) => {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCardId, setEditingCardId] = useState(null);
  const [form, setForm] = useState(INITIAL_FORM);

  const loadCards = useCallback(async () => {
    setLoading(true);
    setErrorMessage("");

    try {
      const response = await fetch(`${API_CARTAO_URL}?incluirInativos=true`, {
        method: "GET",
        headers: getAuthHeaders(),
      });

      if (response.ok) {
        const data = await response.json();
        setCards(Array.isArray(data) ? data : []);
        return;
      }

      if (response.status === 404) {
        setCards([]);
        return;
      }

      if (response.status === 405) {
        const fallback = await fetch(`${API_CARTAO_URL}/resumos`, {
          method: "GET",
          headers: getAuthHeaders(),
        });

        if (fallback.ok) {
          const data = await fallback.json();
          const fallbackCards = Array.isArray(data)
            ? data.map((item) => item?.cartao).filter(Boolean)
            : [];
          setCards(fallbackCards);
          return;
        }
      }

      const message = await extractApiErrorMessage(
        response,
        "Não foi possível carregar os cartões.",
      );
      setErrorMessage(message);
      setCards([]);
    } catch {
      setErrorMessage("Falha de conexão ao carregar cartões.");
      setCards([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCards();
  }, [loadCards]);

  const activeCards = useMemo(
    () => cards.filter((card) => card?.ativo),
    [cards],
  );
  const inactiveCards = useMemo(
    () => cards.filter((card) => !card?.ativo),
    [cards],
  );

  const isEditing = Boolean(editingCardId);
  const activeLimitReached = activeCards.length >= 3;

  const payload = useMemo(
    () => ({
      nome: form.nome.trim(),
      limiteTotal: Number(form.limiteTotal),
      diaFechamento: Number(form.diaFechamento),
      diaVencimento: Number(form.diaVencimento),
      corTema: form.corTema?.trim() ? normalizeColor(form.corTema) : null,
    }),
    [form],
  );

  const isFormValid =
    payload.nome.length > 0 &&
    payload.limiteTotal > 0 &&
    payload.diaFechamento >= 1 &&
    payload.diaFechamento <= 31 &&
    payload.diaVencimento >= 1 &&
    payload.diaVencimento <= 31;

  const openCreateForm = () => {
    setEditingCardId(null);
    setForm(INITIAL_FORM);
    setIsFormOpen(true);
    setErrorMessage("");
    setSuccessMessage("");
  };

  const openEditForm = (card) => {
    setEditingCardId(card.id);
    setForm(mapCardToForm(card));
    setIsFormOpen(true);
    setErrorMessage("");
    setSuccessMessage("");
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingCardId(null);
    setForm(INITIAL_FORM);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!isFormValid) {
      setErrorMessage("Preencha os dados do cartão corretamente.");
      return;
    }

    if (!isEditing && activeLimitReached) {
      setErrorMessage(
        "Você já possui 3 cartões ativos. Inative um cartão para cadastrar outro.",
      );
      return;
    }

    setSaving(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const endpoint = isEditing
        ? `${API_CARTAO_URL}/${editingCardId}`
        : API_CARTAO_URL;

      const method = isEditing ? "PUT" : "POST";

      const response = await fetch(endpoint, {
        method,
        headers: {
          ...getAuthHeaders(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const fallback = isEditing
          ? "Não foi possível atualizar o cartão."
          : "Não foi possível cadastrar o cartão.";
        const message = await extractApiErrorMessage(response, fallback);
        setErrorMessage(message);
        return;
      }

      setSuccessMessage(
        isEditing
          ? "Cartão atualizado com sucesso."
          : "Cartão cadastrado com sucesso.",
      );
      closeForm();
      await loadCards();
      await onCardsChanged?.();
    } catch {
      setErrorMessage("Falha de conexão ao salvar cartão.");
    } finally {
      setSaving(false);
    }
  };

  const handleInactivate = async (card) => {
    const confirmed = window.confirm(
      `Deseja inativar o cartão "${card.nome}"?`,
    );

    if (!confirmed) {
      return;
    }

    setSaving(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const response = await fetch(`${API_CARTAO_URL}/${card.id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        const message = await extractApiErrorMessage(
          response,
          "Não foi possível inativar o cartão.",
        );
        setErrorMessage(message);
        return;
      }

      setSuccessMessage("Cartão inativado com sucesso.");
      await loadCards();
      await onCardsChanged?.();
    } catch {
      setErrorMessage("Falha de conexão ao inativar cartão.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="space-y-5">
      <div className="rounded-2xl border border-teal-100 bg-teal-50 p-4 text-sm text-teal-900">
        Gestão completa de cartões manuais. Você pode criar, editar, inativar e
        personalizar cor tema. Limite máximo: 3 cartões ativos por usuário.
      </div>

      {errorMessage ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {errorMessage}
        </div>
      ) : null}

      {successMessage ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {successMessage}
        </div>
      ) : null}

      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
          Carregando cartões...
        </div>
      ) : (
        <>
          <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-800">
                  Cartões ativos
                </h2>
                <p className="text-sm text-slate-500">
                  {activeCards.length}/3 ativos
                </p>
              </div>

              <button
                type="button"
                onClick={openCreateForm}
                disabled={saving}
                className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-60"
              >
                Novo cartão
              </button>
            </div>

            {activeCards.length === 0 ? (
              <p className="text-sm text-slate-600">
                Nenhum cartão ativo. Cadastre o primeiro cartão para começar.
              </p>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {activeCards.map((card) => (
                  <article
                    key={card.id}
                    className="rounded-xl border border-slate-200 p-4"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="text-base font-semibold text-slate-800">
                          {card.nome}
                        </h3>
                        <p className="text-sm text-slate-600">
                          Limite: {formatCurrency(card.limiteTotal || 0)}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          Fechamento{" "}
                          {String(card.diaFechamento || "-").padStart(2, "0")} ·
                          Vencimento{" "}
                          {String(card.diaVencimento || "-").padStart(2, "0")}
                        </p>
                      </div>

                      <span
                        className="inline-block h-4 w-4 rounded-full border border-slate-300"
                        style={{
                          backgroundColor: normalizeColor(card.corTema),
                        }}
                        title={`Cor tema ${normalizeColor(card.corTema)}`}
                      />
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => openEditForm(card)}
                        className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleInactivate(card)}
                        disabled={saving}
                        className="rounded-md border border-rose-300 px-3 py-1.5 text-sm font-medium text-rose-700 hover:bg-rose-50 disabled:opacity-60"
                      >
                        Inativar
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}

            {inactiveCards.length > 0 ? (
              <div className="pt-3 border-t border-slate-200">
                <h3 className="text-sm font-semibold text-slate-700 mb-2">
                  Cartões inativos
                </h3>
                <div className="grid gap-2 md:grid-cols-2">
                  {inactiveCards.map((card) => (
                    <div
                      key={card.id}
                      className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
                    >
                      <p className="text-sm font-medium text-slate-700">
                        {card.nome}
                      </p>
                      <p className="text-xs text-slate-500">
                        Limite {formatCurrency(card.limiteTotal || 0)} · Fech{" "}
                        {String(card.diaFechamento || "-").padStart(2, "0")} ·
                        Venc{" "}
                        {String(card.diaVencimento || "-").padStart(2, "0")}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          {isFormOpen ? (
            <form
              onSubmit={handleSubmit}
              className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4"
            >
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-lg font-semibold text-slate-800">
                  {isEditing ? "Editar cartão" : "Novo cartão"}
                </h3>
                <button
                  type="button"
                  className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  onClick={closeForm}
                >
                  Fechar
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="space-y-1 text-sm text-slate-700">
                  <span>Nome do cartão</span>
                  <input
                    type="text"
                    value={form.nome}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, nome: event.target.value }))
                    }
                    className="w-full rounded-lg border border-slate-300 p-2"
                    maxLength={100}
                  />
                </label>

                <label className="space-y-1 text-sm text-slate-700">
                  <span>Limite total</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.limiteTotal}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        limiteTotal: event.target.value,
                      }))
                    }
                    className="w-full rounded-lg border border-slate-300 p-2"
                  />
                </label>

                <label className="space-y-1 text-sm text-slate-700">
                  <span>Dia de fechamento</span>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={form.diaFechamento}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        diaFechamento: event.target.value,
                      }))
                    }
                    className="w-full rounded-lg border border-slate-300 p-2"
                  />
                </label>

                <label className="space-y-1 text-sm text-slate-700">
                  <span>Dia de vencimento</span>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={form.diaVencimento}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        diaVencimento: event.target.value,
                      }))
                    }
                    className="w-full rounded-lg border border-slate-300 p-2"
                  />
                </label>
              </div>

              <div className="space-y-2">
                <p className="text-sm text-slate-700">Cor tema</p>
                <div className="flex flex-wrap items-center gap-2">
                  {QUICK_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      className="h-7 w-7 rounded-full border border-slate-300"
                      style={{ backgroundColor: color }}
                      onClick={() =>
                        setForm((prev) => ({ ...prev, corTema: color }))
                      }
                      aria-label={`Selecionar cor ${color}`}
                    />
                  ))}

                  <input
                    type="color"
                    value={normalizeColor(form.corTema)}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        corTema: event.target.value,
                      }))
                    }
                    className="h-8 w-10 rounded border border-slate-300"
                    aria-label="Selecionar cor personalizada"
                  />
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 p-4">
                <p className="text-xs text-slate-500 uppercase tracking-wide">
                  Preview
                </p>
                <div
                  className="mt-2 rounded-xl border border-slate-300 px-4 py-3 text-white"
                  style={{ backgroundColor: normalizeColor(form.corTema) }}
                >
                  <p className="text-sm font-medium truncate">
                    {form.nome.trim() || "Nome do cartão"}
                  </p>
                  <p className="text-xs opacity-90 mt-1">
                    Limite {formatCurrency(Number(form.limiteTotal) || 0)}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="submit"
                  disabled={saving || !isFormValid}
                  className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-60"
                >
                  {saving
                    ? "Salvando..."
                    : isEditing
                      ? "Salvar alterações"
                      : "Cadastrar cartão"}
                </button>

                {activeLimitReached && !isEditing ? (
                  <p className="text-xs text-amber-700">
                    Limite de 3 cartões ativos atingido.
                  </p>
                ) : null}
              </div>
            </form>
          ) : null}
        </>
      )}
    </section>
  );
};

export default CardViewerView;
