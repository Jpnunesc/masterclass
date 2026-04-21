using System.Net;
using System.Net.Http.Json;
using System.Text;
using MasterClass.Application.Ai;

namespace MasterClass.Api.Tests;

public class AiEndpointsTests : IClassFixture<MasterClassWebApplicationFactory>
{
    private readonly MasterClassWebApplicationFactory _factory;

    public AiEndpointsTests(MasterClassWebApplicationFactory factory)
    {
        _factory = factory;
        _factory.AzureFake.Reset();
        _factory.ElevenFake.Reset();
        _factory.GroqFake.Reset();
    }

    [Fact]
    public async Task AssessmentEvaluate_ReturnsEvaluation()
    {
        var client = _factory.CreateClient();
        _factory.AzureFake.NextEvaluation = new AssessmentEvaluation(
            "B2", "Clear range.", new[] { "fluency" }, new[] { "tenses" });

        var resp = await client.PostAsJsonAsync("/api/assessment/evaluate", new AssessmentRequest(
            new[] { new ChatTurn("user", "I goed to the park yesterday.") }));

        Assert.Equal(HttpStatusCode.OK, resp.StatusCode);
        var body = await resp.Content.ReadFromJsonAsync<AssessmentEvaluation>();
        Assert.NotNull(body);
        Assert.Equal("B2", body!.Level);
        Assert.Single(_factory.AzureFake.EvaluateCalls);
    }

    [Fact]
    public async Task AssessmentEvaluate_EmptyConversation_Returns400()
    {
        var client = _factory.CreateClient();
        var resp = await client.PostAsJsonAsync("/api/assessment/evaluate",
            new AssessmentRequest(Array.Empty<ChatTurn>()));
        Assert.Equal(HttpStatusCode.BadRequest, resp.StatusCode);
    }

    [Fact]
    public async Task LessonTurn_NonStreaming_ReturnsTurnWithCorrections()
    {
        var client = _factory.CreateClient();
        _factory.AzureFake.NextTurn = new LessonTurnResult(
            "Great! Tell me more.",
            new[] { new Correction("goed", "went", "Irregular past.") });

        var resp = await client.PostAsJsonAsync("/api/lesson/turn",
            new LessonTurnRequest("B1", "travel", "I goed to Paris."));

        Assert.Equal(HttpStatusCode.OK, resp.StatusCode);
        var body = await resp.Content.ReadFromJsonAsync<LessonTurnResult>();
        Assert.NotNull(body);
        Assert.Equal("Great! Tell me more.", body!.TeacherResponse);
        Assert.Single(body.Corrections);
        Assert.Equal("went", body.Corrections[0].Suggestion);
    }

    [Fact]
    public async Task LessonTurn_Streaming_EmitsSseChunks()
    {
        var client = _factory.CreateClient();
        _factory.AzureFake.StreamChunks = new[] { "Hi ", "there ", "!" };

        var req = new HttpRequestMessage(HttpMethod.Post, "/api/lesson/turn?stream=true")
        {
            Content = JsonContent.Create(new LessonTurnRequest("A2", "greetings", "Hello")),
        };
        using var resp = await client.SendAsync(req, HttpCompletionOption.ResponseHeadersRead);
        Assert.Equal(HttpStatusCode.OK, resp.StatusCode);
        Assert.Contains("text/event-stream", resp.Content.Headers.ContentType?.MediaType ?? "");

        var text = await resp.Content.ReadAsStringAsync();
        Assert.Contains("\"delta\":\"Hi \"", text);
        Assert.Contains("\"delta\":\"there \"", text);
        Assert.Contains("[DONE]", text);
    }

    [Fact]
    public async Task LessonTurn_MissingUtterance_Returns400()
    {
        var client = _factory.CreateClient();
        var resp = await client.PostAsJsonAsync("/api/lesson/turn",
            new LessonTurnRequest("B1", "travel", ""));
        Assert.Equal(HttpStatusCode.BadRequest, resp.StatusCode);
    }

