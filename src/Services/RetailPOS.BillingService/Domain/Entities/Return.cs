using RetailPOS.Shared.Enums;

namespace RetailPOS.BillingService.Domain.Entities;

public class Return
{
    public int ReturnId { get; set; }
    public int OriginalBillId { get; set; }
    public int? ReturnBillId { get; set; }
    public int StoreId { get; set; }
    public int InitiatedBy { get; set; }
    public int? ApprovedBy { get; set; }
    public string Reason { get; set; } = string.Empty;
    public string? RefundMode { get; set; }
    public decimal RefundAmount { get; set; }
    public ReturnStatus Status { get; set; } = ReturnStatus.Initiated;
    public DateTime InitiatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ApprovedAt { get; set; }
    public DateTime? RefundedAt { get; set; }
    public string? PolicyNote { get; set; }
    public ICollection<ReturnItem> Items { get; set; } = new List<ReturnItem>();
}
