using System.Runtime.CompilerServices;
using MasterClass.Application.Ai;

namespace MasterClass.Api.Tests.Fakes;

public sealed class FakeAzureOpenAIClient : IAzureOpenAIClient
{
    public AssessmentEvaluation NextEvaluation { get; set; } =
        new("B1", "Balanced responses.", new[] { "vocabulary" }, new[] { "articles" });

    public LessonTurnResult NextTurn { get; set; } =
        new("How was your trip?", new[] { new Correction("goed", "went", "Irregular past of 'go'.") });

    public GeneratedMaterials NextMaterials { get; set; } =
        new(
            "Travel vocabulary",
            "Essential phrases for travel.",
            new[] { new VocabularyEntry("itinerary", "plan of travel", "My itinerary has three stops.") },
            new[] { new Exercise("I ___ to Paris last year.", "fill-in-blank", null, "went") });

    public IReadOnlyList<string> StreamChunks { get; set; } = new[] { "How ", "was ", "your ", "trip?" };

    public List<AssessmentRequest> EvaluateCalls { get; } = new();
    public List<LessonTurnRequest> TurnCalls { get; } = new();
    public List<LessonTurnRequest> StreamCalls { get; } = new();
    public List<MaterialsRequest> MaterialsCalls { get; } = new();

    public Task<AssessmentEvaluation> EvaluateConversationAsync(AssessmentRequest request, CancellationToken ct = default)
    {
        EvaluateCalls.Add(request);
        return Task.FromResult(NextEvaluation);
    }

    public Task<LessonTurnResult> LessonTurnAsync(LessonTurnRequest request, CancellationToken ct = default)
    {
        TurnCalls.Add(request);
        return Task.FromResult(NextTurn);
    }

    public async IAsyncEnumerable<string> LessonTurnStreamAsync(
        LessonTurnRequest request, [EnumeratorCancellation] CancellationToken ct = default)
    {
        StreamCalls.Add(request);
        foreach (var chunk in StreamChunks)
        {
            ct.ThrowIfCancellationRequested();
            yield return chunk;
            await Task.Yield();
        }
    }

    public Task<GeneratedMaterials> GenerateMaterialsAsync(MaterialsRequest request, CancellationToken ct = default)
    {
        MaterialsCalls.Add(request);
        return Task.FromResult(NextMaterials);
    }

    public void Reset()
    {
        EvaluateCalls.Clear();
        TurnCalls.Clear();
        StreamCalls.Clear();
        MaterialsCalls.Clear();
    }
}

public sealed class FakeElevenLabsClient : IElevenLabsClient
{
    public byte[] NextAudio { get; set; } = new byte[] { 0x49, 0x44, 0x33, 0x04 };
    public string NextContentType { get; set; } = "audio/mpeg";
    public List<TtsRequest> Calls { get; } = new();

    public Task<AudioSynthesisResult> SynthesizeAsync(TtsRequest request, CancellationToken ct = default)
    {
        Calls.Add(request);
        return Task.FromResult(new AudioSynthesisResult(new MemoryStream(NextAudio), NextContentType));
    }

    public void Reset() => Calls.Clear();
}

public sealed class FakeGroqClient : IGroqClient
{
    public TranscriptionResult NextResult { get; set; } = new("I went to Paris last summer.", "en");
    public List<(string FileName, string? Lang, long Size)> Calls { get; } = new();

    public async Task<TranscriptionResult> TranscribeAsync(
        Stream audio, string fileName, string? languageHint = null, CancellationToken ct = default)
    {
        using var ms = new MemoryStream();
        await audio.CopyToAsync(ms, ct);
        Calls.Add((fileName, languageHint, ms.Length));
        return NextResult;
    }

    public void Reset() => Calls.Clear();
}
