namespace Finance.Core.Domain;

public static class CompetenciaFaturaCalculator
{
  public static int CalcularCompetencia(DateTime dataReferenciaUtc, int diaFechamento)
  {
    if (diaFechamento is < 1 or > 31)
    {
      throw new ArgumentException("Dia de fechamento deve estar entre 1 e 31.", nameof(diaFechamento));
    }

    var data = DateTime.SpecifyKind(dataReferenciaUtc, DateTimeKind.Utc);
    var fechamentoNoMes = Math.Min(diaFechamento, DateTime.DaysInMonth(data.Year, data.Month));

    var competenciaBase = new DateTime(data.Year, data.Month, 1, 0, 0, 0, DateTimeKind.Utc);

    if (data.Day >= fechamentoNoMes)
    {
      competenciaBase = competenciaBase.AddMonths(1);
    }

    return (competenciaBase.Year * 100) + competenciaBase.Month;
  }

  public static int ProximaCompetencia(int competencia)
  {
    var ano = competencia / 100;
    var mes = competencia % 100;
    var proxima = new DateTime(ano, mes, 1, 0, 0, 0, DateTimeKind.Utc).AddMonths(1);
    return (proxima.Year * 100) + proxima.Month;
  }
}
