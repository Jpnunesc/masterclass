using MasterClass.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace MasterClass.Infrastructure.Persistence.Configurations;

public class ProgressSnapshotConfiguration : IEntityTypeConfiguration<ProgressSnapshot>
{
    public void Configure(EntityTypeBuilder<ProgressSnapshot> builder)
    {
        builder.ToTable("progress_snapshots");
        builder.HasKey(p => p.Id);

        builder.Property(p => p.StudentId).IsRequired();
        builder.Property(p => p.Level).HasConversion<int>();
        builder.Property(p => p.LessonsCompleted).IsRequired();
        builder.Property(p => p.VocabularyKnown).IsRequired();
        builder.Property(p => p.AccuracyPercent).IsRequired();
        builder.Property(p => p.CapturedAt).IsRequired();

        builder.HasIndex(p => new { p.StudentId, p.CapturedAt });

        builder.HasOne<Student>()
            .WithMany()
            .HasForeignKey(p => p.StudentId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
