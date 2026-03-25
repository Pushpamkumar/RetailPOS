using RetailPOS.AuthService.Application.DTOs;
using RetailPOS.AuthService.Domain.Entities;
using RetailPOS.Shared.Common;

namespace RetailPOS.AuthService.Application.Interfaces;

public interface IUserRepository
{
    Task<User?> GetByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<User?> GetByEmailAsync(string email, CancellationToken cancellationToken = default);
    Task<User?> GetByMobileAsync(string mobile, CancellationToken cancellationToken = default);
    Task<User?> GetByEmployeeCodeAsync(string code, CancellationToken cancellationToken = default);
    Task<User?> GetByRefreshTokenAsync(string tokenHash, CancellationToken cancellationToken = default);
    Task<bool> ExistsAsync(string? email, string? mobile, string employeeCode, CancellationToken cancellationToken = default);
    Task AddAsync(User user, CancellationToken cancellationToken = default);
    Task UpdateAsync(User user, CancellationToken cancellationToken = default);
    Task<PagedResult<User>> GetPagedAsync(UserFilterDto filter, CancellationToken cancellationToken = default);
    Task<Role?> GetRoleByIdAsync(int roleId, CancellationToken cancellationToken = default);
    Task<ShiftLog?> GetActiveShiftAsync(int userId, int storeId, CancellationToken cancellationToken = default);
    Task AddShiftAsync(ShiftLog shiftLog, CancellationToken cancellationToken = default);
    Task<ShiftLog?> GetShiftAsync(int shiftId, int userId, CancellationToken cancellationToken = default);
    Task SaveChangesAsync(CancellationToken cancellationToken = default);
}
