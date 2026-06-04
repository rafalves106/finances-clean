using Microsoft.EntityFrameworkCore;
using Finance.Core.Repositories;
using Finance.Core.UseCases;
using Finance.Infrastructure.Repositories;
using Finance.Infrastructure.Data;
using System.Text.Json.Serialization;
using Finance.Core.Services;
using Finance.Infrastructure.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.CookiePolicy;

AppContext.SetSwitch("Npgsql.EnableLegacyTimestampBehavior", true);

var builder = WebApplication.CreateBuilder(args);

var connectionString = builder.Configuration.GetConnectionString("PostgresConnection");

builder.Services.AddDbContext<FinanceDbContext>(options =>
    options.UseNpgsql(connectionString));

builder.Services.AddOpenApi();

builder.Services.AddScoped<IMovimentacaoRepository, MovimentacaoRepository>();
builder.Services.AddScoped<IInvestimentoRepository, InvestimentoRepository>();
builder.Services.AddScoped<IMetaRepository, MetaRepository>();
builder.Services.AddScoped<ICategoriaRepository, CategoriaRepository>();
builder.Services.AddScoped<ICategoriaOrcamentoUsuarioRepository, CategoriaOrcamentoUsuarioRepository>();
builder.Services.AddScoped<IVeiculoRepository, VeiculoRepository>();
builder.Services.AddScoped<ICartaoRepository, CartaoRepository>();
builder.Services.AddScoped<ICartaoBackfillRepository, CartaoBackfillRepository>();

builder.Services.AddScoped<CriarMovimentacaoUseCase>();
builder.Services.AddScoped<ListarMovimentacoesUseCase>();
builder.Services.AddScoped<AtualizarMovimentacaoUseCase>();
builder.Services.AddScoped<RemoverMovimentacaoUseCase>();
builder.Services.AddScoped<BuscarMovimentacaoUseCase>();
builder.Services.AddScoped<BuscarEntradaUseCase>();
builder.Services.AddScoped<BuscarSaidaUseCase>();
builder.Services.AddScoped<BuscarMovimentacoesPorPeriodoUseCase>();
builder.Services.AddScoped<BuscarEntradasPorPeriodoUseCase>();
builder.Services.AddScoped<BuscarSaidasPorPeriodoUseCase>();
builder.Services.AddScoped<ObterResumoMensalUseCase>();
builder.Services.AddScoped<ObterComparativoCategoriaMensalUseCase>();
builder.Services.AddScoped<RenumerarGrupoUseCase>();
builder.Services.AddScoped<ExportarMovimentacoesCsvUseCase>();
builder.Services.AddScoped<CadastrarCartaoManualUseCase>();
builder.Services.AddScoped<EditarCartaoManualUseCase>();
builder.Services.AddScoped<InativarCartaoManualUseCase>();
builder.Services.AddScoped<ListarCartoesManuaisUseCase>();
builder.Services.AddScoped<ListarResumosCartoesUseCase>();
builder.Services.AddScoped<ObterResumoCartaoUseCase>();
builder.Services.AddScoped<ObterPrevisaoFaturaUseCase>();
builder.Services.AddScoped<ExecutarPreviewBackfillCompetenciaCartaoUseCase>();
builder.Services.AddScoped<ExecutarApplyBackfillCompetenciaCartaoUseCase>();
builder.Services.AddScoped<ExecutarRollbackBackfillCompetenciaCartaoUseCase>();

builder.Services.AddScoped<CriarInvestimentoUseCase>();
builder.Services.AddScoped<ListarInvestimentosUseCase>();
builder.Services.AddScoped<ObterInvestimentoPorIdUseCase>();
builder.Services.AddScoped<RealizarAporteUseCase>();
builder.Services.AddScoped<RealizarSaqueUseCase>();
builder.Services.AddScoped<AtualizarSaldoInvestimentoUseCase>();
builder.Services.AddScoped<RemoverInvestimentoUseCase>();

builder.Services.AddScoped<CriarMetaUseCase>();
builder.Services.AddScoped<ListarMetasUseCase>();
builder.Services.AddScoped<AtualizarMetaUseCase>();
builder.Services.AddScoped<RemoverMetaUseCase>();
builder.Services.AddScoped<AlternarConclusaoMetaUseCase>();

builder.Services.AddScoped<CriarCategoriaUseCase>();
builder.Services.AddScoped<ListarCategoriasUseCase>();
builder.Services.AddScoped<AtualizarCategoriaUseCase>();
builder.Services.AddScoped<ObterAlertasOrcamentoCategoriasUseCase>();
builder.Services.AddScoped<RemoverCategoriaUseCase>();

