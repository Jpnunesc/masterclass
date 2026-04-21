using System.Data.Common;
using MasterClass.Api.Tests.Fakes;
using MasterClass.Application.Ai;
using MasterClass.Infrastructure.Persistence;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace MasterClass.Api.Tests;

public sealed class MasterClassWebApplicationFactory : WebApplicationFactory<Program>, IAsyncLifetime
{
    private DbConnection? _sqliteConnection;

    public FakeAzureOpenAIClient AzureFake { get; } = new();
    public FakeElevenLabsClient ElevenFake { get; } = new();
    public FakeGroqClient GroqFake { get; } = new();

    public MasterClassWebApplicationFactory()
    {
        Environment.SetEnvironmentVariable("Jwt__Secret", "test-secret-that-is-long-enough-for-hs256-signing-1234");
        Environment.SetEnvironmentVariable("Jwt__Issuer", "masterclass-api");
        Environment.SetEnvironmentVariable("Jwt__Audience", "masterclass-web");
        Environment.SetEnvironmentVariable("Jwt__AccessTokenLifetimeMinutes", "60");
        Environment.SetEnvironmentVariable("ConnectionStrings__Default",
            "Host=placeholder;Database=placeholder;Username=placeholder;Password=placeholder");
    }

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");

        builder.ConfigureServices(services =>
        {
            var descriptorsToRemove = services.Where(d =>
                d.ServiceType == typeof(DbContextOptions<MasterClassDbContext>) ||
                d.ServiceType == typeof(MasterClassDbContext) ||
                d.ServiceType == typeof(DbConnection) ||
                d.ServiceType == typeof(IAzureOpenAIClient) ||
                d.ServiceType == typeof(IElevenLabsClient) ||
                d.ServiceType == typeof(IGroqClient)).ToList();
            foreach (var d in descriptorsToRemove) services.Remove(d);

            _sqliteConnection = new SqliteConnection("DataSource=:memory:");
            _sqliteConnection.Open();

            services.AddSingleton(_sqliteConnection);
            services.AddDbContext<MasterClassDbContext>((sp, options) =>
                options.UseSqlite(sp.GetRequiredService<DbConnection>()));

            services.AddSingleton<IAzureOpenAIClient>(AzureFake);
            services.AddSingleton<IElevenLabsClient>(ElevenFake);
            services.AddSingleton<IGroqClient>(GroqFake);
        });
    }

    public async Task InitializeAsync()
    {
        using var scope = Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<MasterClassDbContext>();
        await db.Database.EnsureCreatedAsync();
    }

    public new Task DisposeAsync()
    {
        _sqliteConnection?.Dispose();
        return Task.CompletedTask;
    }
}
