using RetailPOS.Shared.Enums;

namespace RetailPOS.AdminService.Domain.Entities;

public class StockAdjustment
{
    public int AdjustmentId { get; set; }
    public int StoreId { get; set; }
    public int ProductId { get; set; }
    public AdjustmentType AdjustmentType { get; set; }
    public decimal Quantity { get; set; }
    public string ReasonCode { get; set; } = string.Empty;
    public string? SourceDocument { get; set; }
    public int AdjustedBy { get; set; }
    public int? ApprovedBy { get; set; }
    public AdjustmentStatus Status { get; set; } = AdjustmentStatus.Draft;
    public DateTime? PostedAt { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
