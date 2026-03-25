using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RetailPOS.AdminService.Domain.Entities;

namespace RetailPOS.AdminService.Infrastructure.Data.Configurations;

public class InventoryConfiguration : IEntityTypeConfiguration<Inventory>
{
    public void Configure(EntityTypeBuilder<Inventory> builder)
    {
        builder.ToTable("Inventory");
        builder.HasKey(x => x.InventoryId);
        builder.HasIndex(x => new { x.StoreId, x.ProductId }).IsUnique();
        builder.Property(x => x.StockOnHand).HasColumnType("decimal(12,3)");
        builder.Property(x => x.ReservedQty).HasColumnType("decimal(12,3)");
        builder.Property(x => x.LastUpdated).HasDefaultValueSql("GETUTCDATE()");
        builder.Property<byte[]>("RowVersion").IsRowVersion();
        builder.Ignore(x => x.AvailableQty);
        builder.Ignore(x => x.IsLowStock);
    }
}
