using RetailPOS.BillingService.Domain.Entities;
using RetailPOS.Shared.Enums;
using RetailPOS.Shared.Exceptions;

namespace RetailPOS.BillingService.Tests;

[TestFixture]
public class BillAggregateTests
{
    [Test]
    public void AddItem_RecalculatesTotals()
    {
        var bill = Bill.Create(1, 5, 10);
        var item = new BillItem
        {
            ProductId = 1,
            ProductName = "Milk 1L",
            SKU = "SKU001",
            UnitPrice = 45m,
            Qty = 2,
            Discount = 0,
            TaxRate = 5
        };
        item.Recalculate();

        bill.AddItem(item);

        Assert.That(bill.GrossAmount, Is.EqualTo(90m));
        Assert.That(bill.TaxAmount, Is.EqualTo(4.5m).Within(0.01m));
    }

    [Test]
    public void Hold_EmptyBill_Throws()
    {
        var bill = Bill.Create(1, 5, 10);
        Assert.Throws<DomainException>(() => bill.Hold(null));
    }

    [Test]
    public void AddPayment_FullAmount_TransitionsToPaymentCompleted()
    {
        var bill = Bill.Create(1, 5, 10);
        var item = new BillItem
        {
            ProductId = 1,
            ProductName = "Test",
            SKU = "SKU001",
            UnitPrice = 100m,
            Qty = 1,
            TaxRate = 0
        };
        item.Recalculate();
        bill.AddItem(item);
        bill.StartPayment();
        bill.AddPayment(new Payment { Amount = bill.NetAmount, PaymentMode = PaymentMode.Cash });

        Assert.That(bill.Status, Is.EqualTo(BillStatus.PaymentCompleted));
    }
}
