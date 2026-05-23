import { useEffect, useState } from "react";
import { Pencil, Trash2, X } from "lucide-react";

import { API_CATEGORIAS_URL } from "../services/api";
import { getAuthHeaders } from "../services/auth";

const CategoryManagerModal = ({
  isOpen,
  onClose,
  categorias,
  onCategoriasChange,
}) => {
  const [editingCat, setEditingCat] = useState(null);
  const [formNome, setFormNome] = useState("");
  const [formIcone, setFormIcone] = useState("");
  const [formCor, setFormCor] = useState("#94a3b8");

  const clearForm = () => {
    setEditingCat(null);
    setFormNome("");
    setFormIcone("");
    setFormCor("#94a3b8");
  };

  useEffect(() => {
    if (!isOpen) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    clearForm();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleEdit = (category) => {
    setEditingCat({
      id: category.id,
      nome: category.nome,
      icone: category.icone || "",
      cor: category.cor || "#94a3b8",
    });
    setFormNome(category.nome || "");
    setFormIcone(category.icone || "");
    setFormCor(category.cor || "#94a3b8");
  };

  const handleDelete = async (id) => {
    try {
      const response = await fetch(`${API_CATEGORIAS_URL}/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });

      if (response.ok) {
        clearForm();
        onCategoriasChange();
      }
    } catch (err) {
      console.error("Erro ao deletar categoria:", err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formNome.trim()) return;
    if (formIcone && formIcone.length > 2) return;

    const payload = {
      nome: formNome.trim(),
      icone: formIcone.trim() || null,
      cor: formCor || "#94a3b8",
    };

    try {
      const response = editingCat
        ? await fetch(`${API_CATEGORIAS_URL}/${editingCat.id}`, {
            method: "PUT",
            headers: getAuthHeaders(),
            body: JSON.stringify(payload),
          })
        : await fetch(API_CATEGORIAS_URL, {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify(payload),
          });

      if (response.ok) {
        clearForm();
        onCategoriasChange();
      }
    } catch (err) {
      console.error("Erro ao salvar categoria:", err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50">
      <div className="absolute right-0 top-0 h-full w-full max-w-sm bg-white shadow-xl overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-slate-200 sticky top-0 bg-white z-10">
          <h2 className="text-lg font-bold text-slate-800">Categorias</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4 space-y-6">
          <div className="space-y-3">
            {categorias.map((category) => (
              <div
                key={category.id}
                className="flex items-center justify-between gap-3 p-3 rounded-xl border border-slate-200"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-lg">{category.icone || "•"}</span>
                  <span className="font-medium text-slate-700 truncate">
                    {category.nome}
                  </span>
                  <span
                    className="w-3 h-3 rounded-full shrink-0 border border-slate-200"
                    style={{ backgroundColor: category.cor || "#94a3b8" }}
                  />
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleEdit(category)}
                    className="p-2 rounded-lg hover:bg-slate-100 text-slate-500"
                    title="Editar"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(category.id)}
                    className="p-2 rounded-lg hover:bg-red-50 text-red-500"
                    title="Deletar"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Nome
              </label>
              <input
                type="text"
                required
                className="w-full p-2 border rounded-lg"
                value={formNome}
                onChange={(e) => setFormNome(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Ícone
              </label>
              <input
                type="text"
                maxLength={2}
                placeholder="Emoji"
                className="w-full p-2 border rounded-lg"
                value={formIcone}
                onChange={(e) => setFormIcone(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Cor
              </label>
              <input
                type="color"
                className="w-full h-11 p-1 border rounded-lg"
                value={formCor}
                onChange={(e) => setFormCor(e.target.value)}
              />
            </div>

            <div className="flex gap-2 pt-2">
              {editingCat && (
                <button
                  type="button"
                  onClick={clearForm}
                  className="flex-1 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 font-medium transition-colors p-2"
                >
                  Cancelar
                </button>
              )}
              <button
                type="submit"
                className={`flex-1 text-white rounded-lg font-medium transition-colors p-2 ${editingCat ? "bg-amber-500 hover:bg-amber-600" : "bg-emerald-500 hover:bg-emerald-600"}`}
              >
                {editingCat ? "Atualizar" : "Salvar"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CategoryManagerModal;
