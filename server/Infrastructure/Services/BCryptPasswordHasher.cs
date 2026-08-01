using Finance.Core.Services;

namespace Finance.Infrastructure.Services;

public class BCryptPasswordHasher : IPasswordHasher
{
  public string Hash(string senha) => BCrypt.Net.BCrypt.HashPassword(senha);

  public bool Verify(string senha, string senhaHash) =>
      BCrypt.Net.BCrypt.Verify(senha, senhaHash);
}
