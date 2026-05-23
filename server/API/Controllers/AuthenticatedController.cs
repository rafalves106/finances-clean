using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Finance.API.Controllers;

[ApiController]
[Authorize]
public abstract class AuthenticatedController : ControllerBase
{
  protected Guid UsuarioId =>
      Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
}