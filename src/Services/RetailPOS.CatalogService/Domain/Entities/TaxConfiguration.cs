namespace RetailPOS.CatalogService.Domain.Entities;

public class TaxConfiguration
{
    public int TaxId { get; set; }
    public string TaxCode { get; set; } = string.Empty;
    public string TaxName { get; set; } = string.Empty;
    public decimal TaxRate { get; set; }
    public bool IsTaxInclusive { get; set; }
    public bool IsActive { get; set; } = true;
    public DateOnly EffectiveFrom { get; set; }
    public DateOnly? EffectiveTo { get; set; }

    public decimal CalculateTaxAmount(decimal sellingPrice)
        => IsTaxInclusive
            ? sellingPrice - (sellingPrice / (1 + TaxRate / 100))
            : sellingPrice * TaxRate / 100;
}
