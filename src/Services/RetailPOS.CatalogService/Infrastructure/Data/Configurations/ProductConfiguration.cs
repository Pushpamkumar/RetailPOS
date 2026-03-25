using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RetailPOS.CatalogService.Domain.Entities;

namespace RetailPOS.CatalogService.Infrastructure.Data.Configurations;

public class ProductConfiguration : IEntityTypeConfiguration<Product>
{
    public void Configure(EntityTypeBuilder<Product> builder)
    {
        builder.ToTable("Products");
        builder.HasKey(x => x.ProductId);
        builder.Property(x => x.SKU).IsRequired().HasMaxLength(50);
        builder.Property(x => x.Barcode).HasMaxLength(100);
        builder.Property(x => x.ProductName).IsRequired().HasMaxLength(200);
        builder.Property(x => x.UOM).IsRequired().HasMaxLength(20);
        builder.Property(x => x.MRP).HasColumnType("decimal(18,2)");
        builder.Property(x => x.SellingPrice).HasColumnType("decimal(18,2)");
        builder.Property(x => x.CostPrice).HasColumnType("decimal(18,2)");
        builder.Property(x => x.CreatedAt).HasDefaultValueSql("GETUTCDATE()");
        builder.HasIndex(x => x.SKU).IsUnique();
        builder.HasIndex(x => x.Barcode).IsUnique().HasFilter("[Barcode] IS NOT NULL");
        builder.HasIndex(x => x.CategoryId);
        builder.HasOne(x => x.Category).WithMany().HasForeignKey(x => x.CategoryId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(x => x.Tax).WithMany().HasForeignKey(x => x.TaxId).OnDelete(DeleteBehavior.Restrict);
        builder.HasMany(x => x.PriceHistory).WithOne().HasForeignKey(x => x.ProductId).OnDelete(DeleteBehavior.Cascade);
    }
}
