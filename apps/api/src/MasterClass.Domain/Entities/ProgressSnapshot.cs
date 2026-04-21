using MasterClass.Domain.Enums;

namespace MasterClass.Domain.Entities;

public class ProgressSnapshot : BaseEntity
{
    private ProgressSnapshot() { }

    public ProgressSnapshot(Guid studentId, ProficiencyLevel level, int lessonsCompleted, int vocabularyKnown, double accuracyPercent)
    {
        if (lessonsCompleted < 0) throw new ArgumentOutOfRangeException(nameof(lessonsCompleted));
        if (vocabularyKnown < 0) throw new ArgumentOutOfRangeException(nameof(vocabularyKnown));
        if (accuracyPercent < 0 || accuracyPercent > 100) throw new ArgumentOutOfRangeException(nameof(accuracyPercent));

        StudentId = studentId;
        Level = level;
        LessonsCompleted = lessonsCompleted;
        VocabularyKnown = vocabularyKnown;
        AccuracyPercent = accuracyPercent;
        CapturedAt = DateTimeOffset.UtcNow;
    }

    public Guid StudentId { get; private set; }
    public ProficiencyLevel Level { get; private set; }
    public int LessonsCompleted { get; private set; }
    public int VocabularyKnown { get; private set; }
    public double AccuracyPercent { get; private set; }
    public DateTimeOffset CapturedAt { get; private set; }
}
