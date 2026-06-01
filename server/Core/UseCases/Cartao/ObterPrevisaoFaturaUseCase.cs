using Finance.Core.Application.DTOs;
using Finance.Core.Repositories;

namespace Finance.Core.UseCases;

public class ObterPrevisaoFaturaUseCase(ICartaoRepository cartaoRepository)
{
  public CartaoPrevisaoFaturaDTO? Executar(Guid usuarioId)
  {
    var cartao = cartaoRepository.ObterAtivoPorUsuario(usuarioId);
    if (cartao is null)
    {
      return null;
    }

    var referenciaUtc = DateTime.UtcNow;
    var (faturaAtual, faturaProxima) = cartaoRepository.ObterPrevisaoFatura(
        cartao.Id,
        referenciaUtc,
        cartao.DiaFechamento);

    return new CartaoPrevisaoFaturaDTO(faturaAtual, faturaProxima);
  }
}
