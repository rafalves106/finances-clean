using System.Text.RegularExpressions;
using Finance.Core.Application.DTOs;
using Finance.Core.Repositories;

namespace Finance.Core.UseCases;

public class RenumerarGrupoUseCase(IMovimentacaoRepository movimentacaoRepository)
{
  private static readonly Regex SufixoParcelaRegex = new(@"\s+\d+/\d+$", RegexOptions.Compiled);

  public RenumeracaoGrupoResultado Executar(Guid grupoRecorrenciaId, Guid usuarioId)
  {
    var movimentacoesDoGrupo = movimentacaoRepository
        .ListarPorGrupoRecorrencia(grupoRecorrenciaId, usuarioId)
        .OrderBy(m => m.Data)
        .ThenBy(m => m.Id)
        .ToList();

    if (movimentacoesDoGrupo.Count == 0)
    {
      throw new KeyNotFoundException("Grupo de recorrência não encontrado.");
    }

    var total = movimentacoesDoGrupo.Count;

    for (int i = 0; i < total; i++)
    {
      var movimentacao = movimentacoesDoGrupo[i];
      var tituloBase = SufixoParcelaRegex.Replace(movimentacao.Titulo, string.Empty).TrimEnd();
      var tituloRenumerado = $"{tituloBase} {i + 1}/{total}";

      movimentacao.AtualizarDados(
          tituloRenumerado,
          movimentacao.Descricao,
          movimentacao.Valor,
          movimentacao.Data,
          movimentacao.Fixa,
          movimentacao.Periodo,
          movimentacao.CategoriaId,
          movimentacao.VeiculoId,
          movimentacao.Km,
              movimentacao.CartaoId,
          movimentacao.TipoMovimentacaoFixa);
    }

    movimentacaoRepository.AtualizarEmLote(movimentacoesDoGrupo);

    return new RenumeracaoGrupoResultado(grupoRecorrenciaId, total);
  }
}