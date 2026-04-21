using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using MasterClass.Application.Abstractions;
using MasterClass.Domain.Entities;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace MasterClass.Infrastructure.Auth;

public sealed class JwtTokenIssuer : ITokenIssuer
{
    private readonly JwtOptions _options;

    public JwtTokenIssuer(IOptions<JwtOptions> options)
    {
        _options = options.Value;
        if (string.IsNullOrWhiteSpace(_options.Secret) || _options.Secret.Length < 32)
            throw new InvalidOperationException("Jwt:Secret must be configured with at least 32 characters (set via env var Jwt__Secret).");
    }

    public IssuedToken Issue(Student student)
    {
        var now = DateTimeOffset.UtcNow;
        var expires = now.AddMinutes(_options.AccessTokenLifetimeMinutes);

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, student.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, student.Email),
            new Claim("name", student.DisplayName),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
        };

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_options.Secret));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: _options.Issuer,
            audience: _options.Audience,
            claims: claims,
            notBefore: now.UtcDateTime,
            expires: expires.UtcDateTime,
            signingCredentials: creds);

        var encoded = new JwtSecurityTokenHandler().WriteToken(token);
        return new IssuedToken(encoded, expires);
    }
}
