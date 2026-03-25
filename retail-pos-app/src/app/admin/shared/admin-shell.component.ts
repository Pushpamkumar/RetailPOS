import { Component } from "@angular/core";
import { AuthService } from "../../core/services/auth.service";

@Component({
  selector: "app-admin-shell",
  template: `
    <div class="page-shell">
      <div class="admin-hero panel">
        <div>
          <p class="eyebrow">Store Operations Console</p>
          <h1 class="hero-title">Retail POS Admin</h1>
          <div class="hero-subtitle">Store {{ authService.getStoreId() }} - Manage products, inventory, users, and live billing from one place.</div>
        </div>

        <div class="nav-cluster">
          <a routerLink="/admin/dashboard" routerLinkActive="is-active" class="nav-pill">Dashboard</a>
          <a routerLink="/admin/products" routerLinkActive="is-active" class="nav-pill">Products</a>
          <a routerLink="/admin/inventory" routerLinkActive="is-active" class="nav-pill">Inventory</a>
          <a routerLink="/admin/users" routerLinkActive="is-active" class="nav-pill">Users</a>
          <a routerLink="/pos/billing" class="nav-pill accent">POS</a>
          <button class="btn danger" type="button" (click)="authService.logout()">Logout</button>
        </div>
      </div>

      <router-outlet></router-outlet>
    </div>
  `
})
export class AdminShellComponent {
  constructor(public authService: AuthService) {}
}