    [Fact]
    public async Task MaterialsGenerate_ReturnsMaterialsShape()
    {
        var client = _factory.CreateClient();
        _factory.AzureFake.NextMaterials = new GeneratedMaterials(
            "Travel 101",
            "Basic travel phrases.",
            new[] { new VocabularyEntry("passport", "travel ID", "I lost my passport.") },
            new[] { new Exercise("Where is the ___?", "fill-in-blank", "place", "airport") });

        var resp = await client.PostAsJsonAsync("/api/materials/generate",
            new MaterialsRequest("A2", "travel", 1, 1));

        Assert.Equal(HttpStatusCode.OK, resp.StatusCode);
        var body = await resp.Content.ReadFromJsonAsync<GeneratedMaterials>();
        Assert.NotNull(body);
        Assert.Equal("Travel 101", body!.LessonTitle);
        Assert.Single(body.Vocabulary);
        Assert.Equal("passport", body.Vocabulary[0].Term);
        Assert.Single(body.Exercises);
        Assert.Equal("airport", body.Exercises[0].ExpectedAnswer);
    }

    [Fact]
    public async Task TtsSynthesize_ReturnsAudioStream()
    {
        var client = _factory.CreateClient();
        var signature = new byte[] { 1, 2, 3, 4, 5 };
        _factory.ElevenFake.NextAudio = signature;
        _factory.ElevenFake.NextContentType = "audio/mpeg";

        var resp = await client.PostAsJsonAsync("/api/tts/synthesize",
            new TtsRequest("Hello learner.", "voice-en-M"));

        Assert.Equal(HttpStatusCode.OK, resp.StatusCode);
        Assert.Equal("audio/mpeg", resp.Content.Headers.ContentType?.MediaType);
        var bytes = await resp.Content.ReadAsByteArrayAsync();
        Assert.Equal(signature, bytes);
        Assert.Single(_factory.ElevenFake.Calls);
        Assert.Equal("voice-en-M", _factory.ElevenFake.Calls[0].VoiceId);
    }

    [Fact]
    public async Task TtsSynthesize_MissingText_Returns400()
    {
        var client = _factory.CreateClient();
        var resp = await client.PostAsJsonAsync("/api/tts/synthesize", new TtsRequest("", "voice-en-M"));
        Assert.Equal(HttpStatusCode.BadRequest, resp.StatusCode);
    }

    [Fact]
    public async Task SttTranscribe_ReturnsTranscriptFromMultipartUpload()
    {
        var client = _factory.CreateClient();
        _factory.GroqFake.NextResult = new TranscriptionResult("Hello there.", "en");

        using var form = new MultipartFormDataContent();
        var audioBytes = Encoding.UTF8.GetBytes("fake-audio-payload-12345");
        var audio = new ByteArrayContent(audioBytes);
        audio.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue("audio/webm");
        form.Add(audio, "file", "utterance.webm");
        form.Add(new StringContent("en"), "language");

        var resp = await client.PostAsync("/api/stt/transcribe", form);

        Assert.Equal(HttpStatusCode.OK, resp.StatusCode);
        var body = await resp.Content.ReadFromJsonAsync<TranscriptionResult>();
        Assert.NotNull(body);
        Assert.Equal("Hello there.", body!.Text);
        Assert.Single(_factory.GroqFake.Calls);
        Assert.Equal("utterance.webm", _factory.GroqFake.Calls[0].FileName);
        Assert.Equal("en", _factory.GroqFake.Calls[0].Lang);
        Assert.Equal(audioBytes.Length, _factory.GroqFake.Calls[0].Size);
    }

    [Fact]
    public async Task SttTranscribe_MissingFile_Returns400()
    {
        var client = _factory.CreateClient();
        using var form = new MultipartFormDataContent();
        var resp = await client.PostAsync("/api/stt/transcribe", form);
        Assert.Equal(HttpStatusCode.BadRequest, resp.StatusCode);
    }

    [Fact]
    public async Task SttTranscribe_WithoutMultipart_Returns400()
    {
        var client = _factory.CreateClient();
        var resp = await client.PostAsync("/api/stt/transcribe",
            new StringContent("raw", Encoding.UTF8, "text/plain"));
        Assert.Equal(HttpStatusCode.BadRequest, resp.StatusCode);
    }
}
