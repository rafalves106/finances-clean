namespace Finance.Core.Domain;

public class Usuario
{
  public Guid Id { get; private set; }
  public string Nome { get; private set; } = null!;
  public string Email { get; private set; } = null!;
  public string SenhaHash { get; private set; } = null!;

  protected Usuario() { }

  public Usuario(string nome, string email, string senhaHash)
  {
    if (string.IsNullOrWhiteSpace(nome)) throw new ArgumentException("Nome obrigatório.");
    if (string.IsNullOrWhiteSpace(email)) throw new ArgumentException("Email obrigatório.");

    Id = Guid.NewGuid();
    Nome = nome;
    Email = email.ToLower().Trim();
    SenhaHash = senhaHash;
  }

  public bool VerificarSenha(string senha) =>
      BCrypt.Net.BCrypt.Verify(senha, SenhaHash);
}