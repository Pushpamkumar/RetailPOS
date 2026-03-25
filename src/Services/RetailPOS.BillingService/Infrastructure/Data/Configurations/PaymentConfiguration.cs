using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RetailPOS.BillingService.Domain.Entities;

namespace RetailPOS.BillingService.Infrastructure.Data.Configurations;

public class PaymentConfiguration : IEntityTypeConfiguration<Payment>
{
    public void Configure(EntityTypeBuilder<Payment> builder)
    {
        builder.ToTable("Payments");
        builder.HasKey(x => x.PaymentId);
        builder.Property(x => x.PaymentMode).HasConversion<int>();
        builder.Property(x => x.Amount).HasColumnType("decimal(18,2)");
        builder.Property(x => x.ReferenceNo).HasMaxLength(100);
        builder.Property(x => x.Status).HasMaxLength(20);
        builder.Property(x => x.CashReceived).HasColumnType("decimal(18,2)");
        builder.Property(x => x.ChangeReturned).HasColumnType("decimal(18,2)");
    }
}
