using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RetailPOS.BillingService.Application.DTOs;
using RetailPOS.BillingService.Application.Interfaces;
using RetailPOS.Shared.Api;
using RetailPOS.Shared.Security;

namespace RetailPOS.BillingService.Controllers;

public record CreateBillRequest(int ShiftId);

[ApiController]
[Route("orders")]
[Authorize]
public class BillingController(IBillingService billingService, IReturnService returnService) : ControllerBase
{
    [HttpPost("bills")]
    [Authorize(Roles = $"{UserRoles.Cashier},{UserRoles.StoreManager},{UserRoles.Admin}")]
    public async Task<ActionResult<BillDto>> CreateBill([FromBody] CreateBillRequest request, CancellationToken cancellationToken)
        => Ok(await billingService.CreateBillAsync(User.GetStoreId(), User.GetUserId(), User.GetShiftId() ?? request.ShiftId, cancellationToken));

    [HttpPost("bills/cart/items")]
    public async Task<ActionResult<BillDto>> AddItem([FromBody] AddItemDto dto, CancellationToken cancellationToken)
        => Ok(await billingService.AddItemAsync(dto, User.GetUserId(), User.GetStoreId(), cancellationToken));

    [HttpPut("bills/cart/items/{id:int}")]
    public async Task<ActionResult<BillDto>> UpdateItem(int id, [FromBody] UpdateBillItemDto dto, CancellationToken cancellationToken)
        => Ok(await billingService.UpdateItemQtyAsync(id, dto, cancellationToken));

    [HttpDelete("bills/cart/items/{id:int}")]
    public async Task<ActionResult<BillDto>> RemoveItem(int id, [FromQuery] int billId, CancellationToken cancellationToken)
        => Ok(await billingService.RemoveItemAsync(billId, id, cancellationToken));

    [HttpPost("bills/{id:int}/hold")]
    public async Task<ActionResult<ApiSuccessResponse>> Hold(int id, [FromBody] string? reason, CancellationToken cancellationToken)
    {
        await billingService.HoldBillAsync(id, reason, cancellationToken);
        return Ok(new ApiSuccessResponse());
    }

    [HttpGet("bills/held")]
    public async Task<ActionResult> Held(CancellationToken cancellationToken)
        => Ok(await billingService.GetHeldBillsAsync(User.GetStoreId(), User.GetUserId(), cancellationToken));

    [HttpPut("bills/{id:int}/resume")]
    public async Task<ActionResult<BillDto>> Resume(int id, CancellationToken cancellationToken)
        => Ok(await billingService.ResumeBillAsync(id, User.GetUserId(), cancellationToken));

    [HttpPost("payments/collect")]
    public async Task<ActionResult<BillDto>> Collect([FromBody] CollectPaymentDto dto, CancellationToken cancellationToken)
        => Ok(await billingService.CollectPaymentAsync(dto, cancellationToken));

    [HttpPost("bills/{id:int}/finalize")]
    public async Task<ActionResult<BillReceiptDto>> Finalize(int id, CancellationToken cancellationToken)
        => Ok(await billingService.FinalizeBillAsync(id, cancellationToken));

    [HttpGet("bills/{id:int}")]
    public async Task<ActionResult<BillDto>> GetBill(int id, CancellationToken cancellationToken)
        => Ok(await billingService.GetBillAsync(id, cancellationToken));

    [HttpGet("bills")]
    public async Task<ActionResult> GetBills([FromQuery] DateTime? from, [FromQuery] DateTime? to, [FromQuery] int? cashierUserId, [FromQuery] string? status, [FromQuery] int page = 1, [FromQuery] int pageSize = 20, CancellationToken cancellationToken = default)
        => Ok(await billingService.GetBillsAsync(new BillFilterDto(User.GetStoreId(), from, to, cashierUserId, status, page, pageSize), cancellationToken));

    [HttpPost("bills/{id:int}/send-receipt")]
    public async Task<ActionResult<ApiSuccessResponse>> SendReceipt(int id, CancellationToken cancellationToken)
    {
        await billingService.SendReceiptAsync(id, cancellationToken);
        return Ok(new ApiSuccessResponse());
    }

    [HttpPost("returns/initiate")]
    public async Task<ActionResult<ReturnDto>> InitiateReturn([FromBody] InitiateReturnDto dto, CancellationToken cancellationToken)
        => Ok(await returnService.InitiateReturnAsync(dto, User.GetUserId(), User.GetStoreId(), cancellationToken));

    [HttpPost("returns/{id:int}/approve")]
    [Authorize(Roles = $"{UserRoles.StoreManager},{UserRoles.Admin}")]
    public async Task<ActionResult<ReturnDto>> ApproveReturn(int id, CancellationToken cancellationToken)
        => Ok(await returnService.ApproveReturnAsync(id, User.GetUserId(), cancellationToken));

    [HttpPost("returns/{id:int}/refund")]
    [Authorize(Roles = $"{UserRoles.StoreManager},{UserRoles.Admin}")]
    public async Task<ActionResult<ReturnDto>> Refund(int id, [FromBody] RefundDto dto, CancellationToken cancellationToken)
        => Ok(await returnService.ProcessRefundAsync(id, dto, User.GetUserId(), cancellationToken));
}
