using RetailPOS.Shared.Common;

namespace RetailPOS.AuthService.Application.DTOs;

public record LoginRequestDto(string Username, string Password);

public record LoginResponseDto(
    string AccessToken,
    string RefreshToken,
    string Role,
    int UserId,
    int StoreId,
    string FullName,
    DateTime ExpiresAt);

public record RegisterUserDto(
    int StoreId,
    string EmployeeCode,
    string FullName,
    string? Email,
    string? Mobile,
    string Password,
    string ConfirmPassword,
    int RoleId);

public record StartShiftDto(int StoreId, string TerminalId, decimal OpeningCash);

public record EndShiftDto(int ShiftId, decimal ClosingCash, string? Notes);

public record RefreshTokenRequestDto(string RefreshToken);

public record UserDto(
    int UserId,
    string FullName,
    string? Email,
    string? Mobile,
    string EmployeeCode,
    string RoleName,
    int StoreId,
    bool IsActive,
    DateTime CreatedAt);

public record UserFilterDto(
    int? StoreId,
    string? Role,
    string? Search,
    int Page = 1,
    int PageSize = 20);

public record UpdateUserDto(
    string FullName,
    string? Email,
    string? Mobile,
    int RoleId,
    bool IsActive);

public record ShiftSummaryDto(
    int ShiftId,
    decimal OpeningCash,
    decimal ClosingCash,
    DateTime OpenedAt,
    DateTime ClosedAt,
    string Status);