builder.Services.AddScoped<CriarVeiculoUseCase>();
builder.Services.AddScoped<ListarVeiculosUseCase>();
builder.Services.AddScoped<BuscarVeiculoPorIdUseCase>();
builder.Services.AddScoped<AtualizarVeiculoUseCase>();
builder.Services.AddScoped<RemoverVeiculoUseCase>();
builder.Services.AddScoped<AtualizarUltimoKmAlertaUseCase>();

builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<ICurrentUserService, CurrentUserService>();
builder.Services.AddScoped<ITransactionManager, TransactionManager>();
builder.Services.AddScoped<ITokenService, TokenService>();
builder.Services.AddScoped<IUsuarioRepository, UsuarioRepository>();
builder.Services.AddScoped<LoginUseCase>();

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
    });

var jwtKey = builder.Configuration["Jwt:Key"]!;
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
  .AddJwtBearer(options =>
  {
      options.Events = new JwtBearerEvents
      {
          OnMessageReceived = context =>
          {
              if (string.IsNullOrWhiteSpace(context.Token) &&
                  context.Request.Cookies.TryGetValue("finance_auth_token", out var cookieToken))
              {
                  context.Token = cookieToken;
              }

              return Task.CompletedTask;
          }
      };

      options.TokenValidationParameters = new TokenValidationParameters
      {
          ValidateIssuer = true,
          ValidateAudience = true,
          ValidateLifetime = true,
          ValidateIssuerSigningKey = true,
          ValidIssuer = builder.Configuration["Jwt:Issuer"],
          ValidAudience = builder.Configuration["Jwt:Audience"],
          IssuerSigningKey = new SymmetricSecurityKey(
              Encoding.UTF8.GetBytes(jwtKey))
      };
  });

builder.Services.Configure<CookiePolicyOptions>(options =>
{
    options.MinimumSameSitePolicy = SameSiteMode.None;
    options.Secure = CookieSecurePolicy.Always;
});

builder.Services.AddAuthorization();

builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;

    options.OnRejected = (context, cancellationToken) =>
    {
        var logger = context.HttpContext.RequestServices
            .GetRequiredService<ILoggerFactory>()
            .CreateLogger("AuthRateLimiter");

        var remoteIp = context.HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        var path = context.HttpContext.Request.Path.Value ?? "unknown";
        var method = context.HttpContext.Request.Method ?? "unknown";
        var traceId = context.HttpContext.TraceIdentifier;
        var userAgent = context.HttpContext.Request.Headers.UserAgent.ToString();

        logger.LogWarning(
            "Rate limit excedido para endpoint de auth. TraceId={TraceId} Method={Method} Path={Path} RemoteIp={RemoteIp} UserAgent={UserAgent}",
            traceId,
            method,
            path,
            remoteIp,
            string.IsNullOrWhiteSpace(userAgent) ? "unknown" : userAgent);

        return ValueTask.CompletedTask;
    };

    options.AddPolicy("AuthPublicPolicy", httpContext =>
    {
        var remoteIp = httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        var endpoint = httpContext.Request.Path.Value?.ToLowerInvariant() ?? "unknown";
        var partitionKey = $"{remoteIp}:{endpoint}";
        var permitLimit = endpoint.EndsWith("/registro", StringComparison.OrdinalIgnoreCase)
            ? 3
            : 5;

        return RateLimitPartition.GetFixedWindowLimiter(
            partitionKey,
            _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = permitLimit,
                Window = TimeSpan.FromMinutes(1),
                QueueLimit = 0,
                AutoReplenishment = true
            });
    });
});

var allowedOrigins = builder.Configuration
  .GetSection("AllowedOrigins")
  .Get<string[]>() ?? new[] { "http://localhost:5173" };

var normalizedAllowedOrigins = allowedOrigins
    .Where(origin => !string.IsNullOrWhiteSpace(origin))
    .Select(origin => origin.Trim())
    .Distinct(StringComparer.OrdinalIgnoreCase)
    .ToArray();

if (!builder.Environment.IsDevelopment() && normalizedAllowedOrigins.Length == 0)
{
    throw new InvalidOperationException(
        "AllowedOrigins precisa ter ao menos uma origem valida fora de Development.");
}

