using RetailPOS.BillingService.Application.DTOs;
using RetailPOS.BillingService.Domain.Entities;
using RetailPOS.Shared.Common;

namespace RetailPOS.BillingService.Application.Interfaces;

public interface IBillRepository
{
    Task AddBillAsync(Bill bill, CancellationToken cancellationToken = default);
    Task<Bill?> GetBillAsync(int billId, CancellationToken cancellationToken = default);
    Task<PagedResult<Bill>> GetBillsAsync(BillFilterDto dto, CancellationToken cancellationToken = default);
    Task<IReadOnlyCollection<Bill>> GetHeldBillsAsync(int storeId, int cashierId, CancellationToken cancellationToken = default);
    Task UpdateBillAsync(Bill bill, CancellationToken cancellationToken = default);
    Task AddReturnAsync(Return returnEntity, CancellationToken cancellationToken = default);
    Task<Return?> GetReturnAsync(int returnId, CancellationToken cancellationToken = default);
    Task SaveChangesAsync(CancellationToken cancellationToken = default);
    Task<int> GetNextSequenceAsync(int storeId, DateOnly businessDate, CancellationToken cancellationToken = default);
}
