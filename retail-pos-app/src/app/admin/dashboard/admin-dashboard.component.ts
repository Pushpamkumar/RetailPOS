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

    <div class="panel dashboard-hero">
      <div class="auth-copy">
        <p class="eyebrow">Store {{ authService.getStoreId() }}</p>
        <h3 class="hero-title">Operator {{ authService.getFullName() || "Dashboard" }}</h3>
        <div class="hero-subtitle">Role {{ authService.getRole() }} - live operations, stock pressure, and billing KPIs.</div>
      </div>

      <div class="nav-cluster">
        <span class="chip success">Revenue {{ kpi?.todayRevenue ?? 0 | number:'1.2-2' }}</span>
        <span class="chip">Transactions {{ kpi?.transactionCount ?? 0 }}</span>
        <span class="chip warn">Low stock {{ kpi?.lowStockItems ?? 0 }}</span>
      </div>
    </div>

    <div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(220px,1fr));">
      <div class="stat-card panel metric-card">
        <span class="stat-label">Today Revenue</span>
        <strong class="stat-value">{{ kpi?.todayRevenue ?? 0 | number:'1.2-2' }}</strong>
        <span class="muted">Sales booked today</span>
      </div>
      <div class="stat-card panel metric-card">
        <span class="stat-label">Transactions</span>
        <strong class="stat-value">{{ kpi?.transactionCount ?? 0 }}</strong>
        <span class="muted">Bills completed</span>
      </div>
      <div class="stat-card panel metric-card">
        <span class="stat-label">Low Stock Alerts</span>
        <strong class="stat-value">{{ kpi?.lowStockItems ?? 0 }}</strong>
        <span class="muted">Needs attention</span>
      </div>
      <div class="stat-card panel metric-card">
        <span class="stat-label">Average Bill</span>
        <strong class="stat-value">{{ kpi?.avgBillValue ?? 0 | number:'1.2-2' }}</strong>
        <span class="muted">Basket quality</span>
      </div>
      <div class="stat-card panel metric-card">
        <span class="stat-label">Cash Collected</span>
        <strong class="stat-value">{{ kpi?.cashCollected ?? 0 | number:'1.2-2' }}</strong>
        <span class="muted">Tendered in cash</span>
      </div>
      <div class="stat-card panel metric-card">
        <span class="stat-label">Top Product</span>
        <strong class="stat-value text-left">{{ kpi?.topProductName || "No data yet" }}</strong>
        <span class="muted">Highest revenue item</span>
      </div>
    </div>
  `
})
export class AdminDashboardComponent implements OnInit {
  kpi: DashboardKpi | null = null;

  constructor(private adminApi: AdminApiService, public authService: AuthService) {}

  ngOnInit(): void {
    this.adminApi.getDashboard(this.authService.getStoreId()).subscribe((res) => (this.kpi = res));
  }
}
