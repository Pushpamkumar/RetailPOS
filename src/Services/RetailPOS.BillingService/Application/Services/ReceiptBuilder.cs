using System.Text;
using RetailPOS.BillingService.Application.DTOs;
using RetailPOS.BillingService.Application.Interfaces;
using RetailPOS.BillingService.Domain.Entities;

namespace RetailPOS.BillingService.Application.Services;

public class ReceiptBuilder : IReceiptBuilder
{
    public BillReceiptDto Build(Bill bill)
    {
        var html = new StringBuilder();
        html.AppendLine("<div class='receipt'>");
        html.AppendLine($"<h2>Store {bill.StoreId}</h2>");
        html.AppendLine($"<p>Bill No: {bill.BillNumber}</p>");
        html.AppendLine($"<p>Date: {bill.FinalizedAt:dd-MMM-yyyy HH:mm}</p>");
        html.AppendLine("<table>");
        foreach (var item in bill.Items)
        {
            html.AppendLine($"<tr><td>{item.ProductName}</td><td>{item.Qty} x {item.UnitPrice:N2}</td><td>{item.LineTotal:N2}</td></tr>");
        }
        html.AppendLine("</table>");
        html.AppendLine($"<p><strong>Net: {bill.NetAmount:N2}</strong></p>");
        html.AppendLine("</div>");
        return new BillReceiptDto(bill.BillId, bill.BillNumber!, bill.NetAmount, bill.FinalizedAt ?? DateTime.UtcNow, html.ToString());
    }
}
