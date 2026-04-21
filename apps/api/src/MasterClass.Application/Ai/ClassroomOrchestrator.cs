namespace MasterClass.Application.Ai;

public sealed record ClassroomTurnInput(
    Stream StudentAudio,
    string AudioFileName,
    string StudentLevel,
    string Topic,
    string VoiceId,
    string? TargetLanguage,
    IReadOnlyList<ChatTurn>? History);

public sealed record ClassroomTurnResult(
    string StudentTranscript,
    string? DetectedLanguage,
    LessonTurnResult TeacherTurn,
    AudioSynthesisResult TeacherAudio);

public sealed class ClassroomOrchestrator
{
    public IGroqClient Stt { get; }
    public IAzureOpenAIClient Chat { get; }
    public IElevenLabsClient Tts { get; }

    public ClassroomOrchestrator(IGroqClient stt, IAzureOpenAIClient chat, IElevenLabsClient tts)
    {
        Stt = stt;
        Chat = chat;
        Tts = tts;
    }

    public async Task<ClassroomTurnResult> ProcessStudentTurnAsync(
        ClassroomTurnInput input,
        CancellationToken ct = default)
    {
        var transcript = await Stt.TranscribeAsync(
            input.StudentAudio, input.AudioFileName, input.TargetLanguage, ct);

        var teacherTurn = await Chat.LessonTurnAsync(new LessonTurnRequest(
            input.StudentLevel,
            input.Topic,
            transcript.Text,
            input.History,
            input.TargetLanguage), ct);

        var audio = await Tts.SynthesizeAsync(
            new TtsRequest(teacherTurn.TeacherResponse, input.VoiceId), ct);

        return new ClassroomTurnResult(
            transcript.Text,
            transcript.Language,
            teacherTurn,
            audio);
    }
}
