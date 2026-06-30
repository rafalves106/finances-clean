using System.Collections.Concurrent;
using Finance.Core.Domain;
using Finance.Core.Repositories;

namespace Finance.Core.UseCases;

public class FaturaAgregadaService(
  IFaturaAgregadaRepository faturaAgregadaRepository,
  IMovimentacaoRepository movimentacaoRepository,
  ICartaoRepository cartaoRepository)
{
  private static readonly ConcurrentDictionary<string, SemaphoreSlim> LocksPorCiclo = new();

  public FaturaAgregada GetOrCreate(Guid usuarioId, Guid cartaoId, int ciclo)
  {
    var existente = faturaAgregadaRepository.ObterPorCartaoECiclo(usuarioId, cartaoId, ciclo);
    if (existente is not null)
    {
      return existente;
    }

    var cartao = cartaoRepository.ObterPorId(cartaoId, usuarioId)
      ?? throw new KeyNotFoundException("CARTAO_NAO_ENCONTRADO");

    var fatura = new FaturaAgregada(usuarioId, cartaoId, ciclo, CalcularVencimentoUtc(ciclo, cartao.DiaVencimento));
    faturaAgregadaRepository.Adicionar(fatura);
    return fatura;
  }

  public FaturaAgregada RecalcularSync(Guid usuarioId, Guid cartaoId, int ciclo, string origem)
  {
    var lockKey = $"{usuarioId:N}:{cartaoId:N}:{ciclo}";
    var semaphore = LocksPorCiclo.GetOrAdd(lockKey, static _ => new SemaphoreSlim(1, 1));

    semaphore.Wait();
    try
    {
      var fatura = GetOrCreate(usuarioId, cartaoId, ciclo);
      movimentacaoRepository.VincularComprasCartaoAFatura(usuarioId, cartaoId, ciclo, fatura.Id);
      var total = movimentacaoRepository.SomarComprasCartaoPorCiclo(usuarioId, cartaoId, ciclo);

      fatura.AtualizarValor(total);
      fatura.DefinirStatus(FaturaAgregadaStatus.Aberta);
      faturaAgregadaRepository.Atualizar(fatura);

      var faturasCartao = faturaAgregadaRepository.ListarPorCartao(usuarioId, cartaoId);
      foreach (var item in faturasCartao.Where(f => f.Ciclo < ciclo && f.Status != FaturaAgregadaStatus.Fechada))
      {
        item.DefinirStatus(FaturaAgregadaStatus.Fechada);
        faturaAgregadaRepository.Atualizar(item);
      }

      return fatura;
    }
    finally
    {
      semaphore.Release();
    }
  }

  private static DateTime CalcularVencimentoUtc(int ciclo, int diaVencimento)
  {
    var ano = ciclo / 100;
    var mes = ciclo % 100;
    var ultimoDia = DateTime.DaysInMonth(ano, mes);
    var diaNormalizado = Math.Min(Math.Max(1, diaVencimento), ultimoDia);
    return new DateTime(ano, mes, diaNormalizado, 0, 0, 0, DateTimeKind.Utc);
  }
}
