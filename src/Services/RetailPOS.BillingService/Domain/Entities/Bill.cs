using RetailPOS.Shared.Constants;
using RetailPOS.Shared.Enums;
using RetailPOS.Shared.Exceptions;

namespace RetailPOS.BillingService.Domain.Entities;

public class Bill
{
    public int BillId { get; private set; }
    public string? BillNumber { get; private set; }
    public int StoreId { get; private set; }
    public int CashierUserId { get; private set; }
    public int ShiftId { get; private set; }
    public string? CustomerMobile { get; private set; }
    public string? CustomerName { get; private set; }
    public DateTime BillDate { get; private set; }
    public decimal GrossAmount { get; private set; }
    public decimal DiscountAmount { get; private set; }
    public decimal TaxAmount { get; private set; }
    public decimal RoundOff { get; private set; }
    public decimal NetAmount { get; private set; }
    public BillStatus Status { get; private set; } = BillStatus.Draft;
    public string? HoldReason { get; private set; }
    public DateTime? HeldAt { get; private set; }
    public DateTime? FinalizedAt { get; private set; }
    public bool ReceiptSent { get; private set; }

    public ICollection<BillItem> Items { get; private set; } = new List<BillItem>();
    public ICollection<Payment> Payments { get; private set; } = new List<Payment>();

    private Bill()
    {
    }

    public static Bill Create(int storeId, int cashierUserId, int shiftId)
        => new()
        {
            StoreId = storeId,
            CashierUserId = cashierUserId,
            ShiftId = shiftId,
            BillDate = DateTime.UtcNow
        };

    public void AddItem(BillItem item)
    {
        if (Status != BillStatus.Draft)
        {
            throw new DomainException(PosErrors.BILL_005);
        }
        Items.Add(item);
        RecalculateTotals();
    }

    public void UpdateItemQty(int billItemId, decimal qty)
    {
        var item = Items.FirstOrDefault(x => x.BillItemId == billItemId)
            ?? throw new PosApiException(PosErrors.BILL_004, StatusCodes.Status404NotFound, "Bill not found or does not belong to this store");
        item.UpdateQuantity(qty);
        RecalculateTotals();
    }

    public void RemoveItem(int billItemId)
    {
        var item = Items.FirstOrDefault(x => x.BillItemId == billItemId)
            ?? throw new PosApiException(PosErrors.BILL_004, StatusCodes.Status404NotFound, "Bill not found or does not belong to this store");
        Items.Remove(item);
        RecalculateTotals();
    }

    public void Hold(string? reason)
    {
        if (!Items.Any())
        {
            throw new DomainException("Cart is empty");
        }
        Status = BillStatus.Held;
        HoldReason = reason;
        HeldAt = DateTime.UtcNow;
    }

    public void Resume() => Status = BillStatus.Draft;

    public void StartPayment()
    {
        if (!Items.Any())
        {
            throw new DomainException(PosErrors.BILL_001);
        }
        Status = BillStatus.PaymentStarted;
    }

    public void AddPayment(Payment payment)
    {
        Payments.Add(payment);
        if (Payments.Sum(x => x.Amount) >= NetAmount)
        {
            Status = BillStatus.PaymentCompleted;
        }
    }

    public void Finalize(string billNumber)
    {
        if (Status != BillStatus.PaymentCompleted)
        {
            throw new DomainException("Payment must be completed before finalization");
        }
        BillNumber = billNumber;
        Status = BillStatus.Finalized;
        FinalizedAt = DateTime.UtcNow;
    }

    public void MarkReceiptSent() => ReceiptSent = true;

    private void RecalculateTotals()
    {
        GrossAmount = Items.Sum(x => x.UnitPrice * x.Qty);
        DiscountAmount = Items.Sum(x => x.Discount);
        TaxAmount = Items.Sum(x => x.TaxAmount);
        var beforeRound = GrossAmount - DiscountAmount + TaxAmount;
        RoundOff = Math.Round(beforeRound) - beforeRound;
        NetAmount = beforeRound + RoundOff;
    }
}
