using RetailPOS.BillingService.Application.DTOs;

namespace RetailPOS.BillingService.Application.Interfaces;

public interface IReturnService
{
    Task<ReturnDto> InitiateReturnAsync(InitiateReturnDto dto, int cashierId, int storeId, CancellationToken cancellationToken = default);
    Task<ReturnDto> ApproveReturnAsync(int returnId, int managerId, CancellationToken cancellationToken = default);
    Task<ReturnDto> ProcessRefundAsync(int returnId, RefundDto dto, int userId, CancellationToken cancellationToken = default);
    Task<ReturnDetailDto> GetReturnAsync(int returnId, CancellationToken cancellationToken = default);
}
