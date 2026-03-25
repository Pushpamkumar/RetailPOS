import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { LoginComponent } from "./auth/login/login.component";
import { BillingComponent } from "./pos/billing/billing.component";
import { AdminDashboardComponent } from "./admin/dashboard/admin-dashboard.component";
import { AdminShellComponent } from "./admin/shared/admin-shell.component";
import { ProductsComponent } from "./admin/products/products.component";
import { InventoryComponent } from "./admin/inventory/inventory.component";
import { UsersComponent } from "./admin/users/users.component";
import { AuthGuard } from "./core/guards/auth.guard";
import { RoleGuard } from "./core/guards/role.guard";

const routes: Routes = [
  { path: "", redirectTo: "auth/login", pathMatch: "full" },
  { path: "auth/login", component: LoginComponent },
  {
    path: "pos/billing",
    component: BillingComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ["Cashier", "StoreManager", "Admin"] }
  },
  {
    path: "admin",
    component: AdminShellComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ["StoreManager", "Admin", "RegionalManager"] },
    children: [
      { path: "", redirectTo: "dashboard", pathMatch: "full" },
      { path: "dashboard", component: AdminDashboardComponent },
      { path: "products", component: ProductsComponent },
      { path: "inventory", component: InventoryComponent },
      { path: "users", component: UsersComponent }
    ]
  },
  { path: "**", redirectTo: "auth/login" }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
