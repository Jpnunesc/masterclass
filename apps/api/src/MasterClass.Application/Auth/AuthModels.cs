namespace MasterClass.Application.Auth;

public sealed record RegisterRequest(string Email, string Password, string DisplayName);

public sealed record LoginRequest(string Email, string Password);

public sealed record RefreshRequest(string RefreshToken);

public sealed record AuthResponse(
    Guid StudentId,
    string Email,
    string DisplayName,
    string AccessToken,
    DateTimeOffset ExpiresAt,
    string RefreshToken,
    DateTimeOffset RefreshTokenExpiresAt);

public sealed record StudentProfile(Guid Id, string Email, string DisplayName, string ProficiencyLevel);

public sealed class AuthException : Exception
{
    public AuthException(string message) : base(message) { }
}
