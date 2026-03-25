using RetailPOS.BillingService.Application.Clients;
using RetailPOS.BillingService.Application.DTOs;
using RetailPOS.BillingService.Application.Interfaces;
using RetailPOS.BillingService.Domain.Entities;
using RetailPOS.Shared.Constants;
using RetailPOS.Shared.Enums;
using RetailPOS.Shared.Exceptions;

namespace RetailPOS.BillingService.Application.Services;

public class ReturnService(IBillRepository repository, IInventoryClient inventoryClient) : IReturnService
{
    public async Task<ReturnDto> InitiateReturnAsync(InitiateReturnDto dto, int cashierId, int storeId, CancellationToken cancellationToken = default)
    {
        var bill = await repository.GetBillAsync(dto.OriginalBillId, cancellationToken)
            ?? throw new PosApiException(PosErrors.BILL_004, StatusCodes.Status404NotFound, "Bill not found or does not belong to this store");
        if (bill.Status != BillStatus.Finalized)
        {
            throw new PosApiException(PosErrors.RET_003, StatusCodes.Status400BadRequest, "Original bill is not in Finalized status");
        }

        var returnEntity = new Return
        {
            OriginalBillId = bill.BillId,
            StoreId = storeId,
            InitiatedBy = cashierId,
            Reason = dto.Reason,
            RefundMode = dto.RefundMode
        };

        foreach (var item in dto.Items)
        {
            var original = bill.Items.FirstOrDefault(x => x.BillItemId == item.BillItemId)
                ?? throw new PosApiException(PosErrors.RET_001, StatusCodes.Status400BadRequest, "Return quantity exceeds original sold quantity");
            if (item.ReturnQty > original.Qty)
            {
                throw new PosApiException(PosErrors.RET_001, StatusCodes.Status400BadRequest, "Return quantity exceeds original sold quantity");
            }

            var refundAmount = original.UnitPrice * item.ReturnQty;
            returnEntity.Items.Add(new ReturnItem
            {
                BillItemId = original.BillItemId,
                ProductId = original.ProductId,
                ReturnQty = item.ReturnQty,
                UnitPrice = original.UnitPrice,
                RefundLineAmount = refundAmount,
                Condition = item.Condition
            });
            returnEntity.RefundAmount += refundAmount;
        }

        await repository.AddReturnAsync(returnEntity, cancellationToken);
        await repository.SaveChangesAsync(cancellationToken);
        return new ReturnDto(returnEntity.ReturnId, returnEntity.OriginalBillId, returnEntity.Status.ToString(), returnEntity.RefundAmount);
    }

    public async Task<ReturnDto> ApproveReturnAsync(int returnId, int managerId, CancellationToken cancellationToken = default)
    {
        var returnEntity = await repository.GetReturnAsync(returnId, cancellationToken)
            ?? throw new PosApiException(PosErrors.RET_002, StatusCodes.Status404NotFound, "Return not found");
        returnEntity.Status = ReturnStatus.Approved;
        returnEntity.ApprovedBy = managerId;
        returnEntity.ApprovedAt = DateTime.UtcNow;
        await repository.SaveChangesAsync(cancellationToken);
        return new ReturnDto(returnEntity.ReturnId, returnEntity.OriginalBillId, returnEntity.Status.ToString(), returnEntity.RefundAmount);
    }

    public async Task<ReturnDto> ProcessRefundAsync(int returnId, RefundDto dto, int userId, CancellationToken cancellationToken = default)
    {
        var returnEntity = await repository.GetReturnAsync(returnId, cancellationToken)
            ?? throw new PosApiException(PosErrors.RET_002, StatusCodes.Status404NotFound, "Return not found");
        returnEntity.Status = ReturnStatus.RefundProcessed;
        returnEntity.RefundMode = dto.RefundMode;
        returnEntity.RefundedAt = DateTime.UtcNow;
        await inventoryClient.CreditReturnStockAsync(returnEntity.StoreId, returnEntity.Items.Select(x => new StockMovementDto(x.ProductId, x.ReturnQty)).ToArray(), cancellationToken);
        await repository.SaveChangesAsync(cancellationToken);
        return new ReturnDto(returnEntity.ReturnId, returnEntity.OriginalBillId, returnEntity.Status.ToString(), returnEntity.RefundAmount);
    }

    public async Task<ReturnDetailDto> GetReturnAsync(int returnId, CancellationToken cancellationToken = default)
    {
        var returnEntity = await repository.GetReturnAsync(returnId, cancellationToken)
            ?? throw new PosApiException(PosErrors.RET_002, StatusCodes.Status404NotFound, "Return not found");
        return new ReturnDetailDto(
            returnEntity.ReturnId,
            returnEntity.OriginalBillId,
            returnEntity.Status.ToString(),
            returnEntity.RefundAmount,
            returnEntity.Items.Select(x => new ReturnItemDto(x.ReturnItemId, x.BillItemId, x.ProductId, x.ReturnQty, x.RefundLineAmount, x.Condition)).ToArray());
    }
}
