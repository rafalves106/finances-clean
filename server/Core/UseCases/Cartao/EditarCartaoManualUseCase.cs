using Finance.Core.Domain;
using Finance.Core.Repositories;

namespace Finance.Core.UseCases;

public class EditarCartaoManualUseCase(ICartaoRepository cartaoRepository)
{
  public CartaoManual Executar(
      Guid usuarioId,
      Guid cartaoId,
      string nome,
      decimal limiteTotal,
      int diaFechamento,
      int diaVencimento,
      string? corTema = null)
  {
    var cartao = cartaoRepository.ObterPorId(cartaoId, usuarioId)
        ?? throw new KeyNotFoundException("Cartão não encontrado.");

    if (!cartao.Ativo)
    {
      throw new InvalidOperationException("Cartão inativo não pode ser editado.");
    }

    cartao.Editar(nome, limiteTotal, diaFechamento, diaVencimento, corTema);
    cartaoRepository.Atualizar(cartao);
    return cartao;
  }
}
