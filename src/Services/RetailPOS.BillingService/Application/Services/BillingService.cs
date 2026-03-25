using RetailPOS.BillingService.Application.Clients;
using RetailPOS.BillingService.Application.DTOs;
using RetailPOS.BillingService.Application.Interfaces;
using RetailPOS.BillingService.Domain.Entities;
using RetailPOS.Shared.Common;
using RetailPOS.Shared.Constants;
using RetailPOS.Shared.Enums;
using RetailPOS.Shared.Exceptions;

namespace RetailPOS.BillingService.Application.Services;

public class BillingService(
    IBillRepository repository,
    IProductLookupClient productLookupClient,
    IInventoryClient inventoryClient,
    IBillNumberService billNumberService,
    IReceiptBuilder receiptBuilder) : IBillingService
{
    public async Task<BillDto> CreateBillAsync(int storeId, int cashierId, int shiftId, CancellationToken cancellationToken = default)
    {
        var bill = Bill.Create(storeId, cashierId, shiftId);
        await repository.AddBillAsync(bill, cancellationToken);
        await repository.SaveChangesAsync(cancellationToken);
        return MapBill(bill);
    }

    public async Task<BillDto> AddItemAsync(AddItemDto dto, int cashierId, int storeId, CancellationToken cancellationToken = default)
    {
        var bill = await repository.GetBillAsync(dto.BillId, cancellationToken)
            ?? throw new PosApiException(PosErrors.BILL_004, StatusCodes.Status404NotFound, "Bill not found or does not belong to this store");
        var product = await productLookupClient.FindByBarcodeAsync(dto.Barcode, cancellationToken)
            ?? throw new PosApiException(PosErrors.CAT_001, StatusCodes.Status404NotFound, "Product not found for given ID or barcode");
        var stock = await inventoryClient.GetStockAsync(product.ProductId, storeId, cancellationToken);
        if (stock is null || stock.AvailableQty < dto.Qty)
        {
            throw new PosApiException(PosErrors.BILL_002, StatusCodes.Status409Conflict, $"Product out of stock: {product.ProductName}");
        }

        var item = new BillItem
        {
            ProductId = product.ProductId,
            ProductName = product.ProductName,
            SKU = product.SKU,
            Barcode = product.Barcode,
            UnitPrice = product.SellingPrice,
            Qty = dto.Qty,
            Discount = dto.DiscountOverride,
            TaxRate = product.TaxRate
        };
        item.Recalculate();

        bill.AddItem(item);
        // Reserve inventory as soon as the item lands in the cart so parallel checkouts
        // do not oversell the same stock before payment is completed.
        await inventoryClient.ReserveStockAsync(product.ProductId, storeId, dto.Qty, cancellationToken);
        await repository.UpdateBillAsync(bill, cancellationToken);
        await repository.SaveChangesAsync(cancellationToken);
        return MapBill(bill);
    }

    public async Task<BillDto> UpdateItemQtyAsync(int itemId, UpdateBillItemDto dto, CancellationToken cancellationToken = default)
    {
        var bill = await repository.GetBillAsync(dto.BillId, cancellationToken)
            ?? throw new PosApiException(PosErrors.BILL_004, StatusCodes.Status404NotFound, "Bill not found or does not belong to this store");
        bill.UpdateItemQty(itemId, dto.Qty);
        await repository.UpdateBillAsync(bill, cancellationToken);
        await repository.SaveChangesAsync(cancellationToken);
        return MapBill(bill);
    }

    public async Task<BillDto> RemoveItemAsync(int billId, int itemId, CancellationToken cancellationToken = default)
    {
        var bill = await repository.GetBillAsync(billId, cancellationToken)
            ?? throw new PosApiException(PosErrors.BILL_004, StatusCodes.Status404NotFound, "Bill not found or does not belong to this store");
        var item = bill.Items.FirstOrDefault(x => x.BillItemId == itemId)
            ?? throw new PosApiException(PosErrors.BILL_004, StatusCodes.Status404NotFound, "Bill not found or does not belong to this store");
        bill.RemoveItem(itemId);
        // Releasing the reservation keeps inventory in sync with cart edits before the
        // bill is finalized.
        await inventoryClient.ReleaseStockAsync(item.ProductId, bill.StoreId, item.Qty, cancellationToken);
        await repository.UpdateBillAsync(bill, cancellationToken);
        await repository.SaveChangesAsync(cancellationToken);
        return MapBill(bill);
    }

    public async Task HoldBillAsync(int billId, string? reason, CancellationToken cancellationToken = default)
    {
        var bill = await repository.GetBillAsync(billId, cancellationToken)
            ?? throw new PosApiException(PosErrors.BILL_004, StatusCodes.Status404NotFound, "Bill not found or does not belong to this store");
        bill.Hold(reason);
        await repository.SaveChangesAsync(cancellationToken);
    }

    public async Task<BillDto> ResumeBillAsync(int billId, int cashierId, CancellationToken cancellationToken = default)
    {
        var bill = await repository.GetBillAsync(billId, cancellationToken)
            ?? throw new PosApiException(PosErrors.BILL_004, StatusCodes.Status404NotFound, "Bill not found or does not belong to this store");
        bill.Resume();
        await repository.SaveChangesAsync(cancellationToken);
        return MapBill(bill);
    }

    public async Task<IReadOnlyCollection<HeldBillSummaryDto>> GetHeldBillsAsync(int storeId, int cashierId, CancellationToken cancellationToken = default)
        => (await repository.GetHeldBillsAsync(storeId, cashierId, cancellationToken))
            .Select(x => new HeldBillSummaryDto(x.BillId, null, x.NetAmount, x.HeldAt ?? x.BillDate))
            .ToArray();

    public async Task<BillDto> CollectPaymentAsync(CollectPaymentDto dto, CancellationToken cancellationToken = default)
    {
        var bill = await repository.GetBillAsync(dto.BillId, cancellationToken)
            ?? throw new PosApiException(PosErrors.BILL_004, StatusCodes.Status404NotFound, "Bill not found or does not belong to this store");
        bill.StartPayment();
        if ((dto.PaymentMode == "CARD" || dto.PaymentMode == "UPI") && string.IsNullOrWhiteSpace(dto.ReferenceNo))
        {
            throw new PosApiException(PosErrors.BILL_007, StatusCodes.Status400BadRequest, "Reference number required for card/UPI payment");
        }

        // Unknown values fall back to cash to keep the API tolerant of client casing
        // issues while still persisting a valid enum.
        var mode = Enum.TryParse<PaymentMode>(dto.PaymentMode, true, out var parsedMode) ? parsedMode : PaymentMode.Cash;
        bill.AddPayment(new Payment
        {
            PaymentMode = mode,
            Amount = dto.Amount,
            ReferenceNo = dto.ReferenceNo,
            CashReceived = dto.CashReceived,
            ChangeReturned = dto.CashReceived.HasValue ? dto.CashReceived.Value - dto.Amount : null
        });

        await repository.SaveChangesAsync(cancellationToken);
        return MapBill(bill);
    }

    public async Task<BillReceiptDto> FinalizeBillAsync(int billId, CancellationToken cancellationToken = default)
    {
        var bill = await repository.GetBillAsync(billId, cancellationToken)
            ?? throw new PosApiException(PosErrors.BILL_004, StatusCodes.Status404NotFound, "Bill not found or does not belong to this store");
        if (bill.Payments.Sum(x => x.Amount) < bill.NetAmount)
        {
            throw new PosApiException(PosErrors.BILL_006, StatusCodes.Status400BadRequest, "Payment amount insufficient for bill total");
        }

        var billNumber = await billNumberService.GenerateAsync(bill.StoreId, $"STR{bill.StoreId:000}", cancellationToken);
        bill.Finalize(billNumber);
        // Physical stock is deducted only after the sale is fully paid and finalized;
        // until then the reserved bucket acts as the protection against overselling.
        await inventoryClient.DeductStockAsync(bill.StoreId, bill.Items.Select(x => new StockMovementDto(x.ProductId, x.Qty)).ToArray(), cancellationToken);
        await repository.SaveChangesAsync(cancellationToken);
        return receiptBuilder.Build(bill);
    }

    public async Task<BillDto> GetBillAsync(int billId, CancellationToken cancellationToken = default)
    {
        var bill = await repository.GetBillAsync(billId, cancellationToken)
            ?? throw new PosApiException(PosErrors.BILL_004, StatusCodes.Status404NotFound, "Bill not found or does not belong to this store");
        return MapBill(bill);
    }

    public async Task<PagedResult<BillSummaryDto>> GetBillsAsync(BillFilterDto dto, CancellationToken cancellationToken = default)
    {
        var result = await repository.GetBillsAsync(dto, cancellationToken);
        return new PagedResult<BillSummaryDto>(
            result.Items.Select(x => new BillSummaryDto(x.BillId, x.BillNumber, x.BillDate, x.NetAmount, x.Status.ToString())).ToArray(),
            result.Page,
            result.PageSize,
            result.TotalCount);
    }

    public async Task SendReceiptAsync(int billId, CancellationToken cancellationToken = default)
    {
        var bill = await repository.GetBillAsync(billId, cancellationToken)
            ?? throw new PosApiException(PosErrors.BILL_004, StatusCodes.Status404NotFound, "Bill not found or does not belong to this store");
        bill.MarkReceiptSent();
        await repository.SaveChangesAsync(cancellationToken);
    }

    private static BillDto MapBill(Bill bill)
        => new(
            bill.BillId,
            bill.BillNumber,
            bill.StoreId,
            bill.CashierUserId,
            bill.Status.ToString(),
            bill.GrossAmount,
            bill.DiscountAmount,
            bill.TaxAmount,
            bill.RoundOff,
            bill.NetAmount,
            bill.Items.Select(x => new BillItemDto(x.BillItemId, x.ProductId, x.ProductName, x.SKU, x.UnitPrice, x.Qty, x.Discount, x.TaxRate, x.TaxAmount, x.LineTotal)).ToArray(),
            bill.Payments.Select(x => new PaymentDto(x.PaymentId, x.PaymentMode.ToString(), x.Amount, x.ReferenceNo, x.Status)).ToArray());
}
