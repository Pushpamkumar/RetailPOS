using RetailPOS.BillingService.Application.DTOs;

namespace RetailPOS.BillingService.Application.Clients;

public interface IProductLookupClient
{
    Task<ProductSearchResultDto?> FindByBarcodeAsync(string barcode, CancellationToken cancellationToken = default);
}
