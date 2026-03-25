using Microsoft.EntityFrameworkCore;
using RetailPOS.AdminService.Domain.Entities;

namespace RetailPOS.AdminService.Infrastructure.Data;

public class AdminDbContext(DbContextOptions<AdminDbContext> options) : DbContext(options)
{
    public DbSet<Inventory> Inventory => Set<Inventory>();
    public DbSet<StockAdjustment> StockAdjustments => Set<StockAdjustment>();
    public DbSet<AlertLog> AlertLogs => Set<AlertLog>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AdminDbContext).Assembly);
        base.OnModelCreating(modelBuilder);
    }
}
