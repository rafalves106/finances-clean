using Finance.Core.Domain;
using Finance.Core.Repositories;

namespace Finance.Core.UseCases;

public record BackfillFaturaAgregadaResultado(
  int MesesAnalisados,
  int MovimentacoesAtualizadas,
  int FaturasRecalculadas);

public class ExecutarBackfillFaturaAgregadaUseCase(
  IMovimentacaoRepository movimentacaoRepository,
  ICartaoRepository cartaoRepository,
  FaturaAgregadaService faturaAgregadaService,
  MovimentacaoFaturaService movimentacaoFaturaService)
{
  public BackfillFaturaAgregadaResultado Executar(Guid usuarioId, int meses = 12, DateTime? referenciaUtc = null)
  {
    if (meses < 1)
    {
      throw new ArgumentException("Quantidade de meses inválida para backfill de fatura agregada.", nameof(meses));
    }

    var referencia = referenciaUtc ?? DateTime.UtcNow;
    var inicioJanela = new DateTime(referencia.Year, referencia.Month, 1, 0, 0, 0, DateTimeKind.Utc).AddMonths(-(meses - 1));
    var fimJanela = new DateTime(referencia.Year, referencia.Month, DateTime.DaysInMonth(referencia.Year, referencia.Month), 23, 59, 59, DateTimeKind.Utc);

    var movimentacoes = movimentacaoRepository
      .ListarComprasCartaoPorPeriodoSemFatura(usuarioId, inicioJanela, fimJanela)
      .ToList();

    var atualizadas = new List<Movimentacao>();
    var chavesAfetadas = new HashSet<string>(StringComparer.Ordinal);

    foreach (var compra in movimentacoes)
    {
      if (!compra.CartaoId.HasValue)
      {
        continue;
      }

      var cartao = cartaoRepository.ObterPorId(compra.CartaoId.Value, usuarioId);
      if (cartao is null)
      {
        continue;
      }

      var ciclo = compra.CompetenciaFatura ?? CompetenciaFaturaCalculator.CalcularCompetencia(compra.Data, cartao.DiaFechamento);
      var fatura = faturaAgregadaService.GetOrCreate(usuarioId, compra.CartaoId.Value, ciclo);

      compra.AtualizarDados(
        compra.Titulo,
        compra.Descricao,
        compra.Valor,
        compra.Data,
        compra.Fixa,
        compra.Periodo,
        compra.CategoriaId,
        compra.VeiculoId,
        compra.Km,
        compra.CartaoId,
        ciclo,
        compra.TipoMovimentacaoFixa,
        ehMovimentacaoFatura: false,
        faturaAgregadaId: fatura.Id);

      atualizadas.Add(compra);
      chavesAfetadas.Add($"{compra.CartaoId.Value:N}:{ciclo}");
    }

    if (atualizadas.Count > 0)
    {
      movimentacaoRepository.AtualizarEmLote(atualizadas);
    }

    foreach (var chave in chavesAfetadas)
    {
      var partes = chave.Split(':', 2);
      var cartaoId = Guid.Parse(partes[0]);
      var ciclo = int.Parse(partes[1]);

      var fatura = faturaAgregadaService.RecalcularSync(usuarioId, cartaoId, ciclo, "backfill");
      movimentacaoFaturaService.CreateOrUpdateForFatura(usuarioId, fatura);
    }

    return new BackfillFaturaAgregadaResultado(
      meses,
      atualizadas.Count,
      chavesAfetadas.Count);
  }
}
