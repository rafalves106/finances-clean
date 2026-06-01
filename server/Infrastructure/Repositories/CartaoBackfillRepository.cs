using Finance.Core.Domain;
using Finance.Core.Repositories;
using Finance.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Finance.Infrastructure.Repositories;

public class CartaoBackfillRepository(FinanceDbContext context) : ICartaoBackfillRepository
{
  public void AdicionarExecucao(CartaoBackfillExecution execution)
  {
    context.CartaoBackfillExecutions.Add(execution);
    context.SaveChanges();
  }

  public CartaoBackfillExecution? ObterExecucao(Guid executionId, Guid usuarioId)
  {
    return context.CartaoBackfillExecutions
      .FirstOrDefault(e => e.Id == executionId && e.UsuarioId == usuarioId);
  }

  public IReadOnlyCollection<CartaoBackfillExecutionItem> ListarItens(Guid executionId, Guid usuarioId)
  {
    var existeExecucao = context.CartaoBackfillExecutions
      .Any(e => e.Id == executionId && e.UsuarioId == usuarioId);

    if (!existeExecucao)
    {
      return [];
    }

    return context.CartaoBackfillExecutionItems
      .Where(i => i.ExecutionId == executionId)
      .OrderBy(i => i.DataOriginal)
      .ThenBy(i => i.MovimentacaoId)
      .ToList();
  }

  public bool ExisteApplyParaPreview(Guid previewExecutionId, Guid usuarioId)
  {
    return context.CartaoBackfillExecutions.Any(e =>
      e.UsuarioId == usuarioId &&
      e.SourceExecutionId == previewExecutionId &&
      e.Modo == CartaoBackfillModo.Apply);
  }
}