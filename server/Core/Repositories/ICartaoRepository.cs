using Finance.Core.Domain;

namespace Finance.Core.Repositories;

public interface ICartaoRepository
{
  void Adicionar(CartaoManual cartao);
  void Atualizar(CartaoManual cartao);
  CartaoManual? ObterAtivoPorUsuario(Guid usuarioId);
  CartaoManual? ObterPorId(Guid id, Guid usuarioId);
  int ContarCartoesAtivos(Guid usuarioId, Guid? ignorarCartaoId = null);
  (decimal faturaAtual, decimal faturaProxima) ObterPrevisaoFatura(Guid cartaoId, DateTime referenciaUtc, int diaFechamento);
}
