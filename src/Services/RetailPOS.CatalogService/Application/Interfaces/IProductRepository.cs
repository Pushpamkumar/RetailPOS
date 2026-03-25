using RetailPOS.CatalogService.Application.DTOs;
using RetailPOS.CatalogService.Domain.Entities;
using RetailPOS.Shared.Common;

namespace RetailPOS.CatalogService.Application.Interfaces;

public interface IProductRepository
{
    Task<Product?> GetByBarcodeAsync(string barcode, CancellationToken cancellationToken = default);
    Task<Product?> GetBySKUAsync(string sku, CancellationToken cancellationToken = default);
    Task<Product?> GetByIdWithDetailsAsync(int id, CancellationToken cancellationToken = default);
    Task<PagedResult<Product>> SearchAsync(ProductSearchDto dto, CancellationToken cancellationToken = default);
    Task<PagedResult<Product>> GetPagedAsync(ProductFilterDto dto, CancellationToken cancellationToken = default);
    Task<bool> ExistsSKUAsync(string sku, int? excludeId, CancellationToken cancellationToken = default);
    Task AddAsync(Product product, CancellationToken cancellationToken = default);
    Task UpdateAsync(Product product, CancellationToken cancellationToken = default);
    Task SaveChangesAsync(CancellationToken cancellationToken = default);
    Task<IReadOnlyCollection<Category>> GetCategoriesAsync(CancellationToken cancellationToken = default);
    Task<IReadOnlyCollection<TaxConfiguration>> GetActiveTaxConfigsAsync(CancellationToken cancellationToken = default);
    Task<IReadOnlyCollection<Promotion>> GetActivePromotionsAsync(CancellationToken cancellationToken = default);
    Task<bool> CategoryCodeExistsAsync(string categoryCode, CancellationToken cancellationToken = default);
    Task<bool> TaxCodeExistsAsync(string taxCode, CancellationToken cancellationToken = default);
    Task AddCategoryAsync(Category category, CancellationToken cancellationToken = default);
    Task AddTaxConfigAsync(TaxConfiguration taxConfiguration, CancellationToken cancellationToken = default);
}
