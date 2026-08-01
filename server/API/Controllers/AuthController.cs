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
Finance.Core.Services.ITokenService tokenService,
Finance.Core.Services.IPasswordHasher passwordHasher,
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
      EmitirCookieDeSessao(result.Token);

      return Ok(new LoginResponseDTO(result.Nome, result.Email));
    }
    catch (UnauthorizedAccessException)
    {
      return Unauthorized("Email ou senha inválidos.");
    }
    catch (ContaNaoAtivadaException)
    {
      return StatusCode(StatusCodes.Status403Forbidden, new
      {
        code = "CONTA_NAO_ATIVADA",
        message = "Conta ainda não ativada. Informe o código de ativação."
      });
    }
  }

  [HttpPost("ativar")]
  [AllowAnonymous]
  [EnableRateLimiting("AuthPublicPolicy")]
  public IActionResult Ativar([FromBody] AtivacaoDTO dto)
  {
    var codigoEsperado = configuration["CodigoAtivacao"];

    if (string.IsNullOrEmpty(codigoEsperado) || dto.Codigo != codigoEsperado)
      return Unauthorized("Código de ativação inválido.");

    var usuario = usuarioRepository.BuscarPorEmail(dto.Email);

    if (usuario is null || !passwordHasher.Verify(dto.Senha, usuario.SenhaHash))
      return Unauthorized("Email ou senha inválidos.");

    if (!usuario.Ativo)
    {
      usuario.Ativar();
      usuarioRepository.Atualizar(usuario);
    }

    var token = tokenService.GerarToken(usuario);
    EmitirCookieDeSessao(token);

    return Ok(new LoginResponseDTO(usuario.Nome, usuario.Email));
  }

  private void EmitirCookieDeSessao(string token)
  {
    var expiryMinutesRaw = configuration["Jwt:ExpiryMinutes"] ?? "60";

    if (!int.TryParse(expiryMinutesRaw, out var expiryMinutes) || expiryMinutes <= 0 || expiryMinutes > 60)
    {
      throw new InvalidOperationException("Jwt:ExpiryMinutes deve ser um inteiro entre 1 e 60.");
    }

    Response.Cookies.Append("finance_auth_token", token, new CookieOptions
    {
      HttpOnly = true,
      Secure = true,
      SameSite = SameSiteMode.None,
      Path = "/",
      Expires = DateTimeOffset.UtcNow.AddMinutes(expiryMinutes)
    });
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

    var senhaHash = passwordHasher.Hash(dto.Senha);
    var usuario = new Finance.Core.Domain.Usuario(dto.Nome, dto.Email, senhaHash);

    usuarioRepository.Adicionar(usuario);

    return CreatedAtAction(nameof(Login), new { id = usuario.Id },
        new { usuario.Id, usuario.Email, usuario.Nome });
  }

  [HttpPost("registro-publico")]
  [AllowAnonymous]
  [EnableRateLimiting("AuthPublicPolicy")]
  public IActionResult RegistroPublico([FromBody] RegistroDTO dto)
  {
    if (usuarioRepository.ExistePorEmail(dto.Email))
      return BadRequest("Email já cadastrado.");

    var senhaHash = passwordHasher.Hash(dto.Senha);
    var usuario = new Finance.Core.Domain.Usuario(dto.Nome, dto.Email, senhaHash, ativo: false);

    usuarioRepository.Adicionar(usuario);

    return StatusCode(StatusCodes.Status201Created, new
    {
      message = "Conta criada. Peça o código de ativação ao administrador da plataforma para acessar."
    });
  }
}