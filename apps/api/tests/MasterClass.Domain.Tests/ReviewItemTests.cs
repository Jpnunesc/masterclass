using MasterClass.Domain.Entities;
using MasterClass.Domain.Enums;

namespace MasterClass.Domain.Tests;

public class ReviewItemTests
{
    [Fact]
    public void Record_Forgot_ResetsRepetitionsAndShortensInterval()
    {
        var now = DateTimeOffset.UtcNow;
        var item = new ReviewItem(Guid.NewGuid(), Guid.NewGuid(), now);

        item.Record(ReviewOutcome.Good, now);
        item.Record(ReviewOutcome.Good, now);
        item.Record(ReviewOutcome.Forgot, now);

        Assert.Equal(0, item.Repetitions);
        Assert.Equal(1, item.IntervalDays);
        Assert.Equal(ReviewOutcome.Forgot, item.LastOutcome);
    }

    [Fact]
    public void Record_GoodProgressesInterval()
    {
        var now = DateTimeOffset.UtcNow;
        var item = new ReviewItem(Guid.NewGuid(), Guid.NewGuid(), now);

        item.Record(ReviewOutcome.Good, now);
        Assert.Equal(1, item.IntervalDays);

        item.Record(ReviewOutcome.Good, now);
        Assert.Equal(3, item.IntervalDays);

        item.Record(ReviewOutcome.Good, now);
        Assert.True(item.IntervalDays >= 7);
    }
}
