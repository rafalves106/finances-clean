using System.Net;
using System.Text;
using System.Text.Json;
using Xunit;

namespace API.IntegrationTests;

/// <summary>
/// Testes dos cenários de segurança 1, 2, 3 e 5.
/// Cada instância de IClassFixture cria um host isolado com rate limiter próprio;
/// manter estes quatro testes numa mesma classe garante que não excedem o
/// limite de 5 req/min para /auth/login (apenas 2 POST chegam ao rate limiter:
/// cenário-1 e cenário-2; cenário-5 é barrado antes pelo middleware de CORS).
/// </summary>
public class AuthTests : IClassFixture<ApiWebApplicationFactory>
{
    private readonly HttpClient _client;

    public AuthTests(ApiWebApplicationFactory factory)
    {
        _client = factory.CreateClient(new Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactoryClientOptions
        {
            AllowAutoRedirect = false
        });
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    private static HttpRequestMessage BuildLoginRequest(object payload, string origin = "http://allowed.example.com")
    {
        var request = new HttpRequestMessage(HttpMethod.Post, "/api/v1/auth/login")
        {
            Content = new StringContent(
                JsonSerializer.Serialize(payload),
                Encoding.UTF8,
                "application/json")
        };
        request.Headers.TryAddWithoutValidation("Origin", origin);
        return request;
    }

    // =========================================================================
    // Cenário 1 — Login com payload inválido retorna 400
    // Rastreabilidade: cobre SEC-012 (validação de DTO com DataAnnotations)
    // =========================================================================
    [Fact]
    public async Task Login_PayloadInvalido_Retorna400()
    {
        // email inválido + senha curta demais (< 8 chars) → falha nas DataAnnotations
        using var request = BuildLoginRequest(new { email = "nao-eh-email", senha = "123" });

        var response = await _client.SendAsync(request);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    // =========================================================================
    // Cenário 2 — Login com credenciais inexistentes retorna 401
    // Rastreabilidade: DB vazio (InMemory) → repositório retorna null → 401
    // =========================================================================
    [Fact]
    public async Task Login_CredenciaisInexistentes_Retorna401()
    {
        // Payload válido que passa as DataAnnotations mas não encontra usuário no DB
        using var request = BuildLoginRequest(new { email = "usuario@inexistente.com", senha = "SenhaValida123!" });

        var response = await _client.SendAsync(request);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    // =========================================================================
    // Cenário 3 — Endpoint protegido sem token retorna 401
    // Rastreabilidade: [Authorize] em AuthenticatedController → JWT middleware → 401
    // =========================================================================
    [Fact]
    public async Task EndpointProtegido_SemToken_Retorna401()
    {
        // GET não aciona o middleware de CORS customizado (só métodos mutáveis)
        var response = await _client.GetAsync("/api/v1/categorias");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    // =========================================================================
    // Cenário 5 — Origem não permitida em POST retorna 403
    // Rastreabilidade: middleware custom (app.Use) bloqueia antes do rate limiter
    // =========================================================================
    [Fact]
    public async Task Login_OrigemNaoPermitida_Retorna403()
    {
        using var request = BuildLoginRequest(
            payload: new { email = "teste@teste.com", senha = "SenhaValida123!" },
            origin: "http://not-allowed.example.com");

        var response = await _client.SendAsync(request);

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }
}
