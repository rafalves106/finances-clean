using Finance.Core.Domain;

namespace Finance.Core.Repositories;

public interface ICategoriaOrcamentoUsuarioRepository
{
  CategoriaOrcamentoUsuario? BuscarPorCategoriaGlobalEUsuario(Guid categoriaGlobalId, Guid usuarioId);
  void Salvar(CategoriaOrcamentoUsuario categoriaOrcamentoUsuario);
  void Remover(CategoriaOrcamentoUsuario categoriaOrcamentoUsuario);
}