using System.Security.Claims;
using MasterClass.Application.Abstractions;
using Microsoft.EntityFrameworkCore;

namespace MasterClass.Api.Endpoints;

public static class ProgressEndpoints
{
    public static IEndpointRouteBuilder MapProgressEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/progress").WithTags("Progress");

        group.MapGet("/me", async (
            ClaimsPrincipal user,
            IMasterClassDbContext db,
            CancellationToken ct) =>
        {
            var sub = user.FindFirstValue(ClaimTypes.NameIdentifier)
                   ?? user.FindFirstValue("sub");
            if (!Guid.TryParse(sub, out var studentId)) return Results.Unauthorized();

            var rows = await db.ProgressSnapshots
                .Where(p => p.StudentId == studentId)
                .Select(p => new ProgressSnapshotResponse(
                    p.StudentId,
                    p.Level.ToString(),
                    p.LessonsCompleted,
                    p.VocabularyKnown,
                    p.AccuracyPercent,
                    p.CapturedAt))
                .ToListAsync(ct);

            var latest = rows
                .OrderByDescending(p => p.CapturedAt)
                .FirstOrDefault();

            return latest is null ? Results.NotFound() : Results.Ok(latest);
        })
        .RequireAuthorization();

        return app;
    }
}

public sealed record ProgressSnapshotResponse(
    Guid StudentId,
    string Level,
    int LessonsCompleted,
    int VocabularyKnown,
    double AccuracyPercent,
    DateTimeOffset CapturedAt);
