using RetailPOS.AdminService.Application.DTOs;
using RetailPOS.AdminService.Domain.Entities;
using RetailPOS.Shared.Common;

namespace RetailPOS.AdminService.Application.Interfaces;

public interface IInventoryRepository
{
    Task<Inventory?> GetInventoryAsync(int storeId, int productId, CancellationToken cancellationToken = default);
    Task<Inventory?> GetByIdAsync(int inventoryId, CancellationToken cancellationToken = default);
    Task<PagedResult<Inventory>> GetPagedAsync(InventoryFilterDto dto, CancellationToken cancellationToken = default);
    Task AddInventoryAsync(Inventory inventory, CancellationToken cancellationToken = default);
    Task UpdateInventoryAsync(Inventory inventory, CancellationToken cancellationToken = default);
    Task AddAdjustmentAsync(StockAdjustment adjustment, CancellationToken cancellationToken = default);
    Task<IReadOnlyCollection<Inventory>> GetLowStockAsync(int storeId, CancellationToken cancellationToken = default);
    Task SaveChangesAsync(CancellationToken cancellationToken = default);
}
