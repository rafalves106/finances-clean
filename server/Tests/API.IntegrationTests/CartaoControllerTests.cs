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

  [Fact]
  public async Task ListarResumos_ComMesEAnoDeCompetenciaPassada_DeveRetornarSoAFaturaDaquelaCompetencia()
  {
    using var client = BuildAuthenticatedClient();

    using var cadastro = BuildRequest(
        HttpMethod.Post,
        "/api/v1/cartao",
        new
        {
          nome = "Cartão Histórico",
          limiteTotal = 2000,
          diaFechamento = 10,
          diaVencimento = 20
        });
    var cadastroResponse = await client.SendAsync(cadastro);
    Assert.Equal(HttpStatusCode.Created, cadastroResponse.StatusCode);
    using var cadastroDocument = JsonDocument.Parse(await cadastroResponse.Content.ReadAsStringAsync());
    var cartaoId = cadastroDocument.RootElement.GetProperty("id").GetGuid();

    // dia 15/abril (>= fechamento 10) cai na competencia de maio (202605)
    await CriarCompraNoCartao(client, cartaoId, valor: 500, data: new DateTime(2026, 4, 15));
    // dia 20/maio (>= fechamento 10) cai na competencia de junho (202606)
    await CriarCompraNoCartao(client, cartaoId, valor: 700, data: new DateTime(2026, 5, 20));

    var resumoMaio = await ObterResumos(client, mes: 5, ano: 2026);
    Assert.Equal(500m, resumoMaio.GetProperty("limite").GetProperty("utilizado").GetDecimal());

    var resumoJunho = await ObterResumos(client, mes: 6, ano: 2026);
    Assert.Equal(700m, resumoJunho.GetProperty("limite").GetProperty("utilizado").GetDecimal());
    Assert.Equal(0m, resumoJunho.GetProperty("previsaoFatura").GetProperty("proxima").GetDecimal());
  }

  [Fact]
  public async Task ObterPrevisaoFutura_ComComprasEmCompetenciasDiferentes_DeveSomarPorMes()
  {
    using var client = BuildAuthenticatedClient();

    using var cadastro = BuildRequest(
        HttpMethod.Post,
        "/api/v1/cartao",
        new
        {
          nome = "Cartão Futuro",
          limiteTotal = 5000,
          diaFechamento = 28,
          diaVencimento = 5
        });
    var cadastroResponse = await client.SendAsync(cadastro);
    Assert.Equal(HttpStatusCode.Created, cadastroResponse.StatusCode);
    using var cadastroDocument = JsonDocument.Parse(await cadastroResponse.Content.ReadAsStringAsync());
    var cartaoId = cadastroDocument.RootElement.GetProperty("id").GetGuid();

    // dia 1 do mes, com fechamento 28, sempre cai na competencia do proprio mes.
    var competenciaAtual = CompetenciaFaturaCalculator.CalcularCompetencia(DateTime.UtcNow, 28);
    var competenciaProxima = CompetenciaFaturaCalculator.ProximaCompetencia(competenciaAtual);

    await CriarCompraNoCartao(client, cartaoId, valor: 300, data: PrimeiroDiaDaCompetencia(competenciaAtual));
    await CriarCompraNoCartao(client, cartaoId, valor: 450, data: PrimeiroDiaDaCompetencia(competenciaProxima));

    using var request = new HttpRequestMessage(
        HttpMethod.Get, $"/api/v1/cartao/{cartaoId}/previsao-futura?meses=3");
    request.Headers.TryAddWithoutValidation("Origin", "http://allowed.example.com");
    var response = await client.SendAsync(request);
    Assert.Equal(HttpStatusCode.OK, response.StatusCode);

    using var document = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
    var meses = document.RootElement.GetProperty("meses").EnumerateArray().ToList();

    Assert.Equal(3, meses.Count);
    Assert.Equal(competenciaAtual, meses[0].GetProperty("competencia").GetInt32());
    Assert.Equal(300m, meses[0].GetProperty("valor").GetDecimal());
    Assert.Equal(competenciaProxima, meses[1].GetProperty("competencia").GetInt32());
    Assert.Equal(450m, meses[1].GetProperty("valor").GetDecimal());
    Assert.Equal(0m, meses[2].GetProperty("valor").GetDecimal());
  }

  [Fact]
  public async Task ObterPrevisaoFutura_ComCartaoDeOutroUsuario_DeveRetornar404()
  {
    using var client = BuildAuthenticatedClient();
    using var outroClient = BuildAuthenticatedClient();

    using var cadastro = BuildRequest(
        HttpMethod.Post,
        "/api/v1/cartao",
        new { nome = "Cartão privado", limiteTotal = 1000, diaFechamento = 10, diaVencimento = 20 });
    var cadastroResponse = await client.SendAsync(cadastro);
    using var cadastroDocument = JsonDocument.Parse(await cadastroResponse.Content.ReadAsStringAsync());
    var cartaoId = cadastroDocument.RootElement.GetProperty("id").GetGuid();

    using var request = new HttpRequestMessage(
        HttpMethod.Get, $"/api/v1/cartao/{cartaoId}/previsao-futura");
    request.Headers.TryAddWithoutValidation("Origin", "http://allowed.example.com");
    var response = await outroClient.SendAsync(request);

    Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
  }

  [Fact]
  public async Task ObterPrevisaoFutura_ComMesesForaDoIntervalo_DeveRetornar400()
  {
    using var client = BuildAuthenticatedClient();

    using var cadastro = BuildRequest(
        HttpMethod.Post,
        "/api/v1/cartao",
        new { nome = "Cartão", limiteTotal = 1000, diaFechamento = 10, diaVencimento = 20 });
    var cadastroResponse = await client.SendAsync(cadastro);
    using var cadastroDocument = JsonDocument.Parse(await cadastroResponse.Content.ReadAsStringAsync());
    var cartaoId = cadastroDocument.RootElement.GetProperty("id").GetGuid();

    using var request = new HttpRequestMessage(
        HttpMethod.Get, $"/api/v1/cartao/{cartaoId}/previsao-futura?meses=13");
    request.Headers.TryAddWithoutValidation("Origin", "http://allowed.example.com");
    var response = await client.SendAsync(request);

    Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
  }

  private static DateTime PrimeiroDiaDaCompetencia(int competencia)
  {
    var ano = competencia / 100;
    var mes = competencia % 100;
    return new DateTime(ano, mes, 1, 0, 0, 0, DateTimeKind.Utc);
  }

  private static async Task CriarCompraNoCartao(HttpClient client, Guid cartaoId, decimal valor, DateTime data)
  {
    using var request = BuildRequest(
        HttpMethod.Post,
        "/api/v1/movimentacoes",
        new
        {
          titulo = "Compra teste",
          valor,
          data,
          tipo = "Saida",
          cartaoId
        });

    var response = await client.SendAsync(request);
    Assert.Equal(HttpStatusCode.Created, response.StatusCode);
  }

  private static async Task<JsonElement> ObterResumos(HttpClient client, int mes, int ano)
  {
    using var request = new HttpRequestMessage(
        HttpMethod.Get, $"/api/v1/cartao/resumos?mes={mes}&ano={ano}");
    request.Headers.TryAddWithoutValidation("Origin", "http://allowed.example.com");

    var response = await client.SendAsync(request);
    Assert.Equal(HttpStatusCode.OK, response.StatusCode);

    using var document = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
    return document.RootElement[0].Clone();
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
