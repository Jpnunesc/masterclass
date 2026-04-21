using MasterClass.Domain.Enums;

namespace MasterClass.Domain.Entities;

public class Student : BaseEntity
{
    private Student() { }

    public Student(string email, string displayName, string passwordHash, ProficiencyLevel level = ProficiencyLevel.A1)
    {
        if (string.IsNullOrWhiteSpace(email)) throw new ArgumentException("Email is required.", nameof(email));
        if (string.IsNullOrWhiteSpace(displayName)) throw new ArgumentException("Display name is required.", nameof(displayName));
        if (string.IsNullOrWhiteSpace(passwordHash)) throw new ArgumentException("Password hash is required.", nameof(passwordHash));

        Email = email.Trim().ToLowerInvariant();
        DisplayName = displayName.Trim();
        PasswordHash = passwordHash;
        ProficiencyLevel = level;
    }

    public string Email { get; private set; } = default!;
    public string DisplayName { get; private set; } = default!;
    public string PasswordHash { get; private set; } = default!;
    public ProficiencyLevel ProficiencyLevel { get; private set; }

    public void Rename(string displayName)
    {
        if (string.IsNullOrWhiteSpace(displayName)) throw new ArgumentException("Display name is required.", nameof(displayName));
        DisplayName = displayName.Trim();
        Touch();
    }

    public void UpdatePasswordHash(string passwordHash)
    {
        if (string.IsNullOrWhiteSpace(passwordHash)) throw new ArgumentException("Password hash is required.", nameof(passwordHash));
        PasswordHash = passwordHash;
        Touch();
    }

    public void PromoteTo(ProficiencyLevel level)
    {
        if (level < ProficiencyLevel) throw new InvalidOperationException("Cannot demote below current level.");
        ProficiencyLevel = level;
        Touch();
    }
}
