using RetailPOS.AuthService.Application.DTOs;
using RetailPOS.Shared.Common;

namespace RetailPOS.AuthService.Application.Interfaces;

public interface IAuthService
{
    Task<LoginResponseDto> LoginAsync(LoginRequestDto dto, string? ipAddress = null, CancellationToken cancellationToken = default);
    Task<UserDto> RegisterAsync(RegisterUserDto dto, CancellationToken cancellationToken = default);
    Task<LoginResponseDto> RefreshTokenAsync(string token, CancellationToken cancellationToken = default);
    Task LogoutAsync(string refreshToken, CancellationToken cancellationToken = default);
    Task<int> StartShiftAsync(int userId, StartShiftDto dto, CancellationToken cancellationToken = default);
    Task<ShiftSummaryDto> EndShiftAsync(int userId, EndShiftDto dto, CancellationToken cancellationToken = default);
    Task<PagedResult<UserDto>> GetUsersAsync(UserFilterDto filter, CancellationToken cancellationToken = default);
    Task<UserDto> GetUserAsync(int userId, CancellationToken cancellationToken = default);
    Task<UserDto> UpdateUserAsync(int userId, UpdateUserDto dto, CancellationToken cancellationToken = default);
    Task DeactivateUserAsync(int userId, CancellationToken cancellationToken = default);
}
