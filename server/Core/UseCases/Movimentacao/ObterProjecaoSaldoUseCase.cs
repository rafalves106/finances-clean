using Finance.Core.Application.DTOs;
using Finance.Core.Domain;

namespace Finance.Core.UseCases;

// Projeta o saldo dos próximos meses a partir de movimentações que já
// existem no banco (parcelas e recorrências já materializadas na criação -
// ver CriarMovimentacaoUseCase) - não simula nada, só soma o que já está
// lançado mês a mês, exatamente como o resumo mensal e o saldo acumulado já
// fazem hoje.
public class ObterProjecaoSaldoUseCase(
    ListarMovimentacoesComCompetenciaEfetivaUseCase listarMovimentacoesComCompetenciaEfetivaUseCase,
    ObterSaldoAcumuladoUseCase obterSaldoAcumuladoUseCase)
{
  public IEnumerable<ProjecaoSaldoMensalDTO> Executar(Guid usuarioId, int mes, int ano, int meses = 6)
  {
    if (mes < 1 || mes > 12)
      throw new ArgumentException("O mês deve estar entre 1 e 12.");

    if (meses < 1 || meses > 12)
      throw new ArgumentException("O número de meses deve estar entre 1 e 12.");

    var saldoAcumulado = obterSaldoAcumuladoUseCase.Executar(usuarioId, mes, ano);
    var referencia = new DateTime(ano, mes, 1);

    var resultado = new List<ProjecaoSaldoMensalDTO>();

    for (var i = 0; i < meses; i++)
    {
      var dataMes = referencia.AddMonths(i);

      var movimentacoes = listarMovimentacoesComCompetenciaEfetivaUseCase
          .Executar(usuarioId, dataMes.Month, dataMes.Year)
          .Where(m => m.InvestimentoId is null)
          .ToList();

      var totalEntradas = movimentacoes.OfType<Entrada>().Sum(m => (decimal?)m.Valor) ?? 0;
      var totalSaidas = movimentacoes.OfType<Saida>().Sum(m => (decimal?)m.Valor) ?? 0;
      var saldoMes = totalEntradas - totalSaidas;
      saldoAcumulado += saldoMes;

      resultado.Add(new ProjecaoSaldoMensalDTO(
          dataMes.Month, dataMes.Year, totalEntradas, totalSaidas, saldoMes, saldoAcumulado));
    }

    return resultado;
  }
}
