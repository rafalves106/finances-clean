using Finance.Core.Application.DTOs;
using Finance.Core.Repositories;

namespace Finance.Core.UseCases;

public class ListarCartoesManuaisUseCase(ICartaoRepository cartaoRepository)
{
  public IReadOnlyCollection<CartaoManualResumoDTO> Executar(Guid usuarioId, bool incluirInativos = true)
  {
    return cartaoRepository
      .ListarPorUsuario(usuarioId, incluirInativos)
      .Select(cartao => new CartaoManualResumoDTO(
        cartao.Id,
        cartao.Nome,
        cartao.LimiteTotal,
        cartao.DiaFechamento,
        cartao.DiaVencimento,
        cartao.CorTema,
        cartao.Ativo,
        cartao.CreatedAtUtc,
        cartao.UpdatedAtUtc))
      .ToList();
  }
}