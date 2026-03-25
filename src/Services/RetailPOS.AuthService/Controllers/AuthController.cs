using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RetailPOS.AuthService.Application.DTOs;
using RetailPOS.AuthService.Application.Interfaces;
using RetailPOS.Shared.Api;
using RetailPOS.Shared.Security;

namespace RetailPOS.AuthService.Controllers;

[ApiController]
[Route("auth")]
public class AuthController(IAuthService authService) : ControllerBase
{
    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<ActionResult<LoginResponseDto>> Login([FromBody] LoginRequestDto dto, CancellationToken cancellationToken)
        => Ok(await authService.LoginAsync(dto, HttpContext.Connection.RemoteIpAddress?.ToString(), cancellationToken));

    [HttpPost("register")]
    [Authorize(Roles = UserRoles.Admin)]
    public async Task<ActionResult<UserDto>> Register([FromBody] RegisterUserDto dto, CancellationToken cancellationToken)
        => Ok(await authService.RegisterAsync(dto, cancellationToken));

    [HttpPost("refresh")]
    [AllowAnonymous]
    public async Task<ActionResult<LoginResponseDto>> Refresh([FromBody] RefreshTokenRequestDto dto, CancellationToken cancellationToken)
        => Ok(await authService.RefreshTokenAsync(dto.RefreshToken, cancellationToken));

    [HttpPost("logout")]
    [Authorize]
    public async Task<ActionResult<ApiSuccessResponse>> Logout([FromBody] RefreshTokenRequestDto dto, CancellationToken cancellationToken)
    {
        await authService.LogoutAsync(dto.RefreshToken, cancellationToken);
        return Ok(new ApiSuccessResponse());
    }

    [HttpPost("start-shift")]
    [Authorize(Roles = $"{UserRoles.Cashier},{UserRoles.StoreManager},{UserRoles.Admin}")]
    public async Task<ActionResult<object>> StartShift([FromBody] StartShiftDto dto, CancellationToken cancellationToken)
    {
        var shiftId = await authService.StartShiftAsync(User.GetUserId(), dto, cancellationToken);
        return Ok(new { shiftId });
    }

    [HttpPost("end-shift")]
    [Authorize(Roles = $"{UserRoles.Cashier},{UserRoles.StoreManager},{UserRoles.Admin}")]
    public async Task<ActionResult<ShiftSummaryDto>> EndShift([FromBody] EndShiftDto dto, CancellationToken cancellationToken)
        => Ok(await authService.EndShiftAsync(User.GetUserId(), dto, cancellationToken));

    [HttpGet("users")]
    [Authorize(Roles = UserRoles.Admin)]
    public async Task<ActionResult> GetUsers([FromQuery] UserFilterDto filter, CancellationToken cancellationToken)
        => Ok(await authService.GetUsersAsync(filter, cancellationToken));

    [HttpGet("users/{id:int}")]
    [Authorize(Roles = UserRoles.Admin)]
    public async Task<ActionResult<UserDto>> GetUser([FromRoute] int id, CancellationToken cancellationToken)
        => Ok(await authService.GetUserAsync(id, cancellationToken));

    [HttpPut("users/{id:int}")]
    [Authorize(Roles = UserRoles.Admin)]
    public async Task<ActionResult<UserDto>> UpdateUser([FromRoute] int id, [FromBody] UpdateUserDto dto, CancellationToken cancellationToken)
        => Ok(await authService.UpdateUserAsync(id, dto, cancellationToken));

    [HttpPost("users/{id:int}/deactivate")]
    [Authorize(Roles = UserRoles.Admin)]
    public async Task<ActionResult<ApiSuccessResponse>> Deactivate([FromRoute] int id, CancellationToken cancellationToken)
    {
        await authService.DeactivateUserAsync(id, cancellationToken);
        return Ok(new ApiSuccessResponse());
    }
}
