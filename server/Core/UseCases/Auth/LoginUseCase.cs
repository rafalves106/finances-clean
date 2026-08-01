using Finance.Core.Application.DTOs;
using Finance.Core.Repositories;
using Finance.Core.Services;

namespace Finance.Core.UseCases;

public class LoginUseCase(
  IUsuarioRepository _usuarioRepository,
  ITokenService _tokenService,
  IPasswordHasher _passwordHasher)
{
  public AuthResponseDTO Executar(LoginDTO dto)
  {
    var usuario = _usuarioRepository.BuscarPorEmail(dto.Email)
        ?? throw new UnauthorizedAccessException("Email ou senha inválidos.");

    if (!_passwordHasher.Verify(dto.Senha, usuario.SenhaHash))
      throw new UnauthorizedAccessException("Email ou senha inválidos.");

    if (!usuario.Ativo)
      throw new ContaNaoAtivadaException();

    var token = _tokenService.GerarToken(usuario);

    return new AuthResponseDTO(token, usuario.Nome, usuario.Email);
  }
}