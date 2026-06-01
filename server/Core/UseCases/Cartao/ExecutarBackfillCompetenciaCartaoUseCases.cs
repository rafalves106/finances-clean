using System.Text.RegularExpressions;
using Finance.Core.Application.DTOs;
using Finance.Core.Domain;
using Finance.Core.Repositories;

namespace Finance.Core.UseCases;

public class ExecutarPreviewBackfillCompetenciaCartaoUseCase(
    IMovimentacaoRepository movimentacaoRepository,
    ICartaoRepository cartaoRepository,
    ICartaoBackfillRepository cartaoBackfillRepository)
{
  public CartaoBackfillExecutionResponseDTO Executar(Guid usuarioId, DateTime? dataInicio = null, DateTime? dataFim = null)
  {
    var movimentos = movimentacaoRepository.ListarTodas()
      .OfType<Saida>()
      .Where(m => m.UsuarioId == usuarioId && m.CartaoId.HasValue)
      .Where(m => !m.CompetenciaFatura.HasValue)
      .Where(m => !dataInicio.HasValue || m.Data >= dataInicio.Value)
      .Where(m => !dataFim.HasValue || m.Data <= dataFim.Value)
      .OrderBy(m => m.Data)
      .ThenBy(m => m.Id)
      .ToList();

    var execution = new CartaoBackfillExecution(
      usuarioId,
      CartaoBackfillModo.Preview,
      usuarioId.ToString());

    var itens = new List<CartaoBackfillExecutionItem>(movimentos.Count);
    var totalAplicavel = 0;
    var totalAmbiguo = 0;
    var totalIgnorado = 0;

    foreach (var movimento in movimentos)
    {
      var (status, motivo, dataExtraida) = LegacyCardDateParser.ExtrairDataUnica(movimento.Descricao, movimento.Data);

      var dataAplicada = dataExtraida;
      int? competenciaAplicada = null;

      if (status == CartaoBackfillStatus.Aplicavel)
      {
        var cartao = cartaoRepository.ObterPorId(movimento.CartaoId!.Value, usuarioId);
        if (cartao is null)
        {
          status = CartaoBackfillStatus.Ignorado;
          motivo = "CARTAO_NAO_ENCONTRADO";
          dataAplicada = null;
          totalIgnorado++;
        }
        else
        {
          competenciaAplicada = CompetenciaFaturaCalculator.CalcularCompetencia(dataAplicada!.Value, cartao.DiaFechamento);
          totalAplicavel++;
        }
      }
      else if (status == CartaoBackfillStatus.Ambiguo)
      {
        totalAmbiguo++;
      }
      else
      {
        totalIgnorado++;
      }

      itens.Add(new CartaoBackfillExecutionItem(
        execution.Id,
        movimento.Id,
        movimento.CartaoId,
        status,
        motivo,
        movimento.Descricao,
        movimento.Data,
        dataExtraida,
        dataAplicada,
        movimento.CompetenciaFatura,
        competenciaAplicada));
    }

    execution.DefinirTotais(
      totalAnalisado: movimentos.Count,
      totalAplicavel: totalAplicavel,
      totalAmbiguo: totalAmbiguo,
      totalIgnorado: totalIgnorado,
      totalAplicado: 0,
      totalRevertido: 0);
    execution.AdicionarItens(itens);

    cartaoBackfillRepository.AdicionarExecucao(execution);

    return new CartaoBackfillExecutionResponseDTO
    {
      ExecutionId = execution.Id,
      Modo = execution.Modo,
      TotalAnalisado = execution.TotalAnalisado,
      TotalAplicavel = execution.TotalAplicavel,
      TotalAmbiguo = execution.TotalAmbiguo,
      TotalIgnorado = execution.TotalIgnorado,
      TotalAplicado = execution.TotalAplicado,
      TotalRevertido = execution.TotalRevertido
    };
  }
}

