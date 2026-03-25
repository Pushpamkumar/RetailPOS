using RetailPOS.CatalogService.Application.DTOs;

namespace RetailPOS.CatalogService.Application.Interfaces;

public interface IPromotionService
{
    Task<IReadOnlyCollection<PromotionDto>> GetActivePromotionsAsync(CancellationToken cancellationToken = default);
    Task<AppliedPromoDto?> ApplyBestPromotionAsync(int productId, decimal price, DateOnly today, CancellationToken cancellationToken = default);
}