builder.Services.AddCors(options =>
{
    options.AddPolicy("FrontendPolicy", policy =>
    {
        if (normalizedAllowedOrigins.Length == 0)
        {
            return;
        }

        policy.WithOrigins(normalizedAllowedOrigins)
              .AllowCredentials()
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});


var app = builder.Build();

var appReady = false;

if (app.Environment.IsDevelopment())
{
    await ApplyMigrationsWithRetryAsync(app);
}

appReady = true;

app.MapOpenApi();

if (!app.Environment.IsDevelopment())
{
    app.UseHsts();
}

app.Use(async (context, next) =>
{
    context.Response.OnStarting(() =>
    {
        context.Response.Headers["X-Frame-Options"] = "DENY";

        // Swagger/OpenAPI UI relies on scripts/styles; keep strict CSP on API responses.
        if (!context.Request.Path.StartsWithSegments("/swagger", StringComparison.OrdinalIgnoreCase) &&
            !context.Request.Path.StartsWithSegments("/openapi", StringComparison.OrdinalIgnoreCase))
        {
            context.Response.Headers["Content-Security-Policy"] =
                "default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'";
        }

        return Task.CompletedTask;
    });

    await next();
});

app.UseHttpsRedirection();
app.UseCookiePolicy();
app.UseSwaggerUI(options =>
{
    options.SwaggerEndpoint("/openapi/v1.json", "Finance API V1");
});

app.MapGet("/", () => Results.Redirect("/swagger"));

app.MapGet("/health", () => Results.Ok(new
{
    status = "healthy",
    timestamp = DateTime.UtcNow
}));

app.MapGet("/ready", async (FinanceDbContext dbContext, CancellationToken cancellationToken) =>
{
    if (!appReady)
    {
        return Results.StatusCode(StatusCodes.Status503ServiceUnavailable);
    }

    try
    {
        if (!await dbContext.Database.CanConnectAsync(cancellationToken))
        {
            return Results.StatusCode(StatusCodes.Status503ServiceUnavailable);
        }

        if (app.Environment.IsDevelopment())
        {
            var pendingMigrations = await dbContext.Database.GetPendingMigrationsAsync(cancellationToken);

            if (pendingMigrations.Any())
            {
                return Results.StatusCode(StatusCodes.Status503ServiceUnavailable);
            }
        }

        return Results.Ok(new
        {
            status = "ready",
            timestamp = DateTime.UtcNow
        });
    }
    catch
    {
        return Results.StatusCode(StatusCodes.Status503ServiceUnavailable);
    }
});

app.UseCors("FrontendPolicy");
app.Use(async (context, next) =>
{
    if (IsMutableHttpMethod(context.Request.Method) &&
        !IsAllowedBrowserOrigin(context.Request, normalizedAllowedOrigins))
    {
        context.Response.StatusCode = StatusCodes.Status403Forbidden;
        await context.Response.WriteAsync("Origem da requisicao nao permitida.");
        return;
    }

    await next();
});
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.Run();

static bool IsMutableHttpMethod(string method)
{
    return HttpMethods.IsPost(method) ||
           HttpMethods.IsPut(method) ||
           HttpMethods.IsDelete(method) ||
           HttpMethods.IsPatch(method);
}

static bool IsAllowedBrowserOrigin(HttpRequest request, string[] allowedOrigins)
{
    var originHeader = request.Headers.Origin.ToString();
    if (!string.IsNullOrWhiteSpace(originHeader))
    {
        return allowedOrigins.Contains(originHeader.Trim(), StringComparer.OrdinalIgnoreCase);
    }

    var refererHeader = request.Headers.Referer.ToString();
    if (!string.IsNullOrWhiteSpace(refererHeader) &&
        Uri.TryCreate(refererHeader, UriKind.Absolute, out var refererUri))
    {
        var refererOrigin = $"{refererUri.Scheme}://{refererUri.Authority}";
        return allowedOrigins.Contains(refererOrigin, StringComparer.OrdinalIgnoreCase);
    }

    return false;
}

static async Task ApplyMigrationsWithRetryAsync(WebApplication app)
{
    const int maxAttempts = 10;
    var delay = TimeSpan.FromSeconds(3);

    for (var attempt = 1; attempt <= maxAttempts; attempt++)
    {
        using var scope = app.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<FinanceDbContext>();
        var logger = scope.ServiceProvider
            .GetRequiredService<ILoggerFactory>()
            .CreateLogger("StartupMigration");

        try
        {
            logger.LogInformation(
                "Aplicando migrations automaticamente no startup ({Attempt}/{MaxAttempts})",
                attempt,
                maxAttempts);

            await dbContext.Database.MigrateAsync();

            logger.LogInformation("Migrations aplicadas com sucesso.");
            return;
        }
        catch (Exception ex) when (attempt < maxAttempts)
        {
            logger.LogWarning(
                ex,
                "Falha ao aplicar migrations no startup. Nova tentativa em {DelaySeconds}s.",
                delay.TotalSeconds);

            await Task.Delay(delay);
        }
    }

    throw new InvalidOperationException(
        $"Nao foi possivel aplicar as migrations automaticamente apos {maxAttempts} tentativas.");
}