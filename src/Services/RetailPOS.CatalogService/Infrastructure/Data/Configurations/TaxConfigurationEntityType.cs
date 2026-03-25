using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RetailPOS.CatalogService.Domain.Entities;

namespace RetailPOS.CatalogService.Infrastructure.Data.Configurations;

public class TaxConfigurationEntityType : IEntityTypeConfiguration<TaxConfiguration>
{
    public void Configure(EntityTypeBuilder<TaxConfiguration> builder)
    {
        builder.ToTable("TaxConfigurations");
        builder.HasKey(x => x.TaxId);
        builder.Property(x => x.TaxCode).IsRequired().HasMaxLength(20);
        builder.Property(x => x.TaxName).IsRequired().HasMaxLength(100);
        builder.Property(x => x.TaxRate).HasColumnType("decimal(5,2)");
        builder.HasIndex(x => x.TaxCode).IsUnique();
    }
}
