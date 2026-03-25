using RetailPOS.Shared.Enums;

namespace RetailPOS.AuthService.Domain.Entities;

public class ShiftLog
{
    public int ShiftId { get; set; }
    public int UserId { get; set; }
    public int StoreId { get; set; }
    public string TerminalId { get; set; } = string.Empty;
    public DateOnly ShiftDate { get; set; }
    public DateTime OpenedAt { get; set; }
    public DateTime? ClosedAt { get; set; }
    public decimal OpeningCash { get; set; }
    public decimal? ClosingCash { get; set; }
    public ShiftStatus Status { get; set; }
    public string? Notes { get; set; }

    public bool IsOpen() => Status is ShiftStatus.Open or ShiftStatus.Active;
}
