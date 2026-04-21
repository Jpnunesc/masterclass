using MasterClass.Domain.Entities;

namespace MasterClass.Application.Abstractions;

public interface ITokenIssuer
{
    IssuedToken Issue(Student student);
    IssuedRefreshToken IssueRefresh();
    string HashRefreshToken(string opaqueToken);
}

public sealed record IssuedToken(string AccessToken, DateTimeOffset ExpiresAt);

public sealed record IssuedRefreshToken(string OpaqueToken, DateTimeOffset ExpiresAt);
