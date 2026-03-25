import { Component } from "@angular/core";
import { FormBuilder, Validators } from "@angular/forms";
import { Router } from "@angular/router";
import { finalize } from "rxjs";
import { AuthService } from "../../core/services/auth.service";
import { NotificationService } from "../../core/services/notification.service";
import { WorkspaceContextService } from "../../core/services/workspace-context.service";
import { AdminApiService } from "../../admin/services/admin-api.service";

@Component({
  selector: "app-signup",
  template: `
    <div class="page-shell auth-shell">
      <div class="auth-panel auth-hero">
        <div class="auth-copy">
          <p class="eyebrow">User Onboarding</p>
          <h1 class="hero-title">Create a staff account</h1>
          <p class="hero-subtitle">
            This page is for admin-controlled onboarding. It creates cashier, manager, inventory, and regional roles
            with the same rules as the backend.
          </p>
          <div class="auth-badges">
            <span class="chip success">Admin-controlled</span>
            <span class="chip">Role based access</span>
            <span class="chip">Store scoped</span>
          </div>
        </div>
      </div>

      <div class="panel auth-card">
        <div class="panel-header">
          <div>
            <h2>Staff Registration</h2>
            <p class="muted">If you are not logged in as Admin, sign in first and come back here.</p>
          </div>
        </div>

        <div class="inline-alert error" *ngIf="authService.getRole() !== 'Admin'">
          You need an Admin session to create users. The backend will reject this request without an admin token.
        </div>

        <form [formGroup]="form" (ngSubmit)="submit()" class="grid form-grid">
          <div class="field">
            <label>Store ID</label>
            <input type="number" formControlName="storeId" min="1" />
          </div>
          <div class="field">
            <label>Employee code</label>
            <input formControlName="employeeCode" placeholder="EMP001" />
          </div>
          <div class="field">
            <label>Full name</label>
            <input formControlName="fullName" placeholder="Full name" />
          </div>
          <div class="field">
            <label>Email</label>
            <input formControlName="email" placeholder="Email" />
          </div>
          <div class="field">
            <label>Mobile</label>
            <input formControlName="mobile" placeholder="Mobile" />
          </div>
          <div class="field">
            <label>Role</label>
            <select formControlName="roleId">
              <option [ngValue]="1">Cashier</option>
              <option [ngValue]="2">StoreManager</option>
              <option [ngValue]="3">Admin</option>
              <option [ngValue]="4">InventoryClerk</option>
              <option [ngValue]="5">RegionalManager</option>
            </select>
          </div>
          <div class="field">
            <label>Password</label>
            <input type="password" formControlName="password" placeholder="Password" maxlength="64" />
          </div>
          <div class="field">
            <label>Confirm password</label>
            <input type="password" formControlName="confirmPassword" placeholder="Confirm password" maxlength="64" />
          </div>

          <div class="auth-links">
            <span class="muted">Store context: {{ workspaceContext.getStoreCode() || "Not set" }}</span>
            <a routerLink="/auth/login">Back to Sign In</a>
          </div>

          <button class="btn" type="submit" [disabled]="busy">Create Account</button>
        </form>
      </div>
    </div>
  `
})
export class SignupComponent {
  busy = false;
  readonly form;

  constructor(
    private formBuilder: FormBuilder,
    private adminApi: AdminApiService,
    public authService: AuthService,
    public workspaceContext: WorkspaceContextService,
    private notificationService: NotificationService,
    public router: Router
  ) {
    this.form = this.formBuilder.nonNullable.group({
      storeId: [this.authService.getStoreId() || 1, [Validators.required, Validators.min(1)]],
      employeeCode: ["", [Validators.required, Validators.minLength(3)]],
      fullName: ["", [Validators.required, Validators.minLength(3)]],
      email: [""],
      mobile: [""],
      roleId: [1, Validators.required],
      password: ["", [Validators.required, Validators.minLength(8), Validators.maxLength(64)]],
      confirmPassword: ["", [Validators.required, Validators.minLength(8), Validators.maxLength(64)]]
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.notificationService.error("Complete the onboarding form before saving.");
      return;
    }

    const value = this.form.getRawValue();
    if (!value.email.trim() && !value.mobile.trim()) {
      this.notificationService.error("Email or mobile is required.");
      return;
    }
    if (value.password !== value.confirmPassword) {
      this.notificationService.error("Password and confirm password must match.");
      return;
    }

    this.busy = true;
    this.adminApi.registerStaff({
      storeId: value.storeId,
      employeeCode: value.employeeCode.toUpperCase().trim(),
      fullName: value.fullName.trim(),
      email: value.email || null,
      mobile: value.mobile || null,
      password: value.password,
      confirmPassword: value.confirmPassword,
      roleId: value.roleId
    }).pipe(
      finalize(() => (this.busy = false))
    ).subscribe({
      next: () => {
        this.notificationService.success("User created successfully.");
        this.form.reset({
          storeId: this.authService.getStoreId() || 1,
          employeeCode: "",
          fullName: "",
          email: "",
          mobile: "",
          roleId: 1,
          password: "",
          confirmPassword: ""
        });
        this.router.navigate(["/auth/login"]);
      },
      error: (error) => this.notificationService.error(error?.error?.detail ?? "Failed to create user.")
    });
  }
}
