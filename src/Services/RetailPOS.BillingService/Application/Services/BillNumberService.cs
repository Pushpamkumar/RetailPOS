using RetailPOS.BillingService.Application.Interfaces;

namespace RetailPOS.BillingService.Application.Services;

public class BillNumberService(IBillRepository repository) : IBillNumberService
{
    public async Task<string> GenerateAsync(int storeId, string storeCode, CancellationToken cancellationToken = default)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var sequence = await repository.GetNextSequenceAsync(storeId, today, cancellationToken);
        return $"{storeCode}-{today:yyyyMMdd}-{sequence:D4}";
    }
}
