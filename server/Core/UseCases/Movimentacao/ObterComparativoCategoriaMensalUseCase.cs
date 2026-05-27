using Finance.Core.Application.DTOs;
using Finance.Core.Domain;
using Finance.Core.Repositories;

namespace Finance.Core.UseCases;

public class ObterComparativoCategoriaMensalUseCase(IMovimentacaoRepository movimentacaoRepository)
{
  public IEnumerable<ComparativoCategoriaMensalDTO> Executar(Guid usuarioId, int mesReferencia, int anoReferencia)
  {
    if (mesReferencia < 1 || mesReferencia > 12)
    {
      throw new ArgumentException("O mês de referência deve estar entre 1 e 12.");
    }

    if (anoReferencia < 1)
    {
      throw new ArgumentException("O ano de referência é inválido.");
    }

    var referencia = new DateTime(anoReferencia, mesReferencia, 1);
    var inicioJanela = referencia.AddMonths(-2);
    var fimJanela = referencia.AddMonths(1).AddTicks(-1);

    var movimentacoes = movimentacaoRepository
        .ListarPorPeriodoPorUsuario(inicioJanela, fimJanela, usuarioId)
        .Where(m => m.InvestimentoId is null)
        .ToList();

    return movimentacoes
        .GroupBy(m => new
        {
          m.Data.Month,
          m.Data.Year,
          Categoria = m.Categoria?.Nome ?? "Sem categoria"
        })
        .Select(grupo => new ComparativoCategoriaMensalDTO(
            grupo.Key.Month,
            grupo.Key.Year,
            grupo.Key.Categoria,
            grupo.Where(m => m.Tipo == TipoMovimentacao.Entrada).Sum(m => m.Valor),
            grupo.Where(m => m.Tipo == TipoMovimentacao.Saida).Sum(m => m.Valor)
        ))
        .OrderBy(item => item.Ano)
        .ThenBy(item => item.Mes)
        .ThenBy(item => item.Categoria)
        .ToList();
  }
}