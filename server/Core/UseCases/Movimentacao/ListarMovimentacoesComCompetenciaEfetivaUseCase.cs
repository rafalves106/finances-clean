using Finance.Core.Domain;
using Finance.Core.Repositories;

namespace Finance.Core.UseCases;

public class ListarMovimentacoesComCompetenciaEfetivaUseCase(
    IMovimentacaoRepository movimentacaoRepository,
    ICartaoRepository cartaoRepository)
{
  public IEnumerable<Movimentacao> Executar(Guid usuarioId, int mes, int ano)
  {
    var naoCartao = movimentacaoRepository.ListarPorMes(mes, ano)
        .Where(m => m.UsuarioId == usuarioId && m.CartaoId is null);

    var cartoesAtivos = cartaoRepository.ListarAtivosPorUsuario(usuarioId);
    var mesAnoAlvo = (ano * 100) + mes;

    var doCartao = cartoesAtivos.SelectMany(cartao =>
    {
      var competencia = CompetenciaFaturaCalculator.ObterCompetenciaComVencimentoEm(
          mesAnoAlvo, cartao.DiaFechamento, cartao.DiaVencimento);

      return movimentacaoRepository.ListarPorCartaoECompetencia(usuarioId, cartao.Id, competencia);
    });

    return naoCartao.Concat(doCartao);
  }
}
