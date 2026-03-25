using System.Net.Http.Json;
using RetailPOS.BillingService.Application.DTOs;

namespace RetailPOS.BillingService.Application.Clients;

public class ProductLookupClient(HttpClient httpClient) : IProductLookupClient
{
    public async Task<ProductSearchResultDto?> FindByBarcodeAsync(string barcode, CancellationToken cancellationToken = default)
    {
        var results = await httpClient.GetFromJsonAsync<List<ProductSearchResultDto>>($"catalog/products/search?q={Uri.EscapeDataString(barcode)}", cancellationToken);
        return results?.FirstOrDefault();
    }
}
