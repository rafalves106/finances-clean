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
      <div className="rounded-2xl border border-[#39508a] bg-[radial-gradient(circle_at_14%_14%,rgba(113,145,242,0.22)_0%,rgba(46,60,105,0.16)_34%,rgba(18,25,47,0.94)_100%)] p-6 text-[#e7edff] shadow-[0_18px_44px_rgba(7,12,26,0.42)]">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Briefcase className="text-[#9ec2ff]" /> Calculadora de Esforço
        </h2>
        <div className="mt-4 flex flex-col md:flex-row gap-8">
          <div>
            <p className="text-[#9f9cb9] text-sm">Sua Renda Total</p>
            <p className="text-2xl font-bold">{formatCurrency(totalIncome)}</p>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-[#9f9cb9] text-sm">Horas trabalhadas/mês</p>
              <label htmlFor="wish-hours-per-month" className="sr-only">
                Horas trabalhadas por mês
              </label>
              <input
                id="wish-hours-per-month"
                type="number"
                className="w-16 text-[#dbe3ff] text-sm p-1 rounded border border-[#2a3554] bg-[#10152d]"
                value={workHoursPerMonth}
                onChange={(e) => setWorkHoursPerMonth(Number(e.target.value))}
              />
            </div>
            <p className="text-xs text-[#7f84a8] mt-1">
              (Padrão estágio: 120h)
            </p>
          </div>
          <div className="p-3 rounded-lg border border-[#4460a3] bg-[linear-gradient(135deg,rgba(53,76,134,0.7)_0%,rgba(24,34,63,0.9)_100%)]">
            <p className="text-[#b9bfd8] text-xs uppercase font-bold">
              Seu valor hora
            </p>
            <p className="text-2xl font-bold text-[#e7edff]">
              {formatCurrency(hourlyRate)}
              <span className="text-sm font-normal">/h</span>
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 p-6 rounded-2xl border border-[#2a3554] bg-[linear-gradient(145deg,rgba(18,24,40,0.98)_0%,rgba(16,22,38,0.96)_100%)] shadow-sm h-fit">
          <h3 className="font-bold mb-4 text-[#dbe3ff]">Adicionar Meta</h3>
          <form onSubmit={addWish} className="space-y-4">
            <label htmlFor="wish-name" className="sr-only">
              Nome da meta
            </label>
            <input
              id="wish-name"
              type="text"
              placeholder="Ex: Viagem"
              className="w-full p-2 border border-[#2a3554] rounded-lg bg-[#10152d] text-[#dbe3ff] placeholder:text-[#7f84a8]"
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
              className="w-full p-2 border border-[#2a3554] rounded-lg bg-[#10152d] text-[#dbe3ff] placeholder:text-[#7f84a8]"
              value={wishPrice}
              onChange={(e) => setWishPrice(e.target.value)}
            />
            <button className="w-full border border-[#2f4566] bg-[#151f34] text-[#9ec2ff] py-2 rounded-lg font-medium hover:bg-[#1a2842] transition-colors">
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
                className="p-4 rounded-2xl border border-[#2a3554] bg-[linear-gradient(145deg,rgba(18,24,40,0.98)_0%,rgba(16,22,38,0.96)_100%)] shadow-sm flex flex-col md:flex-row items-center justify-between gap-4"
              >
                <div className="flex-1">
                  <h4 className="font-bold text-lg text-[#dbe3ff]">
                    {wish.name}
                  </h4>
                  <p className="text-[#9f9cb9] font-medium">
                    {formatCurrency(wish.price)}
                  </p>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-xs text-[#7f84a8] uppercase font-bold">
                      Custo em Tempo
                    </p>
                    <div className="flex items-center gap-2 text-[#9ec2ff] font-bold text-xl">
                      <Clock size={20} />
                      {formatHours(hoursNeeded)}
                    </div>
                    <p className="text-xs text-[#7f84a8]">
                      ~{daysNeeded.toFixed(1)} dias de trabalho
                    </p>
                  </div>
                  <button
                    onClick={() => deleteWish(wish.id)}
                    aria-label={`Excluir meta ${wish.name}`}
                    className="text-[#8f94b4] hover:text-[#f08f9f]"
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
