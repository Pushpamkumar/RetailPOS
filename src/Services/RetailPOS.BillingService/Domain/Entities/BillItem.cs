using RetailPOS.Shared.Exceptions;

namespace RetailPOS.BillingService.Domain.Entities;

public class BillItem
{
    public int BillItemId { get; set; }
    public int BillId { get; set; }
    public int ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public string SKU { get; set; } = string.Empty;
    public string? Barcode { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal Qty { get; set; }
    public decimal Discount { get; set; }
    public decimal TaxRate { get; set; }
    public decimal TaxAmount { get; set; }
    public decimal LineTotal { get; set; }
    public int? PromotionId { get; set; }

    public void UpdateQuantity(decimal qty)
    {
        if (qty <= 0)
        {
            throw new DomainException("Quantity must be greater than zero");
        }
        Qty = qty;
        Recalculate();
    }

    public void Recalculate()
    {
        TaxAmount = (UnitPrice * Qty - Discount) * TaxRate / 100;
        LineTotal = UnitPrice * Qty - Discount + TaxAmount;
    }
}
