using Finance.Core.Domain;
using Finance.Core.Repositories;

namespace Finance.Core.UseCases;

public class RemoverMetaUseCase(IMetaRepository _metaRepository)
{
  public void Executar(Guid id)
  {
    var meta = _metaRepository.BuscarPorId(id)
        ?? throw new ArgumentException($"Meta {id} não encontrada.");

    _metaRepository.Remover(meta.Id);
  }
}