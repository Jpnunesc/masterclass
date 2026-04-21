using System.Net.Http.Headers;
using System.Text.Json;
using System.Text.Json.Serialization;
using MasterClass.Application.Ai;
using Microsoft.Extensions.Options;

namespace MasterClass.Infrastructure.Ai;

public sealed class GroqClient : IGroqClient
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    private readonly HttpClient _http;
    private readonly GroqOptions _options;

    public GroqClient(HttpClient http, IOptions<GroqOptions> options)
    {
        _http = http;
        _options = options.Value;
    }

    public async Task<TranscriptionResult> TranscribeAsync(
        Stream audio,
        string fileName,
        string? languageHint = null,
        CancellationToken ct = default)
    {
        if (!_options.IsConfigured)
            throw new AiVendorException("Groq is not configured. Set Groq__ApiKey.");
        if (audio is null) throw new AiVendorException("Audio stream is required for transcription.");
        if (string.IsNullOrWhiteSpace(fileName)) fileName = "audio.webm";

        var url = $"{_options.BaseUrl.TrimEnd('/')}/openai/v1/audio/transcriptions";

        using var form = new MultipartFormDataContent();
        var audioContent = new StreamContent(audio);
        audioContent.Headers.ContentType = MediaTypeHeaderValue.Parse(GuessMediaType(fileName));
        form.Add(audioContent, "file", fileName);
        form.Add(new StringContent(_options.Model), "model");
        form.Add(new StringContent("verbose_json"), "response_format");
        if (!string.IsNullOrWhiteSpace(languageHint))
            form.Add(new StringContent(languageHint), "language");

        using var req = new HttpRequestMessage(HttpMethod.Post, url) { Content = form };
        req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _options.ApiKey);

        using var resp = await _http.SendAsync(req, ct);
        var raw = await resp.Content.ReadAsStringAsync(ct);
        if (!resp.IsSuccessStatusCode)
            throw new AiVendorException($"Groq transcription failed ({(int)resp.StatusCode}): {raw}");

        Payload? parsed;
        try { parsed = JsonSerializer.Deserialize<Payload>(raw, JsonOptions); }
        catch (JsonException ex) { throw new AiVendorException($"Groq returned non-JSON body: {raw}", ex); }

        if (parsed is null)
            throw new AiVendorException("Groq returned empty transcription payload.");
        return new TranscriptionResult(parsed.Text ?? string.Empty, parsed.Language);
    }

    private static string GuessMediaType(string fileName) => Path.GetExtension(fileName).ToLowerInvariant() switch
    {
        ".mp3" => "audio/mpeg",
        ".wav" => "audio/wav",
        ".ogg" => "audio/ogg",
        ".webm" => "audio/webm",
        ".m4a" => "audio/mp4",
        ".flac" => "audio/flac",
        _ => "application/octet-stream",
    };

    private sealed record Payload(
        [property: JsonPropertyName("text")] string? Text,
        [property: JsonPropertyName("language")] string? Language);
}
