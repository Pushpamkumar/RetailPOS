import { Component } from "@angular/core";
import { FormBuilder, Validators } from "@angular/forms";
import { Router } from "@angular/router";
import { NotificationService } from "../../core/services/notification.service";

@Component({
  selector: "app-forgot-password",
  template: `
    <div class="page-shell auth-shell">
      <div class="auth-panel auth-hero">
        <div class="auth-copy">
          <p class="eyebrow">Account Recovery</p>
          <h1 class="hero-title">Reset access with admin help</h1>
          <p class="hero-subtitle">
            Retail POS uses store-managed accounts. If you forget your password, submit a reset request and the
            store admin can verify and reset the account.
          </p>
          <div class="auth-badges">
            <span class="chip success">Secure reset flow</span>
            <span class="chip">Admin approval required</span>
          </div>
        </div>
      </div>

      <div class="panel auth-card">
        <div class="panel-header">
          <div>
            <h2>Forgot Password</h2>
            <p class="muted">Enter your account details and we'll guide you to the right reset path.</p>
          </div>
        </div>

        <form [formGroup]="form" (ngSubmit)="submit()" class="grid form-grid">
          <div class="field">
            <label>Email or Mobile</label>
            <input formControlName="identifier" placeholder="Email or mobile" />
          </div>
          <div class="field">
            <label>Employee code</label>
            <input formControlName="employeeCode" placeholder="EMP001" />
          </div>
          <div class="field">
            <label>Role</label>
            <select formControlName="role">
              <option value="Cashier">Cashier</option>
              <option value="StoreManager">Store Manager</option>
              <option value="Admin">Admin</option>
              <option value="InventoryClerk">Inventory Clerk</option>
              <option value="RegionalManager">Regional Manager</option>
            </select>
          </div>

          <button class="btn" type="submit">Send Reset Request</button>
          <button class="btn secondary" type="button" (click)="router.navigate(['/auth/login'])">Back to Sign In</button>
        </form>
      </div>
    </div>
  `
})
export class ForgotPasswordComponent {
  readonly form;

  constructor(
    private formBuilder: FormBuilder,
    private notificationService: NotificationService,
    public router: Router
  ) {
    this.form = this.formBuilder.nonNullable.group({
      identifier: ["", [Validators.required, Validators.minLength(3)]],
      employeeCode: ["", [Validators.required, Validators.minLength(3)]],
      role: ["Cashier", Validators.required]
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.notificationService.info(
      "Password resets are handled by the store admin. Please contact your manager to complete the reset."
    );
  }
}
