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

public class MetasControllerTests : IClassFixture<ApiWebApplicationFactory>
{
  private readonly ApiWebApplicationFactory _factory;

  public MetasControllerTests(ApiWebApplicationFactory factory)
  {
    _factory = factory;
  }

  [Fact]
  public async Task Listar_MetaVinculadaACategoria_DeveCalcularProgressoPelasMovimentacoes()
  {
    using var client = BuildAuthenticatedClient();

    var categoriaId = await CriarCategoria(client, "Viagem");

    using var metaRequest = BuildRequest(
        HttpMethod.Post,
        "/api/v1/metas",
        new { descricao = "Viagem para a praia", valor = 1000, categoriaId });
    var metaResponse = await client.SendAsync(metaRequest);
    Assert.Equal(HttpStatusCode.Created, metaResponse.StatusCode);

    await CriarMovimentacao(client, "Entrada", 600, categoriaId);
    await CriarMovimentacao(client, "Saida", 100, categoriaId);

    var metas = await ListarMetas(client);
    var meta = metas.EnumerateArray().Single();

    Assert.Equal(500m, meta.GetProperty("valorAcumulado").GetDecimal());
    Assert.Equal(50m, meta.GetProperty("percentualProgresso").GetDecimal());
  }

  [Fact]
  public async Task Listar_MetaVinculadaAInvestimento_DeveUsarSaldoAtualComoProgresso()
  {
    using var client = BuildAuthenticatedClient();

    using var investimentoRequest = BuildRequest(
        HttpMethod.Post,
        "/api/v1/investimentos",
        new
        {
          nome = "Tesouro Selic",
          instituicao = "Corretora Teste",
          tipo = "TesouroDireto",
          valorAplicado = 2000,
          dataInicio = new DateTime(2026, 1, 1),
          tipoRentabilidade = "PosFixado",
          liquidez = "Diaria"
        });
    var investimentoResponse = await client.SendAsync(investimentoRequest);
    Assert.Equal(HttpStatusCode.Created, investimentoResponse.StatusCode);
    using var investimentoDocument = JsonDocument.Parse(await investimentoResponse.Content.ReadAsStringAsync());
    var investimentoId = investimentoDocument.RootElement.GetProperty("id").GetGuid();

    using var metaRequest = BuildRequest(
        HttpMethod.Post,
        "/api/v1/metas",
        new { descricao = "Reserva de emergência", valor = 4000, investimentoId });
    var metaResponse = await client.SendAsync(metaRequest);
    Assert.Equal(HttpStatusCode.Created, metaResponse.StatusCode);

    var metas = await ListarMetas(client);
    var meta = metas.EnumerateArray().Single();

    Assert.Equal(2000m, meta.GetProperty("valorAcumulado").GetDecimal());
    Assert.Equal(50m, meta.GetProperty("percentualProgresso").GetDecimal());
  }

  [Fact]
  public async Task Criar_MetaComCategoriaEInvestimentoAoMesmoTempo_DeveRetornar400()
  {
    using var client = BuildAuthenticatedClient();

    var categoriaId = await CriarCategoria(client, "Categoria qualquer");

    using var metaRequest = BuildRequest(
        HttpMethod.Post,
        "/api/v1/metas",
        new
        {
          descricao = "Meta invalida",
          valor = 100,
          categoriaId,
          investimentoId = Guid.NewGuid(),
        });
    var metaResponse = await client.SendAsync(metaRequest);

    Assert.Equal(HttpStatusCode.BadRequest, metaResponse.StatusCode);
  }

  private static async Task<Guid> CriarCategoria(HttpClient client, string nome)
  {
    using var request = BuildRequest(
        HttpMethod.Post,
        "/api/v1/categorias",
        new { nome, icone = "🎯", cor = "#4f46e5", orcamentoMensal = (decimal?)null });
    var response = await client.SendAsync(request);
    Assert.Equal(HttpStatusCode.Created, response.StatusCode);
    using var document = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
    return document.RootElement.GetProperty("id").GetGuid();
  }

  private static async Task CriarMovimentacao(HttpClient client, string tipo, decimal valor, Guid categoriaId)
  {
    using var request = BuildRequest(
        HttpMethod.Post,
        "/api/v1/movimentacoes",
        new
        {
          titulo = "Depósito meta",
          valor,
          data = DateTime.UtcNow,
          tipo,
          categoriaId,
        });
    var response = await client.SendAsync(request);
    Assert.Equal(HttpStatusCode.Created, response.StatusCode);
  }

  private static async Task<JsonElement> ListarMetas(HttpClient client)
  {
    using var request = new HttpRequestMessage(HttpMethod.Get, "/api/v1/metas");
    request.Headers.TryAddWithoutValidation("Origin", "http://allowed.example.com");
    var response = await client.SendAsync(request);
    Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    using var document = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
    return document.RootElement.Clone();
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
        email: $"metas-{Guid.NewGuid():N}@teste.local",
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
