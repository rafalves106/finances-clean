using Finance.Core.Application.DTOs;
using Finance.Core.Repositories;

namespace Finance.Core.UseCases;

public class AtualizarCategoriaUseCase(ICategoriaRepository _categoriaRepository)
{
  public void Executar(Guid id, CategoriaDTO dto)
  {
    var categoria = _categoriaRepository.BuscarPorId(id)
        ?? throw new ArgumentException($"Categoria {id} não encontrada.");

    categoria.Atualizar(dto.Nome, dto.Icone, dto.Cor);
    _categoriaRepository.Atualizar(categoria);
  }
}