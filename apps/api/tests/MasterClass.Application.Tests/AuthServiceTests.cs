using MasterClass.Application.Abstractions;
using MasterClass.Application.Auth;
using MasterClass.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MasterClass.Application.Tests;

public class AuthServiceTests
{
    private sealed class FakeDbContext : DbContext, IMasterClassDbContext
    {
        public FakeDbContext() : base(new DbContextOptionsBuilder<FakeDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options)
        { }

        public DbSet<Student> Students => Set<Student>();
        public DbSet<Lesson> Lessons => Set<Lesson>();
        public DbSet<AssessmentResult> AssessmentResults => Set<AssessmentResult>();
        public DbSet<VocabularyItem> VocabularyItems => Set<VocabularyItem>();
        public DbSet<ProgressSnapshot> ProgressSnapshots => Set<ProgressSnapshot>();
        public DbSet<ReviewItem> ReviewItems => Set<ReviewItem>();
        public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
    }

    private sealed class PlainHasher : IPasswordHasher
    {
        public string Hash(string password) => $"hash::{password}";
        public bool Verify(string password, string hash) => hash == $"hash::{password}";
    }

    private sealed class StubIssuer : ITokenIssuer
    {
        private int _refreshSeq;

        public DateTimeOffset RefreshExpiresAt { get; set; } = DateTimeOffset.UtcNow.AddDays(7);

        public IssuedToken Issue(Student student) =>
            new($"token-for-{student.Id}", DateTimeOffset.UtcNow.AddHours(1));

        public IssuedRefreshToken IssueRefresh() =>
            new($"refresh-{System.Threading.Interlocked.Increment(ref _refreshSeq)}-{Guid.NewGuid():N}", RefreshExpiresAt);

        public string HashRefreshToken(string opaqueToken) => $"hash::{opaqueToken}";
    }

    private static AuthService CreateService(out FakeDbContext db, out StubIssuer issuer)
    {
        db = new FakeDbContext();
        issuer = new StubIssuer();
        return new AuthService(db, new PlainHasher(), issuer);
    }

    private static AuthService CreateService(out FakeDbContext db)
    {
        var svc = CreateService(out db, out _);
        return svc;
    }

    [Fact]
    public async Task Register_PersistsStudentAndReturnsToken()
    {
        var svc = CreateService(out var db);

        var res = await svc.RegisterAsync(new RegisterRequest("user@example.com", "password123", "User"));

        Assert.NotEqual(Guid.Empty, res.StudentId);
        Assert.Equal("user@example.com", res.Email);
        Assert.StartsWith("token-for-", res.AccessToken);
        Assert.False(string.IsNullOrWhiteSpace(res.RefreshToken));
        Assert.Single(db.Students);
        Assert.Single(db.RefreshTokens);
    }

    [Fact]
    public async Task Register_RejectsDuplicateEmail()
    {
        var svc = CreateService(out _);

        await svc.RegisterAsync(new RegisterRequest("dup@example.com", "password123", "Dup"));
        await Assert.ThrowsAsync<AuthException>(() =>
            svc.RegisterAsync(new RegisterRequest("DUP@example.com", "password123", "Dup2")));
    }

    [Fact]
    public async Task Register_RejectsShortPassword()
    {
        var svc = CreateService(out _);
        await Assert.ThrowsAsync<AuthException>(() =>
            svc.RegisterAsync(new RegisterRequest("short@example.com", "short", "Short")));
    }

    [Fact]
    public async Task Login_ValidCredentials_ReturnsToken()
    {
        var svc = CreateService(out _);
        await svc.RegisterAsync(new RegisterRequest("login@example.com", "password123", "Login"));

        var res = await svc.LoginAsync(new LoginRequest("login@example.com", "password123"));

        Assert.Equal("login@example.com", res.Email);
        Assert.False(string.IsNullOrWhiteSpace(res.RefreshToken));
    }

    [Fact]
    public async Task Login_InvalidPassword_Throws()
    {
        var svc = CreateService(out _);
        await svc.RegisterAsync(new RegisterRequest("bad@example.com", "password123", "Bad"));

        await Assert.ThrowsAsync<AuthException>(() =>
            svc.LoginAsync(new LoginRequest("bad@example.com", "wrong-pass")));
    }

    [Fact]
    public async Task Refresh_ValidToken_RotatesAndRevokesOld()
    {
        var svc = CreateService(out var db);
        var first = await svc.RegisterAsync(new RegisterRequest("rot@example.com", "password123", "Rot"));

        var second = await svc.RefreshAsync(new RefreshRequest(first.RefreshToken));

        Assert.NotEqual(first.RefreshToken, second.RefreshToken);
        Assert.Equal(2, db.RefreshTokens.Count());
        var revoked = db.RefreshTokens.Single(t => t.TokenHash == $"hash::{first.RefreshToken}");
        Assert.NotNull(revoked.RevokedAt);
    }

    [Fact]
    public async Task Refresh_ReusedToken_Throws()
    {
        var svc = CreateService(out _);
        var first = await svc.RegisterAsync(new RegisterRequest("reuse@example.com", "password123", "Reuse"));

        await svc.RefreshAsync(new RefreshRequest(first.RefreshToken));
        await Assert.ThrowsAsync<AuthException>(() =>
            svc.RefreshAsync(new RefreshRequest(first.RefreshToken)));
    }

    [Fact]
    public async Task Refresh_UnknownToken_Throws()
    {
        var svc = CreateService(out _);
        await svc.RegisterAsync(new RegisterRequest("unknown@example.com", "password123", "Unknown"));

        await Assert.ThrowsAsync<AuthException>(() =>
            svc.RefreshAsync(new RefreshRequest("not-a-real-token")));
    }

    [Fact]
    public async Task Refresh_EmptyToken_Throws()
    {
        var svc = CreateService(out _);
        await Assert.ThrowsAsync<AuthException>(() =>
            svc.RefreshAsync(new RefreshRequest("")));
    }

    [Fact]
    public async Task Refresh_ExpiredToken_Throws()
    {
        var svc = CreateService(out _, out var issuer);
        issuer.RefreshExpiresAt = DateTimeOffset.UtcNow.AddSeconds(-1);
        var first = await svc.RegisterAsync(new RegisterRequest("expired@example.com", "password123", "Expired"));

        await Assert.ThrowsAsync<AuthException>(() =>
            svc.RefreshAsync(new RefreshRequest(first.RefreshToken)));
    }

    [Fact]
    public async Task Logout_RevokesToken()
    {
        var svc = CreateService(out var db);
        var first = await svc.RegisterAsync(new RegisterRequest("logout@example.com", "password123", "Logout"));

        await svc.LogoutAsync(new RefreshRequest(first.RefreshToken));

        var stored = db.RefreshTokens.Single();
        Assert.NotNull(stored.RevokedAt);
        await Assert.ThrowsAsync<AuthException>(() =>
            svc.RefreshAsync(new RefreshRequest(first.RefreshToken)));
    }
}
