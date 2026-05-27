namespace Finance.Core.Domain;

public class Categoria
{
  public Guid Id { get; private set; }
  public Guid UsuarioId { get; private set; }
  public bool IsGlobal { get; private set; }
  public string Nome { get; private set; } = null!;
  public string? Icone { get; private set; }
  public string? Cor { get; private set; }
  public decimal? OrcamentoMensal { get; private set; }

  protected Categoria() { }

  public Categoria(string nome, Guid usuarioId, string? icone = null, string? cor = null, decimal? orcamentoMensal = null)
  {
    Validar(nome, icone, cor, orcamentoMensal);

    Id = Guid.NewGuid();
    UsuarioId = usuarioId;
    IsGlobal = false;
    Nome = nome;
    Icone = icone;
    Cor = cor;
    OrcamentoMensal = orcamentoMensal;
  }

  public static Categoria CriarGlobal(string nome, string? icone = null, string? cor = null)
  {
    Validar(nome, icone, cor, null);

    return new Categoria
    {
      Id = Guid.NewGuid(),
      UsuarioId = Guid.Empty,
      IsGlobal = true,
      Nome = nome,
      Icone = icone,
      Cor = cor,
      OrcamentoMensal = null
    };
  }

  public void Atualizar(string nome, string? icone, string? cor)
  {
    Validar(nome, icone, cor, OrcamentoMensal);

    Nome = nome;
    Icone = icone;
    Cor = cor;
  }

  public void AtualizarOrcamentoMensal(decimal? orcamentoMensal)
  {
    ValidarOrcamento(orcamentoMensal);
    OrcamentoMensal = orcamentoMensal;
  }

  private static void Validar(string nome, string? icone, string? cor, decimal? orcamentoMensal)
  {
    if (string.IsNullOrWhiteSpace(nome))
      throw new ArgumentException("Nome é obrigatório.", nameof(nome));

    if (nome.Length > 100)
      throw new ArgumentException("O nome deve ter no máximo 100 caracteres.", nameof(nome));

    if (icone is not null && icone.Length > 10)
      throw new ArgumentException("O ícone deve ter no máximo 10 caracteres.", nameof(icone));

    if (cor is not null && cor.Length > 7)
      throw new ArgumentException("A cor deve ter no máximo 7 caracteres.", nameof(cor));

    ValidarOrcamento(orcamentoMensal);
  }

  private static void ValidarOrcamento(decimal? orcamentoMensal)
  {
    if (orcamentoMensal.HasValue && orcamentoMensal.Value <= 0)
      throw new ArgumentException("O orçamento mensal deve ser maior que zero.", nameof(orcamentoMensal));
  }
}