namespace RetailPOS.AuthService.Domain.Entities;

public class RefreshToken
{
    public int TokenId { get; set; }
    public int UserId { get; set; }
    public string Token { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; }
    public bool IsRevoked { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public string? IpAddress { get; set; }

    public bool IsValid() => !IsRevoked && ExpiresAt > DateTime.UtcNow;

    public void Revoke() => IsRevoked = true;
}
