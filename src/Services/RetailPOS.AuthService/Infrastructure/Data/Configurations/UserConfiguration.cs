using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RetailPOS.AuthService.Domain.Entities;

namespace RetailPOS.AuthService.Infrastructure.Data.Configurations;

public class UserConfiguration : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> builder)
    {
        builder.ToTable("Users");
        builder.HasKey(x => x.UserId);
        builder.Property(x => x.EmployeeCode).IsRequired().HasMaxLength(50);
        builder.Property(x => x.FullName).IsRequired().HasMaxLength(150);
        builder.Property(x => x.Email).HasMaxLength(200);
        builder.Property(x => x.Mobile).HasMaxLength(20);
        builder.Property(x => x.PasswordHash).IsRequired().HasMaxLength(500);
        builder.Property(x => x.CreatedAt).HasDefaultValueSql("GETUTCDATE()");

        builder.HasIndex(x => x.EmployeeCode).IsUnique();
        builder.HasIndex(x => x.Email).IsUnique().HasFilter("[Email] IS NOT NULL");
        builder.HasIndex(x => x.Mobile).IsUnique().HasFilter("[Mobile] IS NOT NULL");
        builder.HasIndex(x => x.StoreId);
        builder.HasIndex(x => x.RoleId);

        builder.HasOne(x => x.Role).WithMany().HasForeignKey(x => x.RoleId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(x => x.Store).WithMany().HasForeignKey(x => x.StoreId).OnDelete(DeleteBehavior.Restrict);
        builder.HasMany(x => x.RefreshTokens).WithOne().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
    }
}
