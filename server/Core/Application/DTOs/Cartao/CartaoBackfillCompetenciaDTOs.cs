namespace Finance.Core.Application.DTOs;

public class CartaoBackfillPreviewRequestDTO
{
  public DateTime? DataInicio { get; set; }
  public DateTime? DataFim { get; set; }
}

public class CartaoBackfillApplyRequestDTO
{
  public Guid ExecutionId { get; set; }
}

public class CartaoBackfillRollbackRequestDTO
{
  public Guid ExecutionId { get; set; }
}

public class CartaoBackfillExecutionResponseDTO
{
  public Guid ExecutionId { get; set; }
  public string Modo { get; set; } = null!;
  public int TotalAnalisado { get; set; }
  public int TotalAplicavel { get; set; }
  public int TotalAmbiguo { get; set; }
  public int TotalIgnorado { get; set; }
  public int TotalAplicado { get; set; }
  public int TotalRevertido { get; set; }
}