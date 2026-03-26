using RetailPOS.CatalogService.Application.DTOs;
using RetailPOS.CatalogService.Application.Interfaces;
using RetailPOS.CatalogService.Domain.Entities;
using RetailPOS.Shared.Common;
using RetailPOS.Shared.Constants;
using RetailPOS.Shared.Exceptions;

namespace RetailPOS.CatalogService.Application.Services;

public class ProductService(IProductRepository repository) : IProductService
{
    public async Task<IReadOnlyCollection<ProductSearchResultDto>> SearchAsync(ProductSearchDto dto, CancellationToken cancellationToken = default)
    {
        var result = await repository.SearchAsync(dto, cancellationToken);
        return result.Items.Select(MapSearch).ToArray();
    }

    public async Task<ProductDetailDto> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        var product = await repository.GetByIdWithDetailsAsync(id, cancellationToken)
            ?? throw new PosApiException(PosErrors.CAT_001, StatusCodes.Status404NotFound, "Product not found for given ID or barcode");
        return MapDetail(product);
    }

    public async Task<PagedResult<ProductDto>> GetPagedAsync(ProductFilterDto dto, CancellationToken cancellationToken = default)
    {
        var result = await repository.GetPagedAsync(dto, cancellationToken);
        return new PagedResult<ProductDto>(
            result.Items.Select(MapProduct).ToArray(),
            result.Page,
            result.PageSize,
            result.TotalCount);
    }

    public async Task<ProductDto> CreateAsync(CreateProductDto dto, int userId, CancellationToken cancellationToken = default)
    {
        if (await repository.ExistsSKUAsync(dto.SKU, null, cancellationToken))
        {
            throw new PosApiException(PosErrors.CAT_002, StatusCodes.Status409Conflict, "SKU already exists in the system");
        }

        var product = new Product
        {
            SKU = dto.SKU,
            Barcode = dto.Barcode,
            ProductName = dto.ProductName,
            CategoryId = dto.CategoryId,
            UOM = dto.UOM,
            MRP = dto.MRP,
            SellingPrice = dto.SellingPrice,
            CostPrice = dto.CostPrice,
            TaxId = dto.TaxId,
            ReorderLevel = dto.ReorderLevel,
            IsWeighable = dto.IsWeighable
        };

        await repository.AddAsync(product, cancellationToken);
        await repository.SaveChangesAsync(cancellationToken);
        return MapProduct(product);
    }

    public async Task<ProductDto> UpdateAsync(int id, UpdateProductDto dto, int userId, CancellationToken cancellationToken = default)
    {
        var product = await repository.GetByIdWithDetailsAsync(id, cancellationToken)
            ?? throw new PosApiException(PosErrors.CAT_001, StatusCodes.Status404NotFound, "Product not found for given ID or barcode");

        product.ProductName = dto.ProductName;
        product.CategoryId = dto.CategoryId;
        product.UOM = dto.UOM;
        product.MRP = dto.MRP;
        // Price changes are routed through the domain helper so price history and
        // audit metadata stay consistent with the current selling price.
        product.UpdatePrice(dto.SellingPrice, userId, dto.PriceChangeReason);
        product.CostPrice = dto.CostPrice;
        product.TaxId = dto.TaxId;
        product.ReorderLevel = dto.ReorderLevel;
        product.IsWeighable = dto.IsWeighable;
        product.IsActive = dto.IsActive;

        await repository.UpdateAsync(product, cancellationToken);
        await repository.SaveChangesAsync(cancellationToken);
        return MapProduct(product);
    }

    public async Task DeactivateAsync(int id, CancellationToken cancellationToken = default)
    {
        var product = await repository.GetByIdWithDetailsAsync(id, cancellationToken)
            ?? throw new PosApiException(PosErrors.CAT_001, StatusCodes.Status404NotFound, "Product not found for given ID or barcode");
        // Products are soft-deactivated so historical bills can still reference them.
        product.IsActive = false;
        await repository.UpdateAsync(product, cancellationToken);
        await repository.SaveChangesAsync(cancellationToken);
    }

    public async Task<IReadOnlyCollection<CategoryDto>> GetCategoriesAsync(CancellationToken cancellationToken = default)
        => (await repository.GetCategoriesAsync(cancellationToken))
            .Select(x => new CategoryDto(x.CategoryId, x.CategoryCode, x.CategoryName, x.ParentCategoryId, x.SortOrder))
            .ToArray();

    public async Task<IReadOnlyCollection<TaxConfigDto>> GetActiveTaxConfigsAsync(CancellationToken cancellationToken = default)
        => (await repository.GetActiveTaxConfigsAsync(cancellationToken))
            .Select(x => new TaxConfigDto(x.TaxId, x.TaxCode, x.TaxName, x.TaxRate, x.IsTaxInclusive))
            .ToArray();

    public async Task<CategoryDto> CreateCategoryAsync(CreateCategoryDto dto, CancellationToken cancellationToken = default)
    {
        if (await repository.CategoryCodeExistsAsync(dto.CategoryCode, cancellationToken))
        {
            throw new PosApiException(PosErrors.CAT_002, StatusCodes.Status409Conflict, "Category code already exists in the system");
        }

        var category = new Category
        {
            CategoryCode = dto.CategoryCode,
            CategoryName = dto.CategoryName,
            ParentCategoryId = dto.ParentCategoryId,
            SortOrder = dto.SortOrder,
            IsActive = true
        };

        await repository.AddCategoryAsync(category, cancellationToken);
        await repository.SaveChangesAsync(cancellationToken);
        return new CategoryDto(category.CategoryId, category.CategoryCode, category.CategoryName, category.ParentCategoryId, category.SortOrder);
    }

    public async Task<TaxConfigDto> CreateTaxConfigAsync(CreateTaxConfigDto dto, CancellationToken cancellationToken = default)
    {
        if (await repository.TaxCodeExistsAsync(dto.TaxCode, cancellationToken))
        {
            throw new PosApiException(PosErrors.CAT_004, StatusCodes.Status409Conflict, "Tax code already exists in the system");
        }

        var taxConfig = new TaxConfiguration
        {
            TaxCode = dto.TaxCode,
            TaxName = dto.TaxName,
            TaxRate = dto.TaxRate,
            IsTaxInclusive = dto.IsTaxInclusive,
            IsActive = true,
            EffectiveFrom = dto.EffectiveFrom
        };

        await repository.AddTaxConfigAsync(taxConfig, cancellationToken);
        await repository.SaveChangesAsync(cancellationToken);
        return new TaxConfigDto(taxConfig.TaxId, taxConfig.TaxCode, taxConfig.TaxName, taxConfig.TaxRate, taxConfig.IsTaxInclusive);
    }

    private static ProductSearchResultDto MapSearch(Product product)
        => new(
            product.ProductId,
            product.SKU,
            product.Barcode,
            product.ProductName,
            product.Category.CategoryName,
            product.UOM,
            product.MRP,
            product.SellingPrice,
            product.Tax.TaxRate,
            product.Tax.IsTaxInclusive,
            0,
            false,
            product.ImageUrl);

    private static ProductDto MapProduct(Product product)
        => new(product.ProductId, product.SKU, product.Barcode, product.ProductName, product.CategoryId, product.MRP, product.SellingPrice, product.TaxId, product.IsActive);

    private static ProductDetailDto MapDetail(Product product)
        => new(
            product.ProductId,
            product.SKU,
            product.Barcode,
            product.ProductName,
            product.Category.CategoryName,
            product.UOM,
            product.MRP,
            product.SellingPrice,
            product.CostPrice,
            product.Tax.TaxRate,
            product.Tax.IsTaxInclusive,
            product.ReorderLevel,
            product.IsWeighable,
            product.ImageUrl,
            product.IsActive);
}
