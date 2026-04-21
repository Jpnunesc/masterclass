using System.Net.WebSockets;
using System.Text;
using System.Text.Json;
using MasterClass.Application.Ai;

namespace MasterClass.Api.Tests;

public class ClassroomWebSocketTests : IClassFixture<MasterClassWebApplicationFactory>
{
    private readonly MasterClassWebApplicationFactory _factory;

    public ClassroomWebSocketTests(MasterClassWebApplicationFactory factory)
    {
        _factory = factory;
        _factory.AzureFake.Reset();
        _factory.ElevenFake.Reset();
        _factory.GroqFake.Reset();
    }

    [Fact]
    public async Task AudioUtterance_RunsSttChatTtsPipeline_AndEmitsLocaleAndTranscript()
    {
        _factory.GroqFake.NextResult = new TranscriptionResult("I want to travel.", "en");
        _factory.AzureFake.NextTurn = new LessonTurnResult(
            "Where would you go first?", Array.Empty<Correction>());
        _factory.ElevenFake.NextAudio = new byte[] { 0xAA, 0xBB, 0xCC };
        _factory.ElevenFake.NextContentType = "audio/mpeg";

        var wsClient = _factory.Server.CreateWebSocketClient();
        var baseUri = _factory.Server.BaseAddress;
        var wsUri = new UriBuilder(baseUri)
        {
            Scheme = "ws",
            Path = "/ws/classroom",
            Query = "level=B1&topic=travel&voiceId=voice-en-M&locale=en-US&audioFormat=webm",
        }.Uri;

        using var socket = await wsClient.ConnectAsync(wsUri, CancellationToken.None);
        Assert.Equal(WebSocketState.Open, socket.State);

        var open = await ReceiveJsonAsync(socket);
        Assert.Equal("session.open", open.GetProperty("type").GetString());
        Assert.Equal("en-US", open.GetProperty("locale").GetString());

        var localeEvent = await ReceiveJsonAsync(socket);
        Assert.Equal("session.locale", localeEvent.GetProperty("type").GetString());
        Assert.Equal("en-US", localeEvent.GetProperty("locale").GetString());

        var audio = Encoding.UTF8.GetBytes("fake-audio-payload");
        await socket.SendAsync(audio, WebSocketMessageType.Binary, endOfMessage: true, CancellationToken.None);
        await SendJsonAsync(socket, new { type = "student.utterance.end" });

        var transcript = await ReceiveJsonAsync(socket);
        Assert.Equal("student.transcript", transcript.GetProperty("type").GetString());
        Assert.Equal("I want to travel.", transcript.GetProperty("text").GetString());

        var teacherTurn = await ReceiveJsonAsync(socket);
        Assert.Equal("teacher.turn", teacherTurn.GetProperty("type").GetString());
        Assert.Equal("Where would you go first?", teacherTurn.GetProperty("text").GetString());

        var audioBegin = await ReceiveJsonAsync(socket);
        Assert.Equal("teacher.audio.begin", audioBegin.GetProperty("type").GetString());
        Assert.Equal("audio/mpeg", audioBegin.GetProperty("contentType").GetString());

        var binary = await ReceiveBinaryAsync(socket);
        Assert.Equal(new byte[] { 0xAA, 0xBB, 0xCC }, binary);

        var audioEnd = await ReceiveJsonAsync(socket);
        Assert.Equal("teacher.audio.end", audioEnd.GetProperty("type").GetString());

        await socket.CloseAsync(WebSocketCloseStatus.NormalClosure, "done", CancellationToken.None);

        Assert.Single(_factory.GroqFake.Calls);
        Assert.Equal("utterance.webm", _factory.GroqFake.Calls[0].FileName);
        Assert.Equal(audio.Length, _factory.GroqFake.Calls[0].Size);
        Assert.Single(_factory.AzureFake.TurnCalls);
        Assert.Equal("B1", _factory.AzureFake.TurnCalls[0].StudentLevel);
        Assert.Equal("travel", _factory.AzureFake.TurnCalls[0].Topic);
        Assert.Single(_factory.ElevenFake.Calls);
        Assert.Equal("voice-en-M", _factory.ElevenFake.Calls[0].VoiceId);
    }

