namespace Finance.Core.Services;

public interface IPasswordHasher
{
  string Hash(string senha);
  bool Verify(string senha, string senhaHash);
}
