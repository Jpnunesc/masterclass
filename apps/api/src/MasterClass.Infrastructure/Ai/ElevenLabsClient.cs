using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using MasterClass.Application.Ai;
using Microsoft.Extensions.Options;

namespace MasterClass.Infrastructure.Ai;

public sealed class ElevenLabsClient : IElevenLabsClient
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web)
    {
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
    };

    private readonly HttpClient _http;
    private readonly ElevenLabsOptions _options;

    public ElevenLabsClient(HttpClient http, IOptions<ElevenLabsOptions> options)
    {
        _http = http;
        _options = options.Value;
    }

    public async Task<AudioSynthesisResult> SynthesizeAsync(TtsRequest request, CancellationToken ct = default)
    {
        if (!_options.IsConfigured)
            throw new AiVendorException("ElevenLabs is not configured. Set Voice:ElevenLabs:ApiKey.");
        if (string.IsNullOrWhiteSpace(request.Text))
            throw new AiVendorException("Text is required for TTS synthesis.");
        if (string.IsNullOrWhiteSpace(request.VoiceId))
            throw new AiVendorException("VoiceId is required for TTS synthesis.");

        var url = $"{_options.BaseUrl.TrimEnd('/')}/v1/text-to-speech/{Uri.EscapeDataString(request.VoiceId)}?output_format={_options.OutputFormat}";
        using var req = new HttpRequestMessage(HttpMethod.Post, url)
        {
            Content = JsonContent.Create(new Payload(request.Text, _options.ModelId), options: JsonOptions),
        };
        req.Headers.TryAddWithoutValidation("xi-api-key", _options.ApiKey);
        req.Headers.TryAddWithoutValidation("Accept", "audio/mpeg");

        var resp = await _http.SendAsync(req, HttpCompletionOption.ResponseHeadersRead, ct);
        if (!resp.IsSuccessStatusCode)
        {
            var err = await resp.Content.ReadAsStringAsync(ct);
            resp.Dispose();
            throw new AiVendorException($"ElevenLabs synthesis failed ({(int)resp.StatusCode}): {err}");
        }

        var contentType = resp.Content.Headers.ContentType?.MediaType ?? "audio/mpeg";
        var buffer = new MemoryStream();
        await using (var src = await resp.Content.ReadAsStreamAsync(ct))
            await src.CopyToAsync(buffer, ct);
        resp.Dispose();

        buffer.Position = 0;
        return new AudioSynthesisResult(buffer, contentType);
    }

    private sealed record Payload(
        [property: JsonPropertyName("text")] string Text,
        [property: JsonPropertyName("model_id")] string ModelId);
}
