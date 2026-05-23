using Finance.Core.Domain;

namespace Finance.Core.Repositories;

public interface IMetaRepository
{
  Guid Adicionar(Meta meta);
  IEnumerable<Meta> ListarTodas();
  Meta? BuscarPorId(Guid id);
  void Atualizar(Meta meta);
  void Remover(Guid id);
}