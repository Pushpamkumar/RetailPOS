using RetailPOS.Shared.Common;

namespace RetailPOS.CatalogService.Application.DTOs;

public record ProductSearchDto(string? Query, int? CategoryId, int Page = 1, int PageSize = 20);

public record ProductFilterDto(string? Search, int? CategoryId, bool? IsActive, int Page = 1, int PageSize = 20);

public record ProductSearchResultDto(
    int ProductId,
    string SKU,
    string? Barcode,
    string ProductName,
    string CategoryName,
    string UOM,
    decimal MRP,
    decimal SellingPrice,
    decimal TaxRate,
    bool IsTaxInclusive,
    decimal StockOnHand,
    bool IsLowStock,
    string? ImageUrl);

public record ProductDto(
    int ProductId,
    string SKU,
    string? Barcode,
    string ProductName,
    int CategoryId,
    decimal MRP,
    decimal SellingPrice,
    int TaxId,
    bool IsActive);

public record ProductDetailDto(
    int ProductId,
    string SKU,
    string? Barcode,
    string ProductName,
    string CategoryName,
    string UOM,
    decimal MRP,
    decimal SellingPrice,
    decimal? CostPrice,
    decimal TaxRate,
    bool IsTaxInclusive,
    int ReorderLevel,
    bool IsWeighable,
    string? ImageUrl,
    bool IsActive);

public record CreateProductDto(
    string SKU,
    string? Barcode,
    string ProductName,
    int CategoryId,
    string UOM,
    decimal MRP,
    decimal SellingPrice,
    decimal? CostPrice,
    int TaxId,
    int ReorderLevel,
    bool IsWeighable);

public record CreateCategoryDto(
    string CategoryCode,
    string CategoryName,
    int? ParentCategoryId,
    int SortOrder);

public record CreateTaxConfigDto(
    string TaxCode,
    string TaxName,
    decimal TaxRate,
    bool IsTaxInclusive,
    DateOnly EffectiveFrom);

public record UpdateProductDto(
    string ProductName,
    int CategoryId,
    string UOM,
    decimal MRP,
    decimal SellingPrice,
    decimal? CostPrice,
    int TaxId,
    int ReorderLevel,
    bool IsWeighable,
    bool IsActive,
    string? PriceChangeReason);

public record CategoryDto(int CategoryId, string CategoryCode, string CategoryName, int? ParentCategoryId, int SortOrder);

public record TaxConfigDto(int TaxId, string TaxCode, string TaxName, decimal TaxRate, bool IsTaxInclusive);

public record PromotionDto(int PromotionId, string PromoCode, string Name, string DiscountType, decimal DiscountValue, string Scope, int? ScopeRefId);

public record AppliedPromoDto(int PromotionId, string PromoCode, string Name, decimal DiscountAmount, decimal FinalPrice);
