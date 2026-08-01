namespace Finance.Core.Domain;

public class Usuario
{
  public Guid Id { get; private set; }
  public string Nome { get; private set; } = null!;
  public string Email { get; private set; } = null!;
  public string SenhaHash { get; private set; } = null!;
  public bool Ativo { get; private set; }
  public bool IsAdmin { get; private set; }

  protected Usuario() { }

  public Usuario(string nome, string email, string senhaHash, bool ativo = true)
  {
    if (string.IsNullOrWhiteSpace(nome)) throw new ArgumentException("Nome obrigatório.");
    if (string.IsNullOrWhiteSpace(email)) throw new ArgumentException("Email obrigatório.");

    Id = Guid.NewGuid();
    Nome = nome;
    Email = email.ToLower().Trim();
    SenhaHash = senhaHash;
    Ativo = ativo;
    IsAdmin = false;
  }

  public void Ativar() => Ativo = true;
}