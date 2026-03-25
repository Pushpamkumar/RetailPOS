using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RetailPOS.AuthService.Domain.Entities;

namespace RetailPOS.AuthService.Infrastructure.Data.Configurations;

public class RefreshTokenConfiguration : IEntityTypeConfiguration<RefreshToken>
{
    public void Configure(EntityTypeBuilder<RefreshToken> builder)
    {
        builder.ToTable("RefreshTokens");
        builder.HasKey(x => x.TokenId);
        builder.Property(x => x.Token).IsRequired().HasMaxLength(500);
        builder.Property(x => x.IpAddress).HasMaxLength(50);
        builder.HasIndex(x => x.UserId);
        builder.HasIndex(x => x.Token);
    }
}
