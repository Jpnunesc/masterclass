using MasterClass.Domain.Enums;

namespace MasterClass.Domain.Entities;

public class ReviewItem : BaseEntity
{
    private ReviewItem() { }

    public ReviewItem(Guid studentId, Guid vocabularyItemId, DateTimeOffset dueAt)
    {
        StudentId = studentId;
        VocabularyItemId = vocabularyItemId;
        DueAt = dueAt;
        IntervalDays = 1;
        Repetitions = 0;
        EaseFactor = 2.5;
    }

    public Guid StudentId { get; private set; }
    public Guid VocabularyItemId { get; private set; }
    public DateTimeOffset DueAt { get; private set; }
    public int IntervalDays { get; private set; }
    public int Repetitions { get; private set; }
    public double EaseFactor { get; private set; }
    public ReviewOutcome? LastOutcome { get; private set; }

    public void Record(ReviewOutcome outcome, DateTimeOffset now)
    {
        LastOutcome = outcome;
        if (outcome == ReviewOutcome.Forgot)
        {
            Repetitions = 0;
            IntervalDays = 1;
            EaseFactor = Math.Max(1.3, EaseFactor - 0.2);
        }
        else
        {
            Repetitions += 1;
            IntervalDays = Repetitions switch
            {
                1 => 1,
                2 => 3,
                _ => (int)Math.Ceiling(IntervalDays * EaseFactor),
            };
            var bonus = outcome switch
            {
                ReviewOutcome.Hard => -0.15,
                ReviewOutcome.Good => 0.0,
                ReviewOutcome.Easy => 0.15,
                _ => 0.0,
            };
            EaseFactor = Math.Max(1.3, EaseFactor + bonus);
        }
        DueAt = now.AddDays(IntervalDays);
        Touch();
    }
}
