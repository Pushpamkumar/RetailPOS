using RetailPOS.BillingService.Application.DTOs;
using RetailPOS.Shared.Common;

namespace RetailPOS.BillingService.Application.Interfaces;

public interface IBillingService
{
    Task<BillDto> CreateBillAsync(int storeId, int cashierId, int shiftId, CancellationToken cancellationToken = default);
    Task<BillDto> AddItemAsync(AddItemDto dto, int cashierId, int storeId, CancellationToken cancellationToken = default);
    Task<BillDto> UpdateItemQtyAsync(int itemId, UpdateBillItemDto dto, CancellationToken cancellationToken = default);
    Task<BillDto> RemoveItemAsync(int billId, int itemId, CancellationToken cancellationToken = default);
    Task HoldBillAsync(int billId, string? reason, CancellationToken cancellationToken = default);
    Task<BillDto> ResumeBillAsync(int billId, int cashierId, CancellationToken cancellationToken = default);
    Task<IReadOnlyCollection<HeldBillSummaryDto>> GetHeldBillsAsync(int storeId, int cashierId, CancellationToken cancellationToken = default);
    Task<BillDto> CollectPaymentAsync(CollectPaymentDto dto, CancellationToken cancellationToken = default);
    Task<BillReceiptDto> FinalizeBillAsync(int billId, CancellationToken cancellationToken = default);
    Task<BillDto> GetBillAsync(int billId, CancellationToken cancellationToken = default);
    Task<PagedResult<BillSummaryDto>> GetBillsAsync(BillFilterDto dto, CancellationToken cancellationToken = default);
    Task SendReceiptAsync(int billId, CancellationToken cancellationToken = default);
}
