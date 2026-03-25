using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RetailPOS.CatalogService.Domain.Entities;

namespace RetailPOS.CatalogService.Infrastructure.Data.Configurations;

public class CategoryConfiguration : IEntityTypeConfiguration<Category>
{
    public void Configure(EntityTypeBuilder<Category> builder)
    {
        builder.ToTable("Categories");
        builder.HasKey(x => x.CategoryId);
        builder.Property(x => x.CategoryCode).IsRequired().HasMaxLength(20);
        builder.Property(x => x.CategoryName).IsRequired().HasMaxLength(100);
        builder.HasIndex(x => x.CategoryCode).IsUnique();
    }
}
