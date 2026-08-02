using Finance.Core.Domain;
using Xunit;

namespace API.IntegrationTests;

public class CompetenciaFaturaCalculatorTests
{
  [Fact]
  public void ObterCompetenciaVencimento_VencimentoAntesDoFechamento_CaiNoMesSeguinte()
  {
    // Fechamento dia 29, vencimento dia 5: fatura fechada em agosto vence em setembro.
    var resultado = CompetenciaFaturaCalculator.ObterCompetenciaVencimento(202608, diaFechamento: 29, diaVencimento: 5);

    Assert.Equal(202609, resultado);
  }

  [Fact]
  public void ObterCompetenciaVencimento_VencimentoDepoisDoFechamento_CaiNoMesmoMes()
  {
    // Fechamento dia 10, vencimento dia 17: fatura fechada em agosto vence ainda em agosto.
    var resultado = CompetenciaFaturaCalculator.ObterCompetenciaVencimento(202608, diaFechamento: 10, diaVencimento: 17);

    Assert.Equal(202608, resultado);
  }

  [Fact]
  public void ObterCompetenciaComVencimentoEm_EhInversaDeObterCompetenciaVencimento_MesSeguinte()
  {
    var competenciaVencimento = CompetenciaFaturaCalculator.ObterCompetenciaVencimento(202608, diaFechamento: 29, diaVencimento: 5);
    var competenciaOriginal = CompetenciaFaturaCalculator.ObterCompetenciaComVencimentoEm(competenciaVencimento, diaFechamento: 29, diaVencimento: 5);

    Assert.Equal(202608, competenciaOriginal);
  }

  [Fact]
  public void ObterCompetenciaComVencimentoEm_EhInversaDeObterCompetenciaVencimento_MesmoMes()
  {
    var competenciaVencimento = CompetenciaFaturaCalculator.ObterCompetenciaVencimento(202608, diaFechamento: 10, diaVencimento: 17);
    var competenciaOriginal = CompetenciaFaturaCalculator.ObterCompetenciaComVencimentoEm(competenciaVencimento, diaFechamento: 10, diaVencimento: 17);

    Assert.Equal(202608, competenciaOriginal);
  }

  [Fact]
  public void ObterCompetenciaVencimento_AtravessaViradaDeAno()
  {
    // Fechamento dia 29 de dezembro, vencimento dia 5: cai em janeiro do ano seguinte.
    var resultado = CompetenciaFaturaCalculator.ObterCompetenciaVencimento(202512, diaFechamento: 29, diaVencimento: 5);

    Assert.Equal(202601, resultado);
  }
}
