using Finance.Core.Repositories;

namespace Finance.Core.UseCases;

public class RemoverCategoriaUseCase(ICategoriaRepository _categoriaRepository)
{
  public void Executar(Guid id)
  {
    var categoria = _categoriaRepository.BuscarPorId(id)
        ?? throw new ArgumentException($"Categoria {id} não encontrada.");

    _categoriaRepository.Remover(categoria.Id);
  }
}