namespace Finance.Core.Domain;

public class CartaoManual
{
  public Guid Id { get; private set; }
  public Guid UsuarioId { get; private set; }
  public string Nome { get; private set; } = null!;
  public decimal LimiteTotal { get; private set; }
  public int DiaFechamento { get; private set; }
  public int DiaVencimento { get; private set; }
  public string? CorTema { get; private set; }
  public bool Ativo { get; private set; }
  public DateTime CreatedAtUtc { get; private set; }
  public DateTime UpdatedAtUtc { get; private set; }

  protected CartaoManual() { }

  public CartaoManual(
      Guid usuarioId,
      string nome,
      decimal limiteTotal,
      int diaFechamento,
      int diaVencimento,
      string? corTema = null)
  {
    ValidarNome(nome);
    ValidarLimite(limiteTotal);
    ValidarCiclo(diaFechamento, diaVencimento);

    Id = Guid.NewGuid();
    UsuarioId = usuarioId;
    Nome = nome.Trim();
    LimiteTotal = limiteTotal;
    DiaFechamento = diaFechamento;
    DiaVencimento = diaVencimento;
    CorTema = NormalizarCorTema(corTema);
    Ativo = true;
    CreatedAtUtc = DateTime.UtcNow;
    UpdatedAtUtc = DateTime.UtcNow;
  }

  public void Editar(string nome, decimal limiteTotal, int diaFechamento, int diaVencimento, string? corTema = null)
  {
    ValidarNome(nome);
    ValidarLimite(limiteTotal);
    ValidarCiclo(diaFechamento, diaVencimento);

    Nome = nome.Trim();
    LimiteTotal = limiteTotal;
    DiaFechamento = diaFechamento;
    DiaVencimento = diaVencimento;
    CorTema = NormalizarCorTema(corTema);
    UpdatedAtUtc = DateTime.UtcNow;
  }

  public void Inativar()
  {
    if (!Ativo)
    {
      return;
    }

    Ativo = false;
    UpdatedAtUtc = DateTime.UtcNow;
  }

  private static void ValidarNome(string nome)
  {
    if (string.IsNullOrWhiteSpace(nome))
    {
      throw new ArgumentException("Nome do cartão é obrigatório.", nameof(nome));
    }

    if (nome.Trim().Length > 100)
    {
      throw new ArgumentException("Nome do cartão deve ter no máximo 100 caracteres.", nameof(nome));
    }
  }

  private static void ValidarLimite(decimal limiteTotal)
  {
    if (limiteTotal <= 0)
    {
      throw new ArgumentException("Limite total deve ser maior que zero.", nameof(limiteTotal));
    }
  }

  private static void ValidarCiclo(int diaFechamento, int diaVencimento)
  {
    if (diaFechamento is < 1 or > 31)
    {
      throw new ArgumentException("Dia de fechamento deve estar entre 1 e 31.", nameof(diaFechamento));
    }

    if (diaVencimento is < 1 or > 31)
    {
      throw new ArgumentException("Dia de vencimento deve estar entre 1 e 31.", nameof(diaVencimento));
    }
  }

  private static string? NormalizarCorTema(string? corTema)
  {
    if (string.IsNullOrWhiteSpace(corTema))
    {
      return null;
    }

    var normalized = corTema.Trim();
    if (!System.Text.RegularExpressions.Regex.IsMatch(normalized, "^#[0-9a-fA-F]{6}$"))
    {
      throw new ArgumentException("Cor tema deve estar no formato #RRGGBB.", nameof(corTema));
    }

    return normalized.ToUpperInvariant();
  }
}
