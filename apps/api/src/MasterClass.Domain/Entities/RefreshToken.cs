namespace MasterClass.Domain.Entities;

public class RefreshToken : BaseEntity
{
    private RefreshToken() { }

    public RefreshToken(Guid studentId, string tokenHash, DateTimeOffset expiresAt)
    {
        if (studentId == Guid.Empty) throw new ArgumentException("StudentId is required.", nameof(studentId));
        if (string.IsNullOrWhiteSpace(tokenHash)) throw new ArgumentException("Token hash is required.", nameof(tokenHash));

        StudentId = studentId;
        TokenHash = tokenHash;
        ExpiresAt = expiresAt;
    }

    public Guid StudentId { get; private set; }
    public string TokenHash { get; private set; } = default!;
    public DateTimeOffset ExpiresAt { get; private set; }
    public DateTimeOffset? RevokedAt { get; private set; }
    public Guid? ReplacedByTokenId { get; private set; }

    public bool IsActive(DateTimeOffset now) => RevokedAt is null && now < ExpiresAt;

    public void Revoke(DateTimeOffset now, Guid? replacedByTokenId = null)
    {
        if (RevokedAt is null) RevokedAt = now;
        if (replacedByTokenId.HasValue) ReplacedByTokenId = replacedByTokenId;
        Touch();
    }
}
