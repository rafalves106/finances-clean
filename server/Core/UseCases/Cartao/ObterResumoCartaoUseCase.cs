using Finance.Core.Application.DTOs;
using Finance.Core.Domain;
using Finance.Core.Repositories;

namespace Finance.Core.UseCases;

public class ObterResumoCartaoUseCase(ICartaoRepository cartaoRepository)
{
  public CartaoResumoDTO? Executar(Guid usuarioId, int? mes = null, int? ano = null)
  {
    var cartao = cartaoRepository.ObterAtivoPorUsuario(usuarioId);
    if (cartao is null)
    {
      return null;
    }

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
    // mes/ano aqui e o mes de VENCIMENTO (mesma convencao do resto do
    // dashboard - resumo mensal, gastos por categoria, item "Fatura X" na
    // lista de movimentacoes). Fechamento e vencimento podem cair em meses
    // calendario diferentes, entao precisamos voltar da competencia de
    // vencimento selecionada pra competencia de fechamento correspondente
    // antes de somar - nao dá pra tratar mes/ano como a propria competencia.
    var competenciaVencimentoSelecionada = (ano * 100) + mes;
    var competenciaVencimentoProxima =
      CompetenciaFaturaCalculator.ProximaCompetencia(competenciaVencimentoSelecionada);

    var competenciaAtual = CompetenciaFaturaCalculator.ObterCompetenciaComVencimentoEm(
      competenciaVencimentoSelecionada, cartao.DiaFechamento, cartao.DiaVencimento);
    var competenciaProxima = CompetenciaFaturaCalculator.ObterCompetenciaComVencimentoEm(
      competenciaVencimentoProxima, cartao.DiaFechamento, cartao.DiaVencimento);

    return (
      cartaoRepository.ObterFaturaPorCompetencia(cartao.Id, competenciaAtual),
      cartaoRepository.ObterFaturaPorCompetencia(cartao.Id, competenciaProxima));
  }
}
