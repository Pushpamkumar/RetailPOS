namespace RetailPOS.BillingService.Application.Interfaces;

public interface IBillNumberService
{
    Task<string> GenerateAsync(int storeId, string storeCode, CancellationToken cancellationToken = default);
}
