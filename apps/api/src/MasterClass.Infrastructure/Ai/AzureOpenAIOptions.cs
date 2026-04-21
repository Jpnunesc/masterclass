namespace MasterClass.Infrastructure.Ai;

public sealed class AzureOpenAIOptions
{
    public const string SectionName = "AI";

    public string Provider { get; set; } = "AzureOpenAI";
    public string? Endpoint { get; set; }
    public string? ApiKey { get; set; }
    public string ApiVersion { get; set; } = "2024-06-01";
    public double Temperature { get; set; } = 0.3;
    public int MaxOutputTokens { get; set; } = 800;
    public ModelRoutingOptions ModelRouting { get; set; } = new();

    public bool IsConfigured =>
        !string.IsNullOrWhiteSpace(Endpoint) &&
        !string.IsNullOrWhiteSpace(ApiKey) &&
        ModelRouting.IsConfigured;
}

public sealed class ModelRoutingOptions
{
    public string? Conversation { get; set; }
    public string? Analysis { get; set; }
    public string? Assessment { get; set; }
    public string? MaterialGeneration { get; set; }

    public bool IsConfigured =>
        !string.IsNullOrWhiteSpace(Conversation) &&
        !string.IsNullOrWhiteSpace(Assessment) &&
        !string.IsNullOrWhiteSpace(MaterialGeneration);

    public string Resolve(AiUseCase useCase)
    {
        var deployment = useCase switch
        {
            AiUseCase.Conversation => Conversation,
            AiUseCase.Analysis => Analysis ?? Conversation,
            AiUseCase.Assessment => Assessment,
            AiUseCase.MaterialGeneration => MaterialGeneration,
            _ => null,
        };
        if (string.IsNullOrWhiteSpace(deployment))
            throw new InvalidOperationException(
                $"AI:ModelRouting:{useCase} is not configured.");
        return deployment;
    }
}

public enum AiUseCase
{
    Conversation,
    Analysis,
    Assessment,
    MaterialGeneration,
}

public sealed class ElevenLabsOptions
{
    public const string SectionName = "Voice:ElevenLabs";

    public string? ApiKey { get; set; }
    public string BaseUrl { get; set; } = "https://api.elevenlabs.io";
    public string ModelId { get; set; } = "eleven_multilingual_v2";
    public string OutputFormat { get; set; } = "mp3_44100_128";
    public string? VoiceIdFemale { get; set; }
    public string? VoiceIdMale { get; set; }

    public bool IsConfigured => !string.IsNullOrWhiteSpace(ApiKey);
}

public sealed class GroqOptions
{
    public const string SectionName = "Voice:Groq";

    public string? ApiKey { get; set; }
    public string BaseUrl { get; set; } = "https://api.groq.com";
    public string Model { get; set; } = "whisper-large-v3-turbo";

    public bool IsConfigured => !string.IsNullOrWhiteSpace(ApiKey);
}
