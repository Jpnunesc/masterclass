using MasterClass.Application.Ai;
using MasterClass.Application.Auth;
using Microsoft.Extensions.DependencyInjection;

namespace MasterClass.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddScoped<AuthService>();
        services.AddScoped<ClassroomOrchestrator>();
        return services;
    }
}
