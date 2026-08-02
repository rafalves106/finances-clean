using Finance.Core.Application.DTOs;
using Finance.Core.Domain;
using Finance.Core.Repositories;

namespace Finance.Core.UseCases;

public class ObterPrevisaoFaturaFuturaUseCase(ICartaoRepository cartaoRepository)
{
  public CartaoPrevisaoFaturaFuturaDTO Executar(Guid usuarioId, Guid cartaoId, int meses)
  {
    if (meses < 1 || meses > 12)
    {
      throw new ArgumentException("O número de meses deve estar entre 1 e 12.", nameof(meses));
    }

    var cartao = cartaoRepository.ObterPorId(cartaoId, usuarioId)
        ?? throw new KeyNotFoundException("Cartão não encontrado.");

    var competencia = CompetenciaFaturaCalculator.CalcularCompetencia(DateTime.UtcNow, cartao.DiaFechamento);
    var mesesProjetados = new List<CartaoPrevisaoFaturaMesDTO>(meses);

    for (var i = 0; i < meses; i++)
    {
      var valor = cartaoRepository.ObterFaturaPorCompetencia(cartao.Id, competencia);
      mesesProjetados.Add(new CartaoPrevisaoFaturaMesDTO(competencia, valor));
      competencia = CompetenciaFaturaCalculator.ProximaCompetencia(competencia);
    }

    return new CartaoPrevisaoFaturaFuturaDTO(cartao.Id, mesesProjetados);
  }
}
