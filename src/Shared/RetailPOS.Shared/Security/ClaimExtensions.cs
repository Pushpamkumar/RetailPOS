using System.Security.Claims;

namespace RetailPOS.Shared.Security;

public static class ClaimExtensions
{
    public static int GetUserId(this ClaimsPrincipal principal)
        => int.TryParse(principal.FindFirstValue(ClaimTypes.NameIdentifier) ?? principal.FindFirstValue("sub"), out var userId)
            ? userId
            : 0;

    public static int GetStoreId(this ClaimsPrincipal principal)
        => int.TryParse(principal.FindFirstValue("storeId"), out var storeId)
            ? storeId
            : 0;

    public static int? GetShiftId(this ClaimsPrincipal principal)
        => int.TryParse(principal.FindFirstValue("shiftId"), out var shiftId)
            ? shiftId
            : null;
}
