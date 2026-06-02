using Finance.Core.Domain;
using Finance.Core.Repositories;

namespace Finance.Core.UseCases;

public class CadastrarCartaoManualUseCase(ICartaoRepository cartaoRepository)
{
  private const int LimiteMaximoCartoesAtivos = 3;

  public CartaoManual Executar(
      Guid usuarioId,
      string nome,
      decimal limiteTotal,
      int diaFechamento,
      int diaVencimento)
  {
    var totalAtivos = cartaoRepository.ContarCartoesAtivos(usuarioId);
    if (totalAtivos >= LimiteMaximoCartoesAtivos)
    {
      throw new InvalidOperationException("CARTAO_LIMITE_ATIVOS_EXCEDIDO");
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
