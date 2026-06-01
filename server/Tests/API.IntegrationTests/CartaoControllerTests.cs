using System.Net;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using Finance.Core.Domain;
using Finance.Core.Repositories;
using Finance.Core.Services;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace API.IntegrationTests;

public class CartaoControllerTests : IClassFixture<ApiWebApplicationFactory>
{
  private readonly ApiWebApplicationFactory _factory;

  public CartaoControllerTests(ApiWebApplicationFactory factory)
  {
    _factory = factory;
  }

  [Fact]
  public async Task CadastrarCartao_ComDadoSensivel_DeveRetornar400()
  {
    using var client = BuildAuthenticatedClient();
    using var request = BuildRequest(
        HttpMethod.Post,
        "/api/v1/cartao",
        new
        {
          nome = "Cartão Teste",
          limiteTotal = 3000,
          diaFechamento = 10,
          diaVencimento = 20,
          cvv = "123"
        });

    var response = await client.SendAsync(request);
    var body = await response.Content.ReadAsStringAsync();

    Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    Assert.Contains("CARTAO_DADO_SENSIVEL_PROIBIDO", body);
  }

  [Fact]
  public async Task CadastrarCartao_SegundoCartaoAtivo_DeveRetornar409()
  {
    using var client = BuildAuthenticatedClient();

    using var primeiroCadastro = BuildRequest(
        HttpMethod.Post,
        "/api/v1/cartao",
        new
        {
          nome = "Cartão Principal",
          limiteTotal = 4000,
          diaFechamento = 9,
          diaVencimento = 19
        });

    var primeiroResponse = await client.SendAsync(primeiroCadastro);
    Assert.Equal(HttpStatusCode.Created, primeiroResponse.StatusCode);

    using var segundoCadastro = BuildRequest(
        HttpMethod.Post,
        "/api/v1/cartao",
        new
        {
          nome = "Cartão Extra",
          limiteTotal = 2500,
          diaFechamento = 8,
          diaVencimento = 18
        });

    var segundoResponse = await client.SendAsync(segundoCadastro);
    var body = await segundoResponse.Content.ReadAsStringAsync();

    Assert.Equal(HttpStatusCode.Conflict, segundoResponse.StatusCode);
    Assert.Contains("CARTAO_ATIVO_JA_EXISTE", body);
  }

  private HttpClient BuildAuthenticatedClient()
  {
    var client = _factory.CreateClient(new Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactoryClientOptions
    {
      AllowAutoRedirect = false
    });

    using var scope = _factory.Services.CreateScope();
    var usuarioRepository = scope.ServiceProvider.GetRequiredService<IUsuarioRepository>();
    var tokenService = scope.ServiceProvider.GetRequiredService<ITokenService>();

    var usuario = new Usuario(
        nome: $"Usuário Teste {Guid.NewGuid():N}",
        email: $"cartao-{Guid.NewGuid():N}@teste.local",
        senhaHash: BCrypt.Net.BCrypt.HashPassword("SenhaForte123!"));

    usuarioRepository.Adicionar(usuario);

    var token = tokenService.GerarToken(usuario);
    client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

    return client;
  }

  private static HttpRequestMessage BuildRequest(HttpMethod method, string path, object payload)
  {
    var request = new HttpRequestMessage(method, path)
    {
      Content = new StringContent(
            JsonSerializer.Serialize(payload),
            Encoding.UTF8,
            "application/json")
    };

    request.Headers.TryAddWithoutValidation("Origin", "http://allowed.example.com");
    return request;
  }
}
