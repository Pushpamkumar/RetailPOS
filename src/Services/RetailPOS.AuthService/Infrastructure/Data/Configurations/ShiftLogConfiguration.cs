using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RetailPOS.AuthService.Domain.Entities;

namespace RetailPOS.AuthService.Infrastructure.Data.Configurations;

public class ShiftLogConfiguration : IEntityTypeConfiguration<ShiftLog>
{
    public void Configure(EntityTypeBuilder<ShiftLog> builder)
    {
        builder.ToTable("ShiftLog");
        builder.HasKey(x => x.ShiftId);
        builder.Property(x => x.TerminalId).IsRequired().HasMaxLength(50);
        builder.Property(x => x.OpeningCash).HasColumnType("decimal(18,2)");
        builder.Property(x => x.ClosingCash).HasColumnType("decimal(18,2)");
        builder.Property(x => x.Status).HasConversion<int>();
        builder.Property(x => x.Notes).HasMaxLength(500);
        builder.HasIndex(x => new { x.UserId, x.ShiftDate });
        builder.HasIndex(x => new { x.StoreId, x.ShiftDate });
    }
}