public class ExecutarApplyBackfillCompetenciaCartaoUseCase(
    IMovimentacaoRepository movimentacaoRepository,
    ICartaoBackfillRepository cartaoBackfillRepository)
{
  public CartaoBackfillExecutionResponseDTO Executar(Guid usuarioId, Guid previewExecutionId)
  {
    var preview = cartaoBackfillRepository.ObterExecucao(previewExecutionId, usuarioId);
    if (preview is null)
    {
      throw new InvalidOperationException("BACKFILL_EXECUTION_INVALIDA");
    }

    if (!string.Equals(preview.Modo, CartaoBackfillModo.Preview, StringComparison.OrdinalIgnoreCase))
    {
      throw new InvalidOperationException("BACKFILL_PREVIEW_OBRIGATORIO");
    }

    if (cartaoBackfillRepository.ExisteApplyParaPreview(previewExecutionId, usuarioId))
    {
      throw new InvalidOperationException("BACKFILL_EXECUTION_INVALIDA");
    }

    var itensPreview = cartaoBackfillRepository.ListarItens(previewExecutionId, usuarioId)
      .Where(i => i.Status == CartaoBackfillStatus.Aplicavel)
      .ToList();

    var movimentosParaAtualizar = new List<Movimentacao>();
    var itensAplicados = new List<CartaoBackfillExecutionItem>();

    var applyExecution = new CartaoBackfillExecution(
      usuarioId,
      CartaoBackfillModo.Apply,
      usuarioId.ToString(),
      previewExecutionId);

    foreach (var item in itensPreview)
    {
      var movimentacao = movimentacaoRepository.ObterPorId(item.MovimentacaoId);
      if (movimentacao is not Saida saida || !saida.CartaoId.HasValue)
      {
        continue;
      }

      if (!item.DataAplicada.HasValue || !item.CompetenciaAplicada.HasValue)
      {
        continue;
      }

      saida.AtualizarDados(
        saida.Titulo,
        saida.Descricao,
        saida.Valor,
        item.DataAplicada.Value,
        saida.Fixa,
        saida.Periodo,
        saida.CategoriaId,
        saida.VeiculoId,
        saida.Km,
        saida.CartaoId,
        item.CompetenciaAplicada.Value,
        saida.TipoMovimentacaoFixa);

      movimentosParaAtualizar.Add(saida);
      itensAplicados.Add(new CartaoBackfillExecutionItem(
        applyExecution.Id,
        saida.Id,
        saida.CartaoId,
        CartaoBackfillStatus.Aplicavel,
        "APLICADO",
        saida.Descricao,
        item.DataOriginal,
        item.DataExtraida,
        item.DataAplicada,
        item.CompetenciaOriginal,
        item.CompetenciaAplicada));
    }

    if (movimentosParaAtualizar.Count > 0)
    {
      movimentacaoRepository.AtualizarEmLote(movimentosParaAtualizar);
    }

    applyExecution.DefinirTotais(
      totalAnalisado: preview.TotalAnalisado,
      totalAplicavel: preview.TotalAplicavel,
      totalAmbiguo: preview.TotalAmbiguo,
      totalIgnorado: preview.TotalIgnorado,
      totalAplicado: itensAplicados.Count,
      totalRevertido: 0);
    applyExecution.AdicionarItens(itensAplicados);
    cartaoBackfillRepository.AdicionarExecucao(applyExecution);

    return new CartaoBackfillExecutionResponseDTO
    {
      ExecutionId = applyExecution.Id,
      Modo = applyExecution.Modo,
      TotalAnalisado = applyExecution.TotalAnalisado,
      TotalAplicavel = applyExecution.TotalAplicavel,
      TotalAmbiguo = applyExecution.TotalAmbiguo,
      TotalIgnorado = applyExecution.TotalIgnorado,
      TotalAplicado = applyExecution.TotalAplicado,
      TotalRevertido = applyExecution.TotalRevertido
    };
  }
}

