using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.RateLimiting;
using Finance.Core.UseCases;
using Finance.Core.Application.DTOs;
using Finance.Core.Repositories;

namespace Finance.API.Controllers;

public sealed record LoginResponseDTO(string Nome, string Email);

[ApiController]
[Route("api/v1/auth")]
public class AuthController(
LoginUseCase loginUseCase,
IUsuarioRepository usuarioRepository,
IConfiguration configuration) : ControllerBase
{
  [HttpPost("login")]
  [AllowAnonymous]
  [EnableRateLimiting("AuthPublicPolicy")]
  public IActionResult Login([FromBody] LoginDTO dto)
  {
    try
    {
      var result = loginUseCase.Executar(dto);
      var expiryMinutesRaw = configuration["Jwt:ExpiryMinutes"] ?? "60";

      if (!int.TryParse(expiryMinutesRaw, out var expiryMinutes) || expiryMinutes <= 0 || expiryMinutes > 60)
      {
        throw new InvalidOperationException("Jwt:ExpiryMinutes deve ser um inteiro entre 1 e 60.");
      }

      Response.Cookies.Append("finance_auth_token", result.Token, new CookieOptions
      {
        HttpOnly = true,
        Secure = true,
        SameSite = SameSiteMode.None,
        Path = "/",
        Expires = DateTimeOffset.UtcNow.AddMinutes(expiryMinutes)
      });

      return Ok(new LoginResponseDTO(result.Nome, result.Email));
    }
    catch (UnauthorizedAccessException)
    {
      return Unauthorized("Email ou senha inválidos.");
    }
  }

  [HttpPost("logout")]
  [AllowAnonymous]
  [EnableRateLimiting("AuthPublicPolicy")]
  public IActionResult Logout()
  {
    Response.Cookies.Append("finance_auth_token", string.Empty, new CookieOptions
    {
      HttpOnly = true,
      Secure = true,
      SameSite = SameSiteMode.None,
      Path = "/",
      Expires = DateTimeOffset.UtcNow.AddDays(-1)
    });

    return NoContent();
  }

  [HttpPost("registro")]
  [AllowAnonymous]
  [EnableRateLimiting("AuthPublicPolicy")]
  public IActionResult Registro(
      [FromBody] RegistroDTO dto,
      [FromHeader(Name = "X-Admin-Key")] string? adminKey)
  {
    var chaveEsperada = configuration["AdminKey"];

    if (string.IsNullOrEmpty(chaveEsperada) || adminKey != chaveEsperada)
      return Unauthorized("Chave de admin inválida.");

    if (usuarioRepository.ExistePorEmail(dto.Email))
      return BadRequest("Email já cadastrado.");

    var senhaHash = BCrypt.Net.BCrypt.HashPassword(dto.Senha);
    var usuario = new Finance.Core.Domain.Usuario(dto.Nome, dto.Email, senhaHash);

    usuarioRepository.Adicionar(usuario);

    return CreatedAtAction(nameof(Login), new { id = usuario.Id },
        new { usuario.Id, usuario.Email, usuario.Nome });
  }
}