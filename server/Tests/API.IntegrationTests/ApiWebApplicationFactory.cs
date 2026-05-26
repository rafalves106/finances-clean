using Finance.Infrastructure.Data;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace API.IntegrationTests;

/// <summary>
/// Fábrica compartilhada — sobe o host em ambiente "Testing", carrega
/// automaticamente server/API/appsettings.Testing.json (JWT, AllowedOrigins,
/// AdminKey) e substitui o DbContext Npgsql por InMemory para que os testes
/// rodem sem infraestrutura de banco.
/// </summary>
public class ApiWebApplicationFactory : WebApplicationFactory<Program>
{
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        // Ambiente "Testing":
        //   - Evita que Program.cs tente aplicar migrations ao Postgres.
        //   - Força o carregamento de appsettings.Testing.json que fornece
        //     Jwt:Key, AllowedOrigins e AdminKey sem precisar de secrets locais.
        builder.UseEnvironment("Testing");

        // Troca o provedor Npgsql por InMemory para que os testes sejam
        // reproduzíveis sem infraestrutura de banco.
        // É necessário remover TODAS as entradas genéricas que referenciam
        // FinanceDbContext (incluindo IDbContextOptionsConfiguration<>) para
        // evitar o conflito "multiple providers registered".
        builder.ConfigureServices(services =>
        {
            var toRemove = services
                .Where(d =>
                    d.ServiceType == typeof(DbContextOptions<FinanceDbContext>) ||
                    d.ServiceType == typeof(FinanceDbContext) ||
                    (d.ServiceType.IsGenericType &&
                     d.ServiceType.GetGenericArguments().Length > 0 &&
                     d.ServiceType.GetGenericArguments()[0] == typeof(FinanceDbContext)))
                .ToList();

            foreach (var descriptor in toRemove)
                services.Remove(descriptor);

            services.AddDbContext<FinanceDbContext>(options =>
                options.UseInMemoryDatabase("IntegrationTestDb"));
        });
    }
}
