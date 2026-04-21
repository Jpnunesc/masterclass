using MasterClass.Domain.Entities;

namespace MasterClass.Application.Abstractions;

public interface ITokenIssuer
{
    IssuedToken Issue(Student student);
}

public sealed record IssuedToken(string AccessToken, DateTimeOffset ExpiresAt);
