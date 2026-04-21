namespace MasterClass.Infrastructure.Auth;

public sealed class JwtOptions
{
    public const string SectionName = "Jwt";

    public string Issuer { get; set; } = "masterclass-api";
    public string Audience { get; set; } = "masterclass-web";
    public string Secret { get; set; } = string.Empty;
    public int AccessTokenLifetimeMinutes { get; set; } = 60;
}
