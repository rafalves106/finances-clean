namespace Finance.Core.Domain;

public static class FaturaAgregadaStatus
{
  public const string Aberta = "aberta";
  public const string Fechada = "fechada";
}

public class FaturaAgregada
{
  public Guid Id { get; private set; }
  public Guid UsuarioId { get; private set; }
  public Guid CartaoId { get; private set; }
  public int Ciclo { get; private set; }
  public DateTime Vencimento { get; private set; }
  public decimal ValorTotal { get; private set; }
  public string Status { get; private set; } = FaturaAgregadaStatus.Aberta;
  public Guid? MovimentacaoId { get; private set; }
  public DateTime CreatedAtUtc { get; private set; }
  public DateTime UpdatedAtUtc { get; private set; }

  protected FaturaAgregada() { }

  public FaturaAgregada(Guid usuarioId, Guid cartaoId, int ciclo, DateTime vencimento)
  {
    if (usuarioId == Guid.Empty)
    {
      throw new ArgumentException("Usuário inválido para fatura agregada.", nameof(usuarioId));
    }

    if (cartaoId == Guid.Empty)
    {
      throw new ArgumentException("Cartão inválido para fatura agregada.", nameof(cartaoId));
    }

    if (ciclo < 190001)
    {
      throw new ArgumentException("Ciclo inválido para fatura agregada.", nameof(ciclo));
    }

    Id = Guid.NewGuid();
    UsuarioId = usuarioId;
    CartaoId = cartaoId;
    Ciclo = ciclo;
    Vencimento = DateTime.SpecifyKind(vencimento, DateTimeKind.Utc);
    ValorTotal = 0m;
    CreatedAtUtc = DateTime.UtcNow;
    UpdatedAtUtc = DateTime.UtcNow;
  }

  public void AtualizarValor(decimal valorTotal)
  {
    if (valorTotal < 0)
    {
      throw new ArgumentException("Valor total da fatura não pode ser negativo.", nameof(valorTotal));
    }

    ValorTotal = valorTotal;
    UpdatedAtUtc = DateTime.UtcNow;
  }

  public void DefinirStatus(string status)
  {
    if (status != FaturaAgregadaStatus.Aberta && status != FaturaAgregadaStatus.Fechada)
    {
      throw new ArgumentException("Status de fatura inválido.", nameof(status));
    }

    Status = status;
    UpdatedAtUtc = DateTime.UtcNow;
  }

  public void VincularMovimentacao(Guid movimentacaoId)
  {
    if (movimentacaoId == Guid.Empty)
    {
      throw new ArgumentException("Movimentação inválida para vínculo da fatura.", nameof(movimentacaoId));
    }

    MovimentacaoId = movimentacaoId;
    UpdatedAtUtc = DateTime.UtcNow;
  }
}