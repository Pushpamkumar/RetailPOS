import { Component, OnDestroy, OnInit } from "@angular/core";
import { FormBuilder, Validators } from "@angular/forms";
import { Router } from "@angular/router";
import { AuthService, LoginResponse } from "../../core/services/auth.service";
import { WorkspaceContextService } from "../../core/services/workspace-context.service";

type LoginRole = "Cashier" | "StoreManager" | "Admin" | "InventoryClerk" | "RegionalManager";

@Component({
  selector: "app-login",
  template: `
    <div class="page-shell auth-shell">
      <div class="auth-panel auth-hero">
        <div class="auth-copy">
          <p class="eyebrow">Retail Operations Suite</p>
          <h1 class="hero-title">Sign in to your role-based workspace</h1>
          <p class="hero-subtitle">
            Choose the role you want to enter, keep your session remembered if needed, and move directly into the
            right experience for that account.
          </p>
          <div class="auth-badges">
            <span class="chip success">Cashier, manager, and admin flows</span>
            <span class="chip">Role isolation enforced</span>
            <span class="chip">Receipt printing built in</span>
            <span class="chip">Store {{ workspaceContext.getStoreCode() || "context not set" }}</span>
          </div>
        </div>
      </div>

      <div class="panel auth-card">
        <div class="panel-header">
          <div>
            <h2>Sign In</h2>
            <p class="muted">Use your employee credentials and select the role you want to enter.</p>
          </div>
        </div>

        <div class="stack-card auth-role-card">
          <div class="list-row">
            <strong>{{ selectedRoleLabel }}</strong>
            <span class="chip success">Selected role</span>
          </div>
          <div class="muted">{{ selectedRoleHelp }}</div>
        </div>

        <div class="inline-alert warn" *ngIf="isLocked">
          Too many failed attempts. Try again in {{ lockoutSecondsRemaining }} second(s).
        </div>

        <div class="stack-card subtle-panel" *ngIf="canResetAttempts">
          <div class="list-row">
            <div>
              <strong>Attempts ready to reset</strong>
              <div class="muted">Cooldown is complete. Reset to restore the full 5 attempts.</div>
            </div>
            <button class="btn secondary" type="button" (click)="resetAttempts()">Reset attempts</button>
          </div>
        </div>

        <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="grid form-grid">
          <div class="field">
            <label>Account</label>
            <input formControlName="username" placeholder="Email / mobile / employee code" autocomplete="username" />
          </div>

          <div class="field">
            <label>Role to enter</label>
            <select formControlName="role">
              <option *ngFor="let option of roleOptions" [ngValue]="option.value">{{ option.label }}</option>
            </select>
          </div>

          <div class="field">
            <label>Password</label>
            <div class="password-row">
              <input
                [type]="passwordVisible ? 'text' : 'password'"
                formControlName="password"
                placeholder="Password"
                autocomplete="current-password"
                maxlength="64"
              />
              <button class="btn secondary password-toggle" type="button" (click)="passwordVisible = !passwordVisible">
                {{ passwordVisible ? "Hide" : "Show" }}
              </button>
            </div>
            <div class="muted tiny">Password policy: 8 to 64 characters. Use a strong unique password.</div>
          </div>

          <label class="check-row">
            <input type="checkbox" formControlName="rememberMe" />
            Remember me on this device
          </label>

          <div class="auth-links">
            <a routerLink="/auth/forgot-password">Forgot password?</a>
            <a routerLink="/landing">Change store</a>
            <span class="muted">Remaining attempts: {{ remainingAttempts }}</span>
          </div>

        <button class="btn" type="submit" [disabled]="loginForm.invalid || isLocked || needsManualReset || loading">
          {{ loading ? "Signing in..." : "Sign In" }}
        </button>

          <div class="inline-alert error" *ngIf="errorMessage">{{ errorMessage }}</div>
        </form>
      </div>
    </div>
  `
})
export class LoginComponent implements OnInit, OnDestroy {
  readonly roleOptions: Array<{ value: LoginRole; label: string }> = [
    { value: "Cashier", label: "Cashier" },
    { value: "StoreManager", label: "Store Manager" },
    { value: "Admin", label: "Admin" },
    { value: "InventoryClerk", label: "Inventory Clerk" },
    { value: "RegionalManager", label: "Regional Manager" }
  ];

  readonly maxAttempts = 5;
  readonly loginForm;

