using Microsoft.EntityFrameworkCore;
using RetailPOS.AdminService.Application.DTOs;
using RetailPOS.AdminService.Application.Interfaces;
using RetailPOS.AdminService.Domain.Entities;
using RetailPOS.AdminService.Infrastructure.Data;
using RetailPOS.Shared.Common;

namespace RetailPOS.AdminService.Infrastructure.Repositories;

public class InventoryRepository(AdminDbContext dbContext) : IInventoryRepository
{
    public async Task<Inventory?> GetInventoryAsync(int storeId, int productId, CancellationToken cancellationToken = default)
        => await dbContext.Inventory.FirstOrDefaultAsync(x => x.StoreId == storeId && x.ProductId == productId, cancellationToken);

    public async Task<Inventory?> GetByIdAsync(int inventoryId, CancellationToken cancellationToken = default)
        => await dbContext.Inventory.FirstOrDefaultAsync(x => x.InventoryId == inventoryId, cancellationToken);

    public async Task<PagedResult<Inventory>> GetPagedAsync(InventoryFilterDto dto, CancellationToken cancellationToken = default)
    {
        var query = dbContext.Inventory.Where(x => x.StoreId == dto.StoreId);
        if (dto.ProductId.HasValue)
        {
            query = query.Where(x => x.ProductId == dto.ProductId.Value);
        }
        var total = await query.CountAsync(cancellationToken);
        var items = await query.OrderBy(x => x.ProductId).Skip((dto.Page - 1) * dto.PageSize).Take(dto.PageSize).ToListAsync(cancellationToken);
        return new PagedResult<Inventory>(items, dto.Page, dto.PageSize, total);
    }

    public Task AddInventoryAsync(Inventory inventory, CancellationToken cancellationToken = default)
        => dbContext.Inventory.AddAsync(inventory, cancellationToken).AsTask();

    public Task UpdateInventoryAsync(Inventory inventory, CancellationToken cancellationToken = default)
    {
        var entry = dbContext.Entry(inventory);

        // Preserve newly created inventory rows as Added; forcing Modified here
        // can turn a first-time stock adjustment into a failed update.
        if (entry.State == EntityState.Detached)
        {
            dbContext.Inventory.Update(inventory);
        }

        return Task.CompletedTask;
    }

    public Task AddAdjustmentAsync(StockAdjustment adjustment, CancellationToken cancellationToken = default)
        => dbContext.StockAdjustments.AddAsync(adjustment, cancellationToken).AsTask();

    public async Task<IReadOnlyCollection<Inventory>> GetLowStockAsync(int storeId, CancellationToken cancellationToken = default)
        => await dbContext.Inventory.Where(x => x.StoreId == storeId && x.StockOnHand <= x.ReorderLevel).ToListAsync(cancellationToken);

    public Task SaveChangesAsync(CancellationToken cancellationToken = default)
        => dbContext.SaveChangesAsync(cancellationToken);
}
