using Finance.Core.Domain;
using Finance.Core.Repositories;

namespace Finance.Core.UseCases;

public class CadastrarCartaoManualUseCase(ICartaoRepository cartaoRepository)
{
  public CartaoManual Executar(
      Guid usuarioId,
      string nome,
      decimal limiteTotal,
      int diaFechamento,
      int diaVencimento)
  {
    if (cartaoRepository.ExisteCartaoAtivo(usuarioId))
    {
      throw new InvalidOperationException("Já existe um cartão ativo para o usuário.");
    }

    var cartao = new CartaoManual(
        usuarioId,
        nome,
        limiteTotal,
        diaFechamento,
        diaVencimento);

    cartaoRepository.Adicionar(cartao);
    return cartao;
  }
}
