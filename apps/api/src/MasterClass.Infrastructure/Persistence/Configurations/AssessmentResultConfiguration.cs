using MasterClass.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace MasterClass.Infrastructure.Persistence.Configurations;

public class AssessmentResultConfiguration : IEntityTypeConfiguration<AssessmentResult>
{
    public void Configure(EntityTypeBuilder<AssessmentResult> builder)
    {
        builder.ToTable("assessment_results");
        builder.HasKey(a => a.Id);

        builder.Property(a => a.StudentId).IsRequired();
        builder.Property(a => a.LessonId).IsRequired();
        builder.Property(a => a.ScorePercent).IsRequired();
        builder.Property(a => a.DurationSeconds).IsRequired();
        builder.Property(a => a.TakenAt).IsRequired();

        builder.HasIndex(a => new { a.StudentId, a.LessonId });

        builder.HasOne<Student>()
            .WithMany()
            .HasForeignKey(a => a.StudentId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne<Lesson>()
            .WithMany()
            .HasForeignKey(a => a.LessonId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
