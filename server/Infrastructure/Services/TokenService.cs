using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Finance.Core.Domain;
using Finance.Core.Services;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;

namespace Finance.Infrastructure.Services;

public class TokenService(IConfiguration _configuration) : ITokenService
{
  public string GerarToken(Usuario usuario)
  {
    var key = new SymmetricSecurityKey(
        Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]!));

    var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

    var claims = new[]
    {
          new Claim(ClaimTypes.NameIdentifier, usuario.Id.ToString()),
          new Claim(ClaimTypes.Email, usuario.Email),
          new Claim(ClaimTypes.Name, usuario.Nome),
      };

    var expiryDays = int.Parse(_configuration["Jwt:ExpiryDays"] ?? "7");

    var token = new JwtSecurityToken(
        issuer: _configuration["Jwt:Issuer"],
        audience: _configuration["Jwt:Audience"],
        claims: claims,
        expires: DateTime.UtcNow.AddDays(expiryDays),
        signingCredentials: credentials);

    return new JwtSecurityTokenHandler().WriteToken(token);
  }
}