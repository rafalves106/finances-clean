using Finance.Core.Application.DTOs;
using Finance.Core.Domain;
using Finance.Core.Repositories;

namespace Finance.Core.UseCases;

public class ListarFaturasVencendoNoMesUseCase(ICartaoRepository cartaoRepository)
{
  public IEnumerable<FaturaVencendoDTO> Executar(Guid usuarioId, int mes, int ano)
  {
    var mesAnoAlvo = (ano * 100) + mes;

    return cartaoRepository.ListarAtivosPorUsuario(usuarioId)
        .Select(cartao =>
        {
          var competencia = CompetenciaFaturaCalculator.ObterCompetenciaComVencimentoEm(
              mesAnoAlvo, cartao.DiaFechamento, cartao.DiaVencimento);

          var valor = cartaoRepository.ObterFaturaPorCompetencia(cartao.Id, competencia);

          var dataVencimento = CompetenciaFaturaCalculator.ObterDataVencimento(
              competencia, cartao.DiaFechamento, cartao.DiaVencimento);

          return new FaturaVencendoDTO(cartao.Id, cartao.Nome, valor, dataVencimento);
        })
        .Where(item => item.Valor > 0)
        .OrderBy(item => item.DataVencimento)
        .ToList();
  }
}
