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
        await _db.SaveChangesAsync(ct);

        var token = _tokens.Issue(student);
        return new AuthResponse(student.Id, student.Email, student.DisplayName, token.AccessToken, token.ExpiresAt);
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

        var token = _tokens.Issue(student);
        return new AuthResponse(student.Id, student.Email, student.DisplayName, token.AccessToken, token.ExpiresAt);
    }

    public async Task<StudentProfile?> GetProfileAsync(Guid studentId, CancellationToken ct = default)
    {
        var student = await _db.Students.FirstOrDefaultAsync(s => s.Id == studentId, ct);
        return student is null
            ? null
            : new StudentProfile(student.Id, student.Email, student.DisplayName, student.ProficiencyLevel.ToString());
    }
}
