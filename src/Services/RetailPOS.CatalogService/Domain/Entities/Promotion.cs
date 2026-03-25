namespace RetailPOS.CatalogService.Domain.Entities;

public class Promotion
{
    public int PromotionId { get; set; }
    public string PromoCode { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string DiscountType { get; set; } = "PERCENT";
    public decimal DiscountValue { get; set; }
    public string Scope { get; set; } = "PRODUCT";
    public int? ScopeRefId { get; set; }
    public decimal? MinBillAmount { get; set; }
    public DateOnly StartDate { get; set; }
    public DateOnly EndDate { get; set; }
    public int? MaxUsageCount { get; set; }
    public int UsageCount { get; set; }
    public bool IsActive { get; set; } = true;
    public int CreatedBy { get; set; }

    public bool IsValid(DateOnly today)
        => IsActive && today >= StartDate && today <= EndDate && (!MaxUsageCount.HasValue || UsageCount < MaxUsageCount.Value);

    public decimal ApplyDiscount(decimal price)
        => DiscountType == "PERCENT" ? price * DiscountValue / 100 : Math.Min(DiscountValue, price);
}
