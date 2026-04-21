namespace MasterClass.Application.Ai;

public sealed record ChatTurn(string Role, string Content);

public sealed record AssessmentRequest(IReadOnlyList<ChatTurn> Conversation, string? TargetLanguage = null);

public sealed record AssessmentEvaluation(
    string Level,
    string Rationale,
    IReadOnlyList<string> Strengths,
    IReadOnlyList<string> Weaknesses);

public sealed record LessonTurnRequest(
    string StudentLevel,
    string Topic,
    string StudentUtterance,
    IReadOnlyList<ChatTurn>? History = null,
    string? TargetLanguage = null);

public sealed record LessonTurnResult(
    string TeacherResponse,
    IReadOnlyList<Correction> Corrections);

public sealed record Correction(string Original, string Suggestion, string Explanation);

public sealed record MaterialsRequest(
    string Level,
    string Topic,
    int VocabCount = 10,
    int ExerciseCount = 5,
    string? TargetLanguage = null);

public sealed record GeneratedMaterials(
    string LessonTitle,
    string LessonSummary,
    IReadOnlyList<VocabularyEntry> Vocabulary,
    IReadOnlyList<Exercise> Exercises);

public sealed record VocabularyEntry(string Term, string Definition, string ExampleUsage);

public sealed record Exercise(string Prompt, string Kind, string? Hint, string? ExpectedAnswer);

public sealed record TtsRequest(string Text, string VoiceId);

public sealed record AudioSynthesisResult(Stream Audio, string ContentType);

public sealed record TranscriptionResult(string Text, string? Language);

public sealed class AiVendorException : Exception
{
    public AiVendorException(string message) : base(message) { }
    public AiVendorException(string message, Exception inner) : base(message, inner) { }
}
