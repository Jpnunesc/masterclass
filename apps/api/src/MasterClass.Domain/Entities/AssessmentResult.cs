namespace MasterClass.Domain.Entities;

public class AssessmentResult : BaseEntity
{
    private AssessmentResult() { }

    public AssessmentResult(Guid studentId, Guid lessonId, int scorePercent, int durationSeconds)
    {
        if (scorePercent < 0 || scorePercent > 100) throw new ArgumentOutOfRangeException(nameof(scorePercent));
        if (durationSeconds < 0) throw new ArgumentOutOfRangeException(nameof(durationSeconds));

        StudentId = studentId;
        LessonId = lessonId;
        ScorePercent = scorePercent;
        DurationSeconds = durationSeconds;
        TakenAt = DateTimeOffset.UtcNow;
    }

    public Guid StudentId { get; private set; }
    public Guid LessonId { get; private set; }
    public int ScorePercent { get; private set; }
    public int DurationSeconds { get; private set; }
    public DateTimeOffset TakenAt { get; private set; }
}
