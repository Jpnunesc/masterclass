namespace MasterClass.Domain.Entities;

public class VocabularyItem : BaseEntity
{
    private VocabularyItem() { }

    public VocabularyItem(Guid studentId, string term, string translation, string? exampleSentence = null)
    {
        if (string.IsNullOrWhiteSpace(term)) throw new ArgumentException("Term is required.", nameof(term));
        if (string.IsNullOrWhiteSpace(translation)) throw new ArgumentException("Translation is required.", nameof(translation));

        StudentId = studentId;
        Term = term.Trim();
        Translation = translation.Trim();
        ExampleSentence = exampleSentence?.Trim();
    }

    public Guid StudentId { get; private set; }
    public string Term { get; private set; } = default!;
    public string Translation { get; private set; } = default!;
    public string? ExampleSentence { get; private set; }
}
