using Microsoft.EntityFrameworkCore;
using RetailPOS.BillingService.Application.DTOs;
using RetailPOS.BillingService.Application.Interfaces;
using RetailPOS.BillingService.Domain.Entities;
using RetailPOS.BillingService.Infrastructure.Data;
using RetailPOS.Shared.Common;

namespace RetailPOS.BillingService.Infrastructure.Repositories;

public class BillRepository(BillingDbContext dbContext) : IBillRepository
{
    public Task AddBillAsync(Bill bill, CancellationToken cancellationToken = default)
        => dbContext.Bills.AddAsync(bill, cancellationToken).AsTask();

    public async Task<Bill?> GetBillAsync(int billId, CancellationToken cancellationToken = default)
        => await dbContext.Bills.Include(x => x.Items).Include(x => x.Payments).FirstOrDefaultAsync(x => x.BillId == billId, cancellationToken);

    public async Task<PagedResult<Bill>> GetBillsAsync(BillFilterDto dto, CancellationToken cancellationToken = default)
    {
        var query = dbContext.Bills.Where(x => x.StoreId == dto.StoreId);
        if (dto.From.HasValue) query = query.Where(x => x.BillDate >= dto.From.Value);
        if (dto.To.HasValue) query = query.Where(x => x.BillDate <= dto.To.Value);
        if (dto.CashierUserId.HasValue) query = query.Where(x => x.CashierUserId == dto.CashierUserId.Value);
        if (!string.IsNullOrWhiteSpace(dto.Status) && Enum.TryParse<Shared.Enums.BillStatus>(dto.Status, true, out var status))
        {
            query = query.Where(x => x.Status == status);
        }
        var total = await query.CountAsync(cancellationToken);
        var items = await query.OrderByDescending(x => x.BillDate)
            .Skip((dto.Page - 1) * dto.PageSize)
            .Take(dto.PageSize)
            .ToListAsync(cancellationToken);
        return new PagedResult<Bill>(items, dto.Page, dto.PageSize, total);
    }

    public async Task<IReadOnlyCollection<Bill>> GetHeldBillsAsync(int storeId, int cashierId, CancellationToken cancellationToken = default)
        => await dbContext.Bills.Where(x => x.StoreId == storeId && x.CashierUserId == cashierId && x.Status == Shared.Enums.BillStatus.Held)
            .OrderByDescending(x => x.HeldAt)
            .ToListAsync(cancellationToken);

    public Task UpdateBillAsync(Bill bill, CancellationToken cancellationToken = default)
    {
        dbContext.Bills.Update(bill);
        return Task.CompletedTask;
    }

    public Task AddReturnAsync(Return returnEntity, CancellationToken cancellationToken = default)
        => dbContext.Returns.AddAsync(returnEntity, cancellationToken).AsTask();

    public async Task<Return?> GetReturnAsync(int returnId, CancellationToken cancellationToken = default)
        => await dbContext.Returns.Include(x => x.Items).FirstOrDefaultAsync(x => x.ReturnId == returnId, cancellationToken);

    public Task SaveChangesAsync(CancellationToken cancellationToken = default)
        => dbContext.SaveChangesAsync(cancellationToken);

    public async Task<int> GetNextSequenceAsync(int storeId, DateOnly businessDate, CancellationToken cancellationToken = default)
    {
        var from = businessDate.ToDateTime(TimeOnly.MinValue);
        var to = from.AddDays(1);
        var count = await dbContext.Bills.CountAsync(x => x.StoreId == storeId && x.BillDate >= from && x.BillDate < to, cancellationToken);
        return count + 1;
    }
}
