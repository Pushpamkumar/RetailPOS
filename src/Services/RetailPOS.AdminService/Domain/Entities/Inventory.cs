using RetailPOS.Shared.Constants;
using RetailPOS.Shared.Exceptions;

namespace RetailPOS.AdminService.Domain.Entities;

public class Inventory
{
    public int InventoryId { get; set; }
    public int StoreId { get; set; }
    public int ProductId { get; set; }
    public decimal StockOnHand { get; set; }
    public decimal ReservedQty { get; set; }
    public int ReorderLevel { get; set; }
    public DateTime LastUpdated { get; set; } = DateTime.UtcNow;
    public DateOnly? LastInwardDate { get; set; }

    public decimal AvailableQty => StockOnHand - ReservedQty;
    // Low-stock alerts are driven by physical stock on hand, not available quantity,
    // so temporary reservations do not trigger replenishment by themselves.
    public bool IsLowStock => StockOnHand <= ReorderLevel;

    public void Reserve(decimal qty)
    {
        if (qty > AvailableQty)
        {
            throw new DomainException(PosErrors.BILL_002);
        }
        ReservedQty += qty;
        LastUpdated = DateTime.UtcNow;
    }

    public void ReleaseReservation(decimal qty)
    {
        ReservedQty = Math.Max(0, ReservedQty - qty);
        LastUpdated = DateTime.UtcNow;
    }

    public void DeductStock(decimal qty)
    {
        // Bill finalization consumes the matching reservation first so the reserved
        // bucket does not keep growing after successful sales.
        ReservedQty = Math.Max(0, ReservedQty - qty);
        StockOnHand -= qty;
        if (StockOnHand < 0)
        {
            throw new DomainException(PosErrors.INV_003);
        }
        LastUpdated = DateTime.UtcNow;
    }

    public void AddStock(decimal qty, DateOnly inwardDate)
    {
        StockOnHand += qty;
        // The inward date is tracked separately from LastUpdated so reports can tell
        // when stock actually arrived versus when metadata last changed.
        LastInwardDate = inwardDate;
        LastUpdated = DateTime.UtcNow;
    }
}
