using System.Net.Http.Json;
using System.Runtime.CompilerServices;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using MasterClass.Application.Ai;
using Microsoft.Extensions.Options;

namespace MasterClass.Infrastructure.Ai;

public sealed class AzureOpenAIClient : IAzureOpenAIClient
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web)
    {
        PropertyNameCaseInsensitive = true,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
    };

    private readonly HttpClient _http;
    private readonly AzureOpenAIOptions _options;

    public AzureOpenAIClient(HttpClient http, IOptions<AzureOpenAIOptions> options)
    {
        _http = http;
        _options = options.Value;
    }

    public async Task<AssessmentEvaluation> EvaluateConversationAsync(
        AssessmentRequest request, CancellationToken ct = default)
    {
        EnsureConfigured();

        var system = """
            You are a CEFR language assessment examiner. Given a learner's conversation transcript,
            output a single JSON object with the following fields (no prose, no code fences):
            {
              "level": one of "A1" | "A2" | "B1" | "B2" | "C1" | "C2",
              "rationale": short paragraph explaining the level,
              "strengths": array of short bullet strings,
              "weaknesses": array of short bullet strings
            }
            """;

        var messages = new List<ChatMessage>
        {
            new("system", system),
        };
        foreach (var turn in request.Conversation)
            messages.Add(new ChatMessage(turn.Role, turn.Content));

        if (!string.IsNullOrWhiteSpace(request.TargetLanguage))
            messages.Add(new ChatMessage("system", $"Target language: {request.TargetLanguage}"));

        var json = await CompleteJsonAsync(messages, AiUseCase.Assessment, ct);
        try
        {
            var parsed = JsonSerializer.Deserialize<AssessmentPayload>(json, JsonOptions)
                ?? throw new AiVendorException("Azure OpenAI returned empty assessment payload.");
            return new AssessmentEvaluation(
                parsed.Level ?? "A1",
                parsed.Rationale ?? string.Empty,
                parsed.Strengths ?? Array.Empty<string>(),
                parsed.Weaknesses ?? Array.Empty<string>());
        }
        catch (JsonException ex)
        {
            throw new AiVendorException($"Azure OpenAI returned malformed assessment JSON: {json}", ex);
        }
    }

    public async Task<LessonTurnResult> LessonTurnAsync(
        LessonTurnRequest request, CancellationToken ct = default)
    {
        EnsureConfigured();

        var system = $$"""
            You are an AI language teacher running a live classroom session.
            The learner is at CEFR level {{request.StudentLevel}}. The topic is "{{request.Topic}}".
            {{(string.IsNullOrWhiteSpace(request.TargetLanguage) ? "" : $"Target language: {request.TargetLanguage}.")}}

            For each learner utterance, reply with a single JSON object (no prose, no code fences):
            {
              "teacherResponse": natural conversational reply appropriate for the level,
              "corrections": array of objects { "original": string, "suggestion": string, "explanation": string }
            }
            If there is nothing to correct, return an empty "corrections" array.
            """;

        var messages = new List<ChatMessage> { new("system", system) };
        if (request.History is not null)
            foreach (var turn in request.History)
                messages.Add(new ChatMessage(turn.Role, turn.Content));
        messages.Add(new ChatMessage("user", request.StudentUtterance));

        var json = await CompleteJsonAsync(messages, AiUseCase.Conversation, ct);
        try
        {
            var parsed = JsonSerializer.Deserialize<LessonTurnPayload>(json, JsonOptions)
                ?? throw new AiVendorException("Azure OpenAI returned empty lesson turn payload.");
            return new LessonTurnResult(
                parsed.TeacherResponse ?? string.Empty,
                (parsed.Corrections ?? Array.Empty<CorrectionPayload>())
                    .Select(c => new Correction(c.Original ?? "", c.Suggestion ?? "", c.Explanation ?? ""))
                    .ToList());
        }
        catch (JsonException ex)
        {
            throw new AiVendorException($"Azure OpenAI returned malformed lesson turn JSON: {json}", ex);
        }
    }

    public async IAsyncEnumerable<string> LessonTurnStreamAsync(
        LessonTurnRequest request, [EnumeratorCancellation] CancellationToken ct = default)
    {
        EnsureConfigured();

        var system = $"You are an AI language teacher. Learner level: {request.StudentLevel}. Topic: {request.Topic}. " +
                     "Reply naturally in plain text, level-appropriate. Do not output JSON or markdown.";

        var messages = new List<ChatMessage> { new("system", system) };
        if (request.History is not null)
            foreach (var turn in request.History)
                messages.Add(new ChatMessage(turn.Role, turn.Content));
        messages.Add(new ChatMessage("user", request.StudentUtterance));

        using var body = BuildRequestContent(messages, stream: true, responseFormat: null);
        using var req = new HttpRequestMessage(HttpMethod.Post, BuildChatUrl(AiUseCase.Conversation)) { Content = body };
        req.Headers.TryAddWithoutValidation("api-key", _options.ApiKey);

        using var resp = await _http.SendAsync(req, HttpCompletionOption.ResponseHeadersRead, ct);
        if (!resp.IsSuccessStatusCode)
        {
            var err = await resp.Content.ReadAsStringAsync(ct);
            throw new AiVendorException($"Azure OpenAI streaming request failed ({(int)resp.StatusCode}): {err}");
        }

        using var stream = await resp.Content.ReadAsStreamAsync(ct);
        using var reader = new StreamReader(stream, Encoding.UTF8);
        while (!reader.EndOfStream)
        {
            var line = await reader.ReadLineAsync(ct);
            if (string.IsNullOrEmpty(line)) continue;
            if (!line.StartsWith("data:", StringComparison.Ordinal)) continue;
            var payload = line.AsSpan(5).TrimStart().ToString();
            if (payload == "[DONE]") yield break;
            string? delta;
            try
            {
                var chunk = JsonSerializer.Deserialize<StreamChunk>(payload, JsonOptions);
                delta = chunk?.Choices?.FirstOrDefault()?.Delta?.Content;
            }
            catch (JsonException)
            {
                continue;
            }
            if (!string.IsNullOrEmpty(delta)) yield return delta;
        }
    }

    public async Task<GeneratedMaterials> GenerateMaterialsAsync(
        MaterialsRequest request, CancellationToken ct = default)
    {
        EnsureConfigured();

        var system = $$"""
            You are an AI language curriculum designer. Generate a lesson for CEFR level {{request.Level}}
            on the topic "{{request.Topic}}". {{(string.IsNullOrWhiteSpace(request.TargetLanguage) ? "" : $"Target language: {request.TargetLanguage}.")}}
            Include ~{{request.VocabCount}} vocabulary entries and ~{{request.ExerciseCount}} exercises.

            Return a single JSON object (no prose, no code fences):
            {
              "lessonTitle": string,
              "lessonSummary": string,
              "vocabulary": array of { "term": string, "definition": string, "exampleUsage": string },
              "exercises": array of { "prompt": string, "kind": "fill-in-blank" | "translate" | "multiple-choice", "hint": string | null, "expectedAnswer": string | null }
            }
            """;

        var messages = new List<ChatMessage>
        {
            new("system", system),
            new("user", $"Generate the materials now."),
        };

        var json = await CompleteJsonAsync(messages, AiUseCase.MaterialGeneration, ct);
        try
        {
            var parsed = JsonSerializer.Deserialize<MaterialsPayload>(json, JsonOptions)
                ?? throw new AiVendorException("Azure OpenAI returned empty materials payload.");
            return new GeneratedMaterials(
                parsed.LessonTitle ?? request.Topic,
                parsed.LessonSummary ?? string.Empty,
                (parsed.Vocabulary ?? Array.Empty<VocabEntryPayload>())
                    .Select(v => new VocabularyEntry(v.Term ?? "", v.Definition ?? "", v.ExampleUsage ?? ""))
                    .ToList(),
                (parsed.Exercises ?? Array.Empty<ExercisePayload>())
                    .Select(e => new Exercise(e.Prompt ?? "", e.Kind ?? "fill-in-blank", e.Hint, e.ExpectedAnswer))
                    .ToList());
        }
        catch (JsonException ex)
        {
            throw new AiVendorException($"Azure OpenAI returned malformed materials JSON: {json}", ex);
        }
    }

    private async Task<string> CompleteJsonAsync(List<ChatMessage> messages, AiUseCase useCase, CancellationToken ct)
    {
        using var body = BuildRequestContent(messages, stream: false, responseFormat: new { type = "json_object" });
        using var req = new HttpRequestMessage(HttpMethod.Post, BuildChatUrl(useCase)) { Content = body };
        req.Headers.TryAddWithoutValidation("api-key", _options.ApiKey);

        using var resp = await _http.SendAsync(req, ct);
        var raw = await resp.Content.ReadAsStringAsync(ct);
        if (!resp.IsSuccessStatusCode)
            throw new AiVendorException($"Azure OpenAI request failed ({(int)resp.StatusCode}): {raw}");

        ChatCompletionResponse? parsed;
        try { parsed = JsonSerializer.Deserialize<ChatCompletionResponse>(raw, JsonOptions); }
        catch (JsonException ex) { throw new AiVendorException($"Azure OpenAI returned non-JSON body: {raw}", ex); }

        var content = parsed?.Choices?.FirstOrDefault()?.Message?.Content
            ?? throw new AiVendorException($"Azure OpenAI response missing choices[0].message.content: {raw}");
        return content;
    }

    private HttpContent BuildRequestContent(
        List<ChatMessage> messages,
        bool stream,
        object? responseFormat)
    {
        var payload = new Dictionary<string, object?>
        {
            ["messages"] = messages,
            ["temperature"] = _options.Temperature,
            ["max_tokens"] = _options.MaxOutputTokens,
            ["stream"] = stream,
        };
        if (responseFormat is not null) payload["response_format"] = responseFormat;
        return JsonContent.Create(payload, options: JsonOptions);
    }

    private string BuildChatUrl(AiUseCase useCase) =>
        $"{_options.Endpoint!.TrimEnd('/')}/openai/deployments/{_options.ModelRouting.Resolve(useCase)}/chat/completions?api-version={_options.ApiVersion}";

    private void EnsureConfigured()
    {
        if (!_options.IsConfigured)
            throw new AiVendorException(
                "Azure OpenAI is not configured. Set AI:Endpoint, AI:ApiKey, and AI:ModelRouting:{Conversation,Assessment,MaterialGeneration}.");
    }

    private sealed record ChatMessage(
        [property: JsonPropertyName("role")] string Role,
        [property: JsonPropertyName("content")] string Content);

    private sealed record ChatCompletionResponse(
        [property: JsonPropertyName("choices")] IReadOnlyList<ChatChoice>? Choices);

    private sealed record ChatChoice(
        [property: JsonPropertyName("message")] ChatChoiceMessage? Message,
        [property: JsonPropertyName("delta")] ChatChoiceMessage? Delta);

    private sealed record ChatChoiceMessage(
        [property: JsonPropertyName("content")] string? Content);

    private sealed record StreamChunk(
        [property: JsonPropertyName("choices")] IReadOnlyList<ChatChoice>? Choices);

    private sealed record AssessmentPayload(
        string? Level,
        string? Rationale,
        string[]? Strengths,
        string[]? Weaknesses);

    private sealed record LessonTurnPayload(
        string? TeacherResponse,
        CorrectionPayload[]? Corrections);

    private sealed record CorrectionPayload(string? Original, string? Suggestion, string? Explanation);

    private sealed record MaterialsPayload(
        string? LessonTitle,
        string? LessonSummary,
        VocabEntryPayload[]? Vocabulary,
        ExercisePayload[]? Exercises);

    private sealed record VocabEntryPayload(string? Term, string? Definition, string? ExampleUsage);

    private sealed record ExercisePayload(string? Prompt, string? Kind, string? Hint, string? ExpectedAnswer);
}
