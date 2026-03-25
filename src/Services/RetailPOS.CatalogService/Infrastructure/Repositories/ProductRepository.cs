using Microsoft.EntityFrameworkCore;
using RetailPOS.CatalogService.Application.DTOs;
using RetailPOS.CatalogService.Application.Interfaces;
using RetailPOS.CatalogService.Domain.Entities;
using RetailPOS.CatalogService.Infrastructure.Data;
using RetailPOS.Shared.Common;

namespace RetailPOS.CatalogService.Infrastructure.Repositories;

public class ProductRepository(CatalogDbContext dbContext) : IProductRepository
{
    public async Task<Product?> GetByBarcodeAsync(string barcode, CancellationToken cancellationToken = default)
        => await Query().FirstOrDefaultAsync(x => x.Barcode == barcode, cancellationToken);

    public async Task<Product?> GetBySKUAsync(string sku, CancellationToken cancellationToken = default)
        => await Query().FirstOrDefaultAsync(x => x.SKU == sku, cancellationToken);

    public async Task<Product?> GetByIdWithDetailsAsync(int id, CancellationToken cancellationToken = default)
        => await Query().FirstOrDefaultAsync(x => x.ProductId == id, cancellationToken);

    public async Task<PagedResult<Product>> SearchAsync(ProductSearchDto dto, CancellationToken cancellationToken = default)
    {
        var query = Query().Where(x => x.IsActive);
        if (!string.IsNullOrWhiteSpace(dto.Query))
        {
            query = query.Where(x => x.Barcode == dto.Query || x.SKU.Contains(dto.Query) || x.ProductName.Contains(dto.Query));
        }
        if (dto.CategoryId.HasValue)
        {
            query = query.Where(x => x.CategoryId == dto.CategoryId);
        }
        var total = await query.CountAsync(cancellationToken);
        var items = await query.Skip((dto.Page - 1) * dto.PageSize).Take(dto.PageSize).ToListAsync(cancellationToken);
        return new PagedResult<Product>(items, dto.Page, dto.PageSize, total);
    }

    public async Task<PagedResult<Product>> GetPagedAsync(ProductFilterDto dto, CancellationToken cancellationToken = default)
    {
        var query = Query().AsQueryable();
        if (!string.IsNullOrWhiteSpace(dto.Search))
        {
            query = query.Where(x => x.ProductName.Contains(dto.Search) || x.SKU.Contains(dto.Search));
        }
        if (dto.CategoryId.HasValue)
        {
            query = query.Where(x => x.CategoryId == dto.CategoryId);
        }
        if (dto.IsActive.HasValue)
        {
            query = query.Where(x => x.IsActive == dto.IsActive.Value);
        }
        var total = await query.CountAsync(cancellationToken);
        var items = await query.OrderBy(x => x.ProductName)
            .Skip((dto.Page - 1) * dto.PageSize)
            .Take(dto.PageSize)
            .ToListAsync(cancellationToken);
        return new PagedResult<Product>(items, dto.Page, dto.PageSize, total);
    }

    public Task<bool> ExistsSKUAsync(string sku, int? excludeId, CancellationToken cancellationToken = default)
        => dbContext.Products.AnyAsync(x => x.SKU == sku && (!excludeId.HasValue || x.ProductId != excludeId), cancellationToken);

    public Task AddAsync(Product product, CancellationToken cancellationToken = default)
        => dbContext.Products.AddAsync(product, cancellationToken).AsTask();

    public Task UpdateAsync(Product product, CancellationToken cancellationToken = default)
    {
        dbContext.Products.Update(product);
        return Task.CompletedTask;
    }

    public Task SaveChangesAsync(CancellationToken cancellationToken = default)
        => dbContext.SaveChangesAsync(cancellationToken);

    public async Task<IReadOnlyCollection<Category>> GetCategoriesAsync(CancellationToken cancellationToken = default)
        => await dbContext.Categories.OrderBy(x => x.SortOrder).ToListAsync(cancellationToken);

    public async Task<IReadOnlyCollection<TaxConfiguration>> GetActiveTaxConfigsAsync(CancellationToken cancellationToken = default)
        => await dbContext.TaxConfigurations.Where(x => x.IsActive).OrderBy(x => x.TaxCode).ToListAsync(cancellationToken);

    public async Task<IReadOnlyCollection<Promotion>> GetActivePromotionsAsync(CancellationToken cancellationToken = default)
        => await dbContext.Promotions.Where(x => x.IsActive).ToListAsync(cancellationToken);

    public Task<bool> CategoryCodeExistsAsync(string categoryCode, CancellationToken cancellationToken = default)
        => dbContext.Categories.AnyAsync(x => x.CategoryCode == categoryCode, cancellationToken);

    public Task<bool> TaxCodeExistsAsync(string taxCode, CancellationToken cancellationToken = default)
        => dbContext.TaxConfigurations.AnyAsync(x => x.TaxCode == taxCode, cancellationToken);

    public Task AddCategoryAsync(Category category, CancellationToken cancellationToken = default)
        => dbContext.Categories.AddAsync(category, cancellationToken).AsTask();

    public Task AddTaxConfigAsync(TaxConfiguration taxConfiguration, CancellationToken cancellationToken = default)
        => dbContext.TaxConfigurations.AddAsync(taxConfiguration, cancellationToken).AsTask();

    private IQueryable<Product> Query()
        => dbContext.Products.Include(x => x.Category).Include(x => x.Tax).Include(x => x.PriceHistory);
}