public class ExecutarRollbackBackfillCompetenciaCartaoUseCase(
    IMovimentacaoRepository movimentacaoRepository,
    ICartaoBackfillRepository cartaoBackfillRepository)
{
  public CartaoBackfillExecutionResponseDTO Executar(Guid usuarioId, Guid applyExecutionId)
  {
    var applyExecution = cartaoBackfillRepository.ObterExecucao(applyExecutionId, usuarioId);
    if (applyExecution is null)
    {
      throw new InvalidOperationException("BACKFILL_EXECUTION_INVALIDA");
    }

    if (!string.Equals(applyExecution.Modo, CartaoBackfillModo.Apply, StringComparison.OrdinalIgnoreCase))
    {
      throw new InvalidOperationException("BACKFILL_EXECUTION_INVALIDA");
    }

    var itensApply = cartaoBackfillRepository.ListarItens(applyExecutionId, usuarioId)
      .Where(i => i.Status == CartaoBackfillStatus.Aplicavel)
      .ToList();

    var rollbackExecution = new CartaoBackfillExecution(
      usuarioId,
      CartaoBackfillModo.Rollback,
      usuarioId.ToString(),
      applyExecutionId);

    var itensRevertidos = new List<CartaoBackfillExecutionItem>();
    var movimentosParaAtualizar = new List<Movimentacao>();

    foreach (var item in itensApply)
    {
      var movimentacao = movimentacaoRepository.ObterPorId(item.MovimentacaoId);
      if (movimentacao is not Saida saida || !saida.CartaoId.HasValue)
      {
        continue;
      }

      saida.AtualizarDados(
        saida.Titulo,
        saida.Descricao,
        saida.Valor,
        item.DataOriginal,
        saida.Fixa,
        saida.Periodo,
        saida.CategoriaId,
        saida.VeiculoId,
        saida.Km,
        saida.CartaoId,
        item.CompetenciaOriginal,
        saida.TipoMovimentacaoFixa);

      movimentosParaAtualizar.Add(saida);
      itensRevertidos.Add(new CartaoBackfillExecutionItem(
        rollbackExecution.Id,
        saida.Id,
        saida.CartaoId,
        CartaoBackfillStatus.Aplicavel,
        "REVERTIDO",
        saida.Descricao,
        item.DataAplicada ?? saida.Data,
        item.DataExtraida,
        item.DataOriginal,
        item.CompetenciaAplicada,
        item.CompetenciaOriginal));
    }

    if (movimentosParaAtualizar.Count > 0)
    {
      movimentacaoRepository.AtualizarEmLote(movimentosParaAtualizar);
    }

    rollbackExecution.DefinirTotais(
      totalAnalisado: applyExecution.TotalAnalisado,
      totalAplicavel: applyExecution.TotalAplicavel,
      totalAmbiguo: applyExecution.TotalAmbiguo,
      totalIgnorado: applyExecution.TotalIgnorado,
      totalAplicado: 0,
      totalRevertido: itensRevertidos.Count);
    rollbackExecution.AdicionarItens(itensRevertidos);
    cartaoBackfillRepository.AdicionarExecucao(rollbackExecution);

    return new CartaoBackfillExecutionResponseDTO
    {
      ExecutionId = rollbackExecution.Id,
      Modo = rollbackExecution.Modo,
      TotalAnalisado = rollbackExecution.TotalAnalisado,
      TotalAplicavel = rollbackExecution.TotalAplicavel,
      TotalAmbiguo = rollbackExecution.TotalAmbiguo,
      TotalIgnorado = rollbackExecution.TotalIgnorado,
      TotalAplicado = rollbackExecution.TotalAplicado,
      TotalRevertido = rollbackExecution.TotalRevertido
    };
  }
}

internal static partial class LegacyCardDateParser
{
  [GeneratedRegex(@"(?<![\d/-])(\d{2})([/-])(\d{2})(?![\d/-])")]
  private static partial Regex DataRegex();

  public static (string status, string motivo, DateTime? dataExtraida) ExtrairDataUnica(string? descricao, DateTime dataReferencia)
  {
    if (string.IsNullOrWhiteSpace(descricao))
    {
      return (CartaoBackfillStatus.Ignorado, "BACKFILL_DATA_NAO_ENCONTRADA", null);
    }

    var matches = DataRegex().Matches(descricao);
    if (matches.Count == 0)
    {
      return (CartaoBackfillStatus.Ignorado, "BACKFILL_DATA_NAO_ENCONTRADA", null);
    }

    if (matches.Count > 1)
    {
      return (CartaoBackfillStatus.Ambiguo, "BACKFILL_DATA_AMBIGUA", null);
    }

    var match = matches[0];
    if (!int.TryParse(match.Groups[1].Value, out var dia) ||
        !int.TryParse(match.Groups[3].Value, out var mes))
    {
      return (CartaoBackfillStatus.Ignorado, "BACKFILL_DATA_NAO_ENCONTRADA", null);
    }

    if (mes is < 1 or > 12)
    {
      return (CartaoBackfillStatus.Ignorado, "BACKFILL_DATA_NAO_ENCONTRADA", null);
    }

    var ano = dataReferencia.Year;
    if (!DateTime.TryParse($"{ano:D4}-{mes:D2}-{dia:D2}", out var dataExtraida))
    {
      return (CartaoBackfillStatus.Ignorado, "BACKFILL_DATA_NAO_ENCONTRADA", null);
    }

    return (CartaoBackfillStatus.Aplicavel, "BACKFILL_APLICAVEL", DateTime.SpecifyKind(dataExtraida, DateTimeKind.Utc));
  }
}