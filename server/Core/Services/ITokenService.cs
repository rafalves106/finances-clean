using Finance.Core.Domain;

namespace Finance.Core.Services;

public interface ITokenService
{
  string GerarToken(Usuario usuario);
}