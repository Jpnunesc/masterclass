using MasterClass.Application.Ai;

namespace MasterClass.Api.Endpoints;

public static class SttEndpoints
{
    public static IEndpointRouteBuilder MapSttEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/stt").WithTags("Stt");

        group.MapPost("/transcribe", async (
            HttpRequest request,
            IGroqClient groq,
            CancellationToken ct) =>
        {
            if (!request.HasFormContentType)
                return Results.BadRequest(new { error = "multipart/form-data with a 'file' part is required." });

            IFormCollection form;
            try { form = await request.ReadFormAsync(ct); }
            catch (InvalidDataException ex) { return Results.BadRequest(new { error = $"invalid multipart body: {ex.Message}" }); }

            var file = form.Files.GetFile("file") ?? form.Files.FirstOrDefault();
            if (file is null || file.Length == 0)
                return Results.BadRequest(new { error = "file is required." });

            var languageHint = form["language"].FirstOrDefault();

            try
            {
                await using var stream = file.OpenReadStream();
                var result = await groq.TranscribeAsync(stream, file.FileName, languageHint, ct);
                return Results.Ok(result);
            }
            catch (AiVendorException ex)
            {
                return Results.Problem(ex.Message, statusCode: StatusCodes.Status502BadGateway);
            }
        }).DisableAntiforgery();

        return app;
    }
}
