using Finance.Core.Domain;
using Finance.Core.Repositories;

namespace Finance.Core.UseCases;

public class ListarCategoriasUseCase(ICategoriaRepository _categoriaRepository)
{
  public IEnumerable<Categoria> Executar() => _categoriaRepository.ListarTodas();
}