using Finance.Core.Domain;

namespace Finance.Core.Repositories;

public interface IVeiculoRepository
{
  Guid Adicionar(Veiculo veiculo);
  IEnumerable<Veiculo> ListarTodos();
  Veiculo? BuscarPorId(Guid id);
  void Atualizar(Veiculo veiculo);
  void Remover(Guid id);
}
