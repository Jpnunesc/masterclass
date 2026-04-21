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

public class LessonsEndpointsTests : IClassFixture<MasterClassWebApplicationFactory>
{
    private readonly MasterClassWebApplicationFactory _factory;

    public LessonsEndpointsTests(MasterClassWebApplicationFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task Get_WithoutToken_ReturnsUnauthorized()
    {
        var client = _factory.CreateClient();
        var response = await client.GetAsync("/api/lessons");
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Get_ReturnsOrderedListWithDefaultPaging()
    {
        var client = _factory.CreateClient();
        var token = await RegisterAndLoginAsync(client);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token.AccessToken);

        await SeedLessonsAsync(3);

        var response = await client.GetAsync("/api/lessons");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<LessonListResponse>();
        Assert.NotNull(body);
        Assert.Equal(3, body!.Total);
        Assert.Equal(20, body.Take);
        Assert.Equal(0, body.Skip);
        Assert.Equal(3, body.Items.Count);
        // Ordered by OrderIndex then Title — seed below uses increasing OrderIndex.
        Assert.Equal("lesson-0", body.Items[0].Slug);
        Assert.Equal("lesson-1", body.Items[1].Slug);
        Assert.Equal("lesson-2", body.Items[2].Slug);
    }

    [Fact]
    public async Task Get_RespectsTakeAndSkip()
    {
        var client = _factory.CreateClient();
        var token = await RegisterAndLoginAsync(client);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token.AccessToken);

        await SeedLessonsAsync(5);

        var response = await client.GetAsync("/api/lessons?take=2&skip=1");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<LessonListResponse>();
        Assert.NotNull(body);
        Assert.Equal(2, body!.Items.Count);
        Assert.Equal(2, body.Take);
        Assert.Equal(1, body.Skip);
        Assert.Equal("lesson-1", body.Items[0].Slug);
        Assert.Equal("lesson-2", body.Items[1].Slug);
    }

    [Fact]
    public async Task Get_ClampsTakeWithinBounds()
    {
        var client = _factory.CreateClient();
        var token = await RegisterAndLoginAsync(client);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token.AccessToken);

        var response = await client.GetAsync("/api/lessons?take=500");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<LessonListResponse>();
        Assert.NotNull(body);
        Assert.Equal(100, body!.Take);
    }

    private async Task<AuthResponse> RegisterAndLoginAsync(HttpClient client)
    {
        var email = $"user-{Guid.NewGuid():N}@example.com";
        var registerResp = await client.PostAsJsonAsync("/auth/register",
            new RegisterRequest(email, "password123", "Test User"));
        registerResp.EnsureSuccessStatusCode();
        return (await registerResp.Content.ReadFromJsonAsync<AuthResponse>())!;
    }

    private async Task SeedLessonsAsync(int count)
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<MasterClassDbContext>();
        var existing = db.Lessons.Any();
        if (existing) return; // per-test-class isolation: seed once per factory instance
        for (var i = 0; i < count; i++)
        {
            db.Lessons.Add(new Lesson(
                slug: $"lesson-{i}",
                title: $"Lesson {i}",
                summary: $"Summary {i}",
                targetLevel: ProficiencyLevel.B1,
                orderIndex: i));
        }
        await db.SaveChangesAsync();
    }
}
