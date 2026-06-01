namespace Finance.Core.Domain;

public static class CartaoBackfillModo
{
  public const string Preview = "preview";
  public const string Apply = "apply";
  public const string Rollback = "rollback";
}

public static class CartaoBackfillStatus
{
  public const string Aplicavel = "aplicavel";
  public const string Ambiguo = "ambiguo";
  public const string Ignorado = "ignorado";
}

public class CartaoBackfillExecution
{
  public Guid Id { get; private set; }
  public Guid UsuarioId { get; private set; }
  public string Modo { get; private set; } = null!;
  public Guid? SourceExecutionId { get; private set; }
  public DateTime ExecutedAtUtc { get; private set; }
  public string ExecutedBy { get; private set; } = null!;
  public int TotalAnalisado { get; private set; }
  public int TotalAplicavel { get; private set; }
  public int TotalAmbiguo { get; private set; }
  public int TotalIgnorado { get; private set; }
  public int TotalAplicado { get; private set; }
  public int TotalRevertido { get; private set; }

  public List<CartaoBackfillExecutionItem> Itens { get; private set; } = [];

  protected CartaoBackfillExecution() { }

  public CartaoBackfillExecution(
      Guid usuarioId,
      string modo,
      string executedBy,
      Guid? sourceExecutionId = null)
  {
    if (usuarioId == Guid.Empty)
    {
      throw new ArgumentException("Usuário inválido para execução de backfill.", nameof(usuarioId));
    }

    if (string.IsNullOrWhiteSpace(modo))
    {
      throw new ArgumentException("Modo da execução é obrigatório.", nameof(modo));
    }

    if (string.IsNullOrWhiteSpace(executedBy))
    {
      throw new ArgumentException("Operador da execução é obrigatório.", nameof(executedBy));
    }

    Id = Guid.NewGuid();
    UsuarioId = usuarioId;
    Modo = modo.Trim().ToLowerInvariant();
    SourceExecutionId = sourceExecutionId;
    ExecutedBy = executedBy.Trim();
    ExecutedAtUtc = DateTime.UtcNow;
  }

  public void DefinirTotais(
      int totalAnalisado,
      int totalAplicavel,
      int totalAmbiguo,
      int totalIgnorado,
      int totalAplicado,
      int totalRevertido)
  {
    TotalAnalisado = totalAnalisado;
    TotalAplicavel = totalAplicavel;
    TotalAmbiguo = totalAmbiguo;
    TotalIgnorado = totalIgnorado;
    TotalAplicado = totalAplicado;
    TotalRevertido = totalRevertido;
  }

  public void AdicionarItens(IEnumerable<CartaoBackfillExecutionItem> itens)
  {
    Itens.AddRange(itens);
  }
}

public class CartaoBackfillExecutionItem
{
  public Guid Id { get; private set; }
  public Guid ExecutionId { get; private set; }
  public Guid MovimentacaoId { get; private set; }
  public Guid? CartaoId { get; private set; }
  public string Status { get; private set; } = null!;
  public string MotivoStatus { get; private set; } = null!;
  public string? DescricaoOriginal { get; private set; }
  public DateTime DataOriginal { get; private set; }
  public DateTime? DataExtraida { get; private set; }
  public DateTime? DataAplicada { get; private set; }
  public int? CompetenciaOriginal { get; private set; }
  public int? CompetenciaAplicada { get; private set; }

  protected CartaoBackfillExecutionItem() { }

  public CartaoBackfillExecutionItem(
      Guid executionId,
      Guid movimentacaoId,
      Guid? cartaoId,
      string status,
      string motivoStatus,
      string? descricaoOriginal,
      DateTime dataOriginal,
      DateTime? dataExtraida,
      DateTime? dataAplicada,
      int? competenciaOriginal,
      int? competenciaAplicada)
  {
    Id = Guid.NewGuid();
    ExecutionId = executionId;
    MovimentacaoId = movimentacaoId;
    CartaoId = cartaoId;
    Status = status;
    MotivoStatus = motivoStatus;
    DescricaoOriginal = descricaoOriginal;
    DataOriginal = dataOriginal;
    DataExtraida = dataExtraida;
    DataAplicada = dataAplicada;
    CompetenciaOriginal = competenciaOriginal;
    CompetenciaAplicada = competenciaAplicada;
  }
}