using MasterClass.Application.Abstractions;
using MasterClass.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MasterClass.Infrastructure.Persistence;

public class MasterClassDbContext : DbContext, IMasterClassDbContext
{
    public MasterClassDbContext(DbContextOptions<MasterClassDbContext> options) : base(options) { }

    public DbSet<Student> Students => Set<Student>();
    public DbSet<Lesson> Lessons => Set<Lesson>();
    public DbSet<AssessmentResult> AssessmentResults => Set<AssessmentResult>();
    public DbSet<VocabularyItem> VocabularyItems => Set<VocabularyItem>();
    public DbSet<ProgressSnapshot> ProgressSnapshots => Set<ProgressSnapshot>();
    public DbSet<ReviewItem> ReviewItems => Set<ReviewItem>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(MasterClassDbContext).Assembly);
    }
}
