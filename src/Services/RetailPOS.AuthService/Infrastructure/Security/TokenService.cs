using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.IdentityModel.Tokens;
using RetailPOS.AuthService.Application.Interfaces;
using RetailPOS.AuthService.Domain.Entities;

namespace RetailPOS.AuthService.Infrastructure.Security;

public class TokenService(IConfiguration configuration) : ITokenService
{
    public string GenerateAccessToken(User user, int? shiftId = null)
    {
        using var rsa = RSA.Create();
        rsa.ImportFromPem(File.ReadAllText(configuration["Jwt:PrivateKeyPath"]!));

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.UserId.ToString()),
            new(ClaimTypes.NameIdentifier, user.UserId.ToString()),
            new(JwtRegisteredClaimNames.Email, user.Email ?? string.Empty),
            new(ClaimTypes.Role, user.Role.RoleName),
            new("storeId", user.StoreId.ToString()),
            new("employeeCode", user.EmployeeCode),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        if (shiftId.HasValue)
        {
            claims.Add(new Claim("shiftId", shiftId.Value.ToString()));
        }

        var credentials = new SigningCredentials(new RsaSecurityKey(rsa.ExportParameters(true)), SecurityAlgorithms.RsaSha256);
        var expires = DateTime.UtcNow.AddMinutes(configuration.GetValue("Jwt:AccessTokenExpiryMinutes", 15));

        var token = new JwtSecurityToken(
            issuer: configuration["Jwt:Issuer"],
            audience: configuration["Jwt:Audience"],
            claims: claims,
            expires: expires,
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    public (string raw, string hashed, DateTime expiresAt) GenerateRefreshToken()
    {
        var raw = Convert.ToBase64String(RandomNumberGenerator.GetBytes(64));
        var hashed = HashRefreshToken(raw);
        var expiresAt = DateTime.UtcNow.AddHours(configuration.GetValue("Jwt:RefreshTokenExpiryHours", 8));
        return (raw, hashed, expiresAt);
    }

    public string HashRefreshToken(string rawToken)
        => Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(rawToken)));

    public ClaimsPrincipal GetClaimsFromExpiredToken(string token)
    {
        using var rsa = RSA.Create();
        rsa.ImportFromPem(File.ReadAllText(configuration["Jwt:PublicKeyPath"]!));

        var validationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateIssuerSigningKey = true,
            ValidateLifetime = false,
            ValidIssuer = configuration["Jwt:Issuer"],
            ValidAudience = configuration["Jwt:Audience"],
            IssuerSigningKey = new RsaSecurityKey(rsa.ExportParameters(false))
        };

        return new JwtSecurityTokenHandler().ValidateToken(token, validationParameters, out _);
    }
}
