using MasterClass.Application.Ai;
using Microsoft.AspNetCore.Mvc;

namespace MasterClass.Api.Endpoints;

public static class MaterialsEndpoints
{
    public static IEndpointRouteBuilder MapMaterialsEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/materials").WithTags("Materials");

        group.MapPost("/generate", async (
            [FromBody] MaterialsRequest request,
            IAzureOpenAIClient azure,
            CancellationToken ct) =>
        {
            if (request is null || string.IsNullOrWhiteSpace(request.Level) || string.IsNullOrWhiteSpace(request.Topic))
                return Results.BadRequest(new { error = "level and topic are required." });

            try
            {
                var result = await azure.GenerateMaterialsAsync(request, ct);
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
