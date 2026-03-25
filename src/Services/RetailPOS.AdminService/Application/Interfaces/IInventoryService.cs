using RetailPOS.AdminService.Application.DTOs;
using RetailPOS.Shared.Common;

namespace RetailPOS.AdminService.Application.Interfaces;

public interface IInventoryService
{
    Task<StockDto> GetStockAsync(int productId, int storeId, CancellationToken cancellationToken = default);
    Task<PagedResult<InventoryDto>> GetStoreInventoryAsync(InventoryFilterDto dto, CancellationToken cancellationToken = default);
    Task ReserveStockAsync(int productId, int storeId, decimal qty, CancellationToken cancellationToken = default);
    Task ReleaseReservationAsync(int productId, int storeId, decimal qty, CancellationToken cancellationToken = default);
    Task DeductStockAsync(int storeId, IReadOnlyCollection<StockMovementDto> items, CancellationToken cancellationToken = default);
    Task CreditReturnStockAsync(int storeId, IReadOnlyCollection<StockMovementDto> items, CancellationToken cancellationToken = default);
    Task<AdjustmentDto> PostAdjustmentAsync(CreateAdjustmentDto dto, int userId, CancellationToken cancellationToken = default);
    Task<IReadOnlyCollection<LowStockAlertDto>> GetLowStockAlertsAsync(int storeId, CancellationToken cancellationToken = default);
    Task UpdateReorderLevelAsync(int inventoryId, int newLevel, int userId, CancellationToken cancellationToken = default);
}
