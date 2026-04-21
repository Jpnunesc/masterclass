using MasterClass.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace MasterClass.Infrastructure.Persistence.Configurations;

public class StudentConfiguration : IEntityTypeConfiguration<Student>
{
    public void Configure(EntityTypeBuilder<Student> builder)
    {
        builder.ToTable("students");
        builder.HasKey(s => s.Id);

        builder.Property(s => s.Email).IsRequired().HasMaxLength(320);
        builder.HasIndex(s => s.Email).IsUnique();

        builder.Property(s => s.DisplayName).IsRequired().HasMaxLength(128);
        builder.Property(s => s.PasswordHash).IsRequired().HasMaxLength(512);
        builder.Property(s => s.ProficiencyLevel).HasConversion<int>();
        builder.Property(s => s.CreatedAt).IsRequired();
        builder.Property(s => s.UpdatedAt).IsRequired();
    }
}
