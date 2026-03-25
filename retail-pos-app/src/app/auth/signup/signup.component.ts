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

      <div class="panel auth-card signup-shell">
        <div class="panel-header signup-header">
          <div>
            <h2>Staff Registration</h2>
            <p class="muted">If you are not logged in as Admin, sign in first and come back here.</p>
          </div>
        </div>

        <div class="inline-alert error" *ngIf="authService.getRole() !== 'Admin'">
          You need an Admin session to create users. The backend will reject this request without an admin token.
        </div>

        <div class="signup-summary">
          <div class="summary-metric">
            <span>Store context</span>
            <strong>{{ workspaceContext.getStoreCode() || "Not set" }}</strong>
          </div>
          <div class="summary-metric">
            <span>Current role</span>
            <strong>{{ authService.getRole() || "Not signed in" }}</strong>
          </div>
        </div>

        <div class="signup-actions">
          <button class="btn" type="button" (click)="openForm()">
            <mat-icon aria-hidden="true">person_add</mat-icon>
            <span>Register Staff</span>
          </button>
          <a class="btn secondary" routerLink="/auth/login">
            <mat-icon aria-hidden="true">arrow_back</mat-icon>
            <span>Back to Sign In</span>
          </a>
        </div>
      </div>
    </div>

    <div class="modal-backdrop signup-modal-backdrop" *ngIf="isFormOpen" (click)="closeForm()">
      <div
        class="modal-panel signup-modal-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="signup-form-title"
        (click)="$event.stopPropagation()"
      >
        <div class="panel-header signup-modal-header">
          <div>
            <h2 id="signup-form-title">Staff Registration</h2>
            <p class="muted">Complete the onboarding details below to create a new staff account.</p>
          </div>
          <div class="signup-modal-actions">
            <span class="chip" *ngIf="busy">Creating...</span>
            <button
              class="modal-close"
              type="button"
              aria-label="Close form"
              (click)="closeForm()"
            >
              <mat-icon aria-hidden="true">close</mat-icon>
            </button>
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
            <a class="inline-link-with-icon" routerLink="/auth/login">
              <mat-icon aria-hidden="true">arrow_back</mat-icon>
              <span>Back to Sign In</span>
            </a>
          </div>

          <button class="btn" type="submit" [disabled]="busy">
            <mat-icon aria-hidden="true">{{ busy ? "hourglass_top" : "person_add" }}</mat-icon>
            <span>Create Account</span>
          </button>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .signup-shell {
      display: grid;
      gap: 18px;
      align-content: start;
    }

    .signup-header {
      margin-bottom: 0;
    }

    .signup-summary {
      display: grid;
      gap: 12px;
    }

    .signup-actions {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
      align-items: center;
    }

    .signup-modal-backdrop {
      backdrop-filter: blur(4px);
    }

    .signup-modal-panel {
      width: min(720px, 100%);
      max-height: min(90vh, 880px);
      overflow: auto;
      padding: 24px;
    }

    .signup-modal-header {
      align-items: flex-start;
    }

    .signup-modal-actions {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .modal-close {
      width: 42px;
      height: 42px;
      border: 1px solid var(--border);
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.9);
      color: var(--ink);
      font-size: 28px;
      line-height: 1;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      transition: transform 120ms ease, box-shadow 120ms ease, background 120ms ease;
    }

    .modal-close:hover {
      transform: translateY(-1px);
      box-shadow: var(--shadow);
      background: #fff;
    }

    @media (max-width: 900px) {
      .signup-actions .btn,
      .signup-actions a.btn {
        flex: 1 1 0;
      }
    }

    @media (max-width: 700px) {
      .signup-modal-header {
        align-items: start;
        flex-direction: column;
      }

      .signup-modal-actions {
        width: 100%;
        justify-content: space-between;
      }

      .signup-modal-panel {
        padding: 20px;
      }
    }
  `]
})
export class SignupComponent {
  busy = false;
  isFormOpen = false;
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

  openForm(): void {
    this.isFormOpen = true;
  }

  closeForm(): void {
    if (!this.busy) {
      this.isFormOpen = false;
    }
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
        this.closeForm();
        this.router.navigate(["/auth/login"]);
      },
      error: (error) => this.notificationService.error(error?.error?.detail ?? "Failed to create user.")
    });
  }
}
