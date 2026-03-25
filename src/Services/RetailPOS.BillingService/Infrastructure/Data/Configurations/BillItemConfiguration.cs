using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RetailPOS.BillingService.Domain.Entities;

namespace RetailPOS.BillingService.Infrastructure.Data.Configurations;

public class BillItemConfiguration : IEntityTypeConfiguration<BillItem>
{
    public void Configure(EntityTypeBuilder<BillItem> builder)
    {
        builder.ToTable("BillItems");
        builder.HasKey(x => x.BillItemId);
        builder.Property(x => x.ProductName).IsRequired().HasMaxLength(200);
        builder.Property(x => x.SKU).IsRequired().HasMaxLength(50);
        builder.Property(x => x.Barcode).HasMaxLength(100);
        builder.Property(x => x.UnitPrice).HasColumnType("decimal(18,2)");
        builder.Property(x => x.Qty).HasColumnType("decimal(10,3)");
        builder.Property(x => x.Discount).HasColumnType("decimal(10,2)");
        builder.Property(x => x.TaxRate).HasColumnType("decimal(5,2)");
        builder.Property(x => x.TaxAmount).HasColumnType("decimal(10,2)");
        builder.Property(x => x.LineTotal).HasColumnType("decimal(18,2)");
    }
}
