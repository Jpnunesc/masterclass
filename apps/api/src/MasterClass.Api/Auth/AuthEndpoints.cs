using System.Security.Claims;
using MasterClass.Application.Auth;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;

namespace MasterClass.Api.Auth;

public static class AuthEndpoints
{
    public static IEndpointRouteBuilder MapAuthEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/auth").WithTags("Auth");

        group.MapPost("/register", async (
            [FromBody] RegisterRequest request,
            AuthService svc,
            CancellationToken ct) =>
        {
            try
            {
                var response = await svc.RegisterAsync(request, ct);
                return Results.Ok(response);
            }
            catch (AuthException ex)
            {
                return Results.BadRequest(new { error = ex.Message });
            }
        });

        group.MapPost("/login", async (
            [FromBody] LoginRequest request,
            AuthService svc,
            CancellationToken ct) =>
        {
            try
            {
                var response = await svc.LoginAsync(request, ct);
                return Results.Ok(response);
            }
            catch (AuthException)
            {
                return Results.Unauthorized();
            }
        });

        group.MapPost("/refresh", async (
            [FromBody] RefreshRequest request,
            AuthService svc,
            CancellationToken ct) =>
        {
            try
            {
                var response = await svc.RefreshAsync(request, ct);
                return Results.Ok(response);
            }
            catch (AuthException)
            {
                return Results.Unauthorized();
            }
        });

        group.MapPost("/logout", async (
            [FromBody] RefreshRequest request,
            AuthService svc,
            CancellationToken ct) =>
        {
            await svc.LogoutAsync(request, ct);
            return Results.NoContent();
        });

        group.MapGet("/me", async (
            ClaimsPrincipal user,
            AuthService svc,
            CancellationToken ct) =>
        {
            var sub = user.FindFirstValue(ClaimTypes.NameIdentifier)
                   ?? user.FindFirstValue("sub");
            if (!Guid.TryParse(sub, out var studentId)) return Results.Unauthorized();

            var profile = await svc.GetProfileAsync(studentId, ct);
            return profile is null ? Results.NotFound() : Results.Ok(profile);
        })
        .RequireAuthorization();

        return app;
    }
}
