using MasterClass.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MasterClass.Application.Abstractions;

public interface IMasterClassDbContext
{
    DbSet<Student> Students { get; }
    DbSet<Lesson> Lessons { get; }
    DbSet<AssessmentResult> AssessmentResults { get; }
    DbSet<VocabularyItem> VocabularyItems { get; }
    DbSet<ProgressSnapshot> ProgressSnapshots { get; }
    DbSet<ReviewItem> ReviewItems { get; }
    DbSet<RefreshToken> RefreshTokens { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
