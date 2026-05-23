using Finance.Core.Domain;

namespace Finance.Core.Repositories;

public interface ICategoriaRepository
{
  Guid Adicionar(Categoria categoria);
  IEnumerable<Categoria> ListarTodas();
  Categoria? BuscarPorId(Guid id);
  void Atualizar(Categoria categoria);
  void Remover(Guid id);
}