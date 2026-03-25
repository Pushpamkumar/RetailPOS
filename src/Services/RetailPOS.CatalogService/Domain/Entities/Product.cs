using RetailPOS.Shared.Constants;
using RetailPOS.Shared.Exceptions;

namespace RetailPOS.CatalogService.Domain.Entities;

public class Product
{
    public int ProductId { get; set; }
    public string SKU { get; set; } = string.Empty;
    public string? Barcode { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public int CategoryId { get; set; }
    public string UOM { get; set; } = "PCS";
    public decimal MRP { get; set; }
    public decimal SellingPrice { get; set; }
    public decimal? CostPrice { get; set; }
    public int TaxId { get; set; }
    public int ReorderLevel { get; set; }
    public bool IsWeighable { get; set; }
    public string? ImageUrl { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    public Category Category { get; set; } = null!;
    public TaxConfiguration Tax { get; set; } = null!;
    public ICollection<PriceHistory> PriceHistory { get; set; } = new List<PriceHistory>();

    public void UpdatePrice(decimal newPrice, int changedBy, string? reason)
    {
        if (newPrice > MRP)
        {
            throw new DomainException(PosErrors.CAT_003);
        }

        if (newPrice != SellingPrice)
        {
            PriceHistory.Add(new PriceHistory
            {
                ProductId = ProductId,
                OldPrice = SellingPrice,
                NewPrice = newPrice,
                ChangedBy = changedBy,
                ChangedAt = DateTime.UtcNow,
                Reason = reason
            });
        }

        SellingPrice = newPrice;
        UpdatedAt = DateTime.UtcNow;
    }
}
