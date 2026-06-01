import { useCallback, useEffect, useMemo, useState } from "react";
import { API_CARTAO_URL, extractApiErrorMessage } from "../services/api";
import { getAuthHeaders } from "../services/auth";
import { formatCurrency } from "../util/formatCurrency";

const INITIAL_FORM = {
  nome: "",
  limiteTotal: "",
  diaFechamento: "",
  diaVencimento: "",
};

const CardViewerView = () => {
  const [resumo, setResumo] = useState(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const preencherForm = (cartao) => {
    setForm({
      nome: cartao.nome || "",
      limiteTotal: String(cartao.limiteTotal ?? ""),
      diaFechamento: String(cartao.diaFechamento ?? ""),
      diaVencimento: String(cartao.diaVencimento ?? ""),
    });
  };

  const carregarResumo = useCallback(async () => {
    setLoading(true);
    setErrorMessage("");

    try {
      const response = await fetch(`${API_CARTAO_URL}/resumo`, {
        headers: getAuthHeaders(),
      });

      if (response.status === 404) {
        setResumo(null);
        setForm(INITIAL_FORM);
        return;
      }

      if (!response.ok) {
        const message = await extractApiErrorMessage(
          response,
          "Não foi possível carregar o cartão.",
        );
        setErrorMessage(message);
        return;
      }

      const data = await response.json();
      setResumo(data);
      preencherForm(data.cartao);
    } catch {
      setErrorMessage("Falha de conexão ao carregar dados do cartão.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregarResumo();
  }, [carregarResumo]);

  const payload = useMemo(
    () => ({
      nome: form.nome.trim(),
      limiteTotal: Number(form.limiteTotal),
      diaFechamento: Number(form.diaFechamento),
      diaVencimento: Number(form.diaVencimento),
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

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!isFormValid) {
      setErrorMessage("Preencha os dados do cartão corretamente.");
      return;
    }

    setSaving(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const endpoint =
        editing && resumo?.cartao?.id
          ? `${API_CARTAO_URL}/${resumo.cartao.id}`
          : API_CARTAO_URL;

      const method = editing ? "PUT" : "POST";

      const response = await fetch(endpoint, {
        method,
        headers: {
          ...getAuthHeaders(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const fallback = editing
          ? "Não foi possível atualizar o cartão."
          : "Não foi possível cadastrar o cartão.";
        const message = await extractApiErrorMessage(response, fallback);
        setErrorMessage(message);
        return;
      }

      setSuccessMessage(
        editing
          ? "Cartão atualizado com sucesso."
          : "Cartão cadastrado com sucesso.",
      );
      setEditing(false);
      await carregarResumo();
    } catch {
      setErrorMessage("Falha de conexão ao salvar cartão.");
    } finally {
      setSaving(false);
    }
  };

  const handleInativar = async () => {
    if (!resumo?.cartao?.id) {
      return;
    }

    setSaving(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const response = await fetch(`${API_CARTAO_URL}/${resumo.cartao.id}`, {
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

      setSuccessMessage(
        "Cartão inativado. Cadastre um novo cartão para continuar.",
      );
      setResumo(null);
      setEditing(false);
      setForm(INITIAL_FORM);
    } catch {
      setErrorMessage("Falha de conexão ao inativar cartão.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="space-y-5">
      <div className="rounded-2xl border border-teal-100 bg-teal-50 p-4 text-sm text-teal-900">
        Este módulo é manual e não possui integração bancária. Cadastre compras
        no app para manter limite e previsão atualizados.
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
          Carregando dados do cartão...
        </div>
      ) : (
        <>
          {!resumo ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-3">
              <h2 className="text-lg font-semibold text-slate-800">
                Cadastre seu cartão manual
              </h2>
              <p className="text-sm text-slate-600">
                Você ainda não possui cartão ativo. Preencha os dados básicos
                para começar a acompanhar limite e fatura.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  Limite utilizado
                </p>
                <p className="mt-1 text-2xl font-bold text-slate-800">
                  {formatCurrency(resumo.limite.utilizado || 0)}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  Limite disponível
                </p>
                <p className="mt-1 text-2xl font-bold text-emerald-700">
                  {formatCurrency(resumo.limite.disponivel || 0)}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  Uso do limite
                </p>
                <p className="mt-1 text-2xl font-bold text-slate-800">
                  {Number(resumo.limite.percentualUso || 0).toFixed(2)}%
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  Fatura atual / próxima
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-700">
                  {formatCurrency(resumo.previsaoFatura.atual || 0)} /{" "}
                  {formatCurrency(resumo.previsaoFatura.proxima || 0)}
                </p>
              </div>
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4"
          >
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-lg font-semibold text-slate-800">
                {resumo
                  ? editing
                    ? "Editar cartão"
                    : "Cartão cadastrado"
                  : "Novo cartão"}
              </h3>

              {resumo && !editing ? (
                <button
                  type="button"
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  onClick={() => setEditing(true)}
                >
                  Editar
                </button>
              ) : null}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="space-y-1 text-sm text-slate-700">
                <span>Nome do cartão</span>
                <input
                  type="text"
                  className="w-full rounded-lg border border-slate-300 p-2"
                  value={form.nome}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, nome: event.target.value }))
                  }
                  disabled={Boolean(resumo) && !editing}
                  maxLength={100}
                />
              </label>

              <label className="space-y-1 text-sm text-slate-700">
                <span>Limite total</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="w-full rounded-lg border border-slate-300 p-2"
                  value={form.limiteTotal}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      limiteTotal: event.target.value,
                    }))
                  }
                  disabled={Boolean(resumo) && !editing}
                />
              </label>

              <label className="space-y-1 text-sm text-slate-700">
                <span>Dia de fechamento</span>
                <input
                  type="number"
                  min="1"
                  max="31"
                  className="w-full rounded-lg border border-slate-300 p-2"
                  value={form.diaFechamento}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      diaFechamento: event.target.value,
                    }))
                  }
                  disabled={Boolean(resumo) && !editing}
                />
              </label>

              <label className="space-y-1 text-sm text-slate-700">
                <span>Dia de vencimento</span>
                <input
                  type="number"
                  min="1"
                  max="31"
                  className="w-full rounded-lg border border-slate-300 p-2"
                  value={form.diaVencimento}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      diaVencimento: event.target.value,
                    }))
                  }
                  disabled={Boolean(resumo) && !editing}
                />
              </label>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {(!resumo || editing) && (
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-70"
                >
                  {saving
                    ? "Salvando..."
                    : resumo
                      ? "Salvar alterações"
                      : "Cadastrar cartão"}
                </button>
              )}

              {resumo && editing ? (
                <button
                  type="button"
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  onClick={() => {
                    preencherForm(resumo.cartao);
                    setEditing(false);
                    setErrorMessage("");
                  }}
                >
                  Cancelar edição
                </button>
              ) : null}

              {resumo ? (
                <button
                  type="button"
                  onClick={handleInativar}
                  disabled={saving}
                  className="rounded-lg border border-rose-300 px-4 py-2 text-sm font-medium text-rose-700 hover:bg-rose-50 disabled:opacity-70"
                >
                  Inativar cartão
                </button>
              ) : null}
            </div>
          </form>
        </>
      )}
    </section>
  );
};

export default CardViewerView;
