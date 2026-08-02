using System.Text.RegularExpressions;
using Finance.Core.Application.DTOs;
using Finance.Core.Repositories;

namespace Finance.Core.UseCases;

public class ListarGruposRecorrenciaExpiradosUseCase(IMovimentacaoRepository movimentacaoRepository)
{
  private static readonly Regex SufixoParcelaRegex = new(@"\s+\d+/\d+$", RegexOptions.Compiled);

  public IEnumerable<GrupoRecorrenciaExpiradoDTO> Executar(Guid usuarioId)
  {
    return movimentacaoRepository
        .ListarUltimaOcorrenciaDosGruposExpirados(usuarioId, DateTime.Today)
        .OrderBy(m => m.Data)
        .Select(m => new GrupoRecorrenciaExpiradoDTO(
            m.GrupoRecorrenciaId!.Value,
            SufixoParcelaRegex.Replace(m.Titulo, string.Empty).TrimEnd(),
            m.Data,
            m.TipoRecorrencia));
  }
}
