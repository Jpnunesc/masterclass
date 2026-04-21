using MasterClass.Domain.Enums;

namespace MasterClass.Domain.Entities;

public class Lesson : BaseEntity
{
    private Lesson() { }

    public Lesson(string slug, string title, string summary, ProficiencyLevel targetLevel, int orderIndex)
    {
        if (string.IsNullOrWhiteSpace(slug)) throw new ArgumentException("Slug is required.", nameof(slug));
        if (string.IsNullOrWhiteSpace(title)) throw new ArgumentException("Title is required.", nameof(title));

        Slug = slug.Trim().ToLowerInvariant();
        Title = title.Trim();
        Summary = summary?.Trim() ?? string.Empty;
        TargetLevel = targetLevel;
        OrderIndex = orderIndex;
    }

    public string Slug { get; private set; } = default!;
    public string Title { get; private set; } = default!;
    public string Summary { get; private set; } = default!;
    public ProficiencyLevel TargetLevel { get; private set; }
    public int OrderIndex { get; private set; }
}
