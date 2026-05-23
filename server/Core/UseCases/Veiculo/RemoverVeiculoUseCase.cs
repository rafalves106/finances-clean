using Finance.Core.Repositories;

namespace Finance.Core.UseCases;

public class RemoverVeiculoUseCase(IVeiculoRepository _veiculoRepository)
{
  public void Executar(Guid id)
  {
    _veiculoRepository.Remover(id);
  }
}
