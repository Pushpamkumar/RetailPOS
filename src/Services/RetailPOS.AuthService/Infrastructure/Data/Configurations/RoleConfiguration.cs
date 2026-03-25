using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RetailPOS.AuthService.Domain.Entities;
using RetailPOS.Shared.Security;

namespace RetailPOS.AuthService.Infrastructure.Data.Configurations;

public class RoleConfiguration : IEntityTypeConfiguration<Role>
{
    public void Configure(EntityTypeBuilder<Role> builder)
    {
        builder.ToTable("Roles");
        builder.HasKey(x => x.RoleId);
        builder.Property(x => x.RoleName).IsRequired().HasMaxLength(50);
        builder.Property(x => x.Description).HasMaxLength(300);
        builder.HasIndex(x => x.RoleName).IsUnique();

        builder.HasData(
            new Role { RoleId = 1, RoleName = UserRoles.Cashier, Description = "Cashier", IsActive = true },
            new Role { RoleId = 2, RoleName = UserRoles.StoreManager, Description = "Store manager", IsActive = true },
            new Role { RoleId = 3, RoleName = UserRoles.Admin, Description = "Admin", IsActive = true },
            new Role { RoleId = 4, RoleName = UserRoles.InventoryClerk, Description = "Inventory clerk", IsActive = true },
            new Role { RoleId = 5, RoleName = UserRoles.RegionalManager, Description = "Regional manager", IsActive = true });
    }
}
