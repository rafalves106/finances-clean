using Finance.Core.Domain;
using Finance.Core.Repositories;
using Finance.Infrastructure.Data;

namespace Finance.Infrastructure.Repositories;

public class CartaoRepository(FinanceDbContext context) : ICartaoRepository
{
  public void Adicionar(CartaoManual cartao)
  {
    context.CartoesManuais.Add(cartao);
    context.SaveChanges();
  }

  public void Atualizar(CartaoManual cartao)
  {
    context.CartoesManuais.Update(cartao);
    context.SaveChanges();
  }

  public CartaoManual? ObterAtivoPorUsuario(Guid usuarioId)
  {
    return context.CartoesManuais
        .FirstOrDefault(c => c.UsuarioId == usuarioId && c.Ativo);
  }

  public CartaoManual? ObterPorId(Guid id, Guid usuarioId)
  {
    return context.CartoesManuais
        .FirstOrDefault(c => c.Id == id && c.UsuarioId == usuarioId);
  }

  public bool ExisteCartaoAtivo(Guid usuarioId, Guid? ignorarCartaoId = null)
  {
    var query = context.CartoesManuais
        .Where(c => c.UsuarioId == usuarioId && c.Ativo);

    if (ignorarCartaoId.HasValue)
    {
      query = query.Where(c => c.Id != ignorarCartaoId.Value);
    }

    return query.Any();
  }

  public (decimal faturaAtual, decimal faturaProxima) ObterPrevisaoFatura(Guid cartaoId, DateTime referenciaUtc, int diaFechamento)
  {
    var inicioMes = new DateTime(referenciaUtc.Year, referenciaUtc.Month, 1, 0, 0, 0, DateTimeKind.Utc);
    var fechamentoAtual = NormalizarDiaMes(referenciaUtc.Year, referenciaUtc.Month, diaFechamento);

    var inicioProximoMesBase = inicioMes.AddMonths(1);
    var fechamentoProximo = NormalizarDiaMes(inicioProximoMesBase.Year, inicioProximoMesBase.Month, diaFechamento);

    var faturaAtual = context.Saidas
        .Where(s => s.CartaoId == cartaoId && s.Data <= fechamentoAtual)
        .Sum(s => (decimal?)s.Valor) ?? 0m;

    var faturaProxima = context.Saidas
        .Where(s => s.CartaoId == cartaoId && s.Data > fechamentoAtual && s.Data <= fechamentoProximo)
        .Sum(s => (decimal?)s.Valor) ?? 0m;

    return (faturaAtual, faturaProxima);
  }

  private static DateTime NormalizarDiaMes(int ano, int mes, int dia)
  {
    var ultimoDia = DateTime.DaysInMonth(ano, mes);
    var diaNormalizado = Math.Min(dia, ultimoDia);
    return new DateTime(ano, mes, diaNormalizado, 23, 59, 59, DateTimeKind.Utc);
  }
}
