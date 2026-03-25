using RetailPOS.BillingService.Application.DTOs;

namespace RetailPOS.BillingService.Application.Clients;

public interface IInventoryClient
{
    Task<StockDto?> GetStockAsync(int productId, int storeId, CancellationToken cancellationToken = default);
    Task ReserveStockAsync(int productId, int storeId, decimal qty, CancellationToken cancellationToken = default);
    Task ReleaseStockAsync(int productId, int storeId, decimal qty, CancellationToken cancellationToken = default);
    Task DeductStockAsync(int storeId, IReadOnlyCollection<StockMovementDto> items, CancellationToken cancellationToken = default);
    Task CreditReturnStockAsync(int storeId, IReadOnlyCollection<StockMovementDto> items, CancellationToken cancellationToken = default);
}
