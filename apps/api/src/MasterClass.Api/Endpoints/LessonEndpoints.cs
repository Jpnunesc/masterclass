using System.Text;
using System.Text.Json;
using MasterClass.Application.Ai;
using Microsoft.AspNetCore.Mvc;

namespace MasterClass.Api.Endpoints;

public static class LessonEndpoints
{
    public static IEndpointRouteBuilder MapLessonEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/lesson").WithTags("Lesson");

        group.MapPost("/turn", async (
            [FromBody] LessonTurnRequest request,
            [FromQuery(Name = "stream")] bool? stream,
            IAzureOpenAIClient azure,
            HttpResponse response,
            CancellationToken ct) =>
        {
            if (request is null || string.IsNullOrWhiteSpace(request.StudentUtterance))
                return Results.BadRequest(new { error = "studentUtterance is required." });
            if (string.IsNullOrWhiteSpace(request.StudentLevel))
                return Results.BadRequest(new { error = "studentLevel is required." });
            if (string.IsNullOrWhiteSpace(request.Topic))
                return Results.BadRequest(new { error = "topic is required." });

            if (stream == true)
            {
                response.ContentType = "text/event-stream";
                response.Headers.CacheControl = "no-cache";
                response.Headers.Append("X-Accel-Buffering", "no");
                try
                {
                    await foreach (var chunk in azure.LessonTurnStreamAsync(request, ct))
                    {
                        var payload = JsonSerializer.Serialize(new { delta = chunk });
                        await response.WriteAsync($"data: {payload}\n\n", Encoding.UTF8, ct);
                        await response.Body.FlushAsync(ct);
                    }
                    await response.WriteAsync("data: [DONE]\n\n", Encoding.UTF8, ct);
                    await response.Body.FlushAsync(ct);
                    return Results.Empty;
                }
                catch (AiVendorException ex)
                {
                    var err = JsonSerializer.Serialize(new { error = ex.Message });
                    await response.WriteAsync($"data: {err}\n\n", Encoding.UTF8, ct);
                    return Results.Empty;
                }
            }

            try
            {
                var result = await azure.LessonTurnAsync(request, ct);
                return Results.Ok(result);
            }
            catch (AiVendorException ex)
            {
                return Results.Problem(ex.Message, statusCode: StatusCodes.Status502BadGateway);
            }
        });

        return app;
    }
}
