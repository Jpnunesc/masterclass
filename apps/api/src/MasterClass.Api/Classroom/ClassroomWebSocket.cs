using System.Net.WebSockets;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using MasterClass.Application.Ai;

namespace MasterClass.Api.Classroom;

public static class ClassroomWebSocket
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web)
    {
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
    };

    public static IEndpointRouteBuilder MapClassroomWebSocket(this IEndpointRouteBuilder app)
    {
        app.Map("/ws/classroom", async (HttpContext ctx, ClassroomOrchestrator orchestrator, CancellationToken ct) =>
        {
            if (!ctx.WebSockets.IsWebSocketRequest)
            {
                ctx.Response.StatusCode = StatusCodes.Status400BadRequest;
                await ctx.Response.WriteAsync("WebSocket request expected.", ct);
                return;
            }

            var level = ctx.Request.Query["level"].FirstOrDefault() ?? "B1";
            var topic = ctx.Request.Query["topic"].FirstOrDefault() ?? "General conversation";
            var voiceId = ctx.Request.Query["voiceId"].FirstOrDefault() ?? string.Empty;
            var locale = ctx.Request.Query["locale"].FirstOrDefault() ?? "en-US";
            var audioFormat = ctx.Request.Query["audioFormat"].FirstOrDefault() ?? "webm";

            using var socket = await ctx.WebSockets.AcceptWebSocketAsync();
            var session = new ClassroomSession(socket, orchestrator, ct)
            {
                Level = level,
                Topic = topic,
                VoiceId = voiceId,
                Locale = locale,
                AudioExtension = audioFormat,
            };
            await session.RunAsync();
        });

        return app;
    }

    private sealed class ClassroomSession
    {
        private readonly WebSocket _socket;
        private readonly ClassroomOrchestrator _orchestrator;
        private readonly CancellationToken _ct;
        private readonly List<ChatTurn> _history = new();
        private MemoryStream? _inflightAudio;

        public string Level { get; set; } = "B1";
        public string Topic { get; set; } = "General conversation";
        public string VoiceId { get; set; } = string.Empty;
        public string Locale { get; set; } = "en-US";
        public string AudioExtension { get; set; } = "webm";

        public ClassroomSession(WebSocket socket, ClassroomOrchestrator orchestrator, CancellationToken ct)
        {
            _socket = socket;
            _orchestrator = orchestrator;
            _ct = ct;
        }

        public async Task RunAsync()
        {
            await SendJsonAsync(new { type = "session.open", locale = Locale, level = Level, topic = Topic });
            await SendJsonAsync(new { type = "session.locale", locale = Locale });

            var buffer = new byte[16 * 1024];
            try
            {
                while (_socket.State == WebSocketState.Open)
                {
                    var result = await _socket.ReceiveAsync(buffer, _ct);
                    if (result.MessageType == WebSocketMessageType.Close)
                    {
                        await _socket.CloseAsync(WebSocketCloseStatus.NormalClosure, "bye", _ct);
                        return;
                    }

                    if (result.MessageType == WebSocketMessageType.Text)
                    {
                        var text = Encoding.UTF8.GetString(buffer, 0, result.Count);
                        while (!result.EndOfMessage)
                        {
                            result = await _socket.ReceiveAsync(buffer, _ct);
                            text += Encoding.UTF8.GetString(buffer, 0, result.Count);
                        }
                        await HandleControlAsync(text);
                    }
                    else if (result.MessageType == WebSocketMessageType.Binary)
                    {
                        _inflightAudio ??= new MemoryStream();
                        _inflightAudio.Write(buffer, 0, result.Count);
                        while (!result.EndOfMessage)
                        {
                            result = await _socket.ReceiveAsync(buffer, _ct);
                            _inflightAudio.Write(buffer, 0, result.Count);
                        }
                    }
                }
            }
            catch (OperationCanceledException) { /* client disconnect */ }
            catch (WebSocketException) { /* client disconnect */ }
            catch (Exception ex)
            {
                await TrySendJsonAsync(new { type = "error", message = ex.Message });
            }
        }

        private async Task HandleControlAsync(string json)
        {
            ControlMessage? msg;
            try { msg = JsonSerializer.Deserialize<ControlMessage>(json, JsonOptions); }
            catch (JsonException)
            {
                await SendJsonAsync(new { type = "error", message = "invalid JSON control frame" });
                return;
            }
            if (msg is null || string.IsNullOrEmpty(msg.Type)) return;

            switch (msg.Type)
            {
                case "locale.set":
                    if (!string.IsNullOrWhiteSpace(msg.Locale) && msg.Locale != Locale)
                    {
                        Locale = msg.Locale!;
                        await SendJsonAsync(new { type = "session.locale", locale = Locale });
                    }
                    break;

                case "student.utterance.begin":
                    _inflightAudio = new MemoryStream();
                    if (!string.IsNullOrWhiteSpace(msg.AudioFormat)) AudioExtension = msg.AudioFormat!;
                    break;

                case "student.utterance.end":
                    await ProcessInflightUtteranceAsync();
                    break;

                case "student.text":
                    if (!string.IsNullOrWhiteSpace(msg.Text))
                        await ProcessTextUtteranceAsync(msg.Text!);
                    break;

                case "session.reset":
                    _history.Clear();
                    _inflightAudio?.Dispose();
                    _inflightAudio = null;
                    await SendJsonAsync(new { type = "session.reset.ok" });
                    break;
            }
        }

        private async Task ProcessInflightUtteranceAsync()
        {
            if (_inflightAudio is null || _inflightAudio.Length == 0)
            {
                await SendJsonAsync(new { type = "error", message = "no audio captured for utterance" });
                return;
            }
            _inflightAudio.Position = 0;
            var audio = _inflightAudio;
            _inflightAudio = null;

            if (string.IsNullOrWhiteSpace(VoiceId))
            {
                await SendJsonAsync(new { type = "error", message = "voiceId is required (send as query string or first control frame)" });
                audio.Dispose();
                return;
            }

            try
            {
                var result = await _orchestrator.ProcessStudentTurnAsync(new ClassroomTurnInput(
                    audio,
                    $"utterance.{AudioExtension}",
                    Level,
                    Topic,
                    VoiceId,
                    TargetLanguageFromLocale(Locale),
                    _history.ToArray()), _ct);

                _history.Add(new ChatTurn("user", result.StudentTranscript));
                _history.Add(new ChatTurn("assistant", result.TeacherTurn.TeacherResponse));

                await SendJsonAsync(new
                {
                    type = "student.transcript",
                    text = result.StudentTranscript,
                    language = result.DetectedLanguage,
                });
                await SendJsonAsync(new
                {
                    type = "teacher.turn",
                    text = result.TeacherTurn.TeacherResponse,
                    corrections = result.TeacherTurn.Corrections,
                });
                await StreamAudioAsync(result.TeacherAudio);
            }
            catch (AiVendorException ex)
            {
                await SendJsonAsync(new { type = "error", message = ex.Message });
            }
            finally
            {
                audio.Dispose();
            }
        }

        private async Task ProcessTextUtteranceAsync(string studentText)
        {
            try
            {
                var turn = await _orchestrator.Chat.LessonTurnAsync(new LessonTurnRequest(
                    Level, Topic, studentText, _history.ToArray(), TargetLanguageFromLocale(Locale)), _ct);
                _history.Add(new ChatTurn("user", studentText));
                _history.Add(new ChatTurn("assistant", turn.TeacherResponse));

                await SendJsonAsync(new { type = "student.transcript", text = studentText, language = (string?)null });
                await SendJsonAsync(new { type = "teacher.turn", text = turn.TeacherResponse, corrections = turn.Corrections });

                if (!string.IsNullOrWhiteSpace(VoiceId))
                {
                    var audio = await _orchestrator.Tts.SynthesizeAsync(
                        new TtsRequest(turn.TeacherResponse, VoiceId), _ct);
                    await StreamAudioAsync(audio);
                }
            }
            catch (AiVendorException ex)
            {
                await SendJsonAsync(new { type = "error", message = ex.Message });
            }
        }

        private async Task StreamAudioAsync(AudioSynthesisResult audio)
        {
            await SendJsonAsync(new { type = "teacher.audio.begin", contentType = audio.ContentType });
            try
            {
                var buffer = new byte[8 * 1024];
                int read;
                while ((read = await audio.Audio.ReadAsync(buffer.AsMemory(0, buffer.Length), _ct)) > 0)
                {
                    var segment = new ArraySegment<byte>(buffer, 0, read);
                    await _socket.SendAsync(segment, WebSocketMessageType.Binary, endOfMessage: true, _ct);
                }
            }
            finally
            {
                await audio.Audio.DisposeAsync();
            }
            await SendJsonAsync(new { type = "teacher.audio.end" });
        }

        private async Task SendJsonAsync(object payload)
        {
            if (_socket.State != WebSocketState.Open) return;
            var json = JsonSerializer.Serialize(payload, JsonOptions);
            var bytes = Encoding.UTF8.GetBytes(json);
            await _socket.SendAsync(bytes, WebSocketMessageType.Text, endOfMessage: true, _ct);
        }

        private async Task TrySendJsonAsync(object payload)
        {
            try { await SendJsonAsync(payload); } catch { /* swallow during shutdown */ }
        }

        private static string? TargetLanguageFromLocale(string locale) =>
            string.IsNullOrWhiteSpace(locale) ? null : locale.Split('-').FirstOrDefault();

        private sealed record ControlMessage(
            [property: JsonPropertyName("type")] string? Type,
            [property: JsonPropertyName("locale")] string? Locale = null,
            [property: JsonPropertyName("audioFormat")] string? AudioFormat = null,
            [property: JsonPropertyName("text")] string? Text = null);
    }
}
