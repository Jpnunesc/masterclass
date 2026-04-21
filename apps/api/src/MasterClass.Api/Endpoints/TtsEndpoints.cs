using MasterClass.Application.Ai;
using Microsoft.AspNetCore.Mvc;

namespace MasterClass.Api.Endpoints;

public static class TtsEndpoints
{
    public static IEndpointRouteBuilder MapTtsEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/tts").WithTags("Tts");

        group.MapPost("/synthesize", async (
            [FromBody] TtsRequest request,
            IElevenLabsClient eleven,
            CancellationToken ct) =>
        {
            if (request is null || string.IsNullOrWhiteSpace(request.Text) || string.IsNullOrWhiteSpace(request.VoiceId))
                return Results.BadRequest(new { error = "text and voiceId are required." });

            try
            {
                var audio = await eleven.SynthesizeAsync(request, ct);
                return Results.File(audio.Audio, audio.ContentType);
            }
            catch (AiVendorException ex)
            {
                return Results.Problem(ex.Message, statusCode: StatusCodes.Status502BadGateway);
            }
        });

        return app;
    }
}
