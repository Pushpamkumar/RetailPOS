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
        LastInwardDate = inwardDate;
        LastUpdated = DateTime.UtcNow;
    }
}