  errorMessage = "";
  loading = false;
  passwordVisible = false;
  failedAttempts = 0;
  lockoutSecondsRemaining = 0;
  private lockoutExpiresAt: number | null = null;
  private lockoutTicker: number | null = null;

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router,
    public workspaceContext: WorkspaceContextService
  ) {
    this.loginForm = this.formBuilder.nonNullable.group({
      username: ["", [Validators.required, Validators.minLength(3)]],
      password: ["", [Validators.required, Validators.minLength(8), Validators.maxLength(64)]],
      role: ["Cashier" as LoginRole, Validators.required],
      rememberMe: [true]
    });
  }

  ngOnInit(): void {
    this.failedAttempts = 0;
    this.lockoutSecondsRemaining = 0;
    this.lockoutExpiresAt = null;
    this.stopLockoutTicker();
  }

  ngOnDestroy(): void {
    if (this.lockoutTicker !== null) {
      window.clearInterval(this.lockoutTicker);
    }
  }

  get remainingAttempts(): number {
    return Math.max(this.maxAttempts - this.failedAttempts, 0);
  }

  get isLocked(): boolean {
    return this.lockoutSecondsRemaining > 0;
  }

  get canResetAttempts(): boolean {
    return !this.isLocked && this.failedAttempts >= this.maxAttempts;
  }

  get needsManualReset(): boolean {
    return !this.isLocked && this.failedAttempts >= this.maxAttempts;
  }

  get selectedRoleLabel(): string {
    return this.roleOptions.find((option) => option.value === this.loginForm.controls.role.value)?.label ?? "Cashier";
  }

  get selectedRoleHelp(): string {
    switch (this.loginForm.controls.role.value as LoginRole) {
      case "Cashier":
        return "Checkout only. Fast billing, payment collection, and receipt printing.";
      case "StoreManager":
        return "Operations workspace with products, inventory, dashboard, billing, and reports.";
      case "Admin":
        return "Full control over users, onboarding, products, inventory, reports, and POS.";
      case "InventoryClerk":
        return "Stock-only access for adjustments and low-stock follow-up.";
      case "RegionalManager":
        return "Read-only oversight for dashboards and reports across the store.";
      default:
        return "Pick the role that matches your account.";
    }
  }

  onSubmit(): void {
    if (this.loginForm.invalid || this.isLocked || this.needsManualReset) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.errorMessage = "";

    const value = this.loginForm.getRawValue();
    this.authService.login(
      {
        username: value.username,
        password: value.password
      },
      { rememberMe: value.rememberMe }
    ).subscribe({
      next: (res: LoginResponse) => {
        this.loading = false;

        if (res.role !== value.role) {
          this.errorMessage = "This account cannot enter the selected workspace. Please choose the matching role.";
          this.registerFailedAttempt();
          this.authService.logout({ navigate: false });
          return;
        }

        this.clearAttemptState();
        this.router.navigate([this.authService.getLandingRoute(res.role)]);
      },
      error: (error) => {
        this.loading = false;
        this.registerFailedAttempt(error?.error?.detail ?? "Login failed");
      }
    });
  }

  resetAttempts(): void {
    this.clearAttemptState();
    this.errorMessage = "";
  }

  private registerFailedAttempt(message = "Login failed"): void {
    this.failedAttempts = Math.min(this.failedAttempts + 1, this.maxAttempts);
    if (this.failedAttempts >= this.maxAttempts) {
      this.beginLockout();
      this.errorMessage = "Too many failed attempts. Please wait 60 seconds and then reset attempts.";
      return;
    }

    this.errorMessage = message;
  }

  private beginLockout(durationSeconds = 60): void {
    this.lockoutExpiresAt = Date.now() + durationSeconds * 1000;
    this.lockoutSecondsRemaining = durationSeconds;
    this.startLockoutTicker();
  }

  private startLockoutTicker(): void {
    if (this.lockoutTicker !== null) {
      return;
    }

    this.lockoutTicker = window.setInterval(() => this.syncLockoutState(), 1000);
  }

  private stopLockoutTicker(): void {
    if (this.lockoutTicker !== null) {
      window.clearInterval(this.lockoutTicker);
      this.lockoutTicker = null;
    }
  }

  private syncLockoutState(): void {
    if (!this.lockoutExpiresAt) {
      this.lockoutSecondsRemaining = 0;
      this.stopLockoutTicker();
      return;
    }

    const remaining = Math.ceil((this.lockoutExpiresAt - Date.now()) / 1000);
    if (remaining <= 0) {
      this.lockoutExpiresAt = null;
      this.lockoutSecondsRemaining = 0;
      this.stopLockoutTicker();
      this.errorMessage = "Cooldown complete. Click Reset attempts to try again.";
      return;
    }

    this.lockoutSecondsRemaining = remaining;
  }

  private clearAttemptState(): void {
    this.failedAttempts = 0;
    this.lockoutSecondsRemaining = 0;
    this.lockoutExpiresAt = null;
    this.stopLockoutTicker();
  }
}
