using System.Security.Claims;
using RetailPOS.AuthService.Domain.Entities;

namespace RetailPOS.AuthService.Application.Interfaces;

public interface ITokenService
{
    string GenerateAccessToken(User user, int? shiftId = null);
    (string raw, string hashed, DateTime expiresAt) GenerateRefreshToken();
    string HashRefreshToken(string rawToken);
    ClaimsPrincipal GetClaimsFromExpiredToken(string token);
}
