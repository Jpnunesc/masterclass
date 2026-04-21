using MasterClass.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace MasterClass.Infrastructure.Persistence.Configurations;

public class ReviewItemConfiguration : IEntityTypeConfiguration<ReviewItem>
{
    public void Configure(EntityTypeBuilder<ReviewItem> builder)
    {
        builder.ToTable("review_items");
        builder.HasKey(r => r.Id);

        builder.Property(r => r.StudentId).IsRequired();
        builder.Property(r => r.VocabularyItemId).IsRequired();
        builder.Property(r => r.DueAt).IsRequired();
        builder.Property(r => r.IntervalDays).IsRequired();
        builder.Property(r => r.Repetitions).IsRequired();
        builder.Property(r => r.EaseFactor).IsRequired();
        builder.Property(r => r.LastOutcome).HasConversion<int?>();

        builder.HasIndex(r => new { r.StudentId, r.DueAt });
        builder.HasIndex(r => r.VocabularyItemId).IsUnique();

        builder.HasOne<Student>()
            .WithMany()
            .HasForeignKey(r => r.StudentId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne<VocabularyItem>()
            .WithMany()
            .HasForeignKey(r => r.VocabularyItemId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