    [Fact]
    public async Task LocaleSet_EmitsSessionLocaleChange()
    {
        var wsClient = _factory.Server.CreateWebSocketClient();
        var wsUri = new UriBuilder(_factory.Server.BaseAddress)
        {
            Scheme = "ws",
            Path = "/ws/classroom",
            Query = "level=A2&topic=food&voiceId=voice-en-M&locale=en-US",
        }.Uri;

        using var socket = await wsClient.ConnectAsync(wsUri, CancellationToken.None);
        _ = await ReceiveJsonAsync(socket);
        _ = await ReceiveJsonAsync(socket);

        await SendJsonAsync(socket, new { type = "locale.set", locale = "pt-BR" });

        var localeChange = await ReceiveJsonAsync(socket);
        Assert.Equal("session.locale", localeChange.GetProperty("type").GetString());
        Assert.Equal("pt-BR", localeChange.GetProperty("locale").GetString());

        await socket.CloseAsync(WebSocketCloseStatus.NormalClosure, "done", CancellationToken.None);
    }

    [Fact]
    public async Task StudentText_SkipsSttAndStillRunsChatPlusTts()
    {
        _factory.AzureFake.NextTurn = new LessonTurnResult("Nice, what did you see?", Array.Empty<Correction>());
        _factory.ElevenFake.NextAudio = new byte[] { 9, 8, 7 };

        var wsClient = _factory.Server.CreateWebSocketClient();
        var wsUri = new UriBuilder(_factory.Server.BaseAddress)
        {
            Scheme = "ws",
            Path = "/ws/classroom",
            Query = "level=B1&topic=travel&voiceId=voice-en-F&locale=en-US",
        }.Uri;

        using var socket = await wsClient.ConnectAsync(wsUri, CancellationToken.None);
        _ = await ReceiveJsonAsync(socket);
        _ = await ReceiveJsonAsync(socket);

        await SendJsonAsync(socket, new { type = "student.text", text = "I visited Paris." });

        var transcript = await ReceiveJsonAsync(socket);
        Assert.Equal("student.transcript", transcript.GetProperty("type").GetString());
        Assert.Equal("I visited Paris.", transcript.GetProperty("text").GetString());

        var teacherTurn = await ReceiveJsonAsync(socket);
        Assert.Equal("teacher.turn", teacherTurn.GetProperty("type").GetString());

        _ = await ReceiveJsonAsync(socket); // teacher.audio.begin
        _ = await ReceiveBinaryAsync(socket);
        _ = await ReceiveJsonAsync(socket); // teacher.audio.end

        Assert.Empty(_factory.GroqFake.Calls);
        Assert.Single(_factory.AzureFake.TurnCalls);
        Assert.Single(_factory.ElevenFake.Calls);

        await socket.CloseAsync(WebSocketCloseStatus.NormalClosure, "done", CancellationToken.None);
    }

    private static async Task<JsonElement> ReceiveJsonAsync(WebSocket socket)
    {
        var buffer = new byte[16 * 1024];
        var total = new MemoryStream();
        WebSocketReceiveResult result;
        do
        {
            result = await socket.ReceiveAsync(buffer, CancellationToken.None);
            total.Write(buffer, 0, result.Count);
        } while (!result.EndOfMessage);

        Assert.Equal(WebSocketMessageType.Text, result.MessageType);
        total.Position = 0;
        using var doc = JsonDocument.Parse(total.ToArray());
        return doc.RootElement.Clone();
    }

    private static async Task<byte[]> ReceiveBinaryAsync(WebSocket socket)
    {
        var buffer = new byte[16 * 1024];
        var total = new MemoryStream();
        WebSocketReceiveResult result;
        do
        {
            result = await socket.ReceiveAsync(buffer, CancellationToken.None);
            total.Write(buffer, 0, result.Count);
        } while (!result.EndOfMessage);

        Assert.Equal(WebSocketMessageType.Binary, result.MessageType);
        return total.ToArray();
    }

    private static async Task SendJsonAsync(WebSocket socket, object payload)
    {
        var json = JsonSerializer.Serialize(payload);
        var bytes = Encoding.UTF8.GetBytes(json);
        await socket.SendAsync(bytes, WebSocketMessageType.Text, endOfMessage: true, CancellationToken.None);
    }
}
