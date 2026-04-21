using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using MasterClass.Api.Endpoints;
using MasterClass.Application.Auth;
using MasterClass.Domain.Entities;
using MasterClass.Domain.Enums;
using MasterClass.Infrastructure.Persistence;
using Microsoft.Extensions.DependencyInjection;

namespace MasterClass.Api.Tests;

public class ProgressEndpointsTests : IClassFixture<MasterClassWebApplicationFactory>
{
    private readonly MasterClassWebApplicationFactory _factory;

    public ProgressEndpointsTests(MasterClassWebApplicationFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task GetMe_WithoutToken_ReturnsUnauthorized()
    {
        var client = _factory.CreateClient();
        var response = await client.GetAsync("/api/progress/me");
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task GetMe_WithNoSnapshots_ReturnsNotFound()
    {
        var client = _factory.CreateClient();
        var token = await RegisterAndLoginAsync(client);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token.AccessToken);

        var response = await client.GetAsync("/api/progress/me");
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task GetMe_WithMultipleSnapshots_ReturnsLatestByCapturedAt()
    {
        var client = _factory.CreateClient();
        var token = await RegisterAndLoginAsync(client);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token.AccessToken);

        await SeedSnapshotsAsync(token.StudentId);

        var response = await client.GetAsync("/api/progress/me");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<ProgressSnapshotResponse>();
        Assert.NotNull(body);
        // Latest seed below: B2 with 20 lessons, capturedAt is most recent.
        Assert.Equal("B2", body!.Level);
        Assert.Equal(20, body.LessonsCompleted);
        Assert.Equal(token.StudentId, body.StudentId);
    }

    [Fact]
    public async Task GetMe_DoesNotLeakOtherStudentsSnapshots()
    {
        var client = _factory.CreateClient();
        var alice = await RegisterAndLoginAsync(client, "alice");
        var bob = await RegisterAndLoginAsync(_factory.CreateClient(), "bob");

        await SeedSnapshotsAsync(bob.StudentId);
        // Alice has no snapshots; Bob has several.

        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", alice.AccessToken);
        var response = await client.GetAsync("/api/progress/me");
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    private async Task<AuthResponse> RegisterAndLoginAsync(HttpClient client, string? prefix = null)
    {
        var email = $"{prefix ?? "user"}-{Guid.NewGuid():N}@example.com";
        var registerResp = await client.PostAsJsonAsync("/auth/register",
            new RegisterRequest(email, "password123", "Test User"));
        registerResp.EnsureSuccessStatusCode();
        return (await registerResp.Content.ReadFromJsonAsync<AuthResponse>())!;
    }

    private async Task SeedSnapshotsAsync(Guid studentId)
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<MasterClassDbContext>();

        db.ProgressSnapshots.Add(new ProgressSnapshot(studentId, ProficiencyLevel.A1, 2, 30, 60.0));
        await db.SaveChangesAsync();
        await Task.Delay(10); // ensure CapturedAt is strictly after the previous row
        db.ProgressSnapshots.Add(new ProgressSnapshot(studentId, ProficiencyLevel.A2, 10, 120, 72.0));
        await db.SaveChangesAsync();
        await Task.Delay(10);
        db.ProgressSnapshots.Add(new ProgressSnapshot(studentId, ProficiencyLevel.B2, 20, 480, 84.5));
        await db.SaveChangesAsync();
    }
}
