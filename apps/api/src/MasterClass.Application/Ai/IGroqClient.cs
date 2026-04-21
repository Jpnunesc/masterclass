namespace MasterClass.Application.Ai;

public interface IGroqClient
{
    Task<TranscriptionResult> TranscribeAsync(
        Stream audio,
        string fileName,
        string? languageHint = null,
        CancellationToken ct = default);
}
