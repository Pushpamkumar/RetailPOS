using RetailPOS.CatalogService.Application.DTOs;
using RetailPOS.CatalogService.Application.Interfaces;

namespace RetailPOS.CatalogService.Application.Services;

public class PromotionService(IProductRepository repository) : IPromotionService
{
    public async Task<IReadOnlyCollection<PromotionDto>> GetActivePromotionsAsync(CancellationToken cancellationToken = default)
        => (await repository.GetActivePromotionsAsync(cancellationToken))
            .Select(x => new PromotionDto(x.PromotionId, x.PromoCode, x.Name, x.DiscountType, x.DiscountValue, x.Scope, x.ScopeRefId))
            .ToArray();

    public async Task<AppliedPromoDto?> ApplyBestPromotionAsync(int productId, decimal price, DateOnly today, CancellationToken cancellationToken = default)
    {
        var promotions = await repository.GetActivePromotionsAsync(cancellationToken);
        var promo = promotions
            .Where(x => x.IsValid(today) && (x.Scope == "BILL" || (x.Scope == "PRODUCT" && x.ScopeRefId == productId)))
            .OrderByDescending(x => x.ApplyDiscount(price))
            .FirstOrDefault();

        if (promo is null)
        {
            return null;
        }

        var discount = promo.ApplyDiscount(price);
        return new AppliedPromoDto(promo.PromotionId, promo.PromoCode, promo.Name, discount, price - discount);
    }
}
