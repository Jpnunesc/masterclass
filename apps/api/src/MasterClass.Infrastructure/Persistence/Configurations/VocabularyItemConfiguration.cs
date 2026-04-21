using MasterClass.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace MasterClass.Infrastructure.Persistence.Configurations;

public class VocabularyItemConfiguration : IEntityTypeConfiguration<VocabularyItem>
{
    public void Configure(EntityTypeBuilder<VocabularyItem> builder)
    {
        builder.ToTable("vocabulary_items");
        builder.HasKey(v => v.Id);

        builder.Property(v => v.StudentId).IsRequired();
        builder.Property(v => v.Term).IsRequired().HasMaxLength(256);
        builder.Property(v => v.Translation).IsRequired().HasMaxLength(256);
        builder.Property(v => v.ExampleSentence).HasMaxLength(1024);

        builder.HasIndex(v => new { v.StudentId, v.Term }).IsUnique();

        builder.HasOne<Student>()
            .WithMany()
            .HasForeignKey(v => v.StudentId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
