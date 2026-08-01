using Finance.Core.Application.DTOs;
using Finance.Core.Domain;
using Finance.Core.Repositories;

namespace Finance.Core.UseCases;

public class ListarMetasUseCase(
  IMetaRepository _metaRepository,
  IMovimentacaoRepository _movimentacaoRepository,
  IInvestimentoRepository _investimentoRepository)
{
  public IEnumerable<MetaResponseDTO> Executar()
  {
    var metas = _metaRepository.ListarTodas().ToList();

    var investimentosPorId = _investimentoRepository.ObterTodos()
      .ToDictionary(investimento => investimento.Id);

    var movimentacoesPorCategoria = _movimentacaoRepository.ListarTodas()
      .Where(movimentacao => movimentacao.CategoriaId.HasValue)
      .GroupBy(movimentacao => movimentacao.CategoriaId!.Value)
      .ToDictionary(
        grupo => grupo.Key,
        grupo => grupo.Sum(movimentacao =>
          movimentacao.Tipo == TipoMovimentacao.Entrada
            ? movimentacao.Valor
            : -movimentacao.Valor));

    return metas.Select(meta =>
    {
      var valorAcumulado = 0m;

      if (meta.CategoriaId.HasValue)
      {
        valorAcumulado = movimentacoesPorCategoria.GetValueOrDefault(meta.CategoriaId.Value, 0m);
      }
      else if (meta.InvestimentoId.HasValue &&
               investimentosPorId.TryGetValue(meta.InvestimentoId.Value, out var investimento))
      {
        valorAcumulado = investimento.SaldoAtual;
      }

      var percentualProgresso = meta.Valor > 0
        ? Math.Round(Math.Max(0, valorAcumulado) / meta.Valor * 100, 2)
        : 0;

      return new MetaResponseDTO(
        meta.Id,
        meta.Descricao,
        meta.Valor,
        meta.DataAlvo,
        meta.Concluida,
        meta.DataCriacao,
        meta.CategoriaId,
        meta.InvestimentoId,
        valorAcumulado,
        percentualProgresso
      );
    });
  }
}
