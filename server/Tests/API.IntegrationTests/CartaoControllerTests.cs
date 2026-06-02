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
  public async Task CadastrarCartao_QuartoCartaoAtivo_DeveRetornar409()
  {
    using var client = BuildAuthenticatedClient();

    for (var i = 1; i <= 3; i++)
    {
      using var cadastro = BuildRequest(
          HttpMethod.Post,
          "/api/v1/cartao",
          new
          {
            nome = $"Cartão {i}",
            limiteTotal = 2000 + (i * 500),
            diaFechamento = 7 + i,
            diaVencimento = 17 + i
          });

      var response = await client.SendAsync(cadastro);
      Assert.Equal(HttpStatusCode.Created, response.StatusCode);
    }

    using var quartoCadastro = BuildRequest(
        HttpMethod.Post,
        "/api/v1/cartao",
        new
        {
          nome = "Cartão 4",
          limiteTotal = 3500,
          diaFechamento = 12,
          diaVencimento = 22
        });

    var quartoResponse = await client.SendAsync(quartoCadastro);
    var body = await quartoResponse.Content.ReadAsStringAsync();

    Assert.Equal(HttpStatusCode.Conflict, quartoResponse.StatusCode);
    Assert.Contains("CARTAO_LIMITE_ATIVOS_EXCEDIDO", body);
  }

  [Fact]
  public async Task InativarCartao_ComTresAtivosEAdicionarNovo_DevePermitirNovoCadastro()
  {
    using var client = BuildAuthenticatedClient();
    Guid? ultimoCartaoId = null;

    for (var i = 1; i <= 3; i++)
    {
      using var cadastro = BuildRequest(
          HttpMethod.Post,
          "/api/v1/cartao",
          new
          {
            nome = $"Cartão ativo {i}",
            limiteTotal = 1500 + (i * 400),
            diaFechamento = 6 + i,
            diaVencimento = 16 + i
          });

      var response = await client.SendAsync(cadastro);
      Assert.Equal(HttpStatusCode.Created, response.StatusCode);

      var payload = await response.Content.ReadAsStringAsync();
      using var document = JsonDocument.Parse(payload);
      ultimoCartaoId = document.RootElement.GetProperty("id").GetGuid();
    }

    Assert.True(ultimoCartaoId.HasValue);

    using var inativacao = new HttpRequestMessage(HttpMethod.Delete, $"/api/v1/cartao/{ultimoCartaoId.Value}");
    inativacao.Headers.TryAddWithoutValidation("Origin", "http://allowed.example.com");
    var inativarResponse = await client.SendAsync(inativacao);
    Assert.Equal(HttpStatusCode.NoContent, inativarResponse.StatusCode);

    using var novoCadastro = BuildRequest(
        HttpMethod.Post,
        "/api/v1/cartao",
        new
        {
          nome = "Cartão pós-inativação",
          limiteTotal = 3900,
          diaFechamento = 11,
          diaVencimento = 21
        });

    var novoResponse = await client.SendAsync(novoCadastro);
    Assert.Equal(HttpStatusCode.Created, novoResponse.StatusCode);
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
