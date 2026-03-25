namespace RetailPOS.BillingService.Domain.Entities;

public class ReturnItem
{
    public int ReturnItemId { get; set; }
    public int ReturnId { get; set; }
    public int BillItemId { get; set; }
    public int ProductId { get; set; }
    public decimal ReturnQty { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal RefundLineAmount { get; set; }
    public string Condition { get; set; } = "SALEABLE";
}
