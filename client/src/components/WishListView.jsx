import { useEffect, useState } from "react";

import { Trash2, Clock, Briefcase } from "lucide-react";

import { API_METAS_URL } from "../services/api";
import { getAuthHeaders } from "../services/auth";

import { formatCurrency } from "../util/formatCurrency";
import { formatHours } from "../util/formatHours";

const WishListView = ({
  totalIncome,
  hourlyRate,
  workHoursPerMonth,
  setWorkHoursPerMonth,
}) => {
  const [wishes, setWishes] = useState([]);
  const [wishName, setWishName] = useState("");
  const [wishPrice, setWishPrice] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const fetchMetas = async () => {
      try {
        const res = await fetch(API_METAS_URL, { headers: getAuthHeaders() });
        if (res.ok) {
          const data = await res.json();
          setWishes(
            data.map((m) => ({ id: m.id, name: m.descricao, price: m.valor })),
          );
        }
      } catch (e) {
        console.error(e);
      }
    };

    fetchMetas();
  }, [refreshKey]);

  const addWish = async (e) => {
    e.preventDefault();
    if (!wishName || !wishPrice) return;

    const novaMeta = {
      descricao: wishName,
      valor: parseFloat(wishPrice),
    };

    try {
      const res = await fetch(API_METAS_URL, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(novaMeta),
      });

      if (res.ok) {
        setRefreshKey((prev) => prev + 1);
        setWishName("");
        setWishPrice("");
      } else {
        console.error("Erro ao salvar meta no servidor.");
      }
    } catch (e) {
      console.error("Erro ao adicionar meta:", e);
    }
  };

  const deleteWish = async (id) => {
    try {
      await fetch(`${API_METAS_URL}/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      setWishes(wishes.filter((w) => w.id !== id));
    } catch (err) {
      console.error("Erro ao deletar meta:", err);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-6 text-[var(--text-primary)] shadow-sm">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Briefcase className="text-[var(--accent-600)]" /> Calculadora de Esforço
        </h2>
        <div className="mt-4 flex flex-col md:flex-row gap-8">
          <div>
            <p className="text-[var(--text-secondary)] text-sm">Sua Renda Total</p>
            <p className="text-2xl font-bold">{formatCurrency(totalIncome)}</p>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-[var(--text-secondary)] text-sm">Horas trabalhadas/mês</p>
              <label htmlFor="wish-hours-per-month" className="sr-only">
                Horas trabalhadas por mês
              </label>
              <input
                id="wish-hours-per-month"
                type="number"
                className="w-16 text-[var(--text-primary)] text-sm p-1 rounded border border-[var(--border-default)] bg-[var(--bg-surface-sunken)]"
                value={workHoursPerMonth}
                onChange={(e) => setWorkHoursPerMonth(Number(e.target.value))}
              />
            </div>
            <p className="text-xs text-[var(--text-tertiary)] mt-1">
              (Padrão estágio: 120h)
            </p>
          </div>
          <div className="p-3 rounded-lg border border-[var(--accent-100)] bg-[var(--accent-50)]">
            <p className="text-[var(--text-secondary)] text-xs uppercase font-bold">
              Seu valor hora
            </p>
            <p className="text-2xl font-bold text-[var(--text-primary)]">
              {formatCurrency(hourlyRate)}
              <span className="text-sm font-normal">/h</span>
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 p-6 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] shadow-sm h-fit">
          <h3 className="font-bold mb-4 text-[var(--text-primary)]">Adicionar Meta</h3>
          <form onSubmit={addWish} className="space-y-4">
            <label htmlFor="wish-name" className="sr-only">
              Nome da meta
            </label>
            <input
              id="wish-name"
              type="text"
              placeholder="Ex: Viagem"
              className="w-full p-2 border border-[var(--border-default)] rounded-lg bg-[var(--bg-surface-sunken)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)]"
              value={wishName}
              onChange={(e) => setWishName(e.target.value)}
            />
            <label htmlFor="wish-price" className="sr-only">
              Preço da meta
            </label>
            <input
              id="wish-price"
              type="number"
              placeholder="Preço (R$)"
              className="w-full p-2 border border-[var(--border-default)] rounded-lg bg-[var(--bg-surface-sunken)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)]"
              value={wishPrice}
              onChange={(e) => setWishPrice(e.target.value)}
            />
            <button className="w-full border border-[var(--border-default)] bg-[var(--bg-surface-sunken)] text-[var(--accent-600)] py-2 rounded-lg font-medium hover:bg-[var(--bg-surface-sunken)] transition-colors">
              Adicionar à Lista
            </button>
          </form>
        </div>

        <div className="md:col-span-2 space-y-4">
          {wishes.map((wish) => {
            const hoursNeeded = hourlyRate > 0 ? wish.price / hourlyRate : 0;
            const daysNeeded = hoursNeeded / 6;

            return (
              <div
                key={wish.id}
                className="p-4 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] shadow-sm flex flex-col md:flex-row items-center justify-between gap-4"
              >
                <div className="flex-1">
                  <h4 className="font-bold text-lg text-[var(--text-primary)]">
                    {wish.name}
                  </h4>
                  <p className="text-[var(--text-secondary)] font-medium">
                    {formatCurrency(wish.price)}
                  </p>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-xs text-[var(--text-tertiary)] uppercase font-bold">
                      Custo em Tempo
                    </p>
                    <div className="flex items-center gap-2 text-[var(--accent-600)] font-bold text-xl">
                      <Clock size={20} />
                      {formatHours(hoursNeeded)}
                    </div>
                    <p className="text-xs text-[var(--text-tertiary)]">
                      ~{daysNeeded.toFixed(1)} dias de trabalho
                    </p>
                  </div>
                  <button
                    onClick={() => deleteWish(wish.id)}
                    aria-label={`Excluir meta ${wish.name}`}
                    className="text-[var(--text-tertiary)] hover:text-[var(--danger-700)]"
                  >
                    <Trash2 />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default WishListView;
