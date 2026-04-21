using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using MasterClass.Application.Auth;

namespace MasterClass.Api.Tests;

public class AuthEndpointsTests : IClassFixture<MasterClassWebApplicationFactory>
{
    private readonly MasterClassWebApplicationFactory _factory;

    public AuthEndpointsTests(MasterClassWebApplicationFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task Register_Login_Me_ReturnsAuthenticatedProfile()
    {
        var client = _factory.CreateClient();
        var email = $"user-{Guid.NewGuid():N}@example.com";

        var registerResp = await client.PostAsJsonAsync("/auth/register",
            new RegisterRequest(email, "password123", "Test User"));
        Assert.Equal(HttpStatusCode.OK, registerResp.StatusCode);
        var registered = await registerResp.Content.ReadFromJsonAsync<AuthResponse>();
        Assert.NotNull(registered);
        Assert.False(string.IsNullOrWhiteSpace(registered!.AccessToken));

        var loginResp = await client.PostAsJsonAsync("/auth/login",
            new LoginRequest(email, "password123"));
        Assert.Equal(HttpStatusCode.OK, loginResp.StatusCode);
        var loggedIn = await loginResp.Content.ReadFromJsonAsync<AuthResponse>();
        Assert.NotNull(loggedIn);

        client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", loggedIn!.AccessToken);
        var meResp = await client.GetAsync("/auth/me");
        Assert.Equal(HttpStatusCode.OK, meResp.StatusCode);
        var profile = await meResp.Content.ReadFromJsonAsync<StudentProfile>();
        Assert.NotNull(profile);
        Assert.Equal(email, profile!.Email);
        Assert.Equal("Test User", profile.DisplayName);
    }

    [Fact]
    public async Task Me_WithoutToken_Returns401()
    {
        var client = _factory.CreateClient();
        var resp = await client.GetAsync("/auth/me");
        Assert.Equal(HttpStatusCode.Unauthorized, resp.StatusCode);
    }

    [Fact]
    public async Task Login_WrongPassword_Returns401()
    {
        var client = _factory.CreateClient();
        var email = $"user-{Guid.NewGuid():N}@example.com";
        await client.PostAsJsonAsync("/auth/register", new RegisterRequest(email, "password123", "Test"));

        var resp = await client.PostAsJsonAsync("/auth/login", new LoginRequest(email, "wrong-pass"));
        Assert.Equal(HttpStatusCode.Unauthorized, resp.StatusCode);
    }

    [Fact]
    public async Task Register_DuplicateEmail_Returns400()
    {
        var client = _factory.CreateClient();
        var email = $"user-{Guid.NewGuid():N}@example.com";
        await client.PostAsJsonAsync("/auth/register", new RegisterRequest(email, "password123", "Test"));

        var resp = await client.PostAsJsonAsync("/auth/register", new RegisterRequest(email, "password123", "Test"));
        Assert.Equal(HttpStatusCode.BadRequest, resp.StatusCode);
    }

    [Fact]
    public async Task Health_ReturnsOk()
    {
        var client = _factory.CreateClient();
        var resp = await client.GetAsync("/health");
        Assert.Equal(HttpStatusCode.OK, resp.StatusCode);
    }
}
