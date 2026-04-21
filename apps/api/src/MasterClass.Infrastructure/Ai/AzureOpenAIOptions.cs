namespace MasterClass.Infrastructure.Ai;

public sealed class AzureOpenAIOptions
{
    public const string SectionName = "AzureOpenAI";

    public string? Endpoint { get; set; }
    public string? ApiKey { get; set; }
    public string? DeploymentName { get; set; }
    public string ApiVersion { get; set; } = "2024-06-01";
    public double Temperature { get; set; } = 0.3;
    public int MaxOutputTokens { get; set; } = 800;

    public bool IsConfigured =>
        !string.IsNullOrWhiteSpace(Endpoint) &&
        !string.IsNullOrWhiteSpace(ApiKey) &&
        !string.IsNullOrWhiteSpace(DeploymentName);
}

public sealed class ElevenLabsOptions
{
    public const string SectionName = "ElevenLabs";

    public string? ApiKey { get; set; }
    public string BaseUrl { get; set; } = "https://api.elevenlabs.io";
    public string ModelId { get; set; } = "eleven_turbo_v2_5";
    public string OutputFormat { get; set; } = "mp3_44100_128";

    public bool IsConfigured => !string.IsNullOrWhiteSpace(ApiKey);
}

public sealed class GroqOptions
{
    public const string SectionName = "Groq";

    public string? ApiKey { get; set; }
    public string BaseUrl { get; set; } = "https://api.groq.com";
    public string Model { get; set; } = "whisper-large-v3-turbo";

    public bool IsConfigured => !string.IsNullOrWhiteSpace(ApiKey);
}
