using RetailPOS.AuthService.Application.DTOs;
using RetailPOS.AuthService.Application.Interfaces;
using RetailPOS.AuthService.Domain.Entities;
using RetailPOS.Shared.Common;
using RetailPOS.Shared.Constants;
using RetailPOS.Shared.Exceptions;

namespace RetailPOS.AuthService.Application.Services;

public class AuthService(IUserRepository userRepository, ITokenService tokenService) : IAuthService
{
    public async Task<LoginResponseDto> LoginAsync(LoginRequestDto dto, string? ipAddress = null, CancellationToken cancellationToken = default)
    {
        var normalized = dto.Username.Trim();
        // Store staff can sign in with email, mobile, or employee code; the lookup
        // order keeps the login field flexible without separate endpoints.
        var user = normalized.Contains('@')
            ? await userRepository.GetByEmailAsync(normalized, cancellationToken)
            : await userRepository.GetByMobileAsync(normalized, cancellationToken) ?? await userRepository.GetByEmployeeCodeAsync(normalized, cancellationToken);

        if (user is null)
        {
            throw new PosApiException(PosErrors.AUTH_001, StatusCodes.Status401Unauthorized, "Invalid username or password");
        }

        if (!user.IsActive)
        {
            throw new PosApiException(PosErrors.AUTH_002, StatusCodes.Status401Unauthorized, "Account is inactive or suspended");
        }

        if (!BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash))
        {
            throw new PosApiException(PosErrors.AUTH_001, StatusCodes.Status401Unauthorized, "Invalid username or password");
        }

        user.RecordLogin();

        var refresh = tokenService.GenerateRefreshToken();
        user.AddRefreshToken(new RefreshToken
        {
            // Persist only the hashed refresh token so database exposure does not leak
            // bearer credentials that are still valid on the client.
            Token = refresh.hashed,
            ExpiresAt = refresh.expiresAt,
            IpAddress = ipAddress
        });

        await userRepository.UpdateAsync(user, cancellationToken);
        await userRepository.SaveChangesAsync(cancellationToken);

