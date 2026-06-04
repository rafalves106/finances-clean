import { useEffect, useMemo, useState } from "react";

import { API_URL, API_VEICULOS_URL } from "../services/api";
import { getAuthHeaders } from "../services/auth";
import { formatCurrency } from "../util/formatCurrency";
import TransactionModal from "./TransactionModal";

import {
  AlertTriangle,
  ArrowDownCircle,
  ArrowUpCircle,
  Calendar,
  CheckCircle2,
  Edit3,
  Gauge,
  Plus,
  RefreshCw,
  Trash2,
} from "lucide-react";

const formInicial = {
  id: null,
  nome: "",
  marca: "",
  modelo: "",
  ano: "",
  placa: "",
  alertaKm: "",
};

const VehicleView = ({ veiculos = [], fetchVeiculos, categorias = [] }) => {
  const [veiculoSelecionadoId, setVeiculoSelecionadoId] = useState(null);
  const [todasMovimentacoes, setTodasMovimentacoes] = useState([]);
  const [formVeiculo, setFormVeiculo] = useState(formInicial);
  const [isEditingVeiculo, setIsEditingVeiculo] = useState(false);
  const [loadingMov, setLoadingMov] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (veiculos.length > 0 && !veiculoSelecionadoId) {
      setVeiculoSelecionadoId(veiculos[0].id);
    }
  }, [veiculos, veiculoSelecionadoId]);

  const veiculoSelecionado = useMemo(
    () =>
      veiculos.find((veiculo) => veiculo.id === veiculoSelecionadoId) || null,
    [veiculos, veiculoSelecionadoId],
  );

  const movimentacoesDoVeiculo = useMemo(() => {
    if (!veiculoSelecionado) return [];

    return [...todasMovimentacoes]
      .filter((item) => item.veiculoId === veiculoSelecionado.id)
      .sort((a, b) => new Date(b.data) - new Date(a.data));
  }, [todasMovimentacoes, veiculoSelecionado]);

  const kmAtualCalculado = useMemo(() => {
    const kms = movimentacoesDoVeiculo
      .map((item) => item.km)
      .filter((km) => km !== null && km !== undefined);

    if (kms.length === 0) return null;

    return Math.max(...kms);
  }, [movimentacoesDoVeiculo]);

  const kmAtual = veiculoSelecionado?.kmAtual ?? kmAtualCalculado;
  const totalGasto =
    veiculoSelecionado?.totalGasto ??
    movimentacoesDoVeiculo
      .filter((item) => item.tipo === "Saida")
      .reduce((acc, item) => acc + Number(item.valor || 0), 0);

  const alertaPendente =
    veiculoSelecionado != null &&
    kmAtual != null &&
    kmAtual - veiculoSelecionado.ultimoKmAlerta >= veiculoSelecionado.alertaKm;

  const kmParaRevisao =
    veiculoSelecionado && kmAtual != null
      ? kmAtual + veiculoSelecionado.alertaKm
      : null;

  const categoriaTransporte = useMemo(
    () =>
      categorias.find(
        (categoria) => categoria.nome?.toLowerCase() === "transporte",
      ),
    [categorias],
  );

  const buscarMovimentacoes = async () => {
    setLoadingMov(true);
    try {
      const response = await fetch(API_URL, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) throw new Error();

      const data = await response.json();
      setTodasMovimentacoes(data);
    } catch (error) {
      console.error("Erro ao carregar movimentações do veículo.", error);
    } finally {
      setLoadingMov(false);
    }
  };

  useEffect(() => {
    buscarMovimentacoes();
  }, []);

  const limparFormulario = () => {
    setFormVeiculo(formInicial);
    setIsEditingVeiculo(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      nome: formVeiculo.nome,
      marca: formVeiculo.marca,
      modelo: formVeiculo.modelo,
      ano: parseInt(formVeiculo.ano),
      placa: formVeiculo.placa,
      alertaKm: parseInt(formVeiculo.alertaKm),
    };

    const method = isEditingVeiculo ? "PUT" : "POST";
    const url = isEditingVeiculo
      ? `${API_VEICULOS_URL}/${formVeiculo.id}`
      : API_VEICULOS_URL;

    try {
      const response = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        limparFormulario();
        await fetchVeiculos?.();
        await buscarMovimentacoes();
      }
    } catch (error) {
      alert("Erro ao salvar veículo.", error);
    }
  };

  const editarVeiculo = (veiculo) => {
    setFormVeiculo({
      id: veiculo.id,
      nome: veiculo.nome || "",
      marca: veiculo.marca || "",
      modelo: veiculo.modelo || "",
      ano: veiculo.ano ? String(veiculo.ano) : "",
      placa: veiculo.placa || "",
      alertaKm: veiculo.alertaKm ? String(veiculo.alertaKm) : "",
    });
    setIsEditingVeiculo(true);
  };

  const deletarVeiculo = async (id) => {
    if (!window.confirm("Excluir este veículo?")) return;

    try {
      const response = await fetch(`${API_VEICULOS_URL}/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });

      if (response.ok) {
        if (veiculoSelecionadoId === id) {
          setVeiculoSelecionadoId(null);
        }
        await fetchVeiculos?.();
        await buscarMovimentacoes();
      }
    } catch (error) {
      alert("Erro ao deletar veículo.", error);
    }
  };

  const confirmarRevisao = async () => {
    if (!veiculoSelecionado || kmAtual == null) return;

    try {
      const response = await fetch(
        `${API_VEICULOS_URL}/${veiculoSelecionado.id}/alerta-km`,
        {
          method: "PATCH",
          headers: getAuthHeaders(),
          body: JSON.stringify({ km: kmAtual }),
        },
      );

      if (response.ok) {
        await fetchVeiculos?.();
      }
    } catch (error) {
      alert("Erro ao confirmar revisão.", error);
    }
  };

  if (veiculos.length === 0) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="rounded-2xl shadow-sm border border-[#2a3554] bg-[linear-gradient(145deg,rgba(18,24,40,0.98)_0%,rgba(16,22,38,0.96)_100%)] p-8 text-center">
          <div className="mx-auto mb-4 w-14 h-14 rounded-full bg-[#2f2330] text-[#f0ae8f] flex items-center justify-center">
            <Gauge size={28} />
          </div>
          <h2 className="text-xl font-bold text-[#dbe3ff] mb-2">
            Nenhum veículo cadastrado
          </h2>
          <p className="text-[#9f9cb9] mb-6">
            Cadastre o primeiro veículo para acompanhar revisões e gastos.
          </p>
          <button
            type="button"
            onClick={() =>
              document
                .getElementById("veiculo-form")
                ?.scrollIntoView({ behavior: "smooth" })
            }
            className="px-4 py-2 rounded-lg border border-[#6a5932] bg-[#4f4428] text-[#f9ddb0] font-medium hover:bg-[#5b4f2e] transition-colors"
          >
            Cadastrar primeiro veículo
          </button>
        </div>

        <div
          id="veiculo-form"
          className="rounded-2xl shadow-sm border border-[#2a3554] bg-[linear-gradient(145deg,rgba(18,24,40,0.98)_0%,rgba(16,22,38,0.96)_100%)] p-4"
        >
          <h3 className="font-bold text-[#f0ae8f] mb-4 flex items-center gap-2">
            <Plus size={18} /> Novo veículo
          </h3>
          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            <label htmlFor="vehicle-empty-nome" className="sr-only">
              Nome do veículo
            </label>
            <input
              id="vehicle-empty-nome"
              className="p-2 border border-[#2a3554] rounded-lg bg-[#10152d] text-[#dbe3ff] placeholder:text-[#7f84a8]"
              placeholder="Nome"
              value={formVeiculo.nome}
              onChange={(e) =>
                setFormVeiculo({ ...formVeiculo, nome: e.target.value })
              }
            />
            <label htmlFor="vehicle-empty-marca" className="sr-only">
              Marca do veículo
            </label>
            <input
              id="vehicle-empty-marca"
              className="p-2 border border-[#2a3554] rounded-lg bg-[#10152d] text-[#dbe3ff] placeholder:text-[#7f84a8]"
              placeholder="Marca"
              value={formVeiculo.marca}
              onChange={(e) =>
                setFormVeiculo({ ...formVeiculo, marca: e.target.value })
              }
            />
            <label htmlFor="vehicle-empty-modelo" className="sr-only">
              Modelo do veículo
            </label>
            <input
              id="vehicle-empty-modelo"
              className="p-2 border border-[#2a3554] rounded-lg bg-[#10152d] text-[#dbe3ff] placeholder:text-[#7f84a8]"
              placeholder="Modelo"
              value={formVeiculo.modelo}
              onChange={(e) =>
                setFormVeiculo({ ...formVeiculo, modelo: e.target.value })
              }
            />
            <label htmlFor="vehicle-empty-ano" className="sr-only">
              Ano do veículo
            </label>
            <input
              id="vehicle-empty-ano"
              className="p-2 border border-[#2a3554] rounded-lg bg-[#10152d] text-[#dbe3ff] placeholder:text-[#7f84a8]"
              type="number"
              placeholder="Ano"
              value={formVeiculo.ano}
              onChange={(e) =>
                setFormVeiculo({ ...formVeiculo, ano: e.target.value })
              }
            />
            <label htmlFor="vehicle-empty-placa" className="sr-only">
              Placa do veículo
            </label>
            <input
              id="vehicle-empty-placa"
              className="p-2 border border-[#2a3554] rounded-lg bg-[#10152d] text-[#dbe3ff] placeholder:text-[#7f84a8]"
              placeholder="Placa"
              value={formVeiculo.placa}
              onChange={(e) =>
                setFormVeiculo({ ...formVeiculo, placa: e.target.value })
              }
            />
            <label htmlFor="vehicle-empty-alerta-km" className="sr-only">
              Alerta de quilometragem
            </label>
            <input
              id="vehicle-empty-alerta-km"
              className="p-2 border border-[#2a3554] rounded-lg bg-[#10152d] text-[#dbe3ff] placeholder:text-[#7f84a8]"
              type="number"
              placeholder="Alerta Km"
              value={formVeiculo.alertaKm}
              onChange={(e) =>
                setFormVeiculo({ ...formVeiculo, alertaKm: e.target.value })
              }
            />
            <div className="md:col-span-2 flex gap-2">
              <button
                type="submit"
                className="px-4 py-2 rounded-lg border border-[#6a5932] bg-[#4f4428] text-[#f9ddb0] font-medium hover:bg-[#5b4f2e]"
              >
                Salvar
              </button>
              {isEditingVeiculo && (
                <button
                  type="button"
                  onClick={limparFormulario}
                  className="px-4 py-2 rounded-lg border border-[#2a3554] bg-[#151f34] text-[#b9bfd8] font-medium hover:bg-[#1a2842]"
                >
                  Cancelar
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="rounded-2xl shadow-sm border border-[#2a3554] bg-[linear-gradient(145deg,rgba(18,24,40,0.98)_0%,rgba(16,22,38,0.96)_100%)] p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-[#dbe3ff]">Veículos</h2>
            <p className="text-sm text-[#9f9cb9]">
              Selecione um veículo para ver alertas, custos e histórico.
            </p>
            <p className="text-xs text-[#7f84a8] mt-1">
              {categoriaTransporte
                ? `Movimentações vinculadas à categoria ${categoriaTransporte.nome}.`
                : "Cadastre a categoria Transporte para vincular quilometragem nas movimentações."}
            </p>
          </div>
          <div className="flex gap-2 items-center">
            <select
              className="p-2 border border-[#2a3554] rounded-lg min-w-72 bg-[#10152d] text-[#dbe3ff]"
              value={veiculoSelecionadoId || ""}
              onChange={(e) => setVeiculoSelecionadoId(e.target.value)}
            >
              {veiculos.map((veiculo) => (
                <option key={veiculo.id} value={veiculo.id}>
                  {veiculo.nome} — {veiculo.modelo} ({veiculo.ano})
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="px-3 py-2 rounded-lg border border-[#6a5932] bg-[#4f4428] text-[#f9ddb0] font-medium hover:bg-[#5b4f2e] flex items-center gap-2"
            >
              <Plus size={16} /> Nova Manutenção
            </button>
            <button
              type="button"
              onClick={buscarMovimentacoes}
              className="px-3 py-2 rounded-lg border border-[#2a3554] text-[#b9bfd8] hover:bg-[#1a2842] flex items-center gap-2"
            >
              <RefreshCw size={16} /> Atualizar
            </button>
          </div>
        </div>
      </div>

      {veiculoSelecionado && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl shadow-sm border border-[#2a3554] bg-[linear-gradient(145deg,rgba(18,24,40,0.98)_0%,rgba(16,22,38,0.96)_100%)]">
              <p className="text-sm text-[#9f9cb9] mb-1">Total gasto</p>
              <h3 className="text-2xl font-bold text-[#dbe3ff]">
                {formatCurrency(totalGasto)}
              </h3>
            </div>
            <div className="p-4 rounded-xl shadow-sm border border-[#2a3554] bg-[linear-gradient(145deg,rgba(18,24,40,0.98)_0%,rgba(16,22,38,0.96)_100%)]">
              <p className="text-sm text-[#9f9cb9] mb-1">Km atual</p>
              <h3 className="text-2xl font-bold text-[#dbe3ff]">
                {kmAtual != null ? kmAtual.toLocaleString("pt-BR") : "---"}
              </h3>
            </div>
            <div className="p-4 rounded-xl shadow-sm border border-[#2a3554] bg-[linear-gradient(145deg,rgba(18,24,40,0.98)_0%,rgba(16,22,38,0.96)_100%)]">
              <p className="text-sm text-[#9f9cb9] mb-1">Próxima revisão</p>
              <h3 className="text-2xl font-bold text-[#dbe3ff]">
                {kmParaRevisao != null
                  ? `${kmParaRevisao.toLocaleString("pt-BR")} km`
                  : "---"}
              </h3>
            </div>
            <div className="p-4 rounded-xl shadow-sm border border-[#2a3554] bg-[linear-gradient(145deg,rgba(18,24,40,0.98)_0%,rgba(16,22,38,0.96)_100%)] flex flex-col justify-between">
              <p className="text-sm text-[#9f9cb9] mb-2">Status</p>
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                    alertaPendente
                      ? "bg-red-100 text-red-700"
                      : "bg-emerald-100 text-emerald-700"
                  }`}
                >
                  {alertaPendente ? (
                    <AlertTriangle size={12} />
                  ) : (
                    <CheckCircle2 size={12} />
                  )}
                  {alertaPendente ? "Alerta pendente" : "Alerta ok"}
                </span>
                {alertaPendente && (
                  <button
                    type="button"
                    onClick={confirmarRevisao}
                    className="px-3 py-1.5 rounded-lg border border-[#6a5932] bg-[#4f4428] text-[#f9ddb0] text-sm font-medium hover:bg-[#5b4f2e]"
                  >
                    Confirmar revisão feita
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            <div className="lg:col-span-1">
              <div className="rounded-xl shadow-sm border border-[#2a3554] bg-[linear-gradient(145deg,rgba(18,24,40,0.98)_0%,rgba(16,22,38,0.96)_100%)] overflow-hidden sticky top-24">
                <div className="bg-[#131a33] p-4 border-b border-[#2a3554] flex justify-between items-center">
                  <h3 className="font-bold flex items-center gap-2 text-[#f0ae8f]">
                    {isEditingVeiculo ? (
                      <Edit3 size={18} />
                    ) : (
                      <Plus size={18} />
                    )}
                    {isEditingVeiculo ? "Editar veículo" : "Novo veículo"}
                  </h3>
                </div>
                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                  <label htmlFor="vehicle-main-nome" className="sr-only">
                    Nome do veículo
                  </label>
                  <input
                    id="vehicle-main-nome"
                    className="w-full p-2 border border-[#2a3554] rounded-lg bg-[#10152d] text-[#dbe3ff] placeholder:text-[#7f84a8]"
                    placeholder="Nome"
                    value={formVeiculo.nome}
                    onChange={(e) =>
                      setFormVeiculo({ ...formVeiculo, nome: e.target.value })
                    }
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <label htmlFor="vehicle-main-marca" className="sr-only">
                      Marca do veículo
                    </label>
                    <input
                      id="vehicle-main-marca"
                      className="w-full p-2 border border-[#2a3554] rounded-lg bg-[#10152d] text-[#dbe3ff] placeholder:text-[#7f84a8]"
                      placeholder="Marca"
                      value={formVeiculo.marca}
                      onChange={(e) =>
                        setFormVeiculo({
                          ...formVeiculo,
                          marca: e.target.value,
                        })
                      }
                    />
                    <label htmlFor="vehicle-main-modelo" className="sr-only">
                      Modelo do veículo
                    </label>
                    <input
                      id="vehicle-main-modelo"
                      className="w-full p-2 border border-[#2a3554] rounded-lg bg-[#10152d] text-[#dbe3ff] placeholder:text-[#7f84a8]"
                      placeholder="Modelo"
                      value={formVeiculo.modelo}
                      onChange={(e) =>
                        setFormVeiculo({
                          ...formVeiculo,
                          modelo: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <label htmlFor="vehicle-main-ano" className="sr-only">
                      Ano do veículo
                    </label>
                    <input
                      id="vehicle-main-ano"
                      className="w-full p-2 border border-[#2a3554] rounded-lg bg-[#10152d] text-[#dbe3ff] placeholder:text-[#7f84a8]"
                      type="number"
                      placeholder="Ano"
                      value={formVeiculo.ano}
                      onChange={(e) =>
                        setFormVeiculo({ ...formVeiculo, ano: e.target.value })
                      }
                    />
                    <label htmlFor="vehicle-main-placa" className="sr-only">
                      Placa do veículo
                    </label>
                    <input
                      id="vehicle-main-placa"
                      className="w-full p-2 border border-[#2a3554] rounded-lg bg-[#10152d] text-[#dbe3ff] placeholder:text-[#7f84a8]"
                      placeholder="Placa"
                      value={formVeiculo.placa}
                      onChange={(e) =>
                        setFormVeiculo({
                          ...formVeiculo,
                          placa: e.target.value,
                        })
                      }
                    />
                  </div>
                  <label htmlFor="vehicle-main-alerta-km" className="sr-only">
                    Alerta de quilometragem
                  </label>
                  <input
                    id="vehicle-main-alerta-km"
                    className="w-full p-2 border border-[#2a3554] rounded-lg bg-[#10152d] text-[#dbe3ff] placeholder:text-[#7f84a8]"
                    type="number"
                    placeholder="Alerta Km"
                    value={formVeiculo.alertaKm}
                    onChange={(e) =>
                      setFormVeiculo({
                        ...formVeiculo,
                        alertaKm: e.target.value,
                      })
                    }
                  />
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="flex-1 border border-[#6a5932] bg-[#4f4428] text-[#f9ddb0] py-2 rounded-lg font-bold hover:bg-[#5b4f2e] transition-colors"
                    >
                      {isEditingVeiculo ? "Atualizar" : "Registrar"}
                    </button>
                    {isEditingVeiculo && (
                      <button
                        type="button"
                        onClick={limparFormulario}
                        className="px-4 py-2 bg-[#151f34] border border-[#2a3554] text-[#b9bfd8] rounded-lg hover:bg-[#1a2842]"
                      >
                        Cancelar
                      </button>
                    )}
                  </div>
                </form>
              </div>
            </div>

            <div className="lg:col-span-2 space-y-6">
              <div className="rounded-xl shadow-sm border border-[#2a3554] bg-[linear-gradient(145deg,rgba(18,24,40,0.98)_0%,rgba(16,22,38,0.96)_100%)] overflow-hidden">
                <div className="p-4 border-b border-[#2a3554] flex justify-between items-center">
                  <h3 className="font-bold flex items-center gap-2 text-[#dbe3ff]">
                    <Calendar size={18} className="text-[#8f94b4]" /> Histórico
                    de movimentações
                  </h3>
                  <button
                    onClick={buscarMovimentacoes}
                    className="text-[#9ec2ff] text-sm font-medium hover:underline flex items-center gap-1"
                  >
                    <RefreshCw size={14} /> Atualizar
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-[#131a33] text-[10px] uppercase tracking-wider text-[#8f94b4] border-b border-[#2a3554]">
                        <th className="p-4 font-bold">Data</th>
                        <th className="p-4 font-bold">Título</th>
                        <th className="p-4 font-bold">Km</th>
                        <th className="p-4 font-bold">Valor</th>
                        <th className="p-4 font-bold">Tipo</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#202a4a] text-[#dbe3ff]">
                      {loadingMov ? (
                        <tr>
                          <td className="p-6 text-[#9f9cb9]" colSpan={5}>
                            Carregando histórico...
                          </td>
                        </tr>
                      ) : movimentacoesDoVeiculo.length > 0 ? (
                        movimentacoesDoVeiculo.map((item) => (
                          <tr
                            key={item.id}
                            className="hover:bg-[#141d36] transition-colors"
                          >
                            <td className="p-4 text-sm">
                              {new Date(item.data).toLocaleDateString("pt-BR")}
                            </td>
                            <td className="p-4">
                              <p className="font-medium text-[#dbe3ff]">
                                {item.titulo}
                              </p>
                              <p className="text-xs text-[#8f94b4]">
                                {item.descricao || "---"}
                              </p>
                            </td>
                            <td className="p-4 text-sm">
                              {item.km != null
                                ? item.km.toLocaleString("pt-BR")
                                : "---"}
                            </td>
                            <td className="p-4 text-sm font-semibold text-[#dbe3ff]">
                              {formatCurrency(item.valor)}
                            </td>
                            <td className="p-4">
                              <span
                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                                  item.tipo === "Entrada"
                                    ? "bg-emerald-100 text-emerald-700"
                                    : "bg-rose-100 text-rose-700"
                                }`}
                              >
                                {item.tipo === "Entrada" ? (
                                  <ArrowUpCircle size={12} />
                                ) : (
                                  <ArrowDownCircle size={12} />
                                )}
                                {item.tipo}
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td className="p-6 text-[#9f9cb9]" colSpan={5}>
                            Nenhuma movimentação vinculada a este veículo.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="rounded-xl shadow-sm border border-[#2a3554] bg-[linear-gradient(145deg,rgba(18,24,40,0.98)_0%,rgba(16,22,38,0.96)_100%)] overflow-hidden">
                <div className="p-4 border-b border-[#2a3554] flex justify-between items-center">
                  <h3 className="font-bold text-[#dbe3ff]">
                    Veículos cadastrados
                  </h3>
                </div>
                <div className="divide-y divide-[#202a4a]">
                  {veiculos.map((veiculo) => (
                    <div
                      key={veiculo.id}
                      className="p-4 flex items-center justify-between gap-4"
                    >
                      <button
                        type="button"
                        onClick={() => setVeiculoSelecionadoId(veiculo.id)}
                        className={`text-left flex-1 ${
                          veiculoSelecionadoId === veiculo.id
                            ? "text-[#f0ae8f]"
                            : "text-[#dbe3ff]"
                        }`}
                      >
                        <p className="font-bold">{veiculo.nome}</p>
                        <p className="text-sm text-[#9f9cb9]">
                          {veiculo.marca} • {veiculo.modelo} • {veiculo.ano}
                        </p>
                      </button>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => editarVeiculo(veiculo)}
                          aria-label={`Editar veículo ${veiculo.nome}`}
                          className="p-2 rounded-lg hover:bg-[#1a2842] text-[#8f94b4] hover:text-[#f0ae8f]"
                        >
                          <Edit3 size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => deletarVeiculo(veiculo.id)}
                          aria-label={`Excluir veículo ${veiculo.nome}`}
                          className="p-2 rounded-lg hover:bg-[#351e2a] text-[#8f94b4] hover:text-[#f08f9f]"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={async () => {
          await buscarMovimentacoes();
          await fetchVeiculos?.();
          setIsModalOpen(false);
        }}
        categorias={categorias}
        veiculos={veiculos}
        editingItem={{
          tipo: "Saida",
          categoriaId: categoriaTransporte?.id || "",
          veiculoId: veiculoSelecionadoId || "",
        }}
      />
    </div>
  );
};

export default VehicleView;
