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
      <div className="bg-indigo-600 text-white p-6 rounded-xl shadow-lg">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Briefcase className="text-indigo-200" /> Calculadora de Esforço
        </h2>
        <div className="mt-4 flex flex-col md:flex-row gap-8">
          <div>
            <p className="text-indigo-200 text-sm">Sua Renda Total</p>
            <p className="text-2xl font-bold">{formatCurrency(totalIncome)}</p>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-indigo-200 text-sm">Horas trabalhadas/mês</p>
              <input
                type="number"
                className="w-16 text-black text-sm p-1 rounded"
                value={workHoursPerMonth}
                onChange={(e) => setWorkHoursPerMonth(Number(e.target.value))}
              />
            </div>
            <p className="text-xs text-indigo-300 mt-1">
              (Padrão estágio: 120h)
            </p>
          </div>
          <div className="bg-indigo-800 p-3 rounded-lg border border-indigo-500">
            <p className="text-indigo-200 text-xs uppercase font-bold">
              Seu valor hora
            </p>
            <p className="text-2xl font-bold text-white">
              {formatCurrency(hourlyRate)}
              <span className="text-sm font-normal">/h</span>
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-fit">
          <h3 className="font-bold mb-4">Adicionar Meta</h3>
          <form onSubmit={addWish} className="space-y-4">
            <input
              type="text"
              placeholder="Ex: Viagem"
              className="w-full p-2 border rounded-lg"
              value={wishName}
              onChange={(e) => setWishName(e.target.value)}
            />
            <input
              type="number"
              placeholder="Preço (R$)"
              className="w-full p-2 border rounded-lg"
              value={wishPrice}
              onChange={(e) => setWishPrice(e.target.value)}
            />
            <button className="w-full bg-indigo-600 text-white py-2 rounded-lg font-medium hover:bg-indigo-700">
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
                className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4"
              >
                <div className="flex-1">
                  <h4 className="font-bold text-lg">{wish.name}</h4>
                  <p className="text-slate-500 font-medium">
                    {formatCurrency(wish.price)}
                  </p>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-xs text-slate-400 uppercase font-bold">
                      Custo em Tempo
                    </p>
                    <div className="flex items-center gap-2 text-indigo-700 font-bold text-xl">
                      <Clock size={20} />
                      {formatHours(hoursNeeded)}
                    </div>
                    <p className="text-xs text-slate-400">
                      ~{daysNeeded.toFixed(1)} dias de trabalho
                    </p>
                  </div>
                  <button
                    onClick={() => deleteWish(wish.id)}
                    className="text-slate-300 hover:text-red-500"
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
