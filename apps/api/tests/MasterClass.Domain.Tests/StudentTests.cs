using MasterClass.Domain.Entities;
using MasterClass.Domain.Enums;

namespace MasterClass.Domain.Tests;

public class StudentTests
{
    [Fact]
    public void Constructor_NormalizesEmailAndDefaultsLevel()
    {
        var student = new Student("  Alice@Example.COM ", " Alice ", "hash");

        Assert.Equal("alice@example.com", student.Email);
        Assert.Equal("Alice", student.DisplayName);
        Assert.Equal(ProficiencyLevel.A1, student.ProficiencyLevel);
        Assert.NotEqual(Guid.Empty, student.Id);
    }

    [Theory]
    [InlineData("", "name", "hash")]
    [InlineData("email@x.com", "", "hash")]
    [InlineData("email@x.com", "name", "")]
    public void Constructor_RejectsMissingFields(string email, string name, string hash)
    {
        Assert.Throws<ArgumentException>(() => new Student(email, name, hash));
    }

    [Fact]
    public void PromoteTo_RefusesDemotion()
    {
        var student = new Student("a@b.com", "A", "h", ProficiencyLevel.B1);
        Assert.Throws<InvalidOperationException>(() => student.PromoteTo(ProficiencyLevel.A2));
    }

    [Fact]
    public void PromoteTo_AcceptsSameOrHigherLevel()
    {
        var student = new Student("a@b.com", "A", "h", ProficiencyLevel.A1);
        student.PromoteTo(ProficiencyLevel.B1);
        Assert.Equal(ProficiencyLevel.B1, student.ProficiencyLevel);
    }
}
