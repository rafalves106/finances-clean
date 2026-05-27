using Finance.Core.Application.DTOs;
using Finance.Core.Repositories;

namespace Finance.Core.UseCases;

public class ListarCategoriasUseCase(ICategoriaRepository _categoriaRepository)
{
  public IEnumerable<CategoriaListItemDTO> Executar(Guid usuarioId)
  {
    var categorias = _categoriaRepository.ListarTodas().ToList();

    var categoriasGlobaisIds = categorias
      .Where(categoria => categoria.IsGlobal)
      .Select(categoria => categoria.Id)
      .ToList();

    var orcamentosGlobaisEfetivos = _categoriaRepository
      .ListarOrcamentosMensaisCategoriasGlobais(usuarioId, categoriasGlobaisIds);

    return categorias.Select(categoria =>
    {
      decimal? orcamentoMensal;

      if (categoria.IsGlobal)
      {
        orcamentoMensal = orcamentosGlobaisEfetivos.TryGetValue(categoria.Id, out var orcamentoGlobal)
          ? orcamentoGlobal
          : null;
      }
      else
      {
        orcamentoMensal = categoria.OrcamentoMensal;
      }

      return new CategoriaListItemDTO(
        categoria.Id,
        categoria.Nome,
        categoria.Icone,
        categoria.Cor,
        categoria.IsGlobal,
        orcamentoMensal
      );
    });
  }
}