using Finance.Core.Domain;
using Finance.Core.Repositories;

namespace Finance.Core.UseCases;

public class ListarMetasUseCase(IMetaRepository _metaRepository)
{
  public IEnumerable<Meta> Executar() => _metaRepository.ListarTodas();
}