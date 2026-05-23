using System.Security.Claims;
using Finance.Core.Services;
using Microsoft.AspNetCore.Http;

namespace Finance.Infrastructure.Services;

public class CurrentUserService(IHttpContextAccessor _httpContextAccessor) : ICurrentUserService
{
  public Guid? UsuarioId
  {
    get
    {
      var claim = _httpContextAccessor.HttpContext?.User
          .FindFirst(ClaimTypes.NameIdentifier)?.Value;
      return Guid.TryParse(claim, out var id) ? id : null;
    }
  }
}