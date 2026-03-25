using RetailPOS.AdminService.Application.DTOs;

namespace RetailPOS.AdminService.Application.Interfaces;

public interface IReportService
{
    Task<DashboardKpiDto> GetDashboardKPIsAsync(int storeId, DateOnly date, CancellationToken cancellationToken = default);
    Task<SalesSummaryDto> GetSalesSummaryAsync(ReportFilterDto dto, CancellationToken cancellationToken = default);
}
