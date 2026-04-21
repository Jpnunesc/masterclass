using System.Runtime.CompilerServices;
using System.Text;
using MasterClass.Application.Ai;

namespace MasterClass.Application.Tests.Ai;

public class ClassroomOrchestratorTests
{
    [Fact]
    public async Task ProcessStudentTurn_RunsSttChatTtsInOrderAndPropagatesContext()
    {
        var stt = new StubGroq(new TranscriptionResult("I went to Paris.", "en"));
        var chat = new StubAzure(new LessonTurnResult("Great, how was it?", Array.Empty<Correction>()));
        var tts = new StubEleven(new byte[] { 1, 2, 3 });
        var orchestrator = new ClassroomOrchestrator(stt, chat, tts);

        await using var audio = new MemoryStream(Encoding.UTF8.GetBytes("fake-audio"));
        var history = new[] { new ChatTurn("user", "hi"), new ChatTurn("assistant", "hello") };

        var result = await orchestrator.ProcessStudentTurnAsync(new ClassroomTurnInput(
            audio, "utt.webm", "B1", "travel", "voice-en-M", "en", history));

        Assert.Equal("I went to Paris.", result.StudentTranscript);
        Assert.Equal("en", result.DetectedLanguage);
        Assert.Equal("Great, how was it?", result.TeacherTurn.TeacherResponse);
        Assert.Equal("audio/mpeg", result.TeacherAudio.ContentType);

        Assert.Equal("utt.webm", stt.LastFileName);
        Assert.Equal("en", stt.LastLanguageHint);

        Assert.NotNull(chat.LastRequest);
        Assert.Equal("B1", chat.LastRequest!.StudentLevel);
        Assert.Equal("travel", chat.LastRequest.Topic);
        Assert.Equal("I went to Paris.", chat.LastRequest.StudentUtterance);
        Assert.Equal(2, chat.LastRequest.History!.Count);

        Assert.NotNull(tts.LastRequest);
        Assert.Equal("voice-en-M", tts.LastRequest!.VoiceId);
        Assert.Equal("Great, how was it?", tts.LastRequest.Text);
    }

    private sealed class StubGroq : IGroqClient
    {
        private readonly TranscriptionResult _result;
        public string? LastFileName { get; private set; }
        public string? LastLanguageHint { get; private set; }

        public StubGroq(TranscriptionResult result) => _result = result;

        public Task<TranscriptionResult> TranscribeAsync(
            Stream audio, string fileName, string? languageHint = null, CancellationToken ct = default)
        {
            LastFileName = fileName;
            LastLanguageHint = languageHint;
            return Task.FromResult(_result);
        }
    }

    private sealed class StubAzure : IAzureOpenAIClient
    {
        private readonly LessonTurnResult _turn;
        public LessonTurnRequest? LastRequest { get; private set; }

        public StubAzure(LessonTurnResult turn) => _turn = turn;

        public Task<AssessmentEvaluation> EvaluateConversationAsync(AssessmentRequest r, CancellationToken ct = default)
            => throw new NotSupportedException();

        public Task<LessonTurnResult> LessonTurnAsync(LessonTurnRequest request, CancellationToken ct = default)
        {
            LastRequest = request;
            return Task.FromResult(_turn);
        }

        public async IAsyncEnumerable<string> LessonTurnStreamAsync(
            LessonTurnRequest request, [EnumeratorCancellation] CancellationToken ct = default)
        {
            yield return _turn.TeacherResponse;
            await Task.Yield();
        }

        public Task<GeneratedMaterials> GenerateMaterialsAsync(MaterialsRequest r, CancellationToken ct = default)
            => throw new NotSupportedException();
    }

    private sealed class StubEleven : IElevenLabsClient
    {
        private readonly byte[] _audio;
        public TtsRequest? LastRequest { get; private set; }

        public StubEleven(byte[] audio) => _audio = audio;

        public Task<AudioSynthesisResult> SynthesizeAsync(TtsRequest request, CancellationToken ct = default)
        {
            LastRequest = request;
            return Task.FromResult(new AudioSynthesisResult(new MemoryStream(_audio), "audio/mpeg"));
        }
    }
}
