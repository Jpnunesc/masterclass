using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace MasterClass.Infrastructure.Persistence;

public sealed class MasterClassDbContextFactory : IDesignTimeDbContextFactory<MasterClassDbContext>
{
    public MasterClassDbContext CreateDbContext(string[] args)
    {
        var connectionString = Environment.GetEnvironmentVariable("ConnectionStrings__Default")
            ?? "Host=localhost;Port=5432;Database=masterclass;Username=postgres;Password=postgres";

        var options = new DbContextOptionsBuilder<MasterClassDbContext>()
            .UseNpgsql(connectionString)
            .Options;

        return new MasterClassDbContext(options);
    }
}
