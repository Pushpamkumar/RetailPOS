namespace RetailPOS.AdminService.Domain.Entities;

public class AlertLog
{
    public int AlertId { get; set; }
    public int StoreId { get; set; }
    public string AlertType { get; set; } = string.Empty;
    public int? ProductId { get; set; }
    public string Message { get; set; } = string.Empty;
    public string Severity { get; set; } = "INFO";
    public bool IsResolved { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ResolvedAt { get; set; }
    public int? ResolvedBy { get; set; }
}
