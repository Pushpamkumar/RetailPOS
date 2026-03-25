namespace RetailPOS.AuthService.Domain.Entities;

public class Store
{
    public int StoreId { get; set; }
    public string StoreCode { get; set; } = string.Empty;
    public string StoreName { get; set; } = string.Empty;
    public string? Address { get; set; }
    public string? Location { get; set; }
    public string? Phone { get; set; }
    public string? GSTNumber { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
