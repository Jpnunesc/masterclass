using MasterClass.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace MasterClass.Infrastructure.Persistence.Configurations;

public class LessonConfiguration : IEntityTypeConfiguration<Lesson>
{
    public void Configure(EntityTypeBuilder<Lesson> builder)
    {
        builder.ToTable("lessons");
        builder.HasKey(l => l.Id);

        builder.Property(l => l.Slug).IsRequired().HasMaxLength(128);
        builder.HasIndex(l => l.Slug).IsUnique();

        builder.Property(l => l.Title).IsRequired().HasMaxLength(256);
        builder.Property(l => l.Summary).HasMaxLength(2048);
        builder.Property(l => l.TargetLevel).HasConversion<int>();
        builder.Property(l => l.OrderIndex).IsRequired();
    }
}
