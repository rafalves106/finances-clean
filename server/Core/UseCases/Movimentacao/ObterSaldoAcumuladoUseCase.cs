using Finance.Core.Domain;
using Finance.Core.Repositories;

namespace Finance.Core.UseCases;

public class ObterSaldoAcumuladoUseCase(
    IMovimentacaoRepository movimentacaoRepository,
    ICartaoRepository cartaoRepository)
{
  public decimal Executar(Guid usuarioId, int mes, int ano)
  {
    var mesAnoAlvo = (ano * 100) + mes;
    var cartoes = cartaoRepository.ListarPorUsuario(usuarioId).ToDictionary(c => c.Id);

    var movimentacoesAnteriores = movimentacaoRepository.ListarTodas()
        .Where(m => m.UsuarioId == usuarioId && m.InvestimentoId is null)
        .Where(m => EhAnteriorAoMesAlvo(m, cartoes, mesAnoAlvo, mes, ano))
        .ToList();

    var entradas = movimentacoesAnteriores.OfType<Entrada>().Sum(m => (decimal?)m.Valor) ?? 0;
    var saidas = movimentacoesAnteriores.OfType<Saida>().Sum(m => (decimal?)m.Valor) ?? 0;

    return entradas - saidas;
  }

  private static bool EhAnteriorAoMesAlvo(
      Movimentacao movimentacao,
      IReadOnlyDictionary<Guid, CartaoManual> cartoes,
      int mesAnoAlvo,
      int mes,
      int ano)
  {
    if (movimentacao.CartaoId is Guid cartaoId &&
        movimentacao.CompetenciaFatura is int competencia &&
        cartoes.TryGetValue(cartaoId, out var cartao))
    {
      var competenciaVencimento = CompetenciaFaturaCalculator.ObterCompetenciaVencimento(
          competencia, cartao.DiaFechamento, cartao.DiaVencimento);

      return competenciaVencimento < mesAnoAlvo;
    }

    // Sem cartão, ou cartão/competência legados: mantém o critério pela data da compra.
    return movimentacao.Data.Year < ano || (movimentacao.Data.Year == ano && movimentacao.Data.Month < mes);
  }
}
