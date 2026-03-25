using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RetailPOS.AdminService.Domain.Entities;

namespace RetailPOS.AdminService.Infrastructure.Data.Configurations;

public class StockAdjustmentConfiguration : IEntityTypeConfiguration<StockAdjustment>
{
    public void Configure(EntityTypeBuilder<StockAdjustment> builder)
    {
        builder.ToTable("StockAdjustments");
        builder.HasKey(x => x.AdjustmentId);
        builder.Property(x => x.AdjustmentType).HasConversion<int>();
        builder.Property(x => x.Quantity).HasColumnType("decimal(12,3)");
        builder.Property(x => x.ReasonCode).IsRequired().HasMaxLength(50);
        builder.Property(x => x.SourceDocument).HasMaxLength(100);
        builder.Property(x => x.Status).HasConversion<int>();
        builder.Property(x => x.Notes).HasMaxLength(500);
    }
}
