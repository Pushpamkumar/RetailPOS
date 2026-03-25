using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RetailPOS.CatalogService.Domain.Entities;

namespace RetailPOS.CatalogService.Infrastructure.Data.Configurations;

public class PriceHistoryConfiguration : IEntityTypeConfiguration<PriceHistory>
{
    public void Configure(EntityTypeBuilder<PriceHistory> builder)
    {
        builder.ToTable("PriceHistory");
        builder.HasKey(x => x.PriceHistoryId);
        builder.Property(x => x.OldPrice).HasColumnType("decimal(18,2)");
        builder.Property(x => x.NewPrice).HasColumnType("decimal(18,2)");
        builder.Property(x => x.Reason).HasMaxLength(300);
    }
}
