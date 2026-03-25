import { HttpClientModule, HTTP_INTERCEPTORS } from "@angular/common/http";
import { NgModule } from "@angular/core";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { BrowserModule } from "@angular/platform-browser";
import { AppRoutingModule } from "./app-routing.module";
import { AppComponent } from "./app.component";
import { JwtInterceptor } from "./core/interceptors/jwt.interceptor";
import { LoginComponent } from "./auth/login/login.component";
import { BillingComponent } from "./pos/billing/billing.component";
import { PaymentModalComponent } from "./pos/payment/payment-modal.component";
import { AdminDashboardComponent } from "./admin/dashboard/admin-dashboard.component";
import { AdminShellComponent } from "./admin/shared/admin-shell.component";
import { ProductsComponent } from "./admin/products/products.component";
import { InventoryComponent } from "./admin/inventory/inventory.component";
import { UsersComponent } from "./admin/users/users.component";
import { ToastContainerComponent } from "./core/components/toast-container.component";

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    BillingComponent,
    PaymentModalComponent,
    AdminDashboardComponent,
    AdminShellComponent,
    ProductsComponent,
    InventoryComponent,
    UsersComponent,
    ToastContainerComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    AppRoutingModule
  ],
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: JwtInterceptor,
      multi: true
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
