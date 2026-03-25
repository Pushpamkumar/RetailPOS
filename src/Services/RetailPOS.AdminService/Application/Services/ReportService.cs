using RetailPOS.AdminService.Application.DTOs;
using RetailPOS.AdminService.Application.Interfaces;

namespace RetailPOS.AdminService.Application.Services;

public class ReportService(IInventoryRepository repository) : IReportService
{
    public async Task<DashboardKpiDto> GetDashboardKPIsAsync(int storeId, DateOnly date, CancellationToken cancellationToken = default)
    {
        var lowStock = await repository.GetLowStockAsync(storeId, cancellationToken);
        return new DashboardKpiDto(0, 0, 0, 0, 0, lowStock.Count, 0, null, 0);
    }

    public Task<SalesSummaryDto> GetSalesSummaryAsync(ReportFilterDto dto, CancellationToken cancellationToken = default)
        => Task.FromResult(new SalesSummaryDto(0, 0, 0, 0, 0, 0));
}
