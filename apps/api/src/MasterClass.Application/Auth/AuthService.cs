using MasterClass.Application.Abstractions;
using MasterClass.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MasterClass.Application.Auth;

public sealed class AuthService
{
    private readonly IMasterClassDbContext _db;
    private readonly IPasswordHasher _hasher;
    private readonly ITokenIssuer _tokens;

    public AuthService(IMasterClassDbContext db, IPasswordHasher hasher, ITokenIssuer tokens)
    {
        _db = db;
        _hasher = hasher;
        _tokens = tokens;
    }

    public async Task<AuthResponse> RegisterAsync(RegisterRequest request, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(request.Email)) throw new AuthException("Email is required.");
        if (string.IsNullOrWhiteSpace(request.Password) || request.Password.Length < 8)
            throw new AuthException("Password must be at least 8 characters.");
        if (string.IsNullOrWhiteSpace(request.DisplayName)) throw new AuthException("Display name is required.");

        var normalized = request.Email.Trim().ToLowerInvariant();
        var existing = await _db.Students.AnyAsync(s => s.Email == normalized, ct);
        if (existing) throw new AuthException("Email already registered.");

        var student = new Student(normalized, request.DisplayName, _hasher.Hash(request.Password));
        _db.Students.Add(student);

        var (access, refresh) = IssueAndPersistTokens(student);
        await _db.SaveChangesAsync(ct);

        return BuildResponse(student, access, refresh);
    }

    public async Task<AuthResponse> LoginAsync(LoginRequest request, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
            throw new AuthException("Invalid credentials.");

        var normalized = request.Email.Trim().ToLowerInvariant();
        var student = await _db.Students.FirstOrDefaultAsync(s => s.Email == normalized, ct)
            ?? throw new AuthException("Invalid credentials.");

        if (!_hasher.Verify(request.Password, student.PasswordHash))
            throw new AuthException("Invalid credentials.");

        var (access, refresh) = IssueAndPersistTokens(student);
        await _db.SaveChangesAsync(ct);

        return BuildResponse(student, access, refresh);
    }

    public async Task<AuthResponse> RefreshAsync(RefreshRequest request, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(request.RefreshToken))
            throw new AuthException("Refresh token is required.");

        var hash = _tokens.HashRefreshToken(request.RefreshToken);
        var now = DateTimeOffset.UtcNow;

        var existing = await _db.RefreshTokens.FirstOrDefaultAsync(t => t.TokenHash == hash, ct)
            ?? throw new AuthException("Invalid refresh token.");

        if (!existing.IsActive(now))
            throw new AuthException("Invalid refresh token.");

        var student = await _db.Students.FirstOrDefaultAsync(s => s.Id == existing.StudentId, ct)
            ?? throw new AuthException("Invalid refresh token.");

        var (access, refresh) = IssueAndPersistTokens(student);
        existing.Revoke(now, replacedByTokenId: GetNewestRefreshId(student.Id));
        await _db.SaveChangesAsync(ct);

        return BuildResponse(student, access, refresh);
    }

    public async Task LogoutAsync(RefreshRequest request, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(request.RefreshToken)) return;

        var hash = _tokens.HashRefreshToken(request.RefreshToken);
        var existing = await _db.RefreshTokens.FirstOrDefaultAsync(t => t.TokenHash == hash, ct);
        if (existing is null || existing.RevokedAt is not null) return;

        existing.Revoke(DateTimeOffset.UtcNow);
        await _db.SaveChangesAsync(ct);
    }

    public async Task<StudentProfile?> GetProfileAsync(Guid studentId, CancellationToken ct = default)
    {
        var student = await _db.Students.FirstOrDefaultAsync(s => s.Id == studentId, ct);
        return student is null
            ? null
            : new StudentProfile(student.Id, student.Email, student.DisplayName, student.ProficiencyLevel.ToString());
    }

    private (IssuedToken Access, IssuedRefreshToken Refresh) IssueAndPersistTokens(Student student)
    {
        var access = _tokens.Issue(student);
        var refresh = _tokens.IssueRefresh();
        var refreshEntity = new RefreshToken(student.Id, _tokens.HashRefreshToken(refresh.OpaqueToken), refresh.ExpiresAt);
        _db.RefreshTokens.Add(refreshEntity);
        return (access, refresh);
    }

    private Guid? GetNewestRefreshId(Guid studentId)
    {
        var added = _db.RefreshTokens.Local
            .Where(t => t.StudentId == studentId && t.RevokedAt is null)
            .OrderByDescending(t => t.CreatedAt)
            .FirstOrDefault();
        return added?.Id;
    }

    private static AuthResponse BuildResponse(Student student, IssuedToken access, IssuedRefreshToken refresh) =>
        new(student.Id, student.Email, student.DisplayName, access.AccessToken, access.ExpiresAt, refresh.OpaqueToken, refresh.ExpiresAt);
}
