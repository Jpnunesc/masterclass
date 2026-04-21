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
    public async Task Refresh_RoundTrip_RotatesTokenAndRejectsReuse()
    {
        var client = _factory.CreateClient();
        var email = $"user-{Guid.NewGuid():N}@example.com";

        var registerResp = await client.PostAsJsonAsync("/auth/register",
            new RegisterRequest(email, "password123", "Refresher"));
        Assert.Equal(HttpStatusCode.OK, registerResp.StatusCode);
        var registered = await registerResp.Content.ReadFromJsonAsync<AuthResponse>();
        Assert.NotNull(registered);
        Assert.False(string.IsNullOrWhiteSpace(registered!.RefreshToken));

        var refresh1Resp = await client.PostAsJsonAsync("/auth/refresh",
            new RefreshRequest(registered.RefreshToken));
        Assert.Equal(HttpStatusCode.OK, refresh1Resp.StatusCode);
        var refreshed1 = await refresh1Resp.Content.ReadFromJsonAsync<AuthResponse>();
        Assert.NotNull(refreshed1);
        Assert.NotEqual(registered.RefreshToken, refreshed1!.RefreshToken);
        Assert.False(string.IsNullOrWhiteSpace(refreshed1.AccessToken));

        var refresh2Resp = await client.PostAsJsonAsync("/auth/refresh",
            new RefreshRequest(refreshed1.RefreshToken));
        Assert.Equal(HttpStatusCode.OK, refresh2Resp.StatusCode);

        var reuseResp = await client.PostAsJsonAsync("/auth/refresh",
            new RefreshRequest(registered.RefreshToken));
        Assert.Equal(HttpStatusCode.Unauthorized, reuseResp.StatusCode);
    }

    [Fact]
    public async Task Refresh_UnknownToken_Returns401()
    {
        var client = _factory.CreateClient();
        var resp = await client.PostAsJsonAsync("/auth/refresh",
            new RefreshRequest("bogus-refresh-token"));
        Assert.Equal(HttpStatusCode.Unauthorized, resp.StatusCode);
    }

    [Fact]
    public async Task Logout_RevokesRefreshToken()
    {
        var client = _factory.CreateClient();
        var email = $"user-{Guid.NewGuid():N}@example.com";

        var registerResp = await client.PostAsJsonAsync("/auth/register",
            new RegisterRequest(email, "password123", "LogoutUser"));
        var registered = await registerResp.Content.ReadFromJsonAsync<AuthResponse>();
        Assert.NotNull(registered);

        var logoutResp = await client.PostAsJsonAsync("/auth/logout",
            new RefreshRequest(registered!.RefreshToken));
        Assert.Equal(HttpStatusCode.NoContent, logoutResp.StatusCode);

        var refreshResp = await client.PostAsJsonAsync("/auth/refresh",
            new RefreshRequest(registered.RefreshToken));
        Assert.Equal(HttpStatusCode.Unauthorized, refreshResp.StatusCode);
    }

    [Fact]
    public async Task Health_ReturnsOk()
    {
        var client = _factory.CreateClient();
        var resp = await client.GetAsync("/health");
        Assert.Equal(HttpStatusCode.OK, resp.StatusCode);
    }
}
