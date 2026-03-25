using RetailPOS.CatalogService.Application.DTOs;
using RetailPOS.Shared.Common;

namespace RetailPOS.CatalogService.Application.Interfaces;

public interface IProductService
{
    Task<IReadOnlyCollection<ProductSearchResultDto>> SearchAsync(ProductSearchDto dto, CancellationToken cancellationToken = default);
    Task<ProductDetailDto> GetByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<PagedResult<ProductDto>> GetPagedAsync(ProductFilterDto dto, CancellationToken cancellationToken = default);
    Task<ProductDto> CreateAsync(CreateProductDto dto, int userId, CancellationToken cancellationToken = default);
    Task<ProductDto> UpdateAsync(int id, UpdateProductDto dto, int userId, CancellationToken cancellationToken = default);
    Task DeactivateAsync(int id, CancellationToken cancellationToken = default);
    Task<IReadOnlyCollection<CategoryDto>> GetCategoriesAsync(CancellationToken cancellationToken = default);
    Task<IReadOnlyCollection<TaxConfigDto>> GetActiveTaxConfigsAsync(CancellationToken cancellationToken = default);
    Task<CategoryDto> CreateCategoryAsync(CreateCategoryDto dto, CancellationToken cancellationToken = default);
    Task<TaxConfigDto> CreateTaxConfigAsync(CreateTaxConfigDto dto, CancellationToken cancellationToken = default);
}
