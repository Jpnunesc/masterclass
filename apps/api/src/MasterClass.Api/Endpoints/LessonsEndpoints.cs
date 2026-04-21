using MasterClass.Application.Abstractions;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace MasterClass.Api.Endpoints;

public static class LessonsEndpoints
{
    private const int MaxTake = 100;
    private const int DefaultTake = 20;

    public static IEndpointRouteBuilder MapLessonsEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/lessons").WithTags("Lessons");

        group.MapGet(string.Empty, async (
            [FromQuery] int? take,
            [FromQuery] int? skip,
            IMasterClassDbContext db,
            CancellationToken ct) =>
        {
            var clampedTake = Math.Clamp(take ?? DefaultTake, 1, MaxTake);
            var clampedSkip = Math.Max(0, skip ?? 0);

            var total = await db.Lessons.CountAsync(ct);
            var items = await db.Lessons
                .OrderBy(l => l.OrderIndex)
                .ThenBy(l => l.Title)
                .Skip(clampedSkip)
                .Take(clampedTake)
                .Select(l => new LessonSummaryResponse(
                    l.Id,
                    l.Slug,
                    l.Title,
                    l.Summary,
                    l.TargetLevel.ToString(),
                    l.OrderIndex))
                .ToListAsync(ct);

            return Results.Ok(new LessonListResponse(items, total, clampedTake, clampedSkip));
        })
        .RequireAuthorization();

        return app;
    }
}

public sealed record LessonSummaryResponse(
    Guid Id,
    string Slug,
    string Title,
    string Summary,
    string TargetLevel,
    int OrderIndex);

public sealed record LessonListResponse(
    IReadOnlyList<LessonSummaryResponse> Items,
    int Total,
    int Take,
    int Skip);
