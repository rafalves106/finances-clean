using System.Net;
using System.Text;
using System.Text.Json;
using Xunit;

namespace API.IntegrationTests;

/// <summary>
/// Teste de rate limiting isolado em classe própria para garantir uma instância
/// de WebApplicationFactory (e, portanto, de FixedWindowRateLimiter) exclusiva.
/// Isso impede que os tokens consumidos pelos outros testes interfiram aqui.
/// </summary>
public class RateLimitTests : IClassFixture<ApiWebApplicationFactory>
{
    private readonly HttpClient _client;

    public RateLimitTests(ApiWebApplicationFactory factory)
    {
        _client = factory.CreateClient(new Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactoryClientOptions
        {
            AllowAutoRedirect = false
        });
    }

    // =========================================================================
    // Cenário 4 — Login acima do rate limit retorna 429
    // Rastreabilidade: FixedWindowLimiter "AuthPublicPolicy" — limite 5 req/min
    //                  para /auth/login; partição por RemoteIp (null → "unknown")
    // =========================================================================
    [Fact]
    public async Task Login_AcimaDoRateLimit_Retorna429()
    {
        // Payload válido (passa DataAnnotations) para que cada requisição
        // consuma um token do rate limiter antes de retornar 401 (DB vazio).
        var payload = JsonSerializer.Serialize(new { email = "teste@ratelimit.com", senha = "SenhaValida123!" });
        const string allowedOrigin = "http://allowed.example.com";

        // Esgotar a janela de 5 requisições permitidas
        for (int i = 0; i < 5; i++)
        {
            using var req = new HttpRequestMessage(HttpMethod.Post, "/api/v1/auth/login")
            {
                Content = new StringContent(payload, Encoding.UTF8, "application/json")
            };
            req.Headers.TryAddWithoutValidation("Origin", allowedOrigin);
            await _client.SendAsync(req);
        }

        // A 6ª requisição deve ser barrada pelo rate limiter
        using var overdraft = new HttpRequestMessage(HttpMethod.Post, "/api/v1/auth/login")
        {
            Content = new StringContent(payload, Encoding.UTF8, "application/json")
        };
        overdraft.Headers.TryAddWithoutValidation("Origin", allowedOrigin);

        var response = await _client.SendAsync(overdraft);

        Assert.Equal(HttpStatusCode.TooManyRequests, response.StatusCode);
    }
}
