namespace MasterClass.Application.Ai;

public interface IAzureOpenAIClient
{
    Task<AssessmentEvaluation> EvaluateConversationAsync(
        AssessmentRequest request,
        CancellationToken ct = default);

    Task<LessonTurnResult> LessonTurnAsync(
        LessonTurnRequest request,
        CancellationToken ct = default);

    IAsyncEnumerable<string> LessonTurnStreamAsync(
        LessonTurnRequest request,
        CancellationToken ct = default);

    Task<GeneratedMaterials> GenerateMaterialsAsync(
        MaterialsRequest request,
        CancellationToken ct = default);
}
