using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RetailPOS.AdminService.Domain.Entities;

namespace RetailPOS.AdminService.Infrastructure.Data.Configurations;

public class AlertLogConfiguration : IEntityTypeConfiguration<AlertLog>
{
    public void Configure(EntityTypeBuilder<AlertLog> builder)
    {
        builder.ToTable("AlertLog");
        builder.HasKey(x => x.AlertId);
        builder.Property(x => x.AlertType).IsRequired().HasMaxLength(50);
        builder.Property(x => x.Message).IsRequired().HasMaxLength(500);
        builder.Property(x => x.Severity).IsRequired().HasMaxLength(20);
    }
}
