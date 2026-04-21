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
    }

    private sealed class PlainHasher : IPasswordHasher
    {
        public string Hash(string password) => $"hash::{password}";
        public bool Verify(string password, string hash) => hash == $"hash::{password}";
    }

    private sealed class StubIssuer : ITokenIssuer
    {
        public IssuedToken Issue(Student student) =>
            new($"token-for-{student.Id}", DateTimeOffset.UtcNow.AddHours(1));
    }

    private static AuthService CreateService(out FakeDbContext db)
    {
        db = new FakeDbContext();
        return new AuthService(db, new PlainHasher(), new StubIssuer());
    }

    [Fact]
    public async Task Register_PersistsStudentAndReturnsToken()
    {
        var svc = CreateService(out var db);

        var res = await svc.RegisterAsync(new RegisterRequest("user@example.com", "password123", "User"));

        Assert.NotEqual(Guid.Empty, res.StudentId);
        Assert.Equal("user@example.com", res.Email);
        Assert.StartsWith("token-for-", res.AccessToken);
        Assert.Single(db.Students);
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
    }

    [Fact]
    public async Task Login_InvalidPassword_Throws()
    {
        var svc = CreateService(out _);
        await svc.RegisterAsync(new RegisterRequest("bad@example.com", "password123", "Bad"));

        await Assert.ThrowsAsync<AuthException>(() =>
            svc.LoginAsync(new LoginRequest("bad@example.com", "wrong-pass")));
    }
}
