using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RetailPOS.AdminService.Application.DTOs;
using RetailPOS.AdminService.Application.Interfaces;
using RetailPOS.Shared.Api;
using RetailPOS.Shared.Security;

namespace RetailPOS.AdminService.Controllers;

[ApiController]
[Route("admin")]
[Authorize]
public class AdminController(IInventoryService inventoryService, IReportService reportService) : ControllerBase
{
    [HttpGet("inventory/stock")]
    // This is used by other internal services during billing flows, so it stays open
    // even though the rest of the admin surface is role-protected.
    [AllowAnonymous]
    public async Task<ActionResult<StockDto>> Stock([FromQuery] int productId, [FromQuery] int storeId, CancellationToken cancellationToken)
        => Ok(await inventoryService.GetStockAsync(productId, storeId, cancellationToken));

    [HttpPost("inventory/reserve")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiSuccessResponse>> Reserve([FromBody] InventoryMovementRequest dto, CancellationToken cancellationToken)
    {
        // Reservation reduces sellable stock immediately but does not touch on-hand
        // quantity until the bill is finalized.
        await inventoryService.ReserveStockAsync(dto.ProductId, dto.StoreId, dto.Qty, cancellationToken);
        return Ok(new ApiSuccessResponse());
    }

    [HttpPost("inventory/release")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiSuccessResponse>> Release([FromBody] InventoryMovementRequest dto, CancellationToken cancellationToken)
    {
        await inventoryService.ReleaseReservationAsync(dto.ProductId, dto.StoreId, dto.Qty, cancellationToken);
        return Ok(new ApiSuccessResponse());
    }

    [HttpPost("inventory/deduct")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiSuccessResponse>> Deduct([FromBody] DeductRequest dto, CancellationToken cancellationToken)
    {
        await inventoryService.DeductStockAsync(dto.StoreId, dto.Items.Select(x => new StockMovementDto(x.ProductId, x.Qty)).ToArray(), cancellationToken);
        return Ok(new ApiSuccessResponse());
    }

    [HttpPost("inventory/credit-return")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiSuccessResponse>> CreditReturn([FromBody] DeductRequest dto, CancellationToken cancellationToken)
    {
        // Returns are credited back as physical stock because the reservation was
        // already consumed when the original bill was finalized.
        await inventoryService.CreditReturnStockAsync(dto.StoreId, dto.Items.Select(x => new StockMovementDto(x.ProductId, x.Qty)).ToArray(), cancellationToken);
        return Ok(new ApiSuccessResponse());
    }

    [HttpGet("inventory")]
    [Authorize(Roles = $"{UserRoles.StoreManager},{UserRoles.Admin}")]
    public async Task<ActionResult> Inventory([FromQuery] int storeId, [FromQuery] int? productId, [FromQuery] int page = 1, [FromQuery] int pageSize = 20, CancellationToken cancellationToken = default)
        => Ok(await inventoryService.GetStoreInventoryAsync(new InventoryFilterDto(storeId, productId, page, pageSize), cancellationToken));

    [HttpPost("inventory/adjustments")]
    [Authorize(Roles = $"{UserRoles.StoreManager},{UserRoles.Admin},{UserRoles.InventoryClerk}")]
    public async Task<ActionResult<AdjustmentDto>> Adjust([FromBody] CreateAdjustmentDto dto, CancellationToken cancellationToken)
        => Ok(await inventoryService.PostAdjustmentAsync(dto, User.GetUserId(), cancellationToken));

    [HttpGet("alerts/low-stock")]
    [Authorize(Roles = $"{UserRoles.StoreManager},{UserRoles.Admin}")]
    public async Task<ActionResult> LowStock([FromQuery] int storeId, CancellationToken cancellationToken)
        => Ok(await inventoryService.GetLowStockAlertsAsync(storeId, cancellationToken));

    [HttpGet("dashboard")]
    [Authorize(Roles = $"{UserRoles.StoreManager},{UserRoles.Admin},{UserRoles.RegionalManager}")]
    public async Task<ActionResult<DashboardKpiDto>> Dashboard([FromQuery] int storeId, [FromQuery] DateOnly? date, CancellationToken cancellationToken)
        => Ok(await reportService.GetDashboardKPIsAsync(storeId, date ?? DateOnly.FromDateTime(DateTime.UtcNow), cancellationToken));

    [HttpGet("reports/sales")]
    [Authorize(Roles = $"{UserRoles.StoreManager},{UserRoles.Admin},{UserRoles.RegionalManager}")]
    public async Task<ActionResult<SalesSummaryDto>> Sales([FromQuery] int storeId, [FromQuery] DateOnly from, [FromQuery] DateOnly to, CancellationToken cancellationToken)
        => Ok(await reportService.GetSalesSummaryAsync(new ReportFilterDto(storeId, from, to), cancellationToken));
}

public record StockMovementRequest(int ProductId, decimal Qty);
public record InventoryMovementRequest(int ProductId, int StoreId, decimal Qty);
public record DeductRequest(int StoreId, List<StockMovementRequest> Items);
