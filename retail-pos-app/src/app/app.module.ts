import { HttpClientModule, HTTP_INTERCEPTORS } from "@angular/common/http";
import { NgModule } from "@angular/core";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { BrowserModule } from "@angular/platform-browser";
import { AppRoutingModule } from "./app-routing.module";
import { AppComponent } from "./app.component";
import { JwtInterceptor } from "./core/interceptors/jwt.interceptor";
import { LandingComponent } from "./auth/landing/landing.component";
import { LoginComponent } from "./auth/login/login.component";
import { SignupComponent } from "./auth/signup/signup.component";
import { ForgotPasswordComponent } from "./auth/forgot-password/forgot-password.component";
import { BillingComponent } from "./pos/billing/billing.component";
import { BillHistoryComponent } from "./pos/history/bill-history.component";
import { PaymentModalComponent } from "./pos/payment/payment-modal.component";
import { ReturnsComponent } from "./pos/returns/returns.component";
import { AdminDashboardComponent } from "./admin/dashboard/admin-dashboard.component";
import { AdminShellComponent } from "./admin/shared/admin-shell.component";
import { ProductsComponent } from "./admin/products/products.component";
import { InventoryComponent } from "./admin/inventory/inventory.component";
import { UsersComponent } from "./admin/users/users.component";
import { ReportsComponent } from "./admin/reports/reports.component";
import { ToastContainerComponent } from "./core/components/toast-container.component";

@NgModule({
  declarations: [
    AppComponent,
    LandingComponent,
    LoginComponent,
    SignupComponent,
    ForgotPasswordComponent,
    BillingComponent,
    BillHistoryComponent,
    PaymentModalComponent,
    ReturnsComponent,
    AdminDashboardComponent,
    AdminShellComponent,
    ProductsComponent,
    InventoryComponent,
    ReportsComponent,
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
