namespace MasterClass.Application.Ai;

public interface IElevenLabsClient
{
    Task<AudioSynthesisResult> SynthesizeAsync(
        TtsRequest request,
        CancellationToken ct = default);
}
