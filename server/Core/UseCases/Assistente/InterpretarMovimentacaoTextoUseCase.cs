using Finance.Core.Repositories;
using Finance.Core.Services;

namespace Finance.Core.UseCases;

public class InterpretarMovimentacaoTextoUseCase(
  IAssistenteIAService assistenteIAService, ICategoriaRepository categoriaRepository)
{
  public async Task<InterpretacaoMovimentacaoResultado> Executar(Guid usuarioId, string texto)
  {
    if (string.IsNullOrWhiteSpace(texto))
    {
      throw new ArgumentException("Descreva a movimentação.");
    }

    // Defesa em profundidade: mesmo com filtro global do EF em produção, os
    // fakes de teste não o replicam (mesma lição do ListarMovimentacoesComCompetenciaEfetivaUseCase).
    var categorias = categoriaRepository.ListarTodas()
      .Where(c => c.IsGlobal || c.UsuarioId == usuarioId)
      .Select(c => new CategoriaResumoIA(c.Id, c.Nome))
      .ToList();

    return await assistenteIAService.InterpretarMovimentacao(texto, DateTime.UtcNow, categorias);
  }
}
