using MasterClass.Application.Ai;
using Microsoft.AspNetCore.Mvc;

namespace MasterClass.Api.Endpoints;

public static class AssessmentEndpoints
{
    public static IEndpointRouteBuilder MapAssessmentEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/assessment").WithTags("Assessment");

        group.MapPost("/evaluate", async (
            [FromBody] AssessmentRequest request,
            IAzureOpenAIClient azure,
            CancellationToken ct) =>
        {
            if (request is null || request.Conversation is null || request.Conversation.Count == 0)
                return Results.BadRequest(new { error = "conversation is required and must contain at least one turn." });

            try
            {
                var result = await azure.EvaluateConversationAsync(request, ct);
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
