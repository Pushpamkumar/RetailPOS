using RetailPOS.Shared.Enums;

namespace RetailPOS.BillingService.Domain.Entities;

public class Payment
{
    public int PaymentId { get; set; }
    public int BillId { get; set; }
    public PaymentMode PaymentMode { get; set; }
    public decimal Amount { get; set; }
    public string? ReferenceNo { get; set; }
    public string Status { get; set; } = "Completed";
    public DateTime PaidAt { get; set; } = DateTime.UtcNow;
    public decimal? CashReceived { get; set; }
    public decimal? ChangeReturned { get; set; }
}
