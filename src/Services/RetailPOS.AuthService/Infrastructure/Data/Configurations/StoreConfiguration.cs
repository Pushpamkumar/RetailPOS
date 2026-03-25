using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RetailPOS.AuthService.Domain.Entities;

namespace RetailPOS.AuthService.Infrastructure.Data.Configurations;

public class StoreConfiguration : IEntityTypeConfiguration<Store>
{
    public void Configure(EntityTypeBuilder<Store> builder)
    {
        builder.ToTable("Stores");
        builder.HasKey(x => x.StoreId);
        builder.Property(x => x.StoreCode).IsRequired().HasMaxLength(20);
        builder.Property(x => x.StoreName).IsRequired().HasMaxLength(150);
        builder.Property(x => x.Address).HasMaxLength(400);
        builder.Property(x => x.Location).HasMaxLength(200);
        builder.Property(x => x.Phone).HasMaxLength(20);
        builder.Property(x => x.GSTNumber).HasMaxLength(50);
        builder.HasIndex(x => x.StoreCode).IsUnique();
    }
}
