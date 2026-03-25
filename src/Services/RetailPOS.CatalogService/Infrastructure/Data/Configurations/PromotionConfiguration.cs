using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RetailPOS.CatalogService.Domain.Entities;

namespace RetailPOS.CatalogService.Infrastructure.Data.Configurations;

public class PromotionConfiguration : IEntityTypeConfiguration<Promotion>
{
    public void Configure(EntityTypeBuilder<Promotion> builder)
    {
        builder.ToTable("Promotions");
        builder.HasKey(x => x.PromotionId);
        builder.Property(x => x.PromoCode).IsRequired().HasMaxLength(50);
        builder.Property(x => x.Name).IsRequired().HasMaxLength(200);
        builder.Property(x => x.DiscountType).IsRequired().HasMaxLength(20);
        builder.Property(x => x.Scope).IsRequired().HasMaxLength(20);
        builder.Property(x => x.DiscountValue).HasColumnType("decimal(10,2)");
        builder.Property(x => x.MinBillAmount).HasColumnType("decimal(18,2)");
        builder.HasIndex(x => x.PromoCode).IsUnique();
    }
}
