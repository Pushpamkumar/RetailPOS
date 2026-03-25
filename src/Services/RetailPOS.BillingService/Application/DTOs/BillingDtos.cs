namespace RetailPOS.BillingService.Application.DTOs;

public record BillDto(
    int BillId,
    string? BillNumber,
    int StoreId,
    int CashierUserId,
    string Status,
    decimal GrossAmount,
    decimal DiscountAmount,
    decimal TaxAmount,
    decimal RoundOff,
    decimal NetAmount,
    IReadOnlyCollection<BillItemDto> Items,
    IReadOnlyCollection<PaymentDto> Payments);

public record BillItemDto(
    int BillItemId,
    int ProductId,
    string ProductName,
    string SKU,
    decimal UnitPrice,
    decimal Qty,
    decimal Discount,
    decimal TaxRate,
    decimal TaxAmount,
    decimal LineTotal);

public record PaymentDto(int PaymentId, string PaymentMode, decimal Amount, string? ReferenceNo, string Status);

public record AddItemDto(int BillId, string Barcode, decimal Qty, decimal DiscountOverride = 0);

public record UpdateBillItemDto(int BillId, decimal Qty);

public record CollectPaymentDto(int BillId, string PaymentMode, decimal Amount, string? ReferenceNo, decimal? CashReceived);

public record BillReceiptDto(int BillId, string BillNumber, decimal NetAmount, DateTime FinalizedAt, string ReceiptHtml, string? QrCodeData = null);

public record HeldBillSummaryDto(int BillId, string? CustomerMobile, decimal NetAmount, DateTime HeldAt);

public record BillFilterDto(int StoreId, DateTime? From, DateTime? To, int? CashierUserId, string? Status, int Page = 1, int PageSize = 20);

public record BillSummaryDto(int BillId, string? BillNumber, DateTime BillDate, decimal NetAmount, string Status);

public record ReturnItemRequestDto(int BillItemId, decimal ReturnQty, string Condition);

public record InitiateReturnDto(int OriginalBillId, List<ReturnItemRequestDto> Items, string Reason, string RefundMode);

public record RefundDto(string RefundMode);

public record ReturnDto(int ReturnId, int OriginalBillId, string Status, decimal RefundAmount);

public record ReturnDetailDto(int ReturnId, int OriginalBillId, string Status, decimal RefundAmount, IReadOnlyCollection<ReturnItemDto> Items);

public record ReturnItemDto(int ReturnItemId, int BillItemId, int ProductId, decimal ReturnQty, decimal RefundLineAmount, string Condition);

public record ProductSearchResultDto(
    int ProductId,
    string SKU,
    string? Barcode,
    string ProductName,
    string CategoryName,
    string UOM,
    decimal MRP,
    decimal SellingPrice,
    decimal TaxRate,
    bool IsTaxInclusive,
    decimal StockOnHand,
    bool IsLowStock,
    string? ImageUrl);

public record StockDto(int ProductId, int StoreId, decimal StockOnHand, decimal ReservedQty, decimal AvailableQty, bool IsLowStock);

public record StockMovementDto(int ProductId, decimal Qty);
