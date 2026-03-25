using RetailPOS.Shared.Common;

namespace RetailPOS.AdminService.Application.DTOs;

public record StockDto(int ProductId, int StoreId, decimal StockOnHand, decimal ReservedQty, decimal AvailableQty, bool IsLowStock);

public record InventoryDto(int InventoryId, int StoreId, int ProductId, decimal StockOnHand, decimal ReservedQty, int ReorderLevel, bool IsLowStock);

public record InventoryFilterDto(int StoreId, int? ProductId, int Page = 1, int PageSize = 20);

public record StockMovementDto(int ProductId, decimal Qty);

public record CreateAdjustmentDto(int StoreId, int ProductId, string AdjustmentType, decimal Quantity, string ReasonCode, string? SourceDocument, string? Notes);

public record AdjustmentDto(int AdjustmentId, int StoreId, int ProductId, string AdjustmentType, decimal Quantity, string Status);

public record LowStockAlertDto(int ProductId, decimal StockOnHand, int ReorderLevel);

public record ReportFilterDto(int StoreId, DateOnly From, DateOnly To, int? CashierUserId = null, int? CategoryId = null, int Page = 1, int PageSize = 20);

public record DashboardKpiDto(decimal TodayRevenue, int TransactionCount, decimal AvgBillValue, decimal CashCollected, decimal DigitalCollected, int LowStockItems, int PendingReturns, string? TopProductName, decimal TopProductRevenue);

public record SalesSummaryDto(decimal TotalRevenue, int BillCount, decimal AvgBillValue, decimal TotalDiscount, decimal TotalTax, decimal GrossRevenue);
