using Finance.Core.Application.DTOs;
using Finance.Core.Domain;
using Finance.Core.Repositories;

namespace Finance.Core.UseCases;

public class CriarCategoriaUseCase(ICategoriaRepository _categoriaRepository)
{
  public Guid Executar(Guid usuarioId, CategoriaDTO dto)
  {
    var categoria = new Categoria(dto.Nome, usuarioId, dto.Icone, dto.Cor, dto.OrcamentoMensal);
    return _categoriaRepository.Adicionar(categoria);
  }
}