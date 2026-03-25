import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { LandingComponent } from "./auth/landing/landing.component";
import { LoginComponent } from "./auth/login/login.component";
import { SignupComponent } from "./auth/signup/signup.component";
import { ForgotPasswordComponent } from "./auth/forgot-password/forgot-password.component";
import { BillingComponent } from "./pos/billing/billing.component";
import { BillHistoryComponent } from "./pos/history/bill-history.component";
import { ReturnsComponent } from "./pos/returns/returns.component";
import { AdminDashboardComponent } from "./admin/dashboard/admin-dashboard.component";
import { AdminShellComponent } from "./admin/shared/admin-shell.component";
import { ProductsComponent } from "./admin/products/products.component";
import { InventoryComponent } from "./admin/inventory/inventory.component";
import { UsersComponent } from "./admin/users/users.component";
import { ReportsComponent } from "./admin/reports/reports.component";
import { AuthGuard } from "./core/guards/auth.guard";
import { RoleGuard } from "./core/guards/role.guard";

const routes: Routes = [
  { path: "", component: LandingComponent },
  { path: "landing", component: LandingComponent },
  { path: "auth/login", component: LoginComponent },
  { path: "auth/signup", component: SignupComponent },
  { path: "auth/forgot-password", component: ForgotPasswordComponent },
  {
    path: "pos/billing",
    component: BillingComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ["Cashier", "StoreManager", "Admin"] }
  },
  {
    path: "pos/history",
    component: BillHistoryComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ["Cashier", "StoreManager", "Admin"] }
  },
  {
    path: "pos/returns",
    component: ReturnsComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ["Cashier", "StoreManager", "Admin"] }
  },
  {
    path: "admin",
    component: AdminShellComponent,
    canActivate: [AuthGuard],
    children: [
      {
        path: "dashboard",
        component: AdminDashboardComponent,
        canActivate: [RoleGuard],
        data: { roles: ["StoreManager", "Admin", "RegionalManager"] }
      },
      {
        path: "products",
        component: ProductsComponent,
        canActivate: [RoleGuard],
        data: { roles: ["StoreManager", "Admin"] }
      },
      {
        path: "inventory",
        component: InventoryComponent,
        canActivate: [RoleGuard],
        data: { roles: ["StoreManager", "Admin", "InventoryClerk"] }
      },
      {
        path: "users",
        component: UsersComponent,
        canActivate: [RoleGuard],
        data: { roles: ["Admin"] }
      },
      {
        path: "reports",
        component: ReportsComponent,
        canActivate: [RoleGuard],
        data: { roles: ["StoreManager", "Admin", "RegionalManager"] }
      }
    ]
  },
  { path: "**", redirectTo: "landing" }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
