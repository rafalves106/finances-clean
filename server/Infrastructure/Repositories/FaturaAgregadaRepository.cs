using Finance.Core.Domain;
using Finance.Core.Repositories;
using Finance.Infrastructure.Data;

namespace Finance.Infrastructure.Repositories;

public class FaturaAgregadaRepository(FinanceDbContext context) : IFaturaAgregadaRepository
{
  public void Adicionar(FaturaAgregada faturaAgregada)
  {
    context.FaturasAgregadas.Add(faturaAgregada);
    context.SaveChanges();
  }

  public void Atualizar(FaturaAgregada faturaAgregada)
  {
    context.FaturasAgregadas.Update(faturaAgregada);
    context.SaveChanges();
  }

  public FaturaAgregada? ObterPorCartaoECiclo(Guid usuarioId, Guid cartaoId, int ciclo)
  {
    return context.FaturasAgregadas
      .FirstOrDefault(f => f.UsuarioId == usuarioId && f.CartaoId == cartaoId && f.Ciclo == ciclo);
  }

  public IReadOnlyCollection<FaturaAgregada> ListarPorCartao(Guid usuarioId, Guid cartaoId)
  {
    return context.FaturasAgregadas
      .Where(f => f.UsuarioId == usuarioId && f.CartaoId == cartaoId)
      .OrderByDescending(f => f.Ciclo)
      .ToList();
  }
}
