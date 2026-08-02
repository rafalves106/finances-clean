using Finance.Core.Application.DTOs;
using Finance.Core.Domain;

namespace Finance.Core.UseCases;

public class ObterComparativoCategoriaMensalUseCase(ListarMovimentacoesComCompetenciaEfetivaUseCase listarMovimentacoesComCompetenciaEfetivaUseCase)
{
  public IEnumerable<ComparativoCategoriaMensalDTO> Executar(Guid usuarioId, int mesReferencia, int anoReferencia, int meses = 3)
  {
    if (mesReferencia < 1 || mesReferencia > 12)
    {
      throw new ArgumentException("O mês de referência deve estar entre 1 e 12.");
    }

    if (anoReferencia < 1)
    {
      throw new ArgumentException("O ano de referência é inválido.");
    }

    if (meses != 3 && meses != 6 && meses != 12)
    {
      throw new ArgumentException("O número de meses deve ser 3, 6 ou 12.");
    }

    var referencia = new DateTime(anoReferencia, mesReferencia, 1);

    var linhas = Enumerable.Range(0, meses)
        .Select(i => referencia.AddMonths(-i))
        .SelectMany(dataMes => listarMovimentacoesComCompetenciaEfetivaUseCase
            .Executar(usuarioId, dataMes.Month, dataMes.Year)
            .Where(m => m.InvestimentoId is null)
            .Select(m => new
            {
              dataMes.Month,
              dataMes.Year,
              Categoria = m.Categoria?.Nome ?? "Sem categoria",
              m.Tipo,
              m.Valor
            }));

    return linhas
        .GroupBy(item => new { item.Month, item.Year, item.Categoria })
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
