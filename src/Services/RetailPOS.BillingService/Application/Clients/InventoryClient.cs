using System.Net.Http.Json;
using RetailPOS.BillingService.Application.DTOs;

namespace RetailPOS.BillingService.Application.Clients;

public class InventoryClient(HttpClient httpClient) : IInventoryClient
{
    public Task<StockDto?> GetStockAsync(int productId, int storeId, CancellationToken cancellationToken = default)
        => httpClient.GetFromJsonAsync<StockDto>($"admin/inventory/stock?productId={productId}&storeId={storeId}", cancellationToken);

    public async Task ReserveStockAsync(int productId, int storeId, decimal qty, CancellationToken cancellationToken = default)
    {
        using var response = await httpClient.PostAsJsonAsync("admin/inventory/reserve", new { productId, storeId, qty }, cancellationToken);
        response.EnsureSuccessStatusCode();
    }

    public async Task ReleaseStockAsync(int productId, int storeId, decimal qty, CancellationToken cancellationToken = default)
    {
        using var response = await httpClient.PostAsJsonAsync("admin/inventory/release", new { productId, storeId, qty }, cancellationToken);
        response.EnsureSuccessStatusCode();
    }

    public async Task DeductStockAsync(int storeId, IReadOnlyCollection<StockMovementDto> items, CancellationToken cancellationToken = default)
    {
        using var response = await httpClient.PostAsJsonAsync("admin/inventory/deduct", new { storeId, items }, cancellationToken);
        response.EnsureSuccessStatusCode();
    }

    public async Task CreditReturnStockAsync(int storeId, IReadOnlyCollection<StockMovementDto> items, CancellationToken cancellationToken = default)
    {
        using var response = await httpClient.PostAsJsonAsync("admin/inventory/credit-return", new { storeId, items }, cancellationToken);
        response.EnsureSuccessStatusCode();
    }
}
