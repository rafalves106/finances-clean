using Finance.Core.Domain;

namespace Finance.Core.Repositories;

public interface ICartaoBackfillRepository
{
  void AdicionarExecucao(CartaoBackfillExecution execution);
  CartaoBackfillExecution? ObterExecucao(Guid executionId, Guid usuarioId);
  IReadOnlyCollection<CartaoBackfillExecutionItem> ListarItens(Guid executionId, Guid usuarioId);
  bool ExisteApplyParaPreview(Guid previewExecutionId, Guid usuarioId);
}