import { Component, OnInit } from "@angular/core";
import { AdminApiService, DashboardKpi } from "../services/admin-api.service";
import { AuthService } from "../../core/services/auth.service";

@Component({
  selector: "app-admin-dashboard",
  template: `
    <div class="section-head">
      <div>
        <p class="eyebrow">Performance Snapshot</p>
        <h2 class="section-title">Dashboard</h2>
      </div>
      <p class="section-caption">Live KPIs are pulled from the backend and reflect the current store state.</p>
    </div>

    <div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(220px,1fr));">
      <div class="stat-card panel">
        <span class="stat-label">Today Revenue</span>
        <strong class="stat-value">{{ kpi?.todayRevenue ?? 0 | number:'1.2-2' }}</strong>
      </div>
      <div class="stat-card panel">
        <span class="stat-label">Transactions</span>
        <strong class="stat-value">{{ kpi?.transactionCount ?? 0 }}</strong>
      </div>
      <div class="stat-card panel">
        <span class="stat-label">Low Stock Alerts</span>
        <strong class="stat-value">{{ kpi?.lowStockItems ?? 0 }}</strong>
      </div>
      <div class="stat-card panel">
        <span class="stat-label">Average Bill</span>
        <strong class="stat-value">{{ kpi?.avgBillValue ?? 0 | number:'1.2-2' }}</strong>
      </div>
      <div class="stat-card panel">
        <span class="stat-label">Cash Collected</span>
        <strong class="stat-value">{{ kpi?.cashCollected ?? 0 | number:'1.2-2' }}</strong>
      </div>
      <div class="stat-card panel">
        <span class="stat-label">Top Product</span>
        <strong class="stat-value text-left">{{ kpi?.topProductName || "No data yet" }}</strong>
      </div>
    </div>
  `
})
export class AdminDashboardComponent implements OnInit {
  kpi: DashboardKpi | null = null;

  constructor(private adminApi: AdminApiService, private authService: AuthService) {}

  ngOnInit(): void {
    this.adminApi.getDashboard(this.authService.getStoreId()).subscribe((res) => (this.kpi = res));
  }
}
