using Microsoft.EntityFrameworkCore;
using RetailPOS.AuthService.Application.DTOs;
using RetailPOS.AuthService.Application.Interfaces;
using RetailPOS.AuthService.Domain.Entities;
using RetailPOS.AuthService.Infrastructure.Data;
using RetailPOS.Shared.Common;

namespace RetailPOS.AuthService.Infrastructure.Repositories;

public class UserRepository(AuthDbContext dbContext) : IUserRepository
{
    public async Task<User?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
        => await QueryUsers().FirstOrDefaultAsync(x => x.UserId == id, cancellationToken);

    public async Task<User?> GetByEmailAsync(string email, CancellationToken cancellationToken = default)
        => await QueryUsers().FirstOrDefaultAsync(x => x.Email == email, cancellationToken);

    public async Task<User?> GetByMobileAsync(string mobile, CancellationToken cancellationToken = default)
        => await QueryUsers().FirstOrDefaultAsync(x => x.Mobile == mobile, cancellationToken);

    public async Task<User?> GetByEmployeeCodeAsync(string code, CancellationToken cancellationToken = default)
        => await QueryUsers().FirstOrDefaultAsync(x => x.EmployeeCode == code, cancellationToken);

    public async Task<User?> GetByRefreshTokenAsync(string tokenHash, CancellationToken cancellationToken = default)
        => await QueryUsers().FirstOrDefaultAsync(x => x.RefreshTokens.Any(rt => rt.Token == tokenHash), cancellationToken);

    public async Task<bool> ExistsAsync(string? email, string? mobile, string employeeCode, CancellationToken cancellationToken = default)
        => await dbContext.Users.AnyAsync(
            x => x.EmployeeCode == employeeCode || (!string.IsNullOrWhiteSpace(email) && x.Email == email) || (!string.IsNullOrWhiteSpace(mobile) && x.Mobile == mobile),
            cancellationToken);

    public Task AddAsync(User user, CancellationToken cancellationToken = default)
        => dbContext.Users.AddAsync(user, cancellationToken).AsTask();

    public Task UpdateAsync(User user, CancellationToken cancellationToken = default)
    {
        dbContext.Users.Update(user);
        return Task.CompletedTask;
    }

    public async Task<PagedResult<User>> GetPagedAsync(UserFilterDto filter, CancellationToken cancellationToken = default)
    {
        var query = QueryUsers().AsQueryable();

        if (filter.StoreId.HasValue)
        {
            query = query.Where(x => x.StoreId == filter.StoreId.Value);
        }

        if (!string.IsNullOrWhiteSpace(filter.Role))
        {
            query = query.Where(x => x.Role.RoleName == filter.Role);
        }

        if (!string.IsNullOrWhiteSpace(filter.Search))
        {
            query = query.Where(x => x.FullName.Contains(filter.Search) || (x.Email ?? string.Empty).Contains(filter.Search) || x.EmployeeCode.Contains(filter.Search));
        }

        var total = await query.CountAsync(cancellationToken);
        var items = await query.OrderBy(x => x.FullName)
            .Skip((filter.Page - 1) * filter.PageSize)
            .Take(filter.PageSize)
            .ToListAsync(cancellationToken);

        return new PagedResult<User>(items, filter.Page, filter.PageSize, total);
    }

    public async Task<Role?> GetRoleByIdAsync(int roleId, CancellationToken cancellationToken = default)
        => await dbContext.Roles.FirstOrDefaultAsync(x => x.RoleId == roleId, cancellationToken);

    public async Task<ShiftLog?> GetActiveShiftAsync(int userId, int storeId, CancellationToken cancellationToken = default)
        => await dbContext.ShiftLogs.FirstOrDefaultAsync(
            x => x.UserId == userId && x.StoreId == storeId && (x.Status == Shared.Enums.ShiftStatus.Open || x.Status == Shared.Enums.ShiftStatus.Active),
            cancellationToken);

    public Task AddShiftAsync(ShiftLog shiftLog, CancellationToken cancellationToken = default)
        => dbContext.ShiftLogs.AddAsync(shiftLog, cancellationToken).AsTask();

    public async Task<ShiftLog?> GetShiftAsync(int shiftId, int userId, CancellationToken cancellationToken = default)
        => await dbContext.ShiftLogs.FirstOrDefaultAsync(x => x.ShiftId == shiftId && x.UserId == userId, cancellationToken);

    public Task SaveChangesAsync(CancellationToken cancellationToken = default)
        => dbContext.SaveChangesAsync(cancellationToken);

    private IQueryable<User> QueryUsers()
        => dbContext.Users
            .Include(x => x.Role)
            .Include(x => x.Store)
            .Include(x => x.RefreshTokens);
}
