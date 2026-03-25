using RetailPOS.BillingService.Application.DTOs;
using RetailPOS.BillingService.Domain.Entities;

namespace RetailPOS.BillingService.Application.Interfaces;

public interface IReceiptBuilder
{
    BillReceiptDto Build(Bill bill);
}
