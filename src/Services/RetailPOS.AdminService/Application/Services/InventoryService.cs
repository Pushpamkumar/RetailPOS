using RetailPOS.AdminService.Application.DTOs;
using RetailPOS.AdminService.Application.Interfaces;
using RetailPOS.AdminService.Domain.Entities;
using RetailPOS.Shared.Common;
using RetailPOS.Shared.Constants;
using RetailPOS.Shared.Enums;
using RetailPOS.Shared.Exceptions;

namespace RetailPOS.AdminService.Application.Services;

public class InventoryService(IInventoryRepository repository, IConfiguration configuration) : IInventoryService
{
    public async Task<StockDto> GetStockAsync(int productId, int storeId, CancellationToken cancellationToken = default)
    {
        var inventory = await GetOrCreateInventoryAsync(storeId, productId, cancellationToken);
        return MapStock(inventory);
    }

    public async Task<PagedResult<InventoryDto>> GetStoreInventoryAsync(InventoryFilterDto dto, CancellationToken cancellationToken = default)
    {
        var result = await repository.GetPagedAsync(dto, cancellationToken);
        return new PagedResult<InventoryDto>(
            result.Items.Select(MapInventory).ToArray(),
            result.Page,
            result.PageSize,
            result.TotalCount);
    }

    public async Task ReserveStockAsync(int productId, int storeId, decimal qty, CancellationToken cancellationToken = default)
    {
        var inventory = await GetOrCreateInventoryAsync(storeId, productId, cancellationToken);
        inventory.Reserve(qty);
        await repository.UpdateInventoryAsync(inventory, cancellationToken);
        await repository.SaveChangesAsync(cancellationToken);
    }

    public async Task ReleaseReservationAsync(int productId, int storeId, decimal qty, CancellationToken cancellationToken = default)
    {
        var inventory = await GetOrCreateInventoryAsync(storeId, productId, cancellationToken);
        inventory.ReleaseReservation(qty);
        await repository.UpdateInventoryAsync(inventory, cancellationToken);
        await repository.SaveChangesAsync(cancellationToken);
    }

    public async Task DeductStockAsync(int storeId, IReadOnlyCollection<StockMovementDto> items, CancellationToken cancellationToken = default)
    {
        foreach (var item in items)
        {
            var inventory = await GetOrCreateInventoryAsync(storeId, item.ProductId, cancellationToken);
            inventory.DeductStock(item.Qty);
            await repository.UpdateInventoryAsync(inventory, cancellationToken);
        }
        await repository.SaveChangesAsync(cancellationToken);
    }

    public async Task CreditReturnStockAsync(int storeId, IReadOnlyCollection<StockMovementDto> items, CancellationToken cancellationToken = default)
    {
        foreach (var item in items)
        {
            var inventory = await GetOrCreateInventoryAsync(storeId, item.ProductId, cancellationToken);
            inventory.AddStock(item.Qty, DateOnly.FromDateTime(DateTime.UtcNow));
            await repository.UpdateInventoryAsync(inventory, cancellationToken);
        }
        await repository.SaveChangesAsync(cancellationToken);
    }

    public async Task<AdjustmentDto> PostAdjustmentAsync(CreateAdjustmentDto dto, int userId, CancellationToken cancellationToken = default)
    {
        var threshold = configuration.GetValue("BusinessRules:StockAdjustmentApprovalThreshold", 500m);
        var adjustmentType = Enum.TryParse<AdjustmentType>(dto.AdjustmentType, true, out var parsed) ? parsed : AdjustmentType.Inward;

        var adjustment = new StockAdjustment
        {
            StoreId = dto.StoreId,
            ProductId = dto.ProductId,
            AdjustmentType = adjustmentType,
            Quantity = dto.Quantity,
            ReasonCode = dto.ReasonCode,
            SourceDocument = dto.SourceDocument,
            Notes = dto.Notes,
            AdjustedBy = userId,
            Status = Math.Abs(dto.Quantity) > threshold ? AdjustmentStatus.Draft : AdjustmentStatus.Posted,
            PostedAt = Math.Abs(dto.Quantity) > threshold ? null : DateTime.UtcNow
        };

        if (adjustment.Status == AdjustmentStatus.Posted)
        {
            var inventory = await GetOrCreateInventoryAsync(dto.StoreId, dto.ProductId, cancellationToken);
            if (dto.Quantity >= 0) inventory.AddStock(dto.Quantity, DateOnly.FromDateTime(DateTime.UtcNow));
            else inventory.DeductStock(Math.Abs(dto.Quantity));
            await repository.UpdateInventoryAsync(inventory, cancellationToken);
        }

        await repository.AddAdjustmentAsync(adjustment, cancellationToken);
        await repository.SaveChangesAsync(cancellationToken);
        return new AdjustmentDto(adjustment.AdjustmentId, adjustment.StoreId, adjustment.ProductId, adjustment.AdjustmentType.ToString(), adjustment.Quantity, adjustment.Status.ToString());
    }

    public async Task<IReadOnlyCollection<LowStockAlertDto>> GetLowStockAlertsAsync(int storeId, CancellationToken cancellationToken = default)
        => (await repository.GetLowStockAsync(storeId, cancellationToken))
            .Select(x => new LowStockAlertDto(x.ProductId, x.StockOnHand, x.ReorderLevel))
            .ToArray();

    public async Task UpdateReorderLevelAsync(int inventoryId, int newLevel, int userId, CancellationToken cancellationToken = default)
    {
        var inventory = await repository.GetByIdAsync(inventoryId, cancellationToken)
            ?? throw new PosApiException(PosErrors.INV_002, StatusCodes.Status404NotFound, "Inventory record not found for store/product");
        inventory.ReorderLevel = newLevel;
        await repository.UpdateInventoryAsync(inventory, cancellationToken);
        await repository.SaveChangesAsync(cancellationToken);
    }

    private async Task<Inventory> GetOrCreateInventoryAsync(int storeId, int productId, CancellationToken cancellationToken)
    {
        var inventory = await repository.GetInventoryAsync(storeId, productId, cancellationToken);
        if (inventory is not null)
        {
            return inventory;
        }
        inventory = new Inventory { StoreId = storeId, ProductId = productId, StockOnHand = 0, ReservedQty = 0, ReorderLevel = 0 };
        await repository.AddInventoryAsync(inventory, cancellationToken);
        return inventory;
    }

    private static StockDto MapStock(Inventory x) => new(x.ProductId, x.StoreId, x.StockOnHand, x.ReservedQty, x.AvailableQty, x.IsLowStock);
    private static InventoryDto MapInventory(Inventory x) => new(x.InventoryId, x.StoreId, x.ProductId, x.StockOnHand, x.ReservedQty, x.ReorderLevel, x.IsLowStock);
}
