namespace RetailPOS.CatalogService.Domain.Entities;

public class PriceHistory
{
    public int PriceHistoryId { get; set; }
    public int ProductId { get; set; }
    public decimal OldPrice { get; set; }
    public decimal NewPrice { get; set; }
    public int ChangedBy { get; set; }
    public DateTime ChangedAt { get; set; }
    public string? Reason { get; set; }
}
