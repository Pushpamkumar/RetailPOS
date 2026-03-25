using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RetailPOS.BillingService.Domain.Entities;

namespace RetailPOS.BillingService.Infrastructure.Data.Configurations;

public class ReturnConfiguration : IEntityTypeConfiguration<Return>
{
    public void Configure(EntityTypeBuilder<Return> builder)
    {
        builder.ToTable("Returns");
        builder.HasKey(x => x.ReturnId);
        builder.Property(x => x.Reason).IsRequired().HasMaxLength(300);
        builder.Property(x => x.RefundMode).HasMaxLength(30);
        builder.Property(x => x.RefundAmount).HasColumnType("decimal(18,2)");
        builder.Property(x => x.Status).HasConversion<int>();
        builder.Property(x => x.PolicyNote).HasMaxLength(500);
        builder.HasMany(x => x.Items).WithOne().HasForeignKey(x => x.ReturnId).OnDelete(DeleteBehavior.Cascade);
    }
}
