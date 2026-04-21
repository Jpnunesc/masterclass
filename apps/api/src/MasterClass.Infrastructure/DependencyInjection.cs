using MasterClass.Application.Abstractions;
using MasterClass.Application.Ai;
using MasterClass.Infrastructure.Ai;
using MasterClass.Infrastructure.Auth;
using MasterClass.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace MasterClass.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("Default")
            ?? throw new InvalidOperationException("ConnectionStrings:Default is required (set via env var ConnectionStrings__Default).");

        services.AddDbContext<MasterClassDbContext>(options => options.UseNpgsql(connectionString));
        services.AddScoped<IMasterClassDbContext>(sp => sp.GetRequiredService<MasterClassDbContext>());

        services.Configure<JwtOptions>(configuration.GetSection(JwtOptions.SectionName));
        services.AddSingleton<ITokenIssuer, JwtTokenIssuer>();
        services.AddSingleton<IPasswordHasher, PbkdfPasswordHasher>();

        services.Configure<AzureOpenAIOptions>(configuration.GetSection(AzureOpenAIOptions.SectionName));
        services.Configure<ElevenLabsOptions>(configuration.GetSection(ElevenLabsOptions.SectionName));
        services.Configure<GroqOptions>(configuration.GetSection(GroqOptions.SectionName));
        services.AddHttpClient<IAzureOpenAIClient, AzureOpenAIClient>();
        services.AddHttpClient<IElevenLabsClient, ElevenLabsClient>();
        services.AddHttpClient<IGroqClient, GroqClient>();

        return services;
    }
}
