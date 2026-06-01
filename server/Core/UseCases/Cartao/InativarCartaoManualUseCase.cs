using Finance.Core.Repositories;

namespace Finance.Core.UseCases;

public class InativarCartaoManualUseCase(ICartaoRepository cartaoRepository)
{
  public void Executar(Guid usuarioId, Guid cartaoId)
  {
    var cartao = cartaoRepository.ObterPorId(cartaoId, usuarioId)
        ?? throw new KeyNotFoundException("Cartão não encontrado.");

    cartao.Inativar();
    cartaoRepository.Atualizar(cartao);
  }
}
