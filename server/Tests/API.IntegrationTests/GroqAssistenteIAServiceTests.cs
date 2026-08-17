using System.Net;
using System.Text;
using System.Text.Json;
using Finance.Core.Services;
using Finance.Infrastructure.Services;
using Microsoft.Extensions.Configuration;
using Xunit;

namespace API.IntegrationTests;

public class GroqAssistenteIAServiceTests
{
  private static readonly IReadOnlyList<CategoriaResumoIA> Categorias = new List<CategoriaResumoIA>
  {
    new(Guid.Parse("11111111-1111-1111-1111-111111111111"), "Alimentação"),
  };

  private static (GroqAssistenteIAService service, FakeHandler handler) CriarServico(
    HttpStatusCode status, string corpoResposta)
  {
    var handler = new FakeHandler(status, corpoResposta);
    var httpClient = new HttpClient(handler) { BaseAddress = new Uri("https://api.groq.com/openai/v1/") };
    var configuration = new ConfigurationBuilder().Build();
    return (new GroqAssistenteIAService(httpClient, configuration), handler);
  }

  private static string MontarRespostaGroq(object conteudoJson)
  {
    var conteudo = JsonSerializer.Serialize(conteudoJson);
    return JsonSerializer.Serialize(new
    {
      choices = new[] { new { message = new { content = conteudo } } },
    });
  }

  [Fact]
  public async Task InterpretarMovimentacao_RespostaValida_ExtraiOsCampos()
  {
    var corpo = MontarRespostaGroq(new
    {
      entendido = true,
      titulo = "Mercado",
      valor = 87.5,
      data = "2026-08-15",
      tipo = "Saida",
      categoriaId = "11111111-1111-1111-1111-111111111111",
      observacao = (string?)null,
    });
    var (service, _) = CriarServico(HttpStatusCode.OK, corpo);

    var resultado = await service.InterpretarMovimentacao("mercado 87,50 anteontem", DateTime.Today, Categorias);

    Assert.True(resultado.Entendido);
    Assert.Equal("Mercado", resultado.Titulo);
    Assert.Equal(87.5m, resultado.Valor);
    Assert.Equal(new DateTime(2026, 8, 15), resultado.Data);
    Assert.Equal("Saida", resultado.Tipo);
    Assert.Equal(Guid.Parse("11111111-1111-1111-1111-111111111111"), resultado.CategoriaId);
  }

  [Fact]
  public async Task InterpretarMovimentacao_CategoriaIdForaDaListaPermitida_IgnoraACategoria()
  {
    // A IA não pode inventar categoria fora da lista que foi mandada pra ela -
    // se vier um Id que não está entre as permitidas, tratamos como null.
    var corpo = MontarRespostaGroq(new
    {
      entendido = true,
      titulo = "Mercado",
      valor = 50,
      data = (string?)null,
      tipo = "Saida",
      categoriaId = "99999999-9999-9999-9999-999999999999",
      observacao = (string?)null,
    });
    var (service, _) = CriarServico(HttpStatusCode.OK, corpo);

    var resultado = await service.InterpretarMovimentacao("mercado 50", DateTime.Today, Categorias);

    Assert.True(resultado.Entendido);
    Assert.Null(resultado.CategoriaId);
  }

  [Fact]
  public async Task InterpretarMovimentacao_NaoEntendido_DevolveObservacaoSemOutrosCampos()
  {
    var corpo = MontarRespostaGroq(new
    {
      entendido = false,
      titulo = (string?)null,
      valor = (decimal?)null,
      data = (string?)null,
      tipo = (string?)null,
      categoriaId = (string?)null,
      observacao = "Não ficou claro o valor da movimentação.",
    });
    var (service, _) = CriarServico(HttpStatusCode.OK, corpo);

    var resultado = await service.InterpretarMovimentacao("oi", DateTime.Today, Categorias);

    Assert.False(resultado.Entendido);
    Assert.Equal("Não ficou claro o valor da movimentação.", resultado.Observacao);
    Assert.Null(resultado.Titulo);
  }

  [Fact]
  public async Task InterpretarMovimentacao_ApiRetornaErro_DevolveNaoEntendidoSemLancar()
  {
    var (service, _) = CriarServico(HttpStatusCode.TooManyRequests, "");

    var resultado = await service.InterpretarMovimentacao("mercado 50", DateTime.Today, Categorias);

    Assert.False(resultado.Entendido);
    Assert.NotNull(resultado.Observacao);
  }

  [Fact]
  public async Task InterpretarMovimentacao_RespostaComJsonInvalido_DevolveNaoEntendidoSemLancar()
  {
    // conteudo mal formado dentro do "content" do choice
    var respostaComConteudoInvalido = JsonSerializer.Serialize(new
    {
      choices = new[] { new { message = new { content = "isso não é um json" } } },
    });
    var (service, _) = CriarServico(HttpStatusCode.OK, respostaComConteudoInvalido);

    var resultado = await service.InterpretarMovimentacao("mercado 50", DateTime.Today, Categorias);

    Assert.False(resultado.Entendido);
  }

  private sealed class FakeHandler(HttpStatusCode status, string corpo) : HttpMessageHandler
  {
    protected override Task<HttpResponseMessage> SendAsync(
      HttpRequestMessage request, CancellationToken cancellationToken)
    {
      var response = new HttpResponseMessage(status)
      {
        Content = new StringContent(corpo, Encoding.UTF8, "application/json"),
      };
      return Task.FromResult(response);
    }
  }
}
