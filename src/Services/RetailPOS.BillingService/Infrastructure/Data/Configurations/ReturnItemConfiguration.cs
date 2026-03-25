using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RetailPOS.BillingService.Domain.Entities;

namespace RetailPOS.BillingService.Infrastructure.Data.Configurations;

public class ReturnItemConfiguration : IEntityTypeConfiguration<ReturnItem>
{
    public void Configure(EntityTypeBuilder<ReturnItem> builder)
    {
        builder.ToTable("ReturnItems");
        builder.HasKey(x => x.ReturnItemId);
        builder.Property(x => x.ReturnQty).HasColumnType("decimal(10,3)");
        builder.Property(x => x.UnitPrice).HasColumnType("decimal(18,2)");
        builder.Property(x => x.RefundLineAmount).HasColumnType("decimal(18,2)");
        builder.Property(x => x.Condition).HasMaxLength(50);
    }
}
