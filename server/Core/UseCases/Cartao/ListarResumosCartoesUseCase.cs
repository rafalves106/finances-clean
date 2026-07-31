using Finance.Core.Application.DTOs;
using Finance.Core.Domain;
using Finance.Core.Repositories;

namespace Finance.Core.UseCases;

public class ListarResumosCartoesUseCase(ICartaoRepository cartaoRepository)
{
  public IReadOnlyCollection<CartaoResumoDTO> Executar(Guid usuarioId, int? mes = null, int? ano = null)
  {
    return cartaoRepository
      .ListarAtivosPorUsuario(usuarioId)
      .Take(3)
      .Select(cartao => ProjetarResumo(cartao, mes, ano))
      .ToList();
  }

  private CartaoResumoDTO ProjetarResumo(CartaoManual cartao, int? mes, int? ano)
  {
    var (faturaAtual, faturaProxima) = mes.HasValue && ano.HasValue
      ? ObterFaturaPorMesSelecionado(cartao, mes.Value, ano.Value)
      : cartaoRepository.ObterPrevisaoFatura(cartao.Id, DateTime.UtcNow, cartao.DiaFechamento);

    var utilizado = faturaAtual;
    var disponivel = Math.Max(0, cartao.LimiteTotal - utilizado);
    var percentualUso = cartao.LimiteTotal <= 0
      ? 0
      : Math.Min(100, decimal.Round((utilizado / cartao.LimiteTotal) * 100, 2));

    return new CartaoResumoDTO(
      new CartaoManualResumoDTO(
        cartao.Id,
        cartao.Nome,
        cartao.LimiteTotal,
        cartao.DiaFechamento,
        cartao.DiaVencimento,
        cartao.CorTema,
        cartao.Ativo,
        cartao.CreatedAtUtc,
        cartao.UpdatedAtUtc),
      new CartaoLimiteResumoDTO(utilizado, disponivel, percentualUso),
      new CartaoPrevisaoFaturaDTO(faturaAtual, faturaProxima));
  }

  private (decimal faturaAtual, decimal faturaProxima) ObterFaturaPorMesSelecionado(
    CartaoManual cartao, int mes, int ano)
  {
    var competenciaSelecionada = (ano * 100) + mes;
    var competenciaProxima = CompetenciaFaturaCalculator.ProximaCompetencia(competenciaSelecionada);

    return (
      cartaoRepository.ObterFaturaPorCompetencia(cartao.Id, competenciaSelecionada),
      cartaoRepository.ObterFaturaPorCompetencia(cartao.Id, competenciaProxima));
  }
}