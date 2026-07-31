using System.Net;
using System.Text;
using System.Text.Json;
using Finance.Core.Domain;
using Finance.Core.Repositories;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace API.IntegrationTests;

/// <summary>
/// Testes do fluxo de registro público + ativação por código
/// (conta nasce inativa via /auth/registro-publico, só entra depois de
/// /auth/ativar com o código configurado em CodigoAtivacao).
/// Só os testes que exercitam /registro-publico de fato chamam esse endpoint
/// via HTTP (limite de 3 req/min); os demais semeiam o usuário inativo direto
/// no repositório, mesmo padrão usado em CartaoControllerTests.
/// </summary>
public class AuthAtivacaoTests : IClassFixture<ApiWebApplicationFactory>
{
    private readonly ApiWebApplicationFactory _factory;
    private readonly HttpClient _client;

    public AuthAtivacaoTests(ApiWebApplicationFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient(new Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactoryClientOptions
        {
            AllowAutoRedirect = false
        });
    }

    private static HttpRequestMessage BuildRequest(string path, object payload, string origin = "http://allowed.example.com")
    {
        var request = new HttpRequestMessage(HttpMethod.Post, path)
        {
            Content = new StringContent(
                JsonSerializer.Serialize(payload),
                Encoding.UTF8,
                "application/json")
        };
        request.Headers.TryAddWithoutValidation("Origin", origin);
        return request;
    }

    private static string NovoEmail() => $"ativacao-{Guid.NewGuid():N}@teste.local";

    private Usuario SeedUsuarioInativo(string email, string senha)
    {
        using var scope = _factory.Services.CreateScope();
        var usuarioRepository = scope.ServiceProvider.GetRequiredService<IUsuarioRepository>();

        var usuario = new Usuario(
            nome: "Usuário Teste",
            email: email,
            senhaHash: BCrypt.Net.BCrypt.HashPassword(senha),
            ativo: false);

        usuarioRepository.Adicionar(usuario);
        return usuario;
    }

    [Fact]
    public async Task RegistroPublico_ComEmailNovo_ContaFicaInativaAteAtivar()
    {
        var email = NovoEmail();
        const string senha = "SenhaValida123!";

        using var registro = BuildRequest("/api/v1/auth/registro-publico", new { nome = "Usuário Teste", email, senha });
        var registroResponse = await _client.SendAsync(registro);
        Assert.Equal(HttpStatusCode.Created, registroResponse.StatusCode);

        using var login = BuildRequest("/api/v1/auth/login", new { email, senha });
        var loginResponse = await _client.SendAsync(login);
        var loginBody = await loginResponse.Content.ReadAsStringAsync();

        Assert.Equal(HttpStatusCode.Forbidden, loginResponse.StatusCode);
        Assert.Contains("CONTA_NAO_ATIVADA", loginBody);
    }

    [Fact]
    public async Task RegistroPublico_ComEmailJaCadastrado_Retorna400()
    {
        var email = NovoEmail();
        const string senha = "SenhaValida123!";
        SeedUsuarioInativo(email, senha);

        using var registro = BuildRequest("/api/v1/auth/registro-publico", new { nome = "Usuário Teste", email, senha });
        var response = await _client.SendAsync(registro);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Ativar_ComCodigoErrado_NaoAtivaConta()
    {
        var email = NovoEmail();
        const string senha = "SenhaValida123!";
        SeedUsuarioInativo(email, senha);

        using var ativacao = BuildRequest("/api/v1/auth/ativar", new { email, senha, codigo = "codigo-errado" });
        var ativacaoResponse = await _client.SendAsync(ativacao);
        Assert.Equal(HttpStatusCode.Unauthorized, ativacaoResponse.StatusCode);

        using var login = BuildRequest("/api/v1/auth/login", new { email, senha });
        var loginResponse = await _client.SendAsync(login);
        Assert.Equal(HttpStatusCode.Forbidden, loginResponse.StatusCode);
    }

    [Fact]
    public async Task Ativar_ComCodigoCorreto_AtivaEPermiteLoginDepois()
    {
        var email = NovoEmail();
        const string senha = "SenhaValida123!";
        SeedUsuarioInativo(email, senha);

        using var ativacao = BuildRequest("/api/v1/auth/ativar", new { email, senha, codigo = "test-activation-code" });
        var ativacaoResponse = await _client.SendAsync(ativacao);
        Assert.Equal(HttpStatusCode.OK, ativacaoResponse.StatusCode);

        using var login = BuildRequest("/api/v1/auth/login", new { email, senha });
        var loginResponse = await _client.SendAsync(login);
        Assert.Equal(HttpStatusCode.OK, loginResponse.StatusCode);
    }
}
