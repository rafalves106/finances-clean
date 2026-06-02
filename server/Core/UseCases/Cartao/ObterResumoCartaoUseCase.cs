using Finance.Core.Application.DTOs;
using Finance.Core.Repositories;

namespace Finance.Core.UseCases;

public class ObterResumoCartaoUseCase(ICartaoRepository cartaoRepository)
{
  public CartaoResumoDTO? Executar(Guid usuarioId)
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
}
