using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RetailPOS.BillingService.Domain.Entities;

namespace RetailPOS.BillingService.Infrastructure.Data.Configurations;

public class BillConfiguration : IEntityTypeConfiguration<Bill>
{
    public void Configure(EntityTypeBuilder<Bill> builder)
    {
        builder.ToTable("Bills");
        builder.HasKey(x => x.BillId);
        builder.Property(x => x.BillNumber).HasMaxLength(30);
        builder.Property(x => x.GrossAmount).HasColumnType("decimal(18,2)");
        builder.Property(x => x.DiscountAmount).HasColumnType("decimal(18,2)");
        builder.Property(x => x.TaxAmount).HasColumnType("decimal(18,2)");
        builder.Property(x => x.RoundOff).HasColumnType("decimal(5,2)");
        builder.Property(x => x.NetAmount).HasColumnType("decimal(18,2)");
        builder.Property(x => x.Status).HasConversion<int>();
        builder.HasIndex(x => x.BillNumber).IsUnique().HasFilter("[BillNumber] IS NOT NULL");
        builder.HasMany(x => x.Items).WithOne().HasForeignKey(x => x.BillId).OnDelete(DeleteBehavior.Cascade);
        builder.HasMany(x => x.Payments).WithOne().HasForeignKey(x => x.BillId).OnDelete(DeleteBehavior.Cascade);
        builder.Property<byte[]>("RowVersion").IsRowVersion();
    }
}