        return new LoginResponseDto(
            tokenService.GenerateAccessToken(user),
            refresh.raw,
            user.Role.RoleName,
            user.UserId,
            user.StoreId,
            user.FullName,
            DateTime.UtcNow.AddMinutes(15));
    }

    public async Task<UserDto> RegisterAsync(RegisterUserDto dto, CancellationToken cancellationToken = default)
    {
        var exists = await userRepository.ExistsAsync(dto.Email, dto.Mobile, dto.EmployeeCode, cancellationToken);
        if (exists)
        {
            throw new PosApiException(PosErrors.AUTH_005, StatusCodes.Status400BadRequest, "Duplicate email or mobile already registered");
        }

        var role = await userRepository.GetRoleByIdAsync(dto.RoleId, cancellationToken);
        if (role is null || !role.IsActive)
        {
            throw new PosApiException(PosErrors.AUTH_003, StatusCodes.Status403Forbidden, "Insufficient role for this operation");
        }

        var passwordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password, workFactor: 12);
        var user = User.Create(dto.StoreId, dto.EmployeeCode, dto.FullName, dto.Email, dto.Mobile, passwordHash, dto.RoleId);

        await userRepository.AddAsync(user, cancellationToken);
        await userRepository.SaveChangesAsync(cancellationToken);

        var saved = await userRepository.GetByEmployeeCodeAsync(dto.EmployeeCode, cancellationToken) ?? user;
        return ToDto(saved);
    }

    public async Task<LoginResponseDto> RefreshTokenAsync(string token, CancellationToken cancellationToken = default)
    {
        var hash = tokenService.HashRefreshToken(token);
        var user = await userRepository.GetByRefreshTokenAsync(hash, cancellationToken);
        if (user is null)
        {
            throw new PosApiException(PosErrors.AUTH_004, StatusCodes.Status401Unauthorized, "JWT token expired or invalid");
        }

        var existing = user.RefreshTokens.FirstOrDefault(x => x.Token == hash && x.IsValid());
        if (existing is null)
        {
            throw new PosApiException(PosErrors.AUTH_004, StatusCodes.Status401Unauthorized, "JWT token expired or invalid");
        }

        existing.Revoke();
        var replacement = tokenService.GenerateRefreshToken();
        user.AddRefreshToken(new RefreshToken
        {
            Token = replacement.hashed,
            ExpiresAt = replacement.expiresAt
        });

        await userRepository.UpdateAsync(user, cancellationToken);
        await userRepository.SaveChangesAsync(cancellationToken);

        return new LoginResponseDto(
            tokenService.GenerateAccessToken(user),
            replacement.raw,
            user.Role.RoleName,
            user.UserId,
            user.StoreId,
            user.FullName,
            DateTime.UtcNow.AddMinutes(15));
    }

    public async Task LogoutAsync(string refreshToken, CancellationToken cancellationToken = default)
    {
        var hash = tokenService.HashRefreshToken(refreshToken);
        var user = await userRepository.GetByRefreshTokenAsync(hash, cancellationToken);
        if (user is null)
        {
            return;
        }

        user.RefreshTokens.FirstOrDefault(x => x.Token == hash)?.Revoke();
        await userRepository.UpdateAsync(user, cancellationToken);
        await userRepository.SaveChangesAsync(cancellationToken);
    }

    public async Task<int> StartShiftAsync(int userId, StartShiftDto dto, CancellationToken cancellationToken = default)
    {
        var existing = await userRepository.GetActiveShiftAsync(userId, dto.StoreId, cancellationToken);
        if (existing is not null)
        {
            // Reuse the open shift instead of creating duplicates when the client
            // retries or refreshes after a successful start-shift call.
            return existing.ShiftId;
        }

        var shift = new ShiftLog
        {
            UserId = userId,
            StoreId = dto.StoreId,
            TerminalId = dto.TerminalId,
            ShiftDate = DateOnly.FromDateTime(DateTime.UtcNow),
            OpenedAt = DateTime.UtcNow,
            OpeningCash = dto.OpeningCash,
            Status = Shared.Enums.ShiftStatus.Open
        };

        await userRepository.AddShiftAsync(shift, cancellationToken);
        await userRepository.SaveChangesAsync(cancellationToken);
        return shift.ShiftId;
    }

    public async Task<ShiftSummaryDto> EndShiftAsync(int userId, EndShiftDto dto, CancellationToken cancellationToken = default)
    {
        var shift = await userRepository.GetShiftAsync(dto.ShiftId, userId, cancellationToken)
            ?? throw new PosApiException(PosErrors.AUTH_003, StatusCodes.Status403Forbidden, "Insufficient role for this operation");

        shift.ClosedAt = DateTime.UtcNow;
        shift.ClosingCash = dto.ClosingCash;
        shift.Notes = dto.Notes;
        shift.Status = Shared.Enums.ShiftStatus.Closed;

        await userRepository.SaveChangesAsync(cancellationToken);

        return new ShiftSummaryDto(
            shift.ShiftId,
            shift.OpeningCash,
            shift.ClosingCash ?? 0,
            shift.OpenedAt,
            shift.ClosedAt ?? DateTime.UtcNow,
            shift.Status.ToString());
    }

    public async Task<PagedResult<UserDto>> GetUsersAsync(UserFilterDto filter, CancellationToken cancellationToken = default)
    {
        var result = await userRepository.GetPagedAsync(filter, cancellationToken);
        return new PagedResult<UserDto>(
            result.Items.Select(ToDto).ToArray(),
            result.Page,
            result.PageSize,
            result.TotalCount);
    }

    public async Task<UserDto> GetUserAsync(int userId, CancellationToken cancellationToken = default)
    {
        var user = await userRepository.GetByIdAsync(userId, cancellationToken)
            ?? throw new PosApiException(PosErrors.AUTH_001, StatusCodes.Status404NotFound, "User not found");

        return ToDto(user);
    }

    public async Task<UserDto> UpdateUserAsync(int userId, UpdateUserDto dto, CancellationToken cancellationToken = default)
    {
        var user = await userRepository.GetByIdAsync(userId, cancellationToken)
            ?? throw new PosApiException(PosErrors.AUTH_001, StatusCodes.Status404NotFound, "User not found");

        user.UpdateProfile(dto.FullName, dto.Email, dto.Mobile, dto.RoleId, dto.IsActive);
        await userRepository.UpdateAsync(user, cancellationToken);
        await userRepository.SaveChangesAsync(cancellationToken);

        var updated = await userRepository.GetByIdAsync(userId, cancellationToken) ?? user;
        return ToDto(updated);
    }

    public async Task DeactivateUserAsync(int userId, CancellationToken cancellationToken = default)
    {
        var user = await userRepository.GetByIdAsync(userId, cancellationToken)
            ?? throw new PosApiException(PosErrors.AUTH_001, StatusCodes.Status404NotFound, "User not found");

        user.Deactivate();
        await userRepository.UpdateAsync(user, cancellationToken);
        await userRepository.SaveChangesAsync(cancellationToken);
    }

    private static UserDto ToDto(User user)
        => new(
            user.UserId,
            user.FullName,
            user.Email,
            user.Mobile,
            user.EmployeeCode,
            user.Role.RoleName,
            user.StoreId,
            user.IsActive,
            user.CreatedAt);
}
