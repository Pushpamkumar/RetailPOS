import { Component, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { AuthService } from "../../core/services/auth.service";

type ShellRole = "Cashier" | "StoreManager" | "Admin" | "InventoryClerk" | "RegionalManager";

interface ShellNavItem {
  label: string;
  route: string;
  roles: ShellRole[];
}

@Component({
  selector: "app-admin-shell",
  template: `
    <div class="page-shell">
      <div class="admin-hero panel">
        <div class="auth-copy">
          <p class="eyebrow">Store Operations Console</p>
          <h1 class="hero-title">Retail POS Workspace</h1>
          <div class="hero-subtitle">
            Store {{ authService.getStoreId() }} - {{ authService.getFullName() || "Operator" }} ({{ authService.getRole() }})
          </div>
          <div class="auth-badges">
            <span class="chip success">Store scoped</span>
            <span class="chip">Role-aware navigation</span>
            <span class="chip">Fast POS & inventory</span>
          </div>
        </div>

        <div class="nav-cluster">
          <a
            *ngFor="let item of navItems"
            [routerLink]="item.route"
            routerLinkActive="is-active"
          class="nav-pill"
          >
            {{ item.label }}
          </a>
          <a class="nav-pill accent" routerLink="/pos/billing" *ngIf="authService.getRole() === 'Cashier' || authService.getRole() === 'StoreManager' || authService.getRole() === 'Admin'">Open POS</a>
          <button class="btn danger" type="button" (click)="authService.logout()">Logout</button>
        </div>
      </div>

      <router-outlet></router-outlet>
    </div>
  `
})
export class AdminShellComponent implements OnInit {
  private readonly navConfig: ShellNavItem[] = [
    { label: "Dashboard", route: "/admin/dashboard", roles: ["StoreManager", "Admin", "RegionalManager"] },
    { label: "Products", route: "/admin/products", roles: ["StoreManager", "Admin"] },
    { label: "Inventory", route: "/admin/inventory", roles: ["StoreManager", "Admin", "InventoryClerk"] },
    { label: "Reports", route: "/admin/reports", roles: ["StoreManager", "Admin", "RegionalManager"] },
    { label: "Users", route: "/admin/users", roles: ["Admin"] },
    { label: "Onboarding", route: "/auth/signup", roles: ["Admin"] },
    { label: "POS", route: "/pos/billing", roles: ["Cashier", "StoreManager", "Admin"] }
  ];

  constructor(public authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    if (this.router.url === "/admin" || this.router.url === "/admin/") {
      this.router.navigateByUrl(this.authService.getLandingRoute());
    }
  }

  get navItems(): ShellNavItem[] {
    const role = this.authService.getRole() as ShellRole | null;
    if (!role) {
      return [];
    }
    return this.navConfig.filter((item) => item.roles.includes(role));
  }
}
