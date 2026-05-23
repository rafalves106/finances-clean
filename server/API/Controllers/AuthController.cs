using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Finance.Core.UseCases;
using Finance.Core.Application.DTOs;
using Finance.Core.Repositories;

namespace Finance.API.Controllers;

[ApiController]
[Route("api/v1/auth")]
public class AuthController(
LoginUseCase loginUseCase,
IUsuarioRepository usuarioRepository,
IConfiguration configuration) : ControllerBase
{
  [HttpPost("login")]
  [AllowAnonymous]
  public IActionResult Login([FromBody] LoginDTO dto)
  {
    try
    {
      var result = loginUseCase.Executar(dto);
      return Ok(result);
    }
    catch (UnauthorizedAccessException)
    {
      return Unauthorized("Email ou senha inválidos.");
    }
  }

  [HttpPost("registro")]
  [AllowAnonymous]
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